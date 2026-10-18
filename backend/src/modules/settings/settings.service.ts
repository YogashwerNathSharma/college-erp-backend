
// Settings Service (Enhanced v2)
// SUPER_ADMIN + TENANT ADMIN dono ke liye combined service
// User Management bhi included hai

import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";

// ============================================================
// 📋 GET TENANT SETTINGS (Tenant Admin ke liye)
// ============================================================

export const getTenantSettingsService = async (
  tenantId: string,
  userId: string
) => {
  // Tenant info fetch karo
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

  if (!tenant) throw new Error("Tenant not found");

  // Admin profile fetch karo
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  // Usage stats
  const [studentCount, teacherCount, userCount] = await Promise.all([
    prisma.student.count({ where: { tenantId, isDeleted: false } }),
    prisma.teacher.count({ where: { tenantId, isDeleted: false } }),
    prisma.user.count({ where: { tenantId } }),
  ]);

  return {
    tenant,
    profile,
    platform: {
      primaryColor: (tenant as any).primaryColor || "#4f46e5",
      appName: tenant.name,
    },
    usage: {
      students: { used: studentCount, max: tenant.maxStudents },
      teachers: { used: teacherCount, max: tenant.maxTeachers },
      admins: { used: userCount, max: tenant.maxAdmins },
    },
  };
};

// ============================================================
// 👤 GET SUPER ADMIN PROFILE
// ============================================================

export const getSuperAdminProfileService = async (userId: string) => {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!profile) throw new Error("User not found");

  // Platform settings (agar PlatformSettings model hai toh)
  // Nahi hai toh env se le lo
  const platform = {
    appName: process.env.APP_NAME || "EduManage",
    tagline: process.env.APP_TAGLINE || "Complete School ERP",
    primaryColor: process.env.PRIMARY_COLOR || "#4f46e5",
    logoUrl: process.env.LOGO_URL || "",
    faviconUrl: process.env.FAVICON_URL || "",
  };

  const systemConfig = {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID
      ? "***" + process.env.RAZORPAY_KEY_ID.slice(-4)
      : "",
    smtpHost: process.env.SMTP_HOST || "",
    smtpPort: process.env.SMTP_PORT || "",
    smtpEmail: process.env.SMTP_EMAIL || "",
    baseUrl: process.env.BASE_URL || "http://localhost:5000",
  };

  return { profile, platform, systemConfig };
};

// ============================================================
// ✏️ UPDATE TENANT SETTINGS (branding/info)
// ============================================================

export const updateTenantSettingsService = async (
  tenantId: string,
  data: any
) => {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
      ...(data.backgroundUrl !== undefined && {
        backgroundUrl: data.backgroundUrl || null,
      }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.email !== undefined && { email: data.email || null }),
    },
  });
};

// ============================================================
// 👤 UPDATE PROFILE (Tenant Admin)
// ============================================================

export const updateProfileService = async (userId: string, data: any) => {
  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;

  // Password change (agar currentPassword aur newPassword diya hai)
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

// ============================================================
// 👤 UPDATE SUPER ADMIN PROFILE
// ============================================================

export const updateSuperAdminProfileService = async (
  userId: string,
  data: any
) => {
  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;

  // Password change
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

// ============================================================
// 🔐 CHANGE PASSWORD (generic — kisi bhi user ke liye)
// ============================================================

export const changePasswordService = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new Error("Current password is incorrect");

  // Same password check
  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame)
    throw new Error("New password must be different from current password");

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password:hashed },
  });

  return { message: "Password changed successfully" };
};

// ============================================================
// 👥 GET USERS (Tenant Admin — with pagination & filters)
// ============================================================

export const getUsersService = async (tenantId: string, filters: any) => {
  const { page = 1, limit = 10, search, role, status } = filters;
  const skip = (page - 1) * limit;

  const whereClause: any = { tenantId };

  // Search by name or email
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // Role filter
  if (role) whereClause.role = role;

  // Status filter
  if (status) whereClause.status = status;

  const [total, users] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    data: users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ============================================================
// 👤 GET USER BY ID
// ============================================================

export const getUserByIdService = async (id: string, tenantId: string) => {
  const user = await prisma.user.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) throw new Error("User not found");
  return user;
};

// ============================================================
// ➕ CREATE USER (Tenant Admin — role-wise)
// ============================================================

export const createUserService = async (tenantId: string, data: any) => {
  // Duplicate email check — same tenant mein
  const existing = await prisma.user.findFirst({
    where: { email: data.email, tenantId },
  });
  if (existing) throw new Error("User with this email already exists");

  // Password — auto-generate ya use provided
  const plainPassword = data.password || generateRandomPassword();
const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role,
      password: hashedPassword,      
      tenantId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return {
    user: newUser,
    // Sirf tab generatedPassword return karo jab auto-generated ho
    generatedPassword: !data.password ? plainPassword : undefined,
};
}

// ============================================================
// ✏️ UPDATE USER (Tenant Admin)
// ============================================================

export const updateUserService = async (
  id: string,
  tenantId: string,
  data: any
) => {
  // Check user exists in same tenant
  const existing = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error("User not found");

  // Email duplicate check (agar email change ho raha hai)
  if (data.email && data.email !== existing.email) {
    const emailExists = await prisma.user.findFirst({
      where: { email: data.email, tenantId, id: { not: id } },
    });
    if (emailExists) throw new Error("Email already in use");
  }

  return prisma.user.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.role && { role: data.role }),
      ...(data.status && { status: data.status }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      //phone: true,
      role: true,
      //status: true,
      createdAt: true,
    },
  });
};

// ============================================================
// 🗑️ DELETE USER (Soft delete — deactivate)
// ============================================================

export const deleteUserService = async (id: string, tenantId: string) => {
  const user = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!user) throw new Error("User not found");

  // Admin/Super Admin ko deactivate nahi kar sakte
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    throw new Error("Cannot deactivate an Admin user");
  }

  await prisma.user.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  return { message: "User deactivated successfully" };
};

// ============================================================
// 📜 GET ROLES (assignable roles)
// ============================================================

export const getRolesService = () => {
  return ["STUDENT", "TEACHER", "PRINCIPAL", "STAFF"];
};

// ============================================================
// 🔧 HELPER: Random password generator (10 chars)
// ============================================================

function generateRandomPassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "@#$&!";
  const all = uppercase + lowercase + numbers + special;

  let pwd = "";
  pwd += uppercase[Math.floor(Math.random() * uppercase.length)];
  pwd += lowercase[Math.floor(Math.random() * lowercase.length)];
  pwd += numbers[Math.floor(Math.random() * numbers.length)];
  pwd += special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < 10; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return pwd
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

