

import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

//////////////////////////////////////////////////////
// 📊 DASHBOARD SERVICE
//////////////////////////////////////////////////////

export const getSuperAdminDashboardService = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalSchools,
    totalStudents,
    totalTeachers,
    activeTenants,
    inactiveTenants,
    recentTenants,
    activeTenantList,
    inactiveTenantList,
    totalRevenueAgg,
    todayRevenueAgg,
    monthlyRevenueAgg,
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
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.tenant.findMany({
      where: { isActive: false, isDeleted: false },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }).catch(() => ({ _sum: { amount: 0 } })),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidAt: { gte: today } } }).catch(() => ({ _sum: { amount: 0 } })),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidAt: { gte: firstOfMonth } } }).catch(() => ({ _sum: { amount: 0 } })),
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
    totalRevenue: totalRevenueAgg._sum?.amount || 0,
    todayRevenue: todayRevenueAgg._sum?.amount || 0,
    monthlyRevenue: monthlyRevenueAgg._sum?.amount || 0,
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
// ✅ CREATE TENANT + AUTO CREATE ADMIN + AUTO FREE PLAN
// 🔥 FIXED: Now assigns free plan automatically (NO fraud check)
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔥 AUTO ASSIGN FREE PLAN — NO FRAUD CHECK (Super Admin is GOD)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let freeTrialAssigned = false;

  const freePlan = await prisma.subscriptionPlan.findFirst({
    where: { price: 0, isActive: true },
  });

  if (freePlan) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + freePlan.durationInDays);

    await prisma.tenantSubscription.create({
      data: {
        tenantId: result.tenant.id,
        planId: freePlan.id,
        subscriptionCode: `SUB-FREE-${Date.now()}`,
        startDate,
        endDate,
        status: "ACTIVE",
        isActive: true,
        amount: 0,
        paymentStatus: "PAID",
        paymentGateway: "FREE",
        maxStudents: freePlan.maxStudents,
        maxTeachers: freePlan.maxTeachers,
        maxAdmins: freePlan.maxAdmins,
        maxStorageInGB: freePlan.maxStorageInGB,
      },
    });

    // Update tenant limits with plan limits
    await prisma.tenant.update({
      where: { id: result.tenant.id },
      data: {
        maxStudents: freePlan.maxStudents,
        maxTeachers: freePlan.maxTeachers,
        maxAdmins: freePlan.maxAdmins,
        maxStorageInGB: freePlan.maxStorageInGB,
      },
    });

    freeTrialAssigned = true;
    console.log(`✅ FREE PLAN auto-assigned to tenant: ${result.tenant.id}`);
  } else {
    console.log("⚠️ No free plan found in SubscriptionPlan table!");
  }

  return { ...result, freeTrialAssigned };
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
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
    },
  });
};

//////////////////////////////////////////////////////
// ⚙️ GET SYSTEM CONFIG
//////////////////////////////////////////////////////

export const getSystemConfigService = async () => {
  return {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ? "Configured" : "Not Set",
    smtpConfigured: !!process.env.SMTP_HOST,
    baseUrl: process.env.BASE_URL || "http://localhost:5000",
  };
};

//////////////////////////////////////////////////////
// 👨‍💻 GET DEVELOPER PROFILE
//////////////////////////////////////////////////////

export const getDeveloperProfileService = async () => {
  return prisma.developerProfile.findFirst();
};

//////////////////////////////////////////////////////
// 👨‍💻 UPSERT DEVELOPER PROFILE
//////////////////////////////////////////////////////

export const upsertDeveloperProfileService = async (data: any) => {
  let profile = await prisma.developerProfile.findFirst();

  if (profile) {
    return prisma.developerProfile.update({
      where: { id: profile.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.linkedinUrl !== undefined && { linkedinUrl: data.linkedinUrl }),
        ...(data.callingHours !== undefined && { callingHours: data.callingHours }),
        ...(data.message !== undefined && { message: data.message }),
        ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
      },
    });
  } else {
    return prisma.developerProfile.create({
      data: {
        name: data.name || "Developer",
        photoUrl: data.photoUrl || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        linkedinUrl: data.linkedinUrl || null,
        callingHours: data.callingHours || null,
        message: data.message || null,
        isVisible: data.isVisible ?? true,
      },
    });
  }
};

//////////////////////////////////////////////////////
// 🔄 CLONE TENANT
//////////////////////////////////////////////////////

