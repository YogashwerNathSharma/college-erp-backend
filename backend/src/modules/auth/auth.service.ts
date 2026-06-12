

import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/jwt";

/////////////////////////
// REGISTER SERVICE (FIXED)
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

  const finalPassword = (password || "123456").trim();

  const hashed = await bcrypt.hash(finalPassword, 10);

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
// LOGIN SERVICE (WITH SUBSCRIPTION CHECK — FIXED)
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

    // 🔥 FIX: query by tenantId field, NOT by id
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

  const token = generateToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  });

  const { password: _, ...safeUser } = user;

  return {
    user: safeUser,
    token,
    forcePasswordChange: user.isFirstLogin || false,
    subscriptionExpired: false,
  };
};

