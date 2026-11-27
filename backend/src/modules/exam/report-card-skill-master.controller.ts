// report-card-skill-master.controller.ts
import { Response } from "express";
import {
  listSkillMastersService,
  createSkillMasterService,
  updateSkillMasterService,
} from "./report-card-skill-master.service";

export const listSkillMasters = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const academicYearId = req.academicYearId || req.query.academicYearId;
    const classId = req.query.classId;
    const includeInactive = req.query.includeInactive === "true";
    const data = await listSkillMastersService(tenantId, academicYearId, classId, includeInactive);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("LIST SKILL MASTERS ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "Error fetching skills" });
  }
};

export const createSkillMaster = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const academicYearId = req.academicYearId || req.body.academicYearId;
    const data = await createSkillMasterService(
      { ...req.body, academicYearId },
      tenantId
    );
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("CREATE SKILL MASTER ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "Error creating skill" });
  }
};

export const updateSkillMaster = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const data = await updateSkillMasterService(req.params.id, req.body, tenantId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("UPDATE SKILL MASTER ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "Error updating skill" });
  }
};
