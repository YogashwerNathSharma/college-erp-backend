import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";

//////////////////////////////////////////////////////
// PERMISSION CHECK MIDDLEWARE
// Usage: requirePermission("canMarkAttendance")
// This checks the RolePermission table for the user
//////////////////////////////////////////////////////

export const requirePermission = (...permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // ADMIN and SUPER_ADMIN bypass permission checks
      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        return next();
      }

      if (!user.tenantId) {
        return res.status(400).json({ message: "Tenant not found" });
      }

      // Get user's permissions from the RolePermission table
      const rolePermission = await prisma.rolePermission.findUnique({
        where: {
          tenantId_userId: {
            tenantId: user.tenantId,
            userId: user.userId,
          },
        },
      });

      // If no permission record exists, deny access
      if (!rolePermission) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: No permissions configured",
        });
      }

      // Check if user has temporary admin (and it's not expired)
      if (
        rolePermission.isTemporaryAdmin &&
        rolePermission.tempAdminExpiry &&
        new Date(rolePermission.tempAdminExpiry) > new Date()
      ) {
        return next(); // Temp admin bypasses all permission checks
      }

      // Check each required permission
      for (const perm of permissions) {
        if (!(rolePermission as any)[perm]) {
          return res.status(403).json({
            success: false,
            message: `Forbidden: You don't have '${perm}' permission`,
          });
        }
      }

      next();
    } catch (error) {
      console.error("Permission Middleware Error:", error);
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};
