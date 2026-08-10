import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import {
  uploadForImport,
  validateImport,
  processImport,
  listImportJobs,
  getImportTemplate,
  generateExport,
  listExportJobs,
  downloadExport,
  cancelImportJob,
  getStats,
} from "./import-export.controller";

import { authMiddleware } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { uploadDocument } from '../../utils/upload';
import { importRealRmsExcel } from '../students/real-excel-import.service';

const router = Router({ mergeParams: true });

const uploadsDir = path.join(__dirname, "../../../uploads/imports");
if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); }

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, "../../../uploads/imports")),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `import-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ];
    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) cb(null, true);
    else cb(new Error("Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed"));
  },
});

router.use(authMiddleware);
router.use(resolveTenant);

router.get("/stats", getStats);

// Safe real RMS/student-list import. Does not delete demo data.
// ADMIN is included because the normal student-operations module uses ADMIN
// for tenant-level student management, while tenant/super admins remain supported.
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
      } finally {
        try { if (filePath.startsWith(os.tmpdir())) fs.unlinkSync(filePath); } catch {}
      }
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error?.message || "Real student import failed" });
    }
  });
});

router.post("/import/upload", upload.single("file"), uploadForImport);
router.post("/import/validate", validateImport);
router.post("/import/process", processImport);
router.get("/import/jobs", listImportJobs);
router.get("/import/templates/:module", getImportTemplate);
router.delete("/import/jobs/:id", cancelImportJob);

router.post("/export/generate", generateExport);
router.get("/export/jobs", listExportJobs);
router.get("/export/download/:id", downloadExport);

export default router;
