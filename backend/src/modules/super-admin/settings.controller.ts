import { Request, Response } from "express";
import {
  getSettingsService,
  updatePlatformSettingsService,
  updateProfileService,
  getSystemConfigService,
} from "./settings.service";
import prisma from "../../utils/prisma";

//////////////////////////////////////////////////////
// GET ALL SETTINGS
//////////////////////////////////////////////////////

export const getSettings = async (req: any, res: Response) => {
  try {
    const platform = await getSettingsService();
    const systemConfig = await getSystemConfigService();

    // Get actual user from DB using JWT userId
    const userId = req.user.userId || req.user.id || req.user._id;
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(200).json({
      success: true,
      data: {
        profile: dbUser || { id: userId, name: "Admin", email: "", role: req.user.role },
        platform,
        systemConfig,
      },
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// UPDATE PLATFORM
//////////////////////////////////////////////////////

export const updatePlatform = async (req: any, res: Response) => {
  try {
    const data = await updatePlatformSettingsService(req.body);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// UPDATE PROFILE
//////////////////////////////////////////////////////

export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const data = await updateProfileService(userId, req.body);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};