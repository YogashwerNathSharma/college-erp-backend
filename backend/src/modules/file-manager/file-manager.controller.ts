import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════
// FILE MANAGER CONTROLLER
// ══════════════════════════════════════════════════════════

const UPLOAD_DIR = path.join(__dirname, "../../../uploads");
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/files/upload
 * Upload one or more files (uses multer in routes)
 */
export const uploadFiles = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name || "Unknown";
    const { category = "GENERAL", entityId, entityType, folderId, description, tags } = req.body;

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const extension = path.extname(file.originalname).replace(".", "").toLowerCase();
      const fileName = `${crypto.randomUUID()}.${extension}`;
      const relativePath = `tenants/${tenantId}/${category.toLowerCase()}/${fileName}`;
      const fullPath = path.join(UPLOAD_DIR, relativePath);

      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Move file to destination
      fs.renameSync(file.path, fullPath);

      // Create DB record
      const fileRecord = await prisma.fileStorage.create({
        data: {
          fileName,
          originalName: file.originalname,
          path: relativePath,
          url: `/uploads/${relativePath}`,
          mimeType: file.mimetype,
          size: file.size,
          extension,
          category,
          folderId: folderId || undefined,
          entityId: entityId || undefined,
          entityType: entityType || undefined,
          uploadedBy: userId,
          uploadedByName: userName,
          description: description || undefined,
          tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((t: string) => t.trim())) : [],
          tenantId,
        },
      });

      uploadedFiles.push(fileRecord);
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: uploadedFiles,
    });
  } catch (error: any) {
    console.error("Error uploading files:", error);
    res.status(500).json({ success: false, message: "Upload failed", error: error.message });
  }
};

/**
 * GET /api/files
 * List files with filters and pagination
 */
