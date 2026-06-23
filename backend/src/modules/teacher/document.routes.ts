

import express from "express";
import multer from "multer";
import path from "path";
import { upload, getByTeacher, remove } from "./document.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";

// Multer config
const storage = multer.memoryStorage();

const uploadFile = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

const router = express.Router();

// UPLOAD DOCUMENT
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  uploadFile.single("file"),
  upload
);

// GET DOCUMENTS
router.get("/", authMiddleware, resolveTenant, getByTeacher);

// DELETE DOCUMENT
router.delete("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, remove);

export default router;

