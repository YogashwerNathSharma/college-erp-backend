import { Request, Response, NextFunction } from "express";
import { isTenantModuleAllowed } from "../modules/modules/tenant-modules.service";

/**
 * 🔒 Module Gate Middleware
 * 
 * Checks if the current tenant has access to a specific module.
 * Super Admin always bypasses.
 * 
 * Usage:
 *   import { moduleGate } from "../../middleware/moduleGate.middleware";
 *   router.use(authMiddleware, moduleGate("fees"), feesRoutes);
 * 
 * This ensures that even if someone knows the API URL,
 * they can't access modules not assigned to their tenant.
 */
export const moduleGate = (moduleSlug: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Super Admin always has access
      if (req.user?.role === "SUPER_ADMIN") {
        return next();
      }

      const tenantId = req.user?.tenantId;

      // No tenant = no module check needed (handled by auth middleware)
      if (!tenantId) {
        return next();
      }

      const allowed = await isTenantModuleAllowed(tenantId, moduleSlug);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          moduleBlocked: true,
          module: moduleSlug,
          message: `Your institution does not have access to the "${moduleSlug}" module. Please contact your administrator.`,
        });
      }

      next();
    } catch (error) {
      console.error("Module gate error:", error);
      // Fail-open to not break existing functionality
      next();
    }
  };
};
