import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════

export interface CreateAdminUserDTO {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  department?: string;
  avatar?: string;
  twoFactorEnabled?: boolean;
  status?: string;
}

export interface UpdateAdminUserDTO {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  avatar?: string;
  status?: string;
  twoFactorEnabled?: boolean;
}

export interface AdminUserFilters {
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ══════════════════════════════════════════════════════
// GET ALL ADMIN USERS
// ══════════════════════════════════════════════════════

export const getAdminUsersService = async (filters: AdminUserFilters) => {
  const {
    search,
    role,
    status,
    department,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) where.role = role;
  if (status) where.status = status;
  if (department) where.department = department;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ══════════════════════════════════════════════════════
// GET ADMIN USER BY ID
// ══════════════════════════════════════════════════════

export const getAdminUserByIdService = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      department: true,
      avatar: true,
      status: true,
      twoFactorEnabled: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new Error("Admin user not found");
  return user;
};

// ══════════════════════════════════════════════════════
// CREATE ADMIN USER
// ══════════════════════════════════════════════════════

export const createAdminUserService = async (data: CreateAdminUserDTO) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      phone: data.phone || null,
      department: data.department || null,
      avatar: data.avatar || null,
      twoFactorEnabled: data.twoFactorEnabled || false,
      status: data.status || "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      department: true,
      avatar: true,
      status: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  });

  // Log the creation
  await prisma.auditLog.create({
    data: {
      action: "ADMIN_USER_CREATED",
      entity: "User",
      entityType: "User",
      entityId: user.id,
      tenantId: user.tenantId,
      details: { name: user.name, email: user.email, role: user.role },
    },
  }).catch(() => {}); // Non-critical

  return user;
};

// ══════════════════════════════════════════════════════
// UPDATE ADMIN USER
// ══════════════════════════════════════════════════════

export const updateAdminUserService = async (id: string, data: UpdateAdminUserDTO) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new Error("Admin user not found");

  if (data.email && data.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailTaken) throw new Error("Email already in use");
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.role && { role: data.role }),
      ...(data.department !== undefined && { department: data.department }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
      ...(data.status && { status: data.status }),
      ...(data.twoFactorEnabled !== undefined && { twoFactorEnabled: data.twoFactorEnabled }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      department: true,
      avatar: true,
      status: true,
      twoFactorEnabled: true,
      updatedAt: true,
    },
  });

  return user;
};

// ══════════════════════════════════════════════════════
// DELETE ADMIN USER
// ══════════════════════════════════════════════════════

export const deleteAdminUserService = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("Admin user not found");
  if (user.role === "SUPER_ADMIN") throw new Error("Cannot delete a Super Admin account");

  await prisma.user.delete({ where: { id } });
  return { message: "User deleted successfully" };
};

// ══════════════════════════════════════════════════════
// BULK DELETE ADMIN USERS
// ══════════════════════════════════════════════════════

export const bulkDeleteAdminUsersService = async (ids: string[]) => {
  const superAdmins = await prisma.user.findMany({
    where: { id: { in: ids }, role: "SUPER_ADMIN" },
  });

  if (superAdmins.length > 0) {
    throw new Error("Cannot delete Super Admin accounts");
  }

  const result = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  return { deletedCount: result.count };
};

// ══════════════════════════════════════════════════════
// BULK STATUS UPDATE
// ══════════════════════════════════════════════════════

export const bulkUpdateStatusService = async (ids: string[], status: string) => {
  const result = await prisma.user.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });
  return { updatedCount: result.count };
};

// ══════════════════════════════════════════════════════
// RESET PASSWORD
// ══════════════════════════════════════════════════════

export const resetPasswordService = async (id: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });

  return { message: "Password reset successfully" };
};

// ══════════════════════════════════════════════════════
// TOGGLE 2FA
// ══════════════════════════════════════════════════════

export const toggle2FAService = async (id: string, enabled: boolean) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  await prisma.user.update({
    where: { id },
    data: { twoFactorEnabled: enabled },
  });

  return { message: `2FA ${enabled ? "enabled" : "disabled"} successfully` };
};

// ══════════════════════════════════════════════════════
// GET LOGIN HISTORY
// ══════════════════════════════════════════════════════

export const getLoginHistoryService = async (userId?: string, limit = 50) => {
  const where: any = { action: "LOGIN" };
  if (userId) where.userId = userId;

  const history = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      userId: true,
      action: true,
      details: true,
      createdAt: true,
    },
  }).catch(() => []);

  return history;
};

// ══════════════════════════════════════════════════════
// GET ACTIVE SESSIONS
// ══════════════════════════════════════════════════════

export const getActiveSessionsService = async (userId?: string) => {
  const where: any = { expiresAt: { gt: new Date() } };
  if (userId) where.userId = userId;

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
      lastActivity: true,
      user: { select: { name: true, email: true } },
    },
  }).catch(() => []);

  return sessions;
};

// ══════════════════════════════════════════════════════
// REVOKE SESSION
// ══════════════════════════════════════════════════════

export const revokeSessionService = async (sessionId: string) => {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
    throw new Error("Session not found");
  });
  return { message: "Session revoked successfully" };
};

// ══════════════════════════════════════════════════════
// REVOKE ALL USER SESSIONS
// ══════════════════════════════════════════════════════

export const revokeAllUserSessionsService = async (userId: string) => {
  const result = await prisma.session.deleteMany({ where: { userId } }).catch(() => ({ count: 0 }));
  return { revokedCount: result.count };
};

// ══════════════════════════════════════════════════════
// GET USER ACTIVITY LOG
// ══════════════════════════════════════════════════════

export const getUserActivityService = async (userId: string, limit = 50) => {
  const activities = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      details: true,
      createdAt: true,
    },
  }).catch(() => []);

  return activities;
};

// ══════════════════════════════════════════════════════
// USER STATS
// ══════════════════════════════════════════════════════

export const getUserManagementStatsService = async () => {
  const [totalUsers, activeNow, lockedAccounts, superAdmins, admins] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "LOCKED" } }),
      prisma.user.count({ where: { role: "SUPER_ADMIN" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ]);

  return {
    totalUsers,
    activeNow,
    twoFactorEnabled: 0,
    lockedAccounts,
    byRole: { superAdmins, admins },
  };
};
