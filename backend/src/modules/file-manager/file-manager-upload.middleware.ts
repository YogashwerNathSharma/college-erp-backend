import multer, { FileFilterCallback } from "multer";
import os from "os";
import path from "path";
import { Request } from "express";

// File-manager uploads are written to a temporary OS directory first and are
// moved into the tenant-scoped uploads directory by the controller.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `erp-upload-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
  ".pdf", ".txt", ".csv", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
]);

const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".dll", ".com", ".bat", ".cmd", ".msi", ".scr", ".sh", ".ps1",
  ".php", ".jsp", ".asp", ".aspx", ".js", ".mjs", ".cjs", ".html", ".htm",
]);

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (BLOCKED_EXTENSIONS.has(extension)) {
    return cb(new Error("Executable or script files are not allowed"));
  }

  if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error("Unsupported file type"));
  }

  return cb(null, true);
};

export const fileManagerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10,
  },
});
