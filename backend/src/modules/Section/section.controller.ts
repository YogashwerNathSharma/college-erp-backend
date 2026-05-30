import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import {
  createSectionService,
  getSectionsService,
  updateSectionService,
  toggleSectionService,
} from "./section.service";

/////////////////////////
// CREATE SECTION
/////////////////////////
export const createSection = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { name, classId, academicYearId } = req.body;

    if (!name || !classId || !academicYearId) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const section = await createSectionService(
      { name, classId, academicYearId },
      tenantId
    );

    return res.status(201).json({
      success: true,
      data: section,
    });

  } catch (error: any) {
    console.error("SECTION ERROR 👉", error); // 🔥 FIXED

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create section",
    });
  }
};
/////////////////////////
// GET ALL SECTIONS
/////////////////////////
export const getSections = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const academicYearId = req.query.academicYearId as string | undefined;
    const classId = req.query.classId as string | undefined;

    const sections = await getSectionsService(tenantId, academicYearId, classId);

    return res.status(200).json({ success: true, data: sections });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/////////////////////////
// UPDATE SECTION
/////////////////////////
export const updateSection = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name required" });
    }

    const updated = await updateSectionService(id, { name }, tenantId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/////////////////////////
// TOGGLE SECTION STATUS
/////////////////////////
export const toggleSection = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;

    const updated = await toggleSectionService(id, tenantId);

    return res.status(200).json({
      success: true,
      data: updated,
      message: updated.isActive ? "Section activated" : "Section deactivated",
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};