import prisma from "../../utils/prisma";

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
    canEditStudents: true,
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

  return permissions;
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
