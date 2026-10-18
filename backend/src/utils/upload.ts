import multer from "multer";
import fs from "fs";
import os from "os";
import path from "path";

const memStorage = multer.memoryStorage();

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
};

const documentFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    "image/jpeg", "image/png", "image/jpg", "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel", "text/csv",
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, and PNG files are allowed"));
};

export const uploadPhoto = multer({
  storage: memStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single("photo");

const documentUpload = multer({
  storage: memStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([{ name: "document", maxCount: 1 }, { name: "file", maxCount: 1 }]);

export const uploadDocument = (req: any, res: any, next: any) => {
  documentUpload(req, res, (err: any) => {
    if (err) return next(err);
    const files = req.files || {};
    req.file = (files.document?.[0] || files.file?.[0]) as Express.Multer.File | undefined;
    // Persist spreadsheet uploads to a temp file so ExcelJS (and other readers)
    // can read from disk. Applies to ALL routes that use uploadDocument for Excel/CSV.
    if (req.file && req.file.buffer) {
      const ext = path.extname(req.file.originalname || "").toLowerCase();
      if ([".xlsx", ".xls", ".csv"].includes(ext) || req.file.mimetype?.includes("spreadsheet") || req.file.mimetype?.includes("excel") || req.file.mimetype === "text/csv") {
        const safeName = String(req.file.originalname || "import.xlsx").replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = path.join(os.tmpdir(), `erp-import-${Date.now()}-${safeName}`);
        fs.writeFileSync(filePath, req.file.buffer);
        req.file.path = filePath;
      }
    }
    next();
  });
};

export const uploadMultipleDocuments = multer({
  storage: memStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("documents", 10);
