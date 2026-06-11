

import { Request, Response } from "express";
import { getSettings, updateSettings } from "./settings.service";

// ✅ GET SETTINGS
export const get = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getSettings(tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("GET SETTINGS ERROR:", e);
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
    console.error("UPDATE SETTINGS ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};

