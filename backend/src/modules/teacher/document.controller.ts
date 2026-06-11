

import { Request, Response } from "express";
import { uploadDocument, getDocuments, getAllDocuments, deleteDocument } from "./document.service";

// ✅ UPLOAD DOCUMENT
export const upload = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // File URL from multer
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl;

    if (!fileUrl) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    const data = await uploadDocument(
      { ...req.body, fileUrl },
      tenantId
    );
    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    console.error("UPLOAD DOCUMENT ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ✅ GET DOCUMENTS BY TEACHER
export const getByTeacher = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { teacherId } = req.query;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (teacherId) {
      const data = await getDocuments(teacherId as string, tenantId);
      return res.json({ success: true, data });
    }

    const data = await getAllDocuments(tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("GET DOCUMENTS ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ DELETE DOCUMENT
export const remove = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await deleteDocument(id, tenantId);
    return res.json({ success: true, message: "Document deleted successfully" });
  } catch (e: any) {
    console.error("DELETE DOCUMENT ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};
