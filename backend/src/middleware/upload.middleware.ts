import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

// ✅ Use memory storage — files go to Cloudinary, not disk
const storage = multer.memoryStorage();

// ✅ File filter (only images)
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images allowed"));
  }
};

// ✅ Export upload (memory-based for Cloudinary)
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});
