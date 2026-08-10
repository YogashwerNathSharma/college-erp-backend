import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { fileManagerUpload } from "./file-manager-upload.middleware";
import { uploadFiles, getFiles, getFileById, updateFile, deleteFile, moveFile, createFolder, getFolders, deleteFolder, getFileStats } from "./file-manager.controller";
import { downloadFile } from "./file-download.controller";

const router = Router();
router.use(authMiddleware);

router.get("/", getFiles);
router.get("/stats", getFileStats);
router.get("/folders", getFolders);
router.get("/:id/download", downloadFile);
router.get("/:id", getFileById);

const fileAdmin = allowRoles("ADMIN", "SUPER_ADMIN");
router.post("/upload", fileAdmin, fileManagerUpload.array("files", 10), uploadFiles);
router.put("/:id", fileAdmin, updateFile);
router.put("/:id/move", fileAdmin, moveFile);
router.delete("/:id", fileAdmin, deleteFile);
router.post("/folder", fileAdmin, createFolder);
router.delete("/folder/:id", fileAdmin, deleteFolder);

export default router;
