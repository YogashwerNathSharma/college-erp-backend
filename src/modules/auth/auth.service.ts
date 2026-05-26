import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/jwt";

/////////////////////////
// REGISTER
/////////////////////////
export const registerService = async (data: any) => {
  let { name, email, password, tenantId, role } = data;

  email = email.toLowerCase(); // 🔥 normalize

  // ✅ check existing user
  const existingUser = await prisma.user.findUnique({
    where: {
      email_tenantId: {
        email,
        tenantId,
      },
    },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: role || "ADMIN",
      tenantId,
    },
  });

  // ❌ remove password
  const { password: _, ...safeUser } = user;

  return safeUser;
};

/////////////////////////
// LOGIN
/////////////////////////
export const loginService = async (
  email: string,
  password: string,
  tenantId: string
) => {
  email = email.toLowerCase(); // 🔥 normalize

  const user = await prisma.user.findUnique({
    where: {
      email_tenantId: {
        email,
        tenantId,
      },
    },
  });

  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = generateToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  });

  const { password: _, ...safeUser } = user;

  return { user: safeUser, token };
};