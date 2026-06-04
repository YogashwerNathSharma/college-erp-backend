
import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";

//////////////////////////////////////////////////////
// 📋 GET TENANT SETTINGS (for tenant admin)
//////////////////////////////////////////////////////

export const getTenantSettingsService = async (tenantId: string, userId: string) => {
  // Get tenant info
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      type: true,
      logoUrl: true,
      backgroundUrl: true,
      address: true,
      phone: true,
      email: true,
      isActive: true,
      maxStudents: true,
      maxTeachers: true,
      maxAdmins: true,
      maxStorageInGB: true,
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  // Get admin profile
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  // Get usage stats
  const [studentCount, teacherCount, userCount] = await Promise.all([
    prisma.student.count({ where: { tenantId, isDeleted: false } }),
    prisma.teacher.count({ where: { tenantId, isDeleted: false } }),
    prisma.user.count({ where: { tenantId } }),
  ]);

  return {
    tenant,
    profile,
    usage: {
      students: { used: studentCount, max: tenant.maxStudents },
      teachers: { used: teacherCount, max: tenant.maxTeachers },
      admins: { used: userCount, max: tenant.maxAdmins },
    },
  };
};

//////////////////////////////////////////////////////
// ✏️ UPDATE TENANT SETTINGS (branding/info)
//////////////////////////////////////////////////////

export const updateTenantSettingsService = async (tenantId: string, data: any) => {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
      ...(data.backgroundUrl !== undefined && { backgroundUrl: data.backgroundUrl || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.email !== undefined && { email: data.email || null }),
    },
  });
};

//////////////////////////////////////////////////////
// 👤 UPDATE TENANT ADMIN PROFILE
//////////////////////////////////////////////////////

export const updateTenantAdminProfileService = async (userId: string, data: any) => {
  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;

  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new Error("Current password is required");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) throw new Error("Current password is incorrect");

    updateData.password = await bcrypt.hash(data.newPassword, 10);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true },
  });
};

