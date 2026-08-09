import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/jwt";

/////////////////////////
// REGISTER SERVICE
/////////////////////////
export const registerService = async (data: any) => {
  let { name, email, password, tenantId, role } = data;

  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  email = email.toLowerCase().trim();
  const cleanPassword = password.trim();

  if (cleanPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

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

  const hashed = await bcrypt.hash(cleanPassword, 10);

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
// LOGIN SERVICE
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

  // SUBSCRIPTION CHECK (Skip for SUPER_ADMIN)
  if (user.role !== "SUPER_ADMIN") {
    const activeSubscription = await prisma.tenantSubscription.findFirst({
      where: {
        tenantId: user.tenantId!,
        isActive: true,
        status: "ACTIVE",
      },
    });

    if (!activeSubscription || new Date(activeSubscription.endDate) < new Date()) {
      if (activeSubscription) {
        await prisma.tenantSubscription.update({
          where: { id: activeSubscription.id },
          data: {
            isActive: false,
            status: "EXPIRED",
          },
        });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId as string },
        select: { id: true, name: true },
      });

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

  let tenant = null;
  if (user.tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        name: true,
        type: true,
        logoUrl: true,
        backgroundUrl: true,
        address: true,
        phone: true,
        email: true,
        primaryColor: true,
      },
    });
  }

  return {
    user: safeUser,
    token,
    forcePasswordChange: user.isFirstLogin || false,
    subscriptionExpired: false,
    tenant,
  };
};