export const getFiles = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const {
      page = "1",
      limit = "20",
      category,
      folderId,
      entityType,
      entityId,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      mimeType,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { tenantId, isDeleted: false };

    if (category) where.category = category as string;
    if (folderId) where.folderId = folderId as string;
    if (folderId === "root") where.folderId = null;
    if (entityType) where.entityType = entityType as string;
    if (entityId) where.entityId = entityId as string;
    if (mimeType) where.mimeType = { startsWith: mimeType as string };

    if (search) {
      where.OR = [
        { originalName: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { tags: { has: search as string } },
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder as string;

    const [files, total] = await Promise.all([
      prisma.fileStorage.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
      }),
      prisma.fileStorage.count({ where }),
    ]);

    res.json({
      success: true,
      data: files,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Error fetching files:", error);
    res.status(500).json({ success: false, message: "Failed to fetch files", error: error.message });
  }
};

/**
 * GET /api/files/:id
 * Get single file details
 */
export const getFileById = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const fileId = req.params.id as string;

    const file = await prisma.fileStorage.findFirst({
      where: { id: fileId, tenantId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    res.json({ success: true, data: file });
  } catch (error: any) {
    console.error("Error fetching file:", error);
    res.status(500).json({ success: false, message: "Failed to fetch file", error: error.message });
  }
};

/**
 * PUT /api/files/:id
 * Update file metadata
 */
export const updateFile = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const fileId = req.params.id as string;
    const { description, tags, category, folderId, isPublic } = req.body;

    const file = await prisma.fileStorage.findFirst({
      where: { id: fileId, tenantId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const updated = await prisma.fileStorage.update({
      where: { id: fileId },
      data: {
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : tags.split(",").map((t: string) => t.trim()) }),
        ...(category !== undefined && { category }),
        ...(folderId !== undefined && { folderId: folderId || null }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating file:", error);
    res.status(500).json({ success: false, message: "Failed to update file", error: error.message });
  }
};

/**
 * DELETE /api/files/:id
 * Soft delete a file
 */
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const fileId = req.params.id as string;
    const userId = (req as any).user?.id;

    const file = await prisma.fileStorage.findFirst({
      where: { id: fileId, tenantId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    await prisma.fileStorage.update({
      where: { id: fileId },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
    });

    res.json({ success: true, message: "File deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting file:", error);
    res.status(500).json({ success: false, message: "Failed to delete file", error: error.message });
  }
};

/**
 * PUT /api/files/:id/move
 * Move file to a different folder
 */
export const moveFile = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const fileId = req.params.id as string;
    const { folderId } = req.body;

    const file = await prisma.fileStorage.findFirst({
      where: { id: fileId, tenantId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Verify folder exists if specified
    if (folderId) {
      const folder = await prisma.fileFolder.findFirst({
        where: { id: folderId, tenantId, isActive: true },
      });
      if (!folder) {
        return res.status(404).json({ success: false, message: "Destination folder not found" });
      }
    }

    const updated = await prisma.fileStorage.update({
      where: { id: fileId },
      data: { folderId: folderId || null },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error moving file:", error);
    res.status(500).json({ success: false, message: "Failed to move file", error: error.message });
  }
};

/**
 * POST /api/files/folder
 * Create a new folder
 */
export const createFolder = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name || "Unknown";
    const { name, parentId, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Folder name is required" });
    }

    // Build path
    let folderPath = `/${name}`;
    if (parentId) {
      const parent = await prisma.fileFolder.findFirst({
        where: { id: parentId, tenantId, isActive: true },
      });
      if (!parent) {
        return res.status(404).json({ success: false, message: "Parent folder not found" });
      }
      folderPath = `${parent.path}/${name}`;
    }

    // Check for duplicate folder name in same parent
    const existing = await prisma.fileFolder.findFirst({
      where: { tenantId, name, parentId: parentId || null, isActive: true },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "Folder with this name already exists" });
    }

    const folder = await prisma.fileFolder.create({
      data: {
        name,
        parentId: parentId || null,
        path: folderPath,
        color: color || null,
        icon: icon || null,
        createdBy: userId,
        createdByName: userName,
        tenantId,
      },
    });

    res.status(201).json({ success: true, data: folder });
  } catch (error: any) {
    console.error("Error creating folder:", error);
    res.status(500).json({ success: false, message: "Failed to create folder", error: error.message });
  }
};

/**
 * GET /api/files/folders
 * List folders (tree structure)
 */
export const getFolders = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { parentId } = req.query;

    const where: any = { tenantId, isActive: true };
    if (parentId) {
      where.parentId = parentId as string;
    } else {
      where.parentId = null; // Root folders
    }

    const folders = await prisma.fileFolder.findMany({
      where,
      orderBy: { name: "asc" },
    });

    // Count files in each folder
    const foldersWithCount = await Promise.all(
      folders.map(async (folder) => {
        const fileCount = await prisma.fileStorage.count({
          where: { tenantId, folderId: folder.id, isDeleted: false },
        });
        const subFolderCount = await prisma.fileFolder.count({
          where: { tenantId, parentId: folder.id, isActive: true },
        });
        return { ...folder, fileCount, subFolderCount };
      })
    );

    res.json({ success: true, data: foldersWithCount });
  } catch (error: any) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch folders", error: error.message });
  }
};

/**
 * DELETE /api/files/folder/:id
 * Delete a folder (soft delete)
 */
export const deleteFolder = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const folderId = req.params.id as string;

    const folder = await prisma.fileFolder.findFirst({
      where: { id: folderId, tenantId, isActive: true },
    });

    if (!folder) {
      return res.status(404).json({ success: false, message: "Folder not found" });
    }

    // Check if folder has files or subfolders
    const fileCount = await prisma.fileStorage.count({
      where: { tenantId, folderId, isDeleted: false },
    });
    const subFolderCount = await prisma.fileFolder.count({
      where: { tenantId, parentId: folderId, isActive: true },
    });

    if (fileCount > 0 || subFolderCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Folder is not empty. Move or delete contents first.",
      });
    }

    await prisma.fileFolder.update({
      where: { id: folderId },
      data: { isActive: false },
    });

    res.json({ success: true, message: "Folder deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ success: false, message: "Failed to delete folder", error: error.message });
  }
};

/**
 * GET /api/files/stats
 * Storage statistics
 */
export const getFileStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;

    const [
      totalFiles,
      totalSize,
      categoryBreakdown,
      recentFiles,
      mimeTypeBreakdown,
    ] = await Promise.all([
      // Total files
      prisma.fileStorage.count({ where: { tenantId, isDeleted: false } }),
      // Total size
      prisma.fileStorage.aggregate({
        where: { tenantId, isDeleted: false },
        _sum: { size: true },
      }),
      // By category
      prisma.fileStorage.groupBy({
        by: ["category"],
        where: { tenantId, isDeleted: false },
        _count: { id: true },
        _sum: { size: true },
      }),
      // Recent 5 files
      prisma.fileStorage.findMany({
        where: { tenantId, isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // By mime type (top 5)
      prisma.fileStorage.groupBy({
        by: ["mimeType"],
        where: { tenantId, isDeleted: false },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

    const totalSizeBytes = totalSize._sum.size || 0;
    const totalFolders = await prisma.fileFolder.count({ where: { tenantId, isActive: true } });

    res.json({
      success: true,
      data: {
        totalFiles,
        totalFolders,
        totalSize: totalSizeBytes,
        totalSizeFormatted: formatFileSize(totalSizeBytes),
        categoryBreakdown: categoryBreakdown.map((c: any) => ({
          category: c.category,
          count: c._count.id,
          size: c._sum.size || 0,
          sizeFormatted: formatFileSize(c._sum.size || 0),
        })),
        mimeTypeBreakdown: mimeTypeBreakdown.map((m: any) => ({
          mimeType: m.mimeType,
          count: m._count.id,
        })),
        recentFiles,
      },
    });
  } catch (error: any) {
    console.error("Error fetching file stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats", error: error.message });
  }
};

/**
 * Format bytes to human readable
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
