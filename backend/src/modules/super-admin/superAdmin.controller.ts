import { Request, Response } from "express";
import {
  getSuperAdminDashboardService,
  getTenantsService,
} from "./superAdmin.service";

// 📊 Dashboard
export const getSuperAdminDashboard = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getSuperAdminDashboardService();

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🏫 Tenants List
export const getTenantsList = async (req: Request, res: Response) => {
  try {
    const tenants = await getTenantsService();

    res.json({
      success: true,
      data: tenants,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};