export const cloneTenantService = async (id: string, newName: string) => {
  const source = await prisma.tenant.findUnique({ where: { id } });
  if (!source || source.isDeleted) {
    throw new Error("Source tenant not found");
  }

  // Check duplicate name
  const existing = await prisma.tenant.findFirst({
    where: { name: newName, isDeleted: false },
  });
  if (existing) {
    throw new Error("A tenant with this name already exists");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Clone tenant with same settings
    const cloned = await tx.tenant.create({
      data: {
        name: newName,
        type: source.type,
        email: null,
        phone: source.phone,
        address: source.address,
        logoUrl: source.logoUrl,
        backgroundUrl: source.backgroundUrl,
        primaryColor: source.primaryColor,
        maxStudents: source.maxStudents,
        maxTeachers: source.maxTeachers,
        maxAdmins: source.maxAdmins,
        maxStorageInGB: source.maxStorageInGB,
        isActive: true,
      },
    });

    // Create admin for cloned tenant
    const adminEmail = `admin.${cloned.id}@erp.com`;
    const defaultPassword = "Admin@123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await tx.user.create({
      data: {
        name: `${newName} Admin`,
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        tenantId: cloned.id,
        isFirstLogin: true,
      },
    });

    return { tenant: cloned, adminEmail, defaultPassword };
  });

  return result;
};

//////////////////////////////////////////////////////
// 🎭 IMPERSONATE TENANT (Generate token for tenant admin)
//////////////////////////////////////////////////////

export const impersonateTenantService = async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || tenant.isDeleted) {
    throw new Error("Tenant not found");
  }

  if (!tenant.isActive) {
    throw new Error("Cannot impersonate an inactive tenant");
  }

  // Find admin user for this tenant
  const adminUser = await prisma.user.findFirst({
    where: { tenantId, role: "ADMIN", isDeleted: false },
    orderBy: { createdAt: "asc" },
  });

  if (!adminUser) {
    throw new Error("No admin user found for this tenant");
  }

  // Generate JWT token for the admin user
  const secret = process.env.JWT_SECRET || "supersecret";
  const token = jwt.sign(
    {
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      tenantId: adminUser.tenantId,
      impersonated: true,
      impersonatedBy: "SUPER_ADMIN",
    },
    secret,
    { expiresIn: "2h" }
  );

  return {
    token,
    user: {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
    },
    tenant: {
      id: tenant.id,
      name: tenant.name,
      type: tenant.type,
    },
  };
};

//////////////////////////////////////////////////////
// ♻️ RESTORE TENANT (un-delete)
//////////////////////////////////////////////////////

export const restoreTenantService = async (id: string) => {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    throw new Error("Tenant not found");
  }
  if (!tenant.isDeleted) {
    throw new Error("Tenant is not deleted");
  }

  return prisma.tenant.update({
    where: { id },
    data: { isDeleted: false, isActive: true },
  });
};

//////////////////////////////////////////////////////
// 📜 TENANT ACTIVITY LOG
//////////////////////////////////////////////////////

export const getTenantActivityService = async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    throw new Error("Tenant not found");
  }

  // Gather activity from multiple sources
  const [recentUsers, recentStudents, recentTeachers, subscriptions] =
    await Promise.all([
      prisma.user.findMany({
        where: { tenantId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.student.findMany({
        where: { tenantId, isDeleted: false },
        select: { id: true, firstName: true, lastName: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.teacher.findMany({
        where: { tenantId, isDeleted: false },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.tenantSubscription.findMany({
        where: { tenantId },
        select: {
          id: true,
          subscriptionCode: true,
          status: true,
          startDate: true,
          endDate: true,
          amount: true,
          plan: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  // Build activity timeline
  const activities: Array<{
    id: string;
    action: string;
    description: string;
    type: string;
    timestamp: Date;
    user?: string;
  }> = [];

  // Tenant creation
  activities.push({
    id: `tenant-created-${tenant.id}`,
    action: "Tenant Created",
    description: `${tenant.name} was registered on the platform`,
    type: "create",
    timestamp: tenant.createdAt,
    user: "System",
  });

  // User registrations
  recentUsers.forEach((u) => {
    activities.push({
      id: `user-${u.id}`,
      action: "User Registered",
      description: `${u.name} (${u.role}) joined`,
      type: "create",
      timestamp: u.createdAt,
      user: u.email,
    });
  });

  // Student enrollments
  recentStudents.forEach((s) => {
    activities.push({
      id: `student-${s.id}`,
      action: "Student Enrolled",
      description: `${s.firstName} ${s.lastName} was enrolled`,
      type: "create",
      timestamp: s.createdAt,
    });
  });

  // Teacher additions
  recentTeachers.forEach((t) => {
    activities.push({
      id: `teacher-${t.id}`,
      action: "Teacher Added",
      description: `${t.name} was added as a teacher`,
      type: "create",
      timestamp: t.createdAt,
    });
  });

  // Subscriptions
  subscriptions.forEach((sub) => {
    activities.push({
      id: `sub-${sub.id}`,
      action: "Subscription Updated",
      description: `${sub.plan?.name || "Plan"} — ${sub.status}`,
      type: "payment",
      timestamp: sub.createdAt,
    });
  });

  // Sort by timestamp desc
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    activities: activities.slice(0, 20),
    summary: {
      totalUsers: recentUsers.length,
      totalStudents: recentStudents.length,
      totalTeachers: recentTeachers.length,
      totalSubscriptions: subscriptions.length,
    },
  };
};

