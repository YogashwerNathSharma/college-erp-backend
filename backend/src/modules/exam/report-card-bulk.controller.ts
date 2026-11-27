// report-card-bulk.controller.ts
import { Response } from "express";
import {
  getBulkLifeSkillsService,
  saveBulkLifeSkillsService,
} from "./report-card-bulk.service";

export const getBulkLifeSkills = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const data = await getBulkLifeSkillsService(req.params.examId, tenantId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("GET BULK LIFE SKILLS ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "Error loading life skills" });
  }
};

export const saveBulkLifeSkills = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const data = await saveBulkLifeSkillsService(req.params.examId, req.body?.rows || [], tenantId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("SAVE BULK LIFE SKILLS ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "Error saving life skills" });
  }
};
