import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import {
  createSectionService,
  getSectionsService,
  updateSectionService,
  toggleSectionService,
} from "./section.service";

export const createSection = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { name, classId } = req.body;
    const academicYearId = req.body.academicYearId || (req as any).academicYearId;
    if (!name || !classId || !academicYearId) return res.status(400).json({ success: false, message: "All fields required" });
    const section = await createSectionService({ name, classId, academicYearId }, tenantId);
    return res.status(201).json({ success: true, data: section });
  } catch (error: any) {
    console.error("SECTION ERROR 👉", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create section" });
  }
};

export const getSectionDropdown = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const academicYearId = (req as any).academicYearId || (req.query.academicYearId as string | undefined);
    const classId = req.query.classId as string | undefined;
    const allYears = req.query.allYears === "true";
    if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const where: any = { tenantId };
    if (!allYears && academicYearId) where.academicYearId = academicYearId;
    if (classId) where.classId = classId;
    const sections = await prisma.section.findMany({
      where,
      select: { id: true, name: true, classId: true, isActive: true },
      orderBy: { name: "asc" },
    });
    return res.status(200).json({ success: true, data: sections });
  } catch (error: any) {
    console.error("SECTION DROPDOWN ERROR 👉", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to load section dropdown" });
  }
};

// Exact section resolver used by timetable table. It deliberately ignores
// academicYearId because a saved timetable row may reference a section from
// another academic-year scope. Tenant isolation remains mandatory.
export const getSectionById = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;
    if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!id) return res.status(400).json({ success: false, message: "Section id required" });

    const section = await prisma.section.findFirst({
      where: { id, tenantId },
      select: { id: true, name: true, classId: true, academicYearId: true, isActive: true },
    });
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });
    return res.status(200).json({ success: true, data: section });
  } catch (error: any) {
    console.error("SECTION BY ID ERROR 👉", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to load section" });
  }
};

export const getSections = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const academicYearId = (req as any).academicYearId || (req.query.academicYearId as string | undefined);
    const classId = req.query.classId as string | undefined;
    const sections = await getSectionsService(tenantId, academicYearId, classId);
    return res.status(200).json({ success: true, data: sections });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSection = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name required" });
    const updated = await updateSectionService(id, { name }, tenantId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleSection = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;
    const updated = await toggleSectionService(id, tenantId);
    return res.status(200).json({ success: true, data: updated, message: updated.isActive ? "Section activated" : "Section deactivated" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
