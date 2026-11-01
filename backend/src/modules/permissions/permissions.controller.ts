import { Request, Response } from "express";
import {
  getUserPermissions,
  updateUserPermissions,
  grantTemporaryAdmin,
  revokeTemporaryAdmin,
  getMyPermissions,
  getAllUsersWithPermissions,
  resetUserPermissions,
} from "./permissions.service";

//////////////////////////////////////////////////////
// GET USER PERMISSIONS
// GET /api/permissions/:userId
//////////////////////////////////////////////////////
export const getUserPermissionsController = async (req: Request, res: Response) => {
  try {
    const { tenantId, role } = req.user as any;
    const userId = req.params.userId as string;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant not found",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Only ADMIN, SUPER_ADMIN, or the user themselves can view permissions
    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && (req.user as any).userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access denied",
      });
    }

    const permissions = await getUserPermissions(userId, tenantId);

    return res.json({
      success: true,
      data: permissions,
    });
  } catch (error: any) {
    console.error("Get Permissions Error:", error);
    return res.status(error.message === "User not found" ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to get permissions",
    });
  }
};

//////////////////////////////////////////////////////
// UPDATE USER PERMISSIONS
// PUT /api/permissions/:userId
//////////////////////////////////////////////////////
export const updateUserPermissionsController = async (req: Request, res: Response) => {
  try {
    const { tenantId, role } = req.user as any;
    const userId = req.params.userId as string;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant not found",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Only ADMIN or SUPER_ADMIN can update permissions
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only admins can update permissions",
      });
    }

    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No permission updates provided",
      });
    }

    const permissions = await updateUserPermissions(userId, tenantId, updates);

    return res.json({
      success: true,
      data: permissions,
      message: "Permissions updated successfully",
    });
  } catch (error: any) {
    console.error("Update Permissions Error:", error);
    return res.status(error.message === "User not found" ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to update permissions",
    });
  }
};

//////////////////////////////////////////////////////
// GRANT TEMPORARY ADMIN
// POST /api/permissions/temp-admin/:userId
//////////////////////////////////////////////////////
export const grantTemporaryAdminController = async (req: Request, res: Response) => {
  try {
    const { tenantId, role } = req.user as any;
    const userId = req.params.userId as string;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant not found",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Only ADMIN or SUPER_ADMIN can grant temp admin
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only admins can grant temporary admin access",
      });
    }

    const { durationHours } = req.body;
    const hours = Number(durationHours) || 24;

    const result = await grantTemporaryAdmin(
      userId,
      tenantId,
      hours
    );

    return res.json({
      success: true,
      data: result,
      message: `Temporary admin access granted for ${hours} hours`,
    });
  } catch (error: any) {
    console.error("Grant Temp Admin Error:", error);
    return res.status(error.message === "User not found" ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to grant temporary admin",
    });
  }
};

//////////////////////////////////////////////////////
// REVOKE TEMPORARY ADMIN
// DELETE /api/permissions/temp-admin/:userId
//////////////////////////////////////////////////////
export const revokeTemporaryAdminController = async (req: Request, res: Response) => {
  try {
    const { tenantId, role } = req.user as any;
    const userId = req.params.userId as string;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant not found",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Only ADMIN or SUPER_ADMIN can revoke temp admin
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only admins can revoke temporary admin access",
      });
    }

    await revokeTemporaryAdmin(userId, tenantId);

    return res.json({
      success: true,
      message: "Temporary admin access revoked",
    });
  } catch (error: any) {
    console.error("Revoke Temp Admin Error:", error);
    return res.status(error.message === "User not found" ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to revoke temporary admin",
    });
  }
};

//////////////////////////////////////////////////////
// GET MY PERMISSIONS
// GET /api/permissions/my
//////////////////////////////////////////////////////
export const getMyPermissionsController = async (req: Request, res: Response) => {
  try {
    const { userId, tenantId, role } = req.user as any;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // If ADMIN or SUPER_ADMIN, return full access
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return res.json({
        success: true,
        data: {
          role,
          isAdmin: true,
          isTemporaryAdmin: false,
          permissions: null, // Full access, no restrictions
        },
      });
    }

    const permissions = await getMyPermissions(userId, tenantId, role);

    return res.json({
      success: true,
      data: permissions,
    });
  } catch (error: any) {
    console.error("Get My Permissions Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get permissions",
    });
  }
};

//////////////////////////////////////////////////////
// GET ALL USERS WITH PERMISSIONS (Tenant Admin)
// GET /api/permissions/all-users
// Tenant Admin sees all their users with permission status
//////////////////////////////////////////////////////
export const getAllUsersWithPermissionsController = async (req: Request, res: Response) => {
  try {
    const { tenantId, role } = req.user as any;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: "Tenant not found" });
    }

    // Only ADMIN can see all users' permissions
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: Only admins can view all permissions" });
    }

    const filterRole = req.query.role as string | undefined;
    const users = await getAllUsersWithPermissions(tenantId, { role: filterRole });

    return res.json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error: any) {
    console.error("Get All Users Permissions Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to get users permissions" });
  }
};

//////////////////////////////////////////////////////
// RESET USER PERMISSIONS TO DEFAULTS (Tenant Admin)
// DELETE /api/permissions/:userId/reset
// Resets a user's custom permissions back to their role's default
//////////////////////////////////////////////////////
export const resetUserPermissionsController = async (req: Request, res: Response) => {
  try {
    const { tenantId, role } = req.user as any;
    const userId = req.params.userId as string;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: "Tenant not found" });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Only ADMIN can reset permissions
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: Only admins can reset permissions" });
    }

    const result = await resetUserPermissions(userId, tenantId);

    return res.json({
      success: true,
      data: result,
      message: "Permissions reset to role defaults",
    });
  } catch (error: any) {
    console.error("Reset Permissions Error:", error);
    return res.status(error.message === "User not found" ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to reset permissions",
    });
  }
};
