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
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import { importRealRmsExcel, validateRealRmsExcel } from '../students/real-excel-import.service';

const router = Router({ mergeParams: true });
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  const allowedTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "application/csv"];
  const allowedExtensions = [".xlsx", ".csv"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) cb(null, true);
  else cb(new Error("Only .xlsx and .csv files are supported. Please save legacy .xls files as .xlsx first."));
} });

async function materializeImportFile(fileUrl: string, originalName?: string) {
  if (!/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error(`Unable to retrieve uploaded file (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const ext = path.extname(originalName || "") || path.extname(new URL(fileUrl).pathname) || ".xlsx";
  const filePath = path.join(os.tmpdir(), `erp-import-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  fs.writeFileSync(filePath, bytes);
  return filePath;
}

async function runWithRemoteImportFile(req: any, res: any, handler: any) {
  const tenantId = req.tenantId as string;
  const jobId = req.body?.jobId as string;
  if (!jobId) return handler(req, res);
  const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId, module: "STUDENT" } });
  if (!job?.fileUrl || !/^https?:\/\//i.test(job.fileUrl)) return handler(req, res);

  const remoteUrl = job.fileUrl;
  let tempPath = "";
  try {
    tempPath = await materializeImportFile(remoteUrl, job.fileName);
    await prisma.importJob.update({ where: { id: job.id }, data: { fileUrl: tempPath } });
    await handler(req, res);
  } finally {
    await prisma.importJob.update({ where: { id: job.id }, data: { fileUrl: remoteUrl } }).catch(() => {});
    if (tempPath && tempPath !== remoteUrl) {
      try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
    }
  }
}

router.use(authMiddleware);
router.use(resolveTenant);
router.get("/stats", getStats);

router.post("/real-student-import", allowRoles("ADMIN", "SUPER_ADMIN", "TENANT_ADMIN"), (req: any, res: any) => {
  uploadDocument(req, res, async (err: any) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: "No Excel/CSV file uploaded" });

    let filePath = "";
    try {
      const { academicYearId } = req.body;
      if (!academicYearId) return res.status(400).json({ success: false, message: "academicYearId is required" });

      const originalName = String(req.file.originalname || "").toLowerCase();
      if (!originalName.endsWith(".xlsx") && !originalName.endsWith(".csv")) {
        return res.status(400).json({ success: false, message: "Only .xlsx and .csv files are supported. Please save legacy .xls files as .xlsx first." });
      }

      filePath = req.file.path;
      if (!filePath && req.file.buffer) {
        const safeName = String(req.file.originalname || "student-import.xlsx").replace(/[^a-zA-Z0-9._-]/g, "_");
        filePath = path.join(os.tmpdir(), `erp-student-import-${Date.now()}-${safeName}`);
        fs.writeFileSync(filePath, req.file.buffer);
      }
      if (!filePath) return res.status(400).json({ success: false, message: "Uploaded Excel file could not be prepared" });

      const result = await importRealRmsExcel(req.tenantId, filePath, academicYearId, req.user.userId);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error?.message || "Real student import failed" });
    } finally {
      if (filePath) {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
      }
    }
  });
});

