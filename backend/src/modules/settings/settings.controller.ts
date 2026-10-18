
// Settings Controller (Enhanced v2)
// SUPER_ADMIN: apni profile update kar sake
// TENANT ADMIN: tenant settings + profile + user management (role-wise create/edit/delete)

import { Response } from "express";
import {
  getTenantSettingsService,
  updateTenantSettingsService,
  updateProfileService,
  changePasswordService,
  getUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  deleteUserService,
  getRolesService,
  getSuperAdminProfileService,
  updateSuperAdminProfileService,
} from "./settings.service";
import prisma from "../../utils/prisma";

// ============================================================
// 📋 GET SETTINGS (role-based response)
// SUPER_ADMIN ko apni profile + platform stats milega
// TENANT ADMIN ko tenant info + profile + usage milega
// ============================================================

export const getSettings = async (req: any, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;
    const tenantId = req.tenantId;

    if (role === "SUPER_ADMIN") {
      // Super Admin ko apni profile info do
      const data = await getSuperAdminProfileService(userId);
      return res.json({ success: true, data });
    }

    // Tenant Admin ko tenant + profile + usage
    const data = await getTenantSettingsService(tenantId, userId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✏️ UPDATE TENANT SETTINGS (branding/info) — Tenant ADMIN only
// ============================================================

export const updateTenantSettings = async (req: any, res: Response) => {
  try {
    const role = req.user?.role;
    if (role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Super Admin cannot update tenant settings. Use platform settings.",
      });
    }

    const tenantId = req.tenantId;
    const data = await updateTenantSettingsService(tenantId, req.body);
    res.json({ success: true, data, message: "Tenant settings updated successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🎨 UPDATE THEME (Both SUPER_ADMIN + TENANT ADMIN)
// ============================================================

export const updateTheme = async (req: any, res: Response) => {
  try {
    const { primaryColor } = req.body;
    if (!primaryColor) {
      return res.status(400).json({ success: false, message: "primaryColor is required" });
    }

    const role = req.user?.role;
    const tenantId = req.tenantId;

    // Use raw PrismaClient to avoid $extends issues
    const { PrismaClient } = require("@prisma/client");
    const rawPrisma = new PrismaClient();

    try {
      if (role === "SUPER_ADMIN") {
        // Save to PlatformSettings
        const existing = await rawPrisma.platformSettings.findFirst();
        if (existing) {
          await rawPrisma.platformSettings.update({ where: { id: existing.id }, data: { primaryColor } });
        } else {
          await rawPrisma.platformSettings.create({ data: { primaryColor, appName: "College ERP" } });
        }
      } else if (tenantId) {
        // Tenant Admin — save to tenant
        await rawPrisma.tenant.update({
          where: { id: tenantId },
          data: { primaryColor },
        });
      }
    } finally {
      await rawPrisma.$disconnect();
    }

    res.json({ success: true, message: "Theme updated successfully" });
  } catch (error: any) {
    console.error("Theme update error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to save theme" });
  }
};

// ============================================================
// 👤 UPDATE PROFILE — Dono ke liye (Super Admin + Tenant Admin)
// ============================================================

export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    let data;
    if (role === "SUPER_ADMIN") {
      data = await updateSuperAdminProfileService(userId, req.body);
    } else {
      data = await updateProfileService(userId, req.body);
    }

    res.json({ success: true, data, message: "Profile updated successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🔐 CHANGE PASSWORD — Sabke liye (old verify + new set)
// ============================================================

export const changePassword = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password both required hain",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password minimum 6 characters hona chahiye",
      });
    }

    const result = await changePasswordService(userId, currentPassword, newPassword);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    const statusCode =
      error.message === "Current password is incorrect" ? 400 :
      error.message === "User not found" ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// ============================================================
// 👥 GET USERS (Tenant Admin — saare users with filters)
// ============================================================

export const getUsers = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { page, limit, search, role, status } = req.query;

    const filters = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search: search as string,
      role: role as string,
      status: status as string,
    };

    const result = await getUsersService(tenantId, filters);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// 👤 GET USER BY ID
// ============================================================

export const getUserById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const user = await getUserByIdService(id, tenantId);
    res.json({ success: true, data: user });
  } catch (error: any) {
    const statusCode = error.message === "User not found" ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// ============================================================
// ➕ CREATE USER (Tenant Admin — role-wise)
// ============================================================

export const createUser = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { name, email, phone, role, password } = req.body;
    console.log("=== CREATE USER ===");
    console.log("tenantId:", req.tenantId);
    console.log("body:", JSON.stringify(req.body));
    // Validation
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and role are required",
      });
    }

    // Allowed roles check
    const allowedRoles = ["STUDENT", "TEACHER", "PRINCIPAL", "STAFF"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed: ${allowedRoles.join(", ")}`,
      });
    }

    const result = await createUserService(tenantId, { name, email, phone, role, password });

    res.status(201).json({
      success: true,
      data: result.user,
      generatedPassword: result.generatedPassword || undefined,
      message: result.generatedPassword
        ? "User created! Auto-generated password provided (share with user)."
        : "User created successfully",
    });
  } catch (error: any) {
    const statusCode =
      error.message === "User with this email already exists" ? 409 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✏️ UPDATE USER (Tenant Admin)
// ============================================================

export const updateUser = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { name, email, phone, role, status } = req.body;

    const updatedUser = await updateUserService(id, tenantId, {
      name,
      email,
      phone,
      role,
      status,
    });

    res.json({ success: true, data: updatedUser, message: "User updated successfully" });
  } catch (error: any) {
    const statusCode =
      error.message === "User not found" ? 404 :
      error.message === "Email already in use" ? 409 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🗑️ DELETE USER (Soft delete — deactivate)
// ============================================================

export const deleteUser = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const result = await deleteUserService(id, tenantId);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    const statusCode =
      error.message === "User not found" ? 404 :
      error.message === "Cannot deactivate an Admin user" ? 403 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// ============================================================
// 📜 GET AVAILABLE ROLES
// ============================================================

export const getRoles = async (req: any, res: Response) => {
  try {
    const roles = getRolesService();
    res.json({ success: true, data: roles });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

