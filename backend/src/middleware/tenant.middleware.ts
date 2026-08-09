import { Request, Response, NextFunction } from "express";

/**
 * Tenant Isolation Middleware
 * Ensures every authenticated request carries a valid tenantId
 * and prevents cross-tenant data access.
 * 
 * Usage: Place AFTER authMiddleware on tenant-scoped routes.
 */
export const enforceTenantIsolation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip for SUPER_ADMIN (they manage all tenants)
  if (req.user?.role === "SUPER_ADMIN") {
    return next();
  }

  // Require tenantId for all other roles
  if (!req.user?.tenantId) {
    return res.status(403).json({
      success: false,
      message: "Tenant context is missing. Access denied.",
    });
  }

  // If a tenantId is provided in body/params/query, ensure it matches user's tenant
  const bodyTenantId = req.body?.tenantId;
  const paramTenantId = req.params?.tenantId;
  const queryTenantId = req.query?.tenantId;

  const providedTenantId = bodyTenantId || paramTenantId || queryTenantId;

  if (providedTenantId && providedTenantId !== req.user.tenantId) {
    return res.status(403).json({
      success: false,
      message: "Cross-tenant access is forbidden.",
    });
  }

  // Auto-inject tenantId into body for create/update operations
  if (req.body && typeof req.body === "object") {
    req.body.tenantId = req.user.tenantId;
  }

  next();
};

/**
 * Helper: Get tenant-scoped prisma filter
 * Use this in services to scope all queries:
 * 
 * const where = { ...tenantFilter(req), ...otherFilters };
 */
export const tenantFilter = (req: Request) => {
  if (req.user?.role === "SUPER_ADMIN") return {};
  return { tenantId: req.user?.tenantId };
};