router.post("/import/real-validate", async (req: any, res: any) => {
  try {
    const tenantId = req.tenantId as string;
    const jobId = req.body?.jobId as string;
    const limit = req.body?.limit ? Math.max(1, Math.min(100, Number(req.body.limit))) : undefined;
    if (!jobId) return res.status(400).json({ success: false, message: "jobId is required" });
    const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId, module: "STUDENT" } });
    if (!job) return res.status(404).json({ success: false, message: "Student import job not found" });
    if (!job.fileUrl) return res.status(404).json({ success: false, message: "Uploaded file not found on server" });
    const academicYear = await prisma.academicYear.findFirst({ where: { tenantId, isActive: true } });
    if (!academicYear) return res.status(400).json({ success: false, message: "No active academic year found for this school" });
    const mapping = (job.mapping && typeof job.mapping === "object" && !Array.isArray(job.mapping)) ? job.mapping as Record<string, string> : undefined;
    const filePath = await materializeImportFile(job.fileUrl, job.fileName);
    try {
      const result = await validateRealRmsExcel(tenantId, filePath, academicYear.id, limit, mapping);
      await prisma.importJob.update({ where: { id: jobId }, data: { totalRows: result.totalRows, mapping: { ...(mapping || {}), realExcel: true, checkedRows: result.checkedRows, validation: "real-student-import" } } });
      return res.json({ success: true, data: { ...result, validCount: result.successCount, invalidCount: result.failedCount, canProceed: result.successCount > 0, testLimit: limit || null } });
    } finally {
      if (/^https?:\/\//i.test(job.fileUrl) && filePath !== job.fileUrl) { try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {} }
    }
  } catch (error: any) { return res.status(400).json({ success: false, message: error?.message || "Real student validation failed" }); }
});

