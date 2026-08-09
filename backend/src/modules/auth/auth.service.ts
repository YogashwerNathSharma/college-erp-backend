

import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import { generateToken, generateRefreshToken } from "../../utils/jwt";
import { z } from "zod";

/////////////////////////
// PASSWORD STRENGTH VALIDATION
/////////////////////////
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

/////////////////////////
// REGISTER SERVICE (SECURED)
/////////////////////////
export const registerService = async (data: any) => {
  let { name, email, password, tenantId, role } = data;

  email = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const allowedRoles = ["ADMIN", "TEACHER", "STUDENT"];
  if (!allowedRoles.includes(role)) {
    role = "ADMIN";
  }

  // Password is required — no default fallback
  if (!password || !password.trim()) {
    throw new Error("Password is required");
  }

  const finalPassword = password.trim();

  // Validate password strength
  passwordSchema.parse(finalPassword);

  // bcrypt cost factor 12 (stronger hashing)
  const hashed = await bcrypt.hash(finalPassword, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
      tenantId,
      isFirstLogin: true,
    },
  });

  const { password: _, ...safeUser } = user;

  return safeUser;
};

/////////////////////////
// LOGIN SERVICE (WITH SUBSCRIPTION CHECK — SECURED)
/////////////////////////
export const loginService = async (email: string, password: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanPassword = password.trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(cleanPassword, user.password);

  if (!isMatch) throw new Error("Invalid credentials");

  // ✅ SUBSCRIPTION CHECK (Skip for SUPER_ADMIN)
  if (user.role !== "SUPER_ADMIN") {

    // query by tenantId field
    const activeSubscription = await prisma.tenantSubscription.findFirst({
      where: {
        tenantId: user.tenantId!,
        isActive: true,
        status: "ACTIVE",
      },
    });

    // Check if subscription exists and is not expired
    if (!activeSubscription || new Date(activeSubscription.endDate) < new Date()) {
      // If subscription exists but expired, mark it
      if (activeSubscription) {
        await prisma.tenantSubscription.update({
          where: { id: activeSubscription.id },
          data: {
            isActive: false,
            status: "EXPIRED",
          },
        });
      }

      // Get tenant info for the expiry page
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId as string },
        select: { id: true, name: true },
      });

      // Still generate token (needed for payment page API calls)
      const token = generateToken({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
      });

      return {
        user: { ...user, password: undefined },
        token,
        forcePasswordChange: false,
        subscriptionExpired: true,
        tenant,
      };
    }
  }

  // Generate short-lived access token (15 min) + refresh token
  const token = generateToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  });

  const { password: _, ...safeUser } = user;

  // Fetch tenant info for frontend (logo, name, etc.)
  let tenant = null;
  if (user.tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, name: true, type: true, logoUrl: true, backgroundUrl: true, address: true, phone: true, email: true, primaryColor: true },
    });
  }

  return {
    user: safeUser,
    token,
    refreshToken,
    forcePasswordChange: user.isFirstLogin || false,
    subscriptionExpired: false,
    tenant,
  };
};
