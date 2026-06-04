
import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";

//////////////////////////////////////////////////////
// 📊 DASHBOARD SERVICE
//////////////////////////////////////////////////////

export const getSuperAdminDashboardService = async () => {
  const [
    totalSchools,
    totalStudents,
    totalTeachers,
    activeTenants,
    inactiveTenants,
    recentTenants,
    activeTenantList,
    inactiveTenantList,
  ] = await Promise.all([
    prisma.tenant.count({ where: { isDeleted: false } }),
    prisma.student.count({ where: { isDeleted: false } }),
    prisma.teacher.count({ where: { isDeleted: false } }),
    prisma.tenant.count({ where: { isActive: true, isDeleted: false } }),
    prisma.tenant.count({ where: { isActive: false, isDeleted: false } }),
    prisma.tenant.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, logoUrl: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.tenant.findMany({
      where: { isActive: true, isDeleted: false },
      select: { id: true, name: true },
    }),
    prisma.tenant.findMany({
      where: { isActive: false, isDeleted: false },
      select: { id: true, name: true },
    }),
  ]);

  return {
    totalSchools,
    totalStudents,
    totalTeachers,
    activeTenants,
    inactiveTenants,
    recentTenants,
    activeTenantList,
    inactiveTenantList,
  };
};

//////////////////////////////////////////////////////
// 🏫 GET ALL TENANTS
//////////////////////////////////////////////////////

export const getTenantsService = async () => {
  return prisma.tenant.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      type: true,
      email: true,
      phone: true,
      address: true,
      logoUrl: true,
      isActive: true,
      maxStudents: true,
      maxTeachers: true,
      maxAdmins: true,
      maxStorageInGB: true,
      createdAt: true,
      _count: {
        select: {
          students: true,
          teachers: true,
          users: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

//////////////////////////////////////////////////////
// 🏫 GET TENANT BY ID
//////////////////////////////////////////////////////

export const getTenantByIdService = async (id: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          users: true,
          classes: true,
          sections: true,
        },
      },
    },
  });

  if (!tenant || tenant.isDeleted) {
    throw new Error("Tenant not found");
  }

  return tenant;
};


//////////////////////////////////////////////////////
// ✅ CREATE TENANT + AUTO CREATE ADMIN
//////////////////////////////////////////////////////

export const createTenantService = async (data: any) => {
  // Validate required fields
  if (!data.name || !data.type) {
    throw new Error("Name and type are required");
  }

  // Check duplicate name
  const existing = await prisma.tenant.findFirst({
    where: { name: data.name, isDeleted: false },
  });

  if (existing) {
    throw new Error("A tenant with this name already exists");
  }

  // Use transaction — create tenant + admin together
  const result = await prisma.$transaction(async (tx) => {
    // 1️⃣ Create Tenant
    const tenant = await tx.tenant.create({
      data: {
        name: data.name,
        type: data.type,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        logoUrl: data.logoUrl || null,
        backgroundUrl: data.backgroundUrl || null,
        maxStudents: data.maxStudents ? Number(data.maxStudents) : 0,
        maxTeachers: data.maxTeachers ? Number(data.maxTeachers) : 0,
        maxAdmins: data.maxAdmins ? Number(data.maxAdmins) : 0,
        maxStorageInGB: data.maxStorageInGB ? Number(data.maxStorageInGB) : 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    // 2️⃣ Auto-generate Admin User for this tenant
    const adminEmail = data.email || `admin.${tenant.id}@erp.com`;
    const defaultPassword = "123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Check if email already exists
    const existingUser = await tx.user.findFirst({
      where: { email: adminEmail },
    });

    let adminUser = null;

    if (!existingUser) {
      adminUser = await tx.user.create({
        data: {
          name: `${data.name} Admin`,
          email: adminEmail,
          password: hashedPassword,
          role: "ADMIN",
          tenantId: tenant.id,
          isFirstLogin: true,
        },
      });
    }

    return { tenant, adminUser, adminEmail, defaultPassword };
  });

  return result;
};

//////////////////////////////////////////////////////
// ✏️ UPDATE TENANT
//////////////////////////////////////////////////////

export const updateTenantService = async (id: string, data: any) => {
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    throw new Error("Tenant not found");
  }

  // Check duplicate name (exclude current)
  if (data.name) {
    const duplicate = await prisma.tenant.findFirst({
      where: { name: data.name, isDeleted: false, id: { not: id } },
    });
    if (duplicate) {
      throw new Error("A tenant with this name already exists");
    }
  }

  return prisma.tenant.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.type && { type: data.type }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
      ...(data.backgroundUrl !== undefined && { backgroundUrl: data.backgroundUrl || null }),
      ...(data.maxStudents !== undefined && { maxStudents: Number(data.maxStudents) }),
      ...(data.maxTeachers !== undefined && { maxTeachers: Number(data.maxTeachers) }),
      ...(data.maxAdmins !== undefined && { maxAdmins: Number(data.maxAdmins) }),
      ...(data.maxStorageInGB !== undefined && { maxStorageInGB: Number(data.maxStorageInGB) }),
    },
  });
};

