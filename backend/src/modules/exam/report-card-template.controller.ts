// report-card-template.controller.ts
import { Response } from "express";
import {
  getTemplateByExamService,
  upsertTemplateService,
  setTemplateSkillsService,
} from "./report-card-template.service";

export const getTemplateByExam = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const data = await getTemplateByExamService(req.params.examId, tenantId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("GET REPORT CARD TEMPLATE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching template" });
  }
};

export const upsertTemplate = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const data = await upsertTemplateService(req.params.examId, req.body, tenantId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("UPSERT REPORT CARD TEMPLATE ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "Error saving template" });
  }
};

export const setTemplateSkills = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const skillIds = Array.isArray(req.body?.skillIds) ? req.body.skillIds : [];
    const data = await setTemplateSkillsService(req.params.templateId, skillIds, tenantId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("SET TEMPLATE SKILLS ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "Error saving template skills" });
  }
};
