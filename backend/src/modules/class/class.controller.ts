
import { Request, Response } from "express";
import {
  createClassService,
  getClassesService,
  getDeletedClassesService,
  updateClassService,
  toggleClassStatusService,
  softDeleteClassService,
  restoreClassService,
} from "./class.service";

// ─── Create Class ────────────────────────────────────────────────────────────

export const createClass = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { name, academicYearId } = req.body;

    if (!name || !academicYearId) {
      return res.status(400).json({
        success: false,
        message: "Name and academicYearId required",
      });
    }

    const newClass = await createClassService({ name, academicYearId }, tenantId);

    return res.status(201).json({
      success: true,
      data: newClass,
    });
  } catch (error: any) {
    console.error("CREATE CLASS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create class",
    });
  }
};

// ─── Get All Classes (non-deleted) ───────────────────────────────────────────

export const getClasses = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const academicYearId = req.query.academicYearId as string | undefined;

    const classes = await getClassesService(tenantId, academicYearId);

    return res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Deleted Classes (Recycle Bin) ───────────────────────────────────────

export const getDeletedClasses = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const data = await getDeletedClassesService(tenantId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Class ────────────────────────────────────────────────────────────

export const updateClass = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name required" });
    }

    const updated = await updateClassService(id, { name }, tenantId);

    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Toggle Active/Inactive ─────────────────────────────────────────────────

export const toggleClassStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;

    const updated = await toggleClassStatusService(id, tenantId);

    return res.status(200).json({
      success: true,
      data: updated,
      message: updated.isActive ? "Class activated" : "Class deactivated",
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Soft Delete (Move to Recycle Bin) ───────────────────────────────────────

export const softDeleteClass = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;

    const deleted = await softDeleteClassService(id, tenantId);

    return res.status(200).json({
      success: true,
      data: deleted,
      message: "Class moved to recycle bin",
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Restore from Recycle Bin ────────────────────────────────────────────────

export const restoreClass = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;

    const restored = await restoreClassService(id, tenantId);

    return res.status(200).json({
      success: true,
      data: restored,
      message: "Class restored successfully",
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
