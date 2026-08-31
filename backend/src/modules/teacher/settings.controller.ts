

import { Request, Response } from "express";
import { getSettings, updateSettings } from "./settings.service";
import logger from "../../config/logger";

// ✅ GET SETTINGS
export const get = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Pass middleware-injected academicYearId for fallback during settings creation
    const academicYearId = (req as any).academicYearId || req.query.academicYearId;
    const data = await getSettings(tenantId, academicYearId);
    return res.json({ success: true, data });
  } catch (e: any) {
    logger.error("GET SETTINGS ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ UPDATE SETTINGS
export const update = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await updateSettings(req.body, tenantId);
    return res.json({ success: true, data, message: "Settings updated successfully" });
  } catch (e: any) {
    logger.error("UPDATE SETTINGS ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};

