// @ts-nocheck
import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";

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

  // Recycle-bin ko alag rakhne ke liye: default list sirf non-deleted users dikhaye.
  const where: any = { isDeleted: false };

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
        twoFactorEnabled: true,
        lastLoginAt: true,
        lastLogoutAt: true,
        createdAt: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  // Count each user's ACTIVE, non-expired sessions in one grouped query.
  const userIds = users.map((u: any) => u.id);
  let sessionCounts: Record<string, number> = {};
  if (userIds.length) {
    try {
      const grouped = await prisma.session.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, isActive: true, expiresAt: { gt: new Date() } },
        _count: { _all: true },
      });
      grouped.forEach((g: any) => { sessionCounts[g.userId] = g._count?._all || 0; });
    } catch (e: any) {
      console.error("session count failed:", e.message);
    }
  }

  const usersWithSessions = users.map((u: any) => ({
    ...u,
    activeSessions: sessionCounts[u.id] || 0,
  }));

  return {
    users: usersWithSessions,
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
      lastLoginAt: true,
      lastLogoutAt: true,
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
      tenantId: (user as any).tenantId || '',
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

export const deleteAdminUserService = async (id: string, actorId?: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("Admin user not found");
  if ((user as any).isDeleted) throw new Error("User already deleted");
  if (user.role === "SUPER_ADMIN") throw new Error("Cannot delete a Super Admin account");

  // Soft delete: user DB se mitta nahi — recycle bin me jaata hai.
  // Isse related records (sessions, tickets, audit) safe rehte hain aur
  // user "wapas" nahi aata kyunki list isDeleted:false filter karti hai.
  await prisma.user.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date(), status: "INACTIVE", isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      action: "ADMIN_USER_SOFT_DELETED",
      entity: "User",
      entityType: "User",
      entityId: user.id,
      userId: actorId || "",
      performedBy: actorId || "",
      tenantId: (user as any).tenantId || "",
      metadata: { targetEmail: user.email, targetName: user.name },
    },
  }).catch(() => {});

  return { message: "User moved to Recycle Bin" };
};

// Recycle Bin: list of soft-deleted users
export const getDeletedUsersService = async () => {
  const users = await prisma.user.findMany({
    where: { isDeleted: true },
    select: {
      id: true, name: true, email: true, role: true, phone: true,
      status: true, deletedAt: true, createdAt: true,
    },
    orderBy: { deletedAt: "desc" },
  });
  return { users, total: users.length };
};

// Restore a soft-deleted user from Recycle Bin
export const restoreUserService = async (id: string, actorId?: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");
  if (!(user as any).isDeleted) throw new Error("User is not deleted");

  await prisma.user.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null, status: "ACTIVE", isActive: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "ADMIN_USER_RESTORED",
      entity: "User",
      entityType: "User",
      entityId: user.id,
      userId: actorId || "",
      performedBy: actorId || "",
      tenantId: (user as any).tenantId || "",
      metadata: { targetEmail: user.email, targetName: user.name },
    },
  }).catch(() => {});

  return { message: "User restored successfully", email: user.email };
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

  const result = await prisma.user.updateMany({
    where: { id: { in: ids }, isDeleted: false },
    data: { isDeleted: true, deletedAt: new Date(), status: "INACTIVE", isActive: false },
  });
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

export const resetPasswordService = async (
  id: string,
  newPassword: string,
  actorId?: string,
  reason?: string
) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      // Tenant ko next login par naya password set karne ke liye force karo,
      // taaki wo baad me apna password khud badal sake.
      isFirstLogin: true,
    },
  });

  // Audit: kisne, kiska, kab, kyun reset kiya. Password kabhi log nahi hota.
  await prisma.auditLog.create({
    data: {
      action: "SUPER_ADMIN_PASSWORD_RESET",
      entity: "User",
      entityType: "User",
      entityId: user.id,
      userId: actorId || "",
      performedBy: actorId || "",
      tenantId: (user as any).tenantId || "",
      metadata: {
        targetEmail: user.email,
        targetName: user.name,
        reason: reason || "Super admin password reset",
      },
    },
  }).catch(() => {}); // non-critical

  return {
    message: "Password reset successfully. User must change it on next login.",
    email: user.email,
  };
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
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { status: "ACTIVE", isDeleted: false } }),
      prisma.user.count({ where: { status: "LOCKED", isDeleted: false } }),
      prisma.user.count({ where: { role: "SUPER_ADMIN", isDeleted: false } }),
      prisma.user.count({ where: { role: "ADMIN", isDeleted: false } }),
    ]);

  return {
    totalUsers,
    activeNow,
    twoFactorEnabled: 0,
    lockedAccounts,
    byRole: { superAdmins, admins },
  };
};
