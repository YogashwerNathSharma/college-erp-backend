import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";

/**
 * Academic Year Resolution Middleware
 * ═══════════════════════════════════════════════════════════════
 * Resolves and validates the selected academic year for every
 * tenant-scoped request. Places the validated academicYearId
 * onto `req.academicYearId` for downstream controllers/services.
 *
 * Resolution order:
 *   1. x-academic-year-id header (set by frontend interceptor)
 *   2. academicYearId query parameter
 *   3. academicYearId in request body
 *   4. Auto-resolve: tenant's current active year (isCurrent: true)
 *
 * Usage: Place AFTER authMiddleware and resolveTenant.
 *
 *   router.use(authMiddleware, resolveTenant, resolveAcademicYear);
 *
 * Or in app.ts as a global middleware for tenant routes.
 * ═══════════════════════════════════════════════════════════════
 */

// In-memory cache for tenant -> current academic year ID
// Avoids a DB hit on every single request when no year header is sent.
// Invalidated when academic year is created/toggled/set-active.
const currentYearCache = new Map<string, { id: string; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the current-year cache for a tenant.
 * Call this whenever an academic year is created, toggled, or set active.
 */
export const invalidateAcademicYearCache = (tenantId: string): void => {
  currentYearCache.delete(tenantId);
};

/**
 * Main middleware: resolves and validates academicYearId.
 */
export const resolveAcademicYear = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ─── Skip for SUPER_ADMIN (they operate cross-tenant) ───
    if (req.user?.role === "SUPER_ADMIN") {
      return next();
    }

    const tenantId = (req as any).tenantId || req.user?.tenantId;

    // If no tenantId available, skip (unauthenticated or system route)
    if (!tenantId) {
      return next();
    }

    // ─── 1. Extract academicYearId from request ───
    let academicYearId: string | undefined =
      (req.headers["x-academic-year-id"] as string) ||
      (req.query.academicYearId as string) ||
      req.body?.academicYearId ||
      undefined;

    // ─── 2. If provided, validate it belongs to this tenant ───
    if (academicYearId) {
      const year = await prisma.academicYear.findFirst({
        where: {
          id: academicYearId,
          tenantId,
        },
        select: { id: true, isDeleted: true },
      });

      if (!year) {
        return res.status(400).json({
          success: false,
          message: "Invalid academic year. It does not belong to your institution.",
        });
      }

      if (year.isDeleted) {
        return res.status(400).json({
          success: false,
          message: "The selected academic year has been deleted. Please select an active year.",
        });
      }

      // Valid — inject onto request
      (req as any).academicYearId = academicYearId;
      return next();
    }

    // ─── 3. Auto-resolve: find tenant's current active year ───
    // Check in-memory cache first
    const now = Date.now();
    const cached = currentYearCache.get(tenantId);
    if (cached && cached.expiry > now) {
      (req as any).academicYearId = cached.id;
      return next();
    }

    // Cache miss — query DB
    const currentYear = await prisma.academicYear.findFirst({
      where: {
        tenantId,
        isCurrent: true,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (currentYear) {
      // Cache it
      currentYearCache.set(tenantId, {
        id: currentYear.id,
        expiry: now + CACHE_TTL_MS,
      });
      (req as any).academicYearId = currentYear.id;
    }
    // If no current year found, academicYearId stays undefined.
    // Controllers can handle this gracefully (e.g., show "No academic year set" message).

    next();
  } catch (error) {
    console.error("AcademicYear Middleware Error:", error);
    // Don't block the request on middleware failure — let it proceed without year context
    next();
  }
};

/**
 * Helper: Get academic-year-scoped prisma filter.
 * Use this in services to scope queries:
 *
 *   const where = { ...tenantFilter(req), ...academicYearFilter(req), ...otherFilters };
 *
 * Returns {} if no academicYearId is set (graceful fallback).
 */
export const academicYearFilter = (req: Request): { academicYearId?: string } => {
  const yearId = (req as any).academicYearId;
  if (!yearId) return {};
  return { academicYearId: yearId };
};
