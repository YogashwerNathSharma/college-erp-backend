import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

/////////////////////////
// REGISTER USER
/////////////////////////
export const register = async (req: Request, res: Response) => {
  try {
    let { email, password, name, tenantId } = req.body;

    if (!email || !password || !name || !tenantId) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    email = email.toLowerCase(); // 🔥 FIX

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(400).json({ success: false, message: "Invalid tenant" });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email_tenantId: { email, tenantId },
      },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "STUDENT",
        tenantId,
      },
    });

    const { password: _, ...safeUser } = user;

    res.status(201).json({
      success: true,
      message: "User registered",
      data: safeUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Register failed" });
  }
};

/////////////////////////
// LOGIN
/////////////////////////
export const login = async (req: Request, res: Response) => {
  try {
    let { email, password, tenantId } = req.body;

    if (!email || !password || !tenantId) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    email = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email_tenantId: {
          email,
          tenantId,
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //////////////////////////////////////////////////////
    // GET TENANT DETAILS
    //////////////////////////////////////////////////////
    const tenant = await prisma.tenant.findUnique({
      where: {
        id: user.tenantId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        logoUrl: true,
        address: true,
        phone: true,
        email: true,
      },
    });

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: "Login successful",
      token,
      data: safeUser,
      tenant, // ✅ tenant data returned
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

/////////////////////////
// REGISTER TENANT + ADMIN
/////////////////////////
export const registerTenant = async (req: Request, res: Response) => {
  try {
    let { schoolName, name, email, password } = req.body;

    if (!schoolName || !name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    email = email.toLowerCase(); // 🔥 FIX

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: schoolName,
          type: "SCHOOL",
        },
      });

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "ADMIN",
          tenantId: tenant.id,
        },
      });

      return { tenant, user };
    });

    const { password: _, ...safeUser } = result.user;

    res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      tenantId: result.tenant.id,
      data: safeUser,
    });
  } catch (error: any) {
  console.error("🔥 TENANT ERROR:", error);

  res.status(500).json({
    success: false,
    message: error.message, // 🔥 REAL ERROR SHOW
  });
}
};