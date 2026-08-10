import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import prisma from "../../utils/prisma";

const UPLOAD_DIR = path.resolve(__dirname, "../../../uploads");

/**
 * GET /api/files/:id/download
 *
 * Files are never served directly from the filesystem. The record is first
 * resolved by both file id and the authenticated user's tenantId.
 */
export const downloadFile = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const fileId = req.params.id as string;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const file = await prisma.fileStorage.findFirst({
      where: {
        id: fileId,
        tenantId,
        isDeleted: false,
      },
    });

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const relativePath = path.normalize(file.path);

    // Defense-in-depth: FileStorage paths must remain inside /uploads.
    if (
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath) ||
      !relativePath.startsWith(`tenants${path.sep}${tenantId}${path.sep}`)
    ) {
      console.warn("[Private File] Rejected unsafe path", { fileId, tenantId });
      return res.status(403).json({ success: false, message: "File access denied" });
    }

    const fullPath = path.resolve(UPLOAD_DIR, relativePath);
    const uploadRoot = `${UPLOAD_DIR}${path.sep}`;

    if (!fullPath.startsWith(uploadRoot)) {
      return res.status(403).json({ success: false, message: "File access denied" });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: "File content not found" });
    }

    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader("Content-Length", String(file.size));
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const inlineTypes = ["image/", "application/pdf"];
    const isInline = inlineTypes.some((type) => (file.mimeType || "").startsWith(type));
    const disposition = isInline ? "inline" : "attachment";
    const safeName = file.originalName.replace(/[\r\n\\\"]+/g, "_");
    res.setHeader("Content-Disposition", `${disposition}; filename="${safeName}"`);

    return res.sendFile(fullPath);
  } catch (error: any) {
    console.error("Private file download error:", error);
    return res.status(500).json({ success: false, message: "Failed to download file" });
  }
};
