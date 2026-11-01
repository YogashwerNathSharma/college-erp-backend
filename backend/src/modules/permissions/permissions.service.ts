import prisma from "../../utils/prisma";
import { clearPermissionCache } from "../../middleware/permission.middleware";

//////////////////////////////////////////////////////
// PERMISSION FIELDS (for validation)
//////////////////////////////////////////////////////
const PERMISSION_FIELDS = [
  "canViewStudents",
  "canEditStudents",
  "canViewAttendance",
  "canMarkAttendance",
  "canViewResults",
  "canEnterMarks",
  "canViewFees",
  "canCollectFees",
  "canViewReports",
  "canManageLibrary",
  "canViewTimetable",
  "canManageTimetable",
  "canViewLeave",
  "canApproveLeave",
  "canViewSalary",
];

//////////////////////////////////////////////////////
// DEFAULT PERMISSIONS BY ROLE
// 🔒 These are defaults — Tenant Admin can override per user
// Super Admin does NOT control these — only module access
//////////////////////////////////////////////////////
const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  TEACHER: {
    canViewStudents: true,
    canEditStudents: false,
    canViewAttendance: true,
    canMarkAttendance: true,
    canViewResults: true,
    canEnterMarks: true,
    canViewFees: false,
    canCollectFees: false,
    canViewReports: true,
    canManageLibrary: false,
    canViewTimetable: true,
    canManageTimetable: false,
    canViewLeave: true,
    canApproveLeave: false,
    canViewSalary: true,
  },
  PRINCIPAL: {
    canViewStudents: true,
    canEditStudents: false,
    canViewAttendance: true,
    canMarkAttendance: false,
    canViewResults: true,
    canEnterMarks: false,
    canViewFees: true,
    canCollectFees: false,
    canViewReports: true,
    canManageLibrary: true,
    canViewTimetable: true,
    canManageTimetable: true,
    canViewLeave: true,
    canApproveLeave: true,
    canViewSalary: true,
  },
  ACCOUNTANT: {
    canViewStudents: true,
    canEditStudents: false,
    canViewAttendance: false,
    canMarkAttendance: false,
    canViewResults: false,
    canEnterMarks: false,
    canViewFees: true,
    canCollectFees: true,
    canViewReports: true,
    canManageLibrary: false,
    canViewTimetable: false,
    canManageTimetable: false,
    canViewLeave: false,
    canApproveLeave: false,
    canViewSalary: false,
  },
  LIBRARIAN: {
    canViewStudents: true,
    canEditStudents: false,
    canViewAttendance: false,
    canMarkAttendance: false,
    canViewResults: false,
    canEnterMarks: false,
    canViewFees: false,
    canCollectFees: false,
    canViewReports: true,
    canManageLibrary: true,
    canViewTimetable: false,
    canManageTimetable: false,
    canViewLeave: true,
    canApproveLeave: false,
    canViewSalary: false,
  },
  HR_MANAGER: {
    canViewStudents: false,
    canEditStudents: false,
    canViewAttendance: true,
    canMarkAttendance: false,
    canViewResults: false,
    canEnterMarks: false,
    canViewFees: false,
    canCollectFees: false,
    canViewReports: true,
    canManageLibrary: false,
    canViewTimetable: false,
    canManageTimetable: false,
    canViewLeave: true,
    canApproveLeave: true,
    canViewSalary: true,
  },
  RECEPTIONIST: {
    canViewStudents: true,
    canEditStudents: false,
    canViewAttendance: false,
    canMarkAttendance: false,
    canViewResults: false,
    canEnterMarks: false,
    canViewFees: true,
    canCollectFees: false,
    canViewReports: false,
    canManageLibrary: false,
    canViewTimetable: false,
    canManageTimetable: false,
    canViewLeave: false,
    canApproveLeave: false,
    canViewSalary: false,
  },
  PARENT: {
    canViewStudents: false,
    canEditStudents: false,
    canViewAttendance: true,
    canMarkAttendance: false,
    canViewResults: true,
    canEnterMarks: false,
    canViewFees: true,
    canCollectFees: false,
    canViewReports: false,
    canManageLibrary: false,
    canViewTimetable: true,
    canManageTimetable: false,
    canViewLeave: false,
    canApproveLeave: false,
    canViewSalary: false,
  },
  TRANSPORT_MANAGER: {
    canViewStudents: true,
    canEditStudents: false,
    canViewAttendance: false,
    canMarkAttendance: false,
    canViewResults: false,
    canEnterMarks: false,
    canViewFees: false,
    canCollectFees: false,
    canViewReports: true,
    canManageLibrary: false,
    canViewTimetable: false,
    canManageTimetable: false,
    canViewLeave: true,
    canApproveLeave: false,
    canViewSalary: false,
  },
  HOSTEL_WARDEN: {
    canViewStudents: true,
    canEditStudents: false,
    canViewAttendance: true,
    canMarkAttendance: false,
    canViewResults: false,
    canEnterMarks: false,
    canViewFees: false,
    canCollectFees: false,
    canViewReports: true,
    canManageLibrary: false,
    canViewTimetable: false,
    canManageTimetable: false,
    canViewLeave: true,
    canApproveLeave: false,
    canViewSalary: false,
  },
  STUDENT: {
    canViewStudents: false,
    canEditStudents: false,
    canViewAttendance: true,
    canMarkAttendance: false,
    canViewResults: true,
    canEnterMarks: false,
    canViewFees: true,
    canCollectFees: false,
    canViewReports: false,
    canManageLibrary: false,
    canViewTimetable: true,
    canManageTimetable: false,
    canViewLeave: true,
    canApproveLeave: false,
    canViewSalary: false,
  },
  STAFF: {
    canViewStudents: true,
    canEditStudents: false,
    canViewAttendance: true,
    canMarkAttendance: false,
    canViewResults: false,
    canEnterMarks: false,
    canViewFees: true,
    canCollectFees: true,
    canViewReports: true,
    canManageLibrary: true,
    canViewTimetable: true,
    canManageTimetable: false,
    canViewLeave: true,
    canApproveLeave: false,
    canViewSalary: false,
  },
};

