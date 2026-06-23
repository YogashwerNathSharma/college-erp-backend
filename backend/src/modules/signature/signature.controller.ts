
// Signature Controller
// Handles HTTP request/response for signature CRUD

import { Response } from "express";
import { uploadToCloudinary } from "../../config/cloudinary";
import {
  getAllSignaturesService,
  createSignatureService,
  updateSignatureService,
  deleteSignatureService,
} from "./signature.service";

// ============================================================
// 📋 GET ALL SIGNATURES
// ============================================================

export const getAllSignatures = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const signatures = await getAllSignaturesService(tenantId);
    return res.json({ success: true, data: signatures });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ➕ CREATE SIGNATURE
// ============================================================

export const createSignature = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { title, personName, designation } = req.body;

    if (!title || !personName || !designation) {
      return res.status(400).json({
        success: false,
        message: "Title, person name, and designation are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Signature image is required",
      });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer, "signatures");

    const signature = await createSignatureService(tenantId, {
      title,
      personName,
      designation,
      imageUrl,
    });

    return res.status(201).json({
      success: true,
      data: signature,
      message: "Signature created successfully",
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✏️ UPDATE SIGNATURE
// ============================================================

export const updateSignature = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { title, personName, designation, isActive } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (personName !== undefined) updateData.personName = personName;
    if (designation !== undefined) updateData.designation = designation;
    if (isActive !== undefined) updateData.isActive = isActive === "true" || isActive === true;

    // If new image uploaded
    if (req.file) {
      updateData.imageUrl = await uploadToCloudinary(req.file.buffer, "signatures");
    }

    const signature = await updateSignatureService(id, tenantId, updateData);

    return res.json({
      success: true,
      data: signature,
      message: "Signature updated successfully",
    });
  } catch (error: any) {
    const statusCode = error.message === "Signature not found" ? 404 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🗑️ DELETE SIGNATURE
// ============================================================

export const deleteSignature = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const result = await deleteSignatureService(id, tenantId);
    return res.json({ success: true, message: result.message });
  } catch (error: any) {
    const statusCode = error.message === "Signature not found" ? 404 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};
