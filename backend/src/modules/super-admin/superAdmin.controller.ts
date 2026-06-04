
import { Response } from "express";
import {
  getSuperAdminDashboardService,
  getTenantsService,
  createTenantService,
  updateTenantService,
  deleteTenantService,
  toggleTenantStatusService,
  getTenantByIdService,
  getSuperAdminSettingsService,
  updatePlatformSettingsService,
  updateSuperAdminProfileService,
  getSystemConfigService,
} from "./superAdmin.service";

//////////////////////////////////////////////////////
// 📊 DASHBOARD
//////////////////////////////////////////////////////

export const getSuperAdminDashboard = async (req: any, res: Response) => {
  try {
    const data = await getSuperAdminDashboardService();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// 🏫 GET ALL TENANTS
//////////////////////////////////////////////////////

export const getTenantsList = async (req: any, res: Response) => {
  try {
    const tenants = await getTenantsService();
    res.json({ success: true, data: tenants });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// 🏫 GET TENANT BY ID
//////////////////////////////////////////////////////

export const getTenantById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const tenant = await getTenantByIdService(id);
    res.json({ success: true, data: tenant });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// ✅ CREATE TENANT (with file upload)
//////////////////////////////////////////////////////

export const createTenant = async (req: any, res: Response) => {
  try {
    // Handle uploaded files (multer)
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    let logoUrl: string | null = null;
    let backgroundUrl: string | null = null;

    if (files?.logo?.[0]) {
      logoUrl = `/uploads/tenants/${files.logo[0].filename}`;
    }

    if (files?.background?.[0]) {
      backgroundUrl = `/uploads/tenants/${files.background[0].filename}`;
    }

    // Merge file URLs with body data
    const tenantData = {
      ...req.body,
      logoUrl,
      backgroundUrl,
    };

    const tenant = await createTenantService(tenantData);
    res.status(201).json({ success: true, data: tenant });
  } catch (error: any) {
    console.log("❌ CREATE TENANT ERROR:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// ✏️ UPDATE TENANT (with file upload)
//////////////////////////////////////////////////////

export const updateTenant = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const updateData = { ...req.body };

    if (files?.logo?.[0]) {
      updateData.logoUrl = `/uploads/tenants/${files.logo[0].filename}`;
    }
    if (files?.background?.[0]) {
      updateData.backgroundUrl = `/uploads/tenants/${files.background[0].filename}`;
    }

    const tenant = await updateTenantService(id, updateData);
    res.json({ success: true, data: tenant });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// 🗑️ DELETE TENANT (soft delete)
//////////////////////////////////////////////////////

export const deleteTenant = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await deleteTenantService(id);
    res.json({ success: true, message: "Tenant deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// 🔄 TOGGLE TENANT STATUS (active/inactive)
//////////////////////////////////////////////////////

export const toggleTenantStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const tenant = await toggleTenantStatusService(id);
    res.json({ success: true, data: tenant });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// ⚙️ GET SUPER ADMIN SETTINGS
//////////////////////////////////////////////////////

export const getSuperAdminSettings = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const data = await getSuperAdminSettingsService(userId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// 🎨 UPDATE PLATFORM SETTINGS
//////////////////////////////////////////////////////

export const updatePlatformSettings = async (req: any, res: Response) => {
  try {
    const data = await updatePlatformSettingsService(req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// 👤 UPDATE SUPER ADMIN PROFILE
//////////////////////////////////////////////////////

export const updateSuperAdminProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const data = await updateSuperAdminProfileService(userId, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// ⚙️ GET SYSTEM CONFIG
//////////////////////////////////////////////////////

export const getSystemConfig = async (req: any, res: Response) => {
  try {
    const config = await getSystemConfigService();
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
