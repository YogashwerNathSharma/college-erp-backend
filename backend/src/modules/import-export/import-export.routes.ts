import { Router } from "express";
import multer from "multer";
import path from "path";
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

const router = Router({ mergeParams: true });

// ══════════════════════════════════════════════════════════
// IMPORT/EXPORT ROUTES
// Base: /api/:tenantId/import-export
// ══════════════════════════════════════════════════════════

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "../../../uploads/imports"));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `import-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv",
      "application/csv",
    ];
    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed"));
    }
  },
});

// Stats
router.get("/stats", getStats);

// Import routes
router.post("/import/upload", upload.single("file"), uploadForImport);
router.post("/import/validate", validateImport);
router.post("/import/process", processImport);
router.get("/import/jobs", listImportJobs);
router.get("/import/templates/:module", getImportTemplate);
router.delete("/import/jobs/:id", cancelImportJob);

// Export routes
router.post("/export/generate", generateExport);
router.get("/export/jobs", listExportJobs);
router.get("/export/download/:id", downloadExport);

export default router;