const validateExistingImport = async (req: any, res: any) => {
  try {
    const job = await prisma.importJob.findFirst({ where: { id: req.body?.jobId, tenantId: req.tenantId } });
    if (!job || job.module !== "STUDENT") return validateImport(req, res);
    if (!job.fileUrl) return res.status(404).json({ success: false, message: "Uploaded file not found on server" });
    const academicYear = await prisma.academicYear.findFirst({ where: { tenantId: req.tenantId, isActive: true } });
    if (!academicYear) return res.status(400).json({ success: false, message: "No active academic year found for this school" });
    const mapping = (job.mapping && typeof job.mapping === "object" && !Array.isArray(job.mapping)) ? job.mapping as Record<string, string> : undefined;
    const filePath = await materializeImportFile(job.fileUrl, job.fileName);
    try {
      const result = await validateRealRmsExcel(req.tenantId, filePath, academicYear.id, undefined, mapping);
      const previewResults = result.errors.slice(0, 10).map((e: any) => ({ row: e.row, data: {}, isValid: false, errors: [e.message] }));
      await prisma.importJob.update({ where: { id: job.id }, data: { totalRows: result.totalRows, mapping: { ...(mapping || {}), realExcel: true, checkedRows: result.checkedRows, validation: "real-student-import" } } });
      return res.json({ success: true, data: { totalRows: result.totalRows, previewResults, validCount: result.successCount, invalidCount: result.failedCount, canProceed: result.successCount > 0 } });
    } finally {
      if (/^https?:\/\//i.test(job.fileUrl) && filePath !== job.fileUrl) { try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {} }
    }
  } catch (error: any) { return res.status(400).json({ success: false, message: error?.message || "Validation failed" }); }
};

const processExistingImportJob = async (req: any, res: any) => {
  const tenantId = req.tenantId as string; const jobId = req.body?.jobId as string;
  if (!jobId) return res.status(400).json({ success: false, message: "jobId is required" });
  const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId, status: "PENDING" } });
  if (!job) return res.status(404).json({ success: false, message: "Job not found or already processed" });
  if (job.module !== "STUDENT") return processImport(req, res);
  if (!job.fileUrl) { await prisma.importJob.update({ where: { id: jobId }, data: { status: "FAILED" } }); return res.status(404).json({ success: false, message: "Uploaded file not found on server" }); }
  const academicYear = await prisma.academicYear.findFirst({ where: { tenantId, isActive: true } });
  if (!academicYear) { await prisma.importJob.update({ where: { id: jobId }, data: { status: "FAILED" } }); return res.status(400).json({ success: false, message: "No active academic year found for this school" }); }
  try {
    const filePath = await materializeImportFile(job.fileUrl, job.fileName);
    try {
      await prisma.importJob.update({ where: { id: jobId }, data: { status: "PROCESSING", startedAt: new Date(), fileUrl: filePath } });
      const mapping = (job.mapping && typeof job.mapping === "object" && !Array.isArray(job.mapping)) ? job.mapping as Record<string, string> : undefined;
      const result = await importRealRmsExcel(tenantId, filePath, academicYear.id, req.user.userId, { mapping });
      await prisma.importJob.update({ where: { id: jobId }, data: { status: "COMPLETED", processedRows: result.totalRows, successRows: result.successCount, failedRows: result.failedCount, errors: result.errors?.length ? result.errors : undefined, completedAt: new Date() } });
      return res.json({ success: true, data: { processedRows: result.totalRows, successRows: result.successCount, failedRows: result.failedCount, errors: result.errors || [], importedStudentIds: result.importedStudentIds || [] }, message: `Import completed: ${result.successCount} successful, ${result.failedCount} failed` });
    } finally {
      await prisma.importJob.update({ where: { id: jobId }, data: { fileUrl: job.fileUrl } }).catch(() => {});
      if (/^https?:\/\//i.test(job.fileUrl) && filePath !== job.fileUrl) { try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {} }
    }
  } catch (error: any) {
    const message = error?.message || "Real student import failed";
    await prisma.importJob.update({ where: { id: jobId }, data: { status: "FAILED", completedAt: new Date(), errors: [{ row: 0, field: "general", message }] }).catch(() => {});
    return res.status(400).json({ success: false, message });
  }
};

async function uploadImportFile(req: any, res: any) {
  if (!req.file?.buffer) return res.status(400).json({ success: false, message: "No file uploaded" });
  const tenantId = req.tenantId as string;
  const userId = req.user?.id || req.user?.userId || "system";
  const { module } = req.body;
  if (!module) return res.status(400).json({ success: false, message: "Module is required" });

  const safeName = String(req.file.originalname || "import.xlsx").replace(/[^a-zA-Z0-9._-]/g, "_");
  const tempPath = path.join(os.tmpdir(), `erp-import-${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  let remoteUrl = "";
  try {
    fs.writeFileSync(tempPath, req.file.buffer);
    remoteUrl = await uploadToCloudinary(req.file.buffer, `imports/${tenantId}`);
    const job = await prisma.importJob.create({ data: { tenantId, module, fileName: req.file.originalname, fileUrl: remoteUrl, status: "PENDING", createdBy: userId } });

    const response: any = { success: true, data: { ...job, fileColumns: [] }, message: "File uploaded. Use /validate to preview and map columns." };
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const ext = path.extname(safeName).toLowerCase();
      if (ext === ".csv") await wb.csv.readFile(tempPath); else await wb.xlsx.readFile(tempPath);
      const ws = wb.getWorksheet(1);
      if (ws) ws.getRow(1).eachCell((cell: any) => { const value = String(cell.value || "").trim(); if (value) response.data.fileColumns.push(value); });
    } catch {}
    return res.status(201).json(response);
  } catch (error: any) {
    if (remoteUrl) await deleteFromCloudinary(remoteUrl).catch(() => {});
    return res.status(500).json({ success: false, message: error?.message || "Error uploading import file" });
  } finally {
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
  }
}

router.post("/import/upload", upload.single("file"), uploadImportFile);
router.post("/import/validate", (req: any, res: any) => runWithRemoteImportFile(req, res, validateExistingImport).catch((error: any) => res.status(400).json({ success: false, message: error?.message || "Validation failed" })));
router.post("/import/process", (req: any, res: any) => runWithRemoteImportFile(req, res, processExistingImportJob).catch((error: any) => res.status(400).json({ success: false, message: error?.message || "Import processing failed" })));
router.get("/import/jobs", listImportJobs);
router.get("/import/templates/:module", getImportTemplate);
router.delete("/import/jobs/:id", cancelImportJob);
router.delete("/import/jobs/unvalidated/clear", clearUnvalidatedImportJobs);
router.post("/export/generate", generateExport);
router.get("/export/jobs", listExportJobs);
router.get("/export/download/:id", downloadExport);
export default router;
