import { Request, Response } from "express";
import {
  getTenantPermittedModules,
  assignModulesToTenant,
  getModulesWithTenantStatus,
} from "./tenant-modules.service";

// ═══════════════════════════════════════════════════════════
// TENANT MODULE CONTROLLER
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/modules/permitted
 * Tenant-facing: Returns list of modules the current tenant can access.
 * Used by frontend sidebar to show/hide modules.
 */
export const getMyPermittedModules = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    // SUPER_ADMIN sees everything
    if (req.user?.role === "SUPER_ADMIN") {
      return res.json({
        success: true,
        data: { mode: "all", modules: [], details: [], message: "Super Admin has unrestricted access" },
      });
    }

    if (!tenantId) {
      return res.status(400).json({ success: false, message: "Tenant ID not found" });
    }

    const result = await getTenantPermittedModules(tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Get permitted modules error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/modules/assign
 * Super Admin: Bulk assign modules to a tenant.
 * Body: { tenantId: string, modules: string[] }
 */
export const assignModules = async (req: Request, res: Response) => {
  try {
    const { tenantId, modules } = req.body;
    if (!tenantId || !Array.isArray(modules)) {
      return res.status(400).json({ success: false, message: "tenantId and modules[] required" });
    }

    const result = await assignModulesToTenant(tenantId, modules);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Assign modules error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/modules/tenant-status/:tenantId
 * Super Admin: Get all modules with assignment status for a specific tenant.
 */
export const getModulesTenantStatus = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: "tenantId required" });
    }

    const result = await getModulesWithTenantStatus(tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Get module tenant status error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
