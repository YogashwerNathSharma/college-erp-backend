import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import prisma from "../../utils/prisma";
import { uploadForImport, validateImport, processImport, listImportJobs, getImportTemplate, generateExport, listExportJobs, downloadExport, cancelImportJob, clearUnvalidatedImportJobs, getStats } from "./import-export.controller";
import { authMiddleware } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { uploadDocument } from '../../utils/upload';
import { importRealRmsExcel, validateRealRmsExcel } from '../students/real-excel-import.service';

const router = Router({ mergeParams: true });
const uploadsDir = path.join(__dirname, "../../../uploads/imports");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `import-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv", "application/csv"];
    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) cb(null, true);
    else cb(new Error("Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed"));
  },
});

router.use(authMiddleware);
router.use(resolveTenant);
router.get("/stats", getStats);

router.post("/real-student-import", allowRoles("ADMIN", "SUPER_ADMIN", "TENANT_ADMIN"), (req: any, res: any) => {
  uploadDocument(req, res, async (err: any) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: "No Excel file uploaded" });
    try {
      const { academicYearId } = req.body;
      if (!academicYearId) return res.status(400).json({ success: false, message: "academicYearId is required" });
      let filePath = req.file.path;
      if (!filePath && req.file.buffer) {
        const safeName = String(req.file.originalname || "student-import.xlsx").replace(/[^a-zA-Z0-9._-]/g, "_");
        filePath = path.join(os.tmpdir(), `erp-student-import-${Date.now()}-${safeName}`);
        fs.writeFileSync(filePath, req.file.buffer);
      }
      if (!filePath) return res.status(400).json({ success: false, message: "Uploaded Excel file could not be prepared" });
      try {
        const result = await importRealRmsExcel(req.tenantId, filePath, academicYearId, req.user.userId);
        return res.json({ success: true, data: result });
      } finally { try { if (filePath.startsWith(os.tmpdir())) fs.unlinkSync(filePath); } catch {} }
    } catch (error: any) { return res.status(400).json({ success: false, message: error?.message || "Real student import failed" }); }
  });
});

// Real Excel validation uses the same parser/row rules as the existing importer, without DB writes.
// For the first test pass the UI may request limit=5; otherwise the whole file is checked.
router.post("/import/real-validate", async (req: any, res: any) => {
  try {
    const tenantId = req.tenantId as string;
    const jobId = req.body?.jobId as string;
    const limit = req.body?.limit ? Math.max(1, Math.min(100, Number(req.body.limit))) : undefined;
    if (!jobId) return res.status(400).json({ success: false, message: "jobId is required" });
    const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId, module: "STUDENT" } });
    if (!job) return res.status(404).json({ success: false, message: "Student import job not found" });
    if (!job.fileUrl || !fs.existsSync(job.fileUrl)) return res.status(404).json({ success: false, message: "Uploaded file not found on server" });
    const academicYear = await prisma.academicYear.findFirst({ where: { tenantId, isActive: true } });
    if (!academicYear) return res.status(400).json({ success: false, message: "No active academic year found for this school" });
    const result = await validateRealRmsExcel(tenantId, job.fileUrl, academicYear.id, limit);
    await prisma.importJob.update({ where: { id: jobId }, data: { totalRows: result.totalRows, mapping: { realExcel: true, checkedRows: result.checkedRows, validation: "real-student-import" } } });
    return res.json({ success: true, data: { ...result, validCount: result.successCount, invalidCount: result.failedCount, canProceed: result.failedCount === 0, testLimit: limit || null } });
  } catch (error: any) { return res.status(400).json({ success: false, message: error?.message || "Real student validation failed" }); }
});

const processExistingImportJob = async (req: any, res: any) => {
  const tenantId = req.tenantId as string;
  const jobId = req.body?.jobId as string;
  if (!jobId) return res.status(400).json({ success: false, message: "jobId is required" });
  const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId, status: "PENDING" } });
  if (!job) return res.status(404).json({ success: false, message: "Job not found or already processed" });
  if (job.module !== "STUDENT") return processImport(req, res);
  if (!job.fileUrl || !fs.existsSync(job.fileUrl)) {
    await prisma.importJob.update({ where: { id: jobId }, data: { status: "FAILED" } });
    return res.status(404).json({ success: false, message: "Uploaded file not found on server" });
  }
  const academicYear = await prisma.academicYear.findFirst({ where: { tenantId, isActive: true } });
  if (!academicYear) {
    await prisma.importJob.update({ where: { id: jobId }, data: { status: "FAILED" } });
    return res.status(400).json({ success: false, message: "No active academic year found for this school" });
  }
  try {
    await prisma.importJob.update({ where: { id: jobId }, data: { status: "PROCESSING", startedAt: new Date() } });
    const result = await importRealRmsExcel(tenantId, job.fileUrl, academicYear.id, req.user.userId);
    await prisma.importJob.update({ where: { id: jobId }, data: { status: "COMPLETED", processedRows: result.totalRows, successRows: result.successCount, failedRows: result.failedCount, errors: result.errors?.length ? result.errors : undefined, completedAt: new Date() } });
    try { fs.unlinkSync(job.fileUrl); } catch {}
    return res.json({ success: true, data: { processedRows: result.totalRows, successRows: result.successCount, failedRows: result.failedCount, errors: result.errors || [], importedStudentIds: result.importedStudentIds || [] }, message: `Import completed: ${result.successCount} successful, ${result.failedCount} failed` });
  } catch (error: any) {
    await prisma.importJob.update({ where: { id: jobId }, data: { status: "FAILED", completedAt: new Date(), errors: [{ row: 0, message: error?.message || "Real student import failed" }] } }).catch(() => {});
    return res.status(400).json({ success: false, message: error?.message || "Real student import failed" });
  }
};

router.post("/import/upload", upload.single("file"), uploadForImport);
router.post("/import/validate", validateImport);
router.post("/import/process", processExistingImportJob);
router.get("/import/jobs", listImportJobs);
router.get("/import/templates/:module", getImportTemplate);
router.delete("/import/jobs/:id", cancelImportJob);
router.delete("/import/jobs/unvalidated/clear", clearUnvalidatedImportJobs);
router.post("/export/generate", generateExport);
router.get("/export/jobs", listExportJobs);
router.get("/export/download/:id", downloadExport);
export default router;
