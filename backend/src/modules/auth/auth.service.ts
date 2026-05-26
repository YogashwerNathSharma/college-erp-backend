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

  // 🔥 FIX: clean password always
  const finalPassword = (password || "123456").trim();

  const hashed = await bcrypt.hash(finalPassword, 10);

  console.log("REGISTER DEBUG:", {
    email,
    role,
    tenantId,
    password: finalPassword,
    hash: hashed,
  });

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
  };
};