//////////////////////////////////////////////////////
// GET USER PERMISSIONS
//////////////////////////////////////////////////////
export const getUserPermissions = async (userId: string, tenantId: string) => {
  // Find the user first
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get existing permissions
  let permissions = await prisma.rolePermission.findUnique({
    where: {
      tenantId_userId: { tenantId, userId },
    },
  });

  // If no permissions record exists, create default one based on role
  if (!permissions) {
    const defaults = DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS["STAFF"];

    permissions = await prisma.rolePermission.create({
      data: {
        tenantId,
        userId,
        role: user.role,
        ...defaults,
      },
    });
  }

  return permissions;
};

//////////////////////////////////////////////////////
// UPDATE USER PERMISSIONS
//////////////////////////////////////////////////////
export const updateUserPermissions = async (
  userId: string,
  tenantId: string,
  updates: Record<string, boolean>
) => {
  // Validate that user exists and belongs to tenant
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Don't allow modifying ADMIN or SUPER_ADMIN permissions
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    throw new Error("Cannot modify admin permissions");
  }

  // Filter only valid permission fields
  const validUpdates: Record<string, boolean> = {};
  for (const key of Object.keys(updates)) {
    if (PERMISSION_FIELDS.includes(key) && typeof updates[key] === "boolean") {
      validUpdates[key] = updates[key];
    }
  }

  if (Object.keys(validUpdates).length === 0) {
    throw new Error("No valid permission fields provided");
  }

  // Upsert the permissions
  const permissions = await prisma.rolePermission.upsert({
    where: {
      tenantId_userId: { tenantId, userId },
    },
    update: validUpdates,
    create: {
      tenantId,
      userId,
      role: user.role,
      ...(DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS["STAFF"]),
      ...validUpdates,
    },
  });

  // Clear permission cache so middleware picks up new permissions immediately
  clearPermissionCache(userId, tenantId);

  return permissions;
};

