
import { Response } from "express";
import {
  getTenantSettingsService,
  updateTenantSettingsService,
  updateTenantAdminProfileService,
} from "./settings.service";

//////////////////////////////////////////////////////
// 📋 GET TENANT SETTINGS (Tenant Admin only)
//////////////////////////////////////////////////////

export const getSettings = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user?.userId;
    const data = await getTenantSettingsService(tenantId, userId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// ✏️ UPDATE TENANT SETTINGS (branding/info)
//////////////////////////////////////////////////////

export const updateTenantSettings = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const data = await updateTenantSettingsService(tenantId, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// 👤 UPDATE TENANT ADMIN PROFILE
//////////////////////////////////////////////////////

export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const data = await updateTenantAdminProfileService(userId, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

