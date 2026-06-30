
import { Response, NextFunction } from "express";
import prisma from "../utils/prisma";

/**
 * 🔒 Subscription Limit Check Middleware
 * 
 * Usage:
 *   import { checkLimit } from "../../middleware/subscriptionLimit.middleware";
 *   router.post("/", authMiddleware, checkLimit("students"), createStudent);
 * 
 * Resources: "students" | "teachers" | "admins"
 * 
 * Logic:
 *   - Gets tenant's maxStudents/maxTeachers/maxAdmins from DB
 *   - Counts current usage
 *   - If at or over limit → 403 error
 *   - If under limit → next()
 *   - SUPER_ADMIN always bypasses
 *   - maxAllowed = 0 means unlimited (no check)
 */
export const checkLimit = (resource: "students" | "teachers" | "admins") => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId;

      // ═══ DEV MODE: Skip limit check in development ═══
      if (process.env.NODE_ENV !== "production") {
        return next();
      }

      // Super Admin bypass — no limits for god mode
      if (req.user?.role === "SUPER_ADMIN") {
        return next();
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Tenant ID not found in token",
        });
      }

      // Get tenant's subscription limits
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          maxStudents: true,
          maxTeachers: true,
          maxAdmins: true,
          maxStorageInGB: true,
        },
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: "Tenant not found",
        });
      }

      // Count current usage
      let currentCount = 0;
      let maxAllowed = 0;
      let resourceLabel = "";

      switch (resource) {
        case "students":
          currentCount = await prisma.student.count({
            where: { tenantId, isDeleted: false },
          });
          maxAllowed = tenant.maxStudents;
          resourceLabel = "Students";
          break;

        case "teachers":
          currentCount = await prisma.teacher.count({
            where: { tenantId, isDeleted: false },
          });
          maxAllowed = tenant.maxTeachers;
          resourceLabel = "Teachers";
          break;

        case "admins":
          currentCount = await prisma.user.count({
            where: { tenantId, role: "ADMIN" },
          });
          maxAllowed = tenant.maxAdmins;
          resourceLabel = "Admins";
          break;
      }

      // 🔥 Check limit (0 means unlimited — skip check)
      if (maxAllowed > 0 && currentCount >= maxAllowed) {
        return res.status(403).json({
          success: false,
          message: `${resourceLabel} limit reached! Current: ${currentCount}/${maxAllowed}. Please upgrade your plan.`,
          limitReached: true,
          current: currentCount,
          max: maxAllowed,
          resource,
        });
      }

      // ✅ Under limit — proceed to controller
      next();
    } catch (error: any) {
      console.error("LIMIT CHECK ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to check subscription limits",
      });
    }
  };
};

