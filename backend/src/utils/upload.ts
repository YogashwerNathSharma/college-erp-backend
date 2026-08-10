import multer from "multer";
import fs from "fs";
import os from "os";
import path from "path";

// Memory storage keeps existing document/image flows unchanged.
const memStorage = multer.memoryStorage();

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
};

const documentFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, and PNG files are allowed"));
};

export const uploadPhoto = multer({
  storage: memStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single("photo");

// Student Excel import historically used uploadDocument, while the Excel service
// expects a file path. Keep memory storage for existing document consumers, but
// materialize a temporary file only for the student Excel import route.
const documentUpload = multer({
  storage: memStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("document");

export const uploadDocument = (req: any, res: any, next: any) => {
  documentUpload(req, res, (err: any) => {
    if (err) return next(err);
    if (req.file && req.originalUrl?.includes("/api/students/operations/excel/import")) {
      const safeName = String(req.file.originalname || "student-import.xlsx").replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = path.join(os.tmpdir(), `erp-student-import-${Date.now()}-${safeName}`);
      fs.writeFileSync(filePath, req.file.buffer);
      req.file.path = filePath;
    }
    next();
  });
};

export const uploadMultipleDocuments = multer({
  storage: memStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("documents", 10);