//////////////////////////////////////////////////////
// GET ALL USERS WITH PERMISSIONS (for Tenant Admin)
// Shows all users in the tenant with their permission status
//////////////////////////////////////////////////////
export const getAllUsersWithPermissions = async (tenantId: string, filters?: { role?: string }) => {
  const where: any = { tenantId, isDeleted: false };
  if (filters?.role) where.role = filters.role;

  // Don't show ADMIN or SUPER_ADMIN in the list (they have full access)
  where.role = where.role || { notIn: ["ADMIN", "SUPER_ADMIN"] };

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      phone: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    take: 500,
  });

  // Fetch all permissions in one query
  const permissions = await prisma.rolePermission.findMany({
    where: { tenantId, userId: { in: users.map((u) => u.id) } },
  });

  const permMap = new Map(permissions.map((p) => [p.userId, p]));

  return users.map((user) => {
    const perm = permMap.get(user.id);
    return {
      ...user,
      hasCustomPermissions: !!perm,
      permissions: perm || DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS["STAFF"],
      isTemporaryAdmin: perm?.isTemporaryAdmin || false,
      tempAdminExpiry: perm?.tempAdminExpiry || null,
    };
  });
};

//////////////////////////////////////////////////////
// RESET USER PERMISSIONS TO ROLE DEFAULTS
// Tenant Admin can reset a user back to their role's default
//////////////////////////////////////////////////////
export const resetUserPermissions = async (userId: string, tenantId: string) => {
  const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  if (!user) throw new Error("User not found");
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") throw new Error("Cannot reset admin permissions");

  // Delete custom permissions — next access will create defaults
  await prisma.rolePermission.deleteMany({ where: { tenantId, userId } });

  clearPermissionCache(userId, tenantId);

  return { message: "Permissions reset to role defaults", role: user.role };
};

//////////////////////////////////////////////////////
// GRANT TEMPORARY ADMIN
//////////////////////////////////////////////////////
export const grantTemporaryAdmin = async (
  userId: string,
  tenantId: string,
  durationInHours: number = 24
) => {
  // Validate user
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    throw new Error("User is already an admin");
  }

  // Cap duration at 72 hours
  const cappedDuration = Math.min(durationInHours, 72);
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + cappedDuration);

  const permissions = await prisma.rolePermission.upsert({
    where: {
      tenantId_userId: { tenantId, userId },
    },
    update: {
      isTemporaryAdmin: true,
      tempAdminExpiry: expiry,
    },
    create: {
      tenantId,
      userId,
      role: user.role,
      isTemporaryAdmin: true,
      tempAdminExpiry: expiry,
      ...(DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS["STAFF"]),
    },
  });

  return permissions;
};

//////////////////////////////////////////////////////
// REVOKE TEMPORARY ADMIN
//////////////////////////////////////////////////////
export const revokeTemporaryAdmin = async (userId: string, tenantId: string) => {
  // Validate user
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const permissions = await prisma.rolePermission.updateMany({
    where: {
      tenantId,
      userId,
    },
    data: {
      isTemporaryAdmin: false,
      tempAdminExpiry: null,
    },
  });

  return permissions;
};

//////////////////////////////////////////////////////
// GET MY PERMISSIONS (current user)
//////////////////////////////////////////////////////
export const getMyPermissions = async (userId: string, tenantId: string, role: string) => {
  // ADMIN and SUPER_ADMIN have all permissions
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    const allTrue: Record<string, boolean> = {};
    PERMISSION_FIELDS.forEach((field) => {
      allTrue[field] = true;
    });
    return {
      role,
      isTemporaryAdmin: false,
      tempAdminExpiry: null,
      ...allTrue,
    };
  }

  // For other roles, fetch or create permissions
  let permissions = await prisma.rolePermission.findUnique({
    where: {
      tenantId_userId: { tenantId, userId },
    },
  });

  if (!permissions) {
    const defaults = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS["STAFF"];

    permissions = await prisma.rolePermission.create({
      data: {
        tenantId,
        userId,
        role,
        ...defaults,
      },
    });
  }

  // Check if temporary admin has expired
  if (
    permissions.isTemporaryAdmin &&
    permissions.tempAdminExpiry &&
    new Date(permissions.tempAdminExpiry) < new Date()
  ) {
    // Auto-revoke expired temp admin
    permissions = await prisma.rolePermission.update({
      where: { id: permissions.id },
      data: {
        isTemporaryAdmin: false,
        tempAdminExpiry: null,
      },
    });
  }

  return permissions;
};
