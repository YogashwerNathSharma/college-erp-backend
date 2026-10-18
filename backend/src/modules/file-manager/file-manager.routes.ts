import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  uploadFiles,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  moveFile,
  createFolder,
  getFolders,
  deleteFolder,
  getFileStats,
} from "./file-manager.controller";

const router = Router();

router.use(authMiddleware);

// File operations
router.post("/upload", uploadFiles);
router.get("/", getFiles);
router.get("/stats", getFileStats);
router.get("/folders", getFolders);
router.get("/:id", getFileById);
router.put("/:id", updateFile);
router.put("/:id/move", moveFile);
router.delete("/:id", deleteFile);

// Folder operations
router.post("/folder", createFolder);
router.delete("/folder/:id", deleteFolder);

export default router;
