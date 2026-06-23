import multer from "multer";

// ✅ Memory storage — files go to Cloudinary, not disk
const memStorage = multer.memoryStorage();

// File filters
const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
  }
};

const documentFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    "image/jpeg", "image/png", "image/jpg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX, JPG, and PNG files are allowed"));
  }
};

// Export multer instances (memory-based for Cloudinary)
export const uploadPhoto = multer({
  storage: memStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single("photo");

export const uploadDocument = multer({
  storage: memStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("document");

export const uploadMultipleDocuments = multer({
  storage: memStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("documents", 10); // max 10 files