//////////////////////////////////////////////////////
// 🗑️ DELETE TENANT (soft delete)
//////////////////////////////////////////////////////

export const deleteTenantService = async (id: string) => {
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    throw new Error("Tenant not found");
  }

  return prisma.tenant.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  });
};

//////////////////////////////////////////////////////
// 🔄 TOGGLE TENANT STATUS
//////////////////////////////////////////////////////

export const toggleTenantStatusService = async (id: string) => {
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    throw new Error("Tenant not found");
  }

  return prisma.tenant.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
};

//////////////////////////////////////////////////////
// ⚙️ GET SUPER ADMIN SETTINGS
//////////////////////////////////////////////////////

export const getSuperAdminSettingsService = async (userId: string) => {
  // Platform settings
  let platform = await prisma.platformSettings.findFirst();

  if (!platform) {
    platform = await prisma.platformSettings.create({
      data: {
        appName: "College ERP",
        tagline: "Complete School Management System",
        primaryColor: "#4f46e5",
      },
    });
  }

  // Super Admin profile
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  // System config
  const systemConfig = {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID
      ? "***" + process.env.RAZORPAY_KEY_ID.slice(-6)
      : "Not Set",
    smtpHost: process.env.SMTP_HOST || "Not Set",
    smtpPort: process.env.SMTP_PORT || "Not Set",
    smtpEmail: process.env.SMTP_EMAIL || "Not Set",
    baseUrl: process.env.BASE_URL || "http://localhost:5000",
  };

  return { platform, profile, systemConfig };
};

//////////////////////////////////////////////////////
// 🎨 UPDATE PLATFORM SETTINGS
//////////////////////////////////////////////////////

export const updatePlatformSettingsService = async (data: any) => {
  let settings = await prisma.platformSettings.findFirst();

  if (settings) {
    return prisma.platformSettings.update({
      where: { id: settings.id },
      data: {
        ...(data.appName && { appName: data.appName }),
        ...(data.tagline && { tagline: data.tagline }),
        ...(data.primaryColor && { primaryColor: data.primaryColor }),
        ...(data.logoUrl && { logoUrl: data.logoUrl }),
        ...(data.faviconUrl && { faviconUrl: data.faviconUrl }),
      },
    });
  } else {
    return prisma.platformSettings.create({ data });
  }
};

//////////////////////////////////////////////////////
// 👤 UPDATE SUPER ADMIN PROFILE
//////////////////////////////////////////////////////

export const updateSuperAdminProfileService = async (userId: string, data: any) => {
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

//////////////////////////////////////////////////////
// ⚙️ GET SYSTEM CONFIG
//////////////////////////////////////////////////////

export const getSystemConfigService = async () => {
  return {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID
      ? "***" + process.env.RAZORPAY_KEY_ID.slice(-6)
      : "Not Set",
    smtpHost: process.env.SMTP_HOST || "Not Set",
    smtpPort: process.env.SMTP_PORT || "Not Set",
    smtpEmail: process.env.SMTP_EMAIL || "Not Set",
    baseUrl: process.env.BASE_URL || "http://localhost:5000",
  };
};

