// report-card-extras.controller.ts
import { Response } from "express";
import {
  getReportCardExtrasService,
  saveLifeSkillsService,
  saveHealthService,
} from "./report-card-extras.service";

export const getReportCardExtras = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId } = req.params;
    const academicYearId = req.academicYearId || req.query.academicYearId;
    if (!studentId || !academicYearId) {
      return res.status(400).json({ success: false, message: "studentId and academicYearId are required" });
    }
    const data = await getReportCardExtrasService(studentId, academicYearId, tenantId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("GET REPORT CARD EXTRAS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching report card extras" });
  }
};

export const saveLifeSkills = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId } = req.params;
    const academicYearId = req.academicYearId || req.body.academicYearId;
    if (!studentId || !academicYearId) {
      return res.status(400).json({ success: false, message: "studentId and academicYearId are required" });
    }
    const data = await saveLifeSkillsService(studentId, academicYearId, req.body.skills, tenantId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("SAVE LIFE SKILLS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error saving life skills" });
  }
};

export const saveHealth = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId } = req.params;
    const academicYearId = req.academicYearId || req.body.academicYearId;
    if (!studentId || !academicYearId) {
      return res.status(400).json({ success: false, message: "studentId and academicYearId are required" });
    }
    const data = await saveHealthService(studentId, academicYearId, req.body.health || {}, tenantId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("SAVE HEALTH ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error saving health" });
  }
};
