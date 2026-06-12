
import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import {
  loginService,
  registerService,
} from "./auth.service";

/////////////////////////
// LOGIN
/////////////////////////
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const result = await loginService(email, password);

    // ✅ If subscription expired → send special response
    if (result.subscriptionExpired) {
      return res.json({
        success: true,
        subscriptionExpired: true,
        token: result.token,
        tenant: result.tenant,
        data: result.user,
        message: "Your subscription has expired. Please renew to continue.",
      });
    }

    return res.json({
      success: true,
      token: result.token,
      forcePasswordChange: result.forcePasswordChange,
      data: result.user,
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

/////////////////////////
// REGISTER USER (STUDENT / TEACHER / ADMIN)
/////////////////////////
export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerService(req.body);

    return res.status(201).json({
      success: true,
      data: user,
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/////////////////////////
// REGISTER TENANT + ADMIN (FIXED)
/////////////////////////
export const registerTenant = async (req: Request, res: Response) => {
  try {
    let { schoolName, name, email } = req.body;

    if (!schoolName || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    email = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: schoolName,
          type: "SCHOOL",
          isDeleted: false,
          isActive: true,
        },
      });

      const defaultPassword = "123456";
      const cleanPassword = defaultPassword.trim();
      const hashedPassword = await bcrypt.hash(cleanPassword, 10);

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "ADMIN",
          tenantId: tenant.id,
          isFirstLogin: true,
        },
      });

      return { tenant, user };
    });

    const { password: _, ...safeUser } = result.user;

    return res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      tenantId: result.tenant.id,
      adminPassword: "123456",
      data: safeUser,
    });

  } catch (error: any) {
    console.error("TENANT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Tenant creation failed",
    });
  }
};

/////////////////////////
// REGISTER SUPER ADMIN
/////////////////////////
export const registerSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashed = await bcrypt.hash(password.trim(), 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashed,
        role: "SUPER_ADMIN",
        tenantId: "SYSTEM",
        isFirstLogin: false,
      },
    });

    const { password: __, ...safeUser } = user;

    return res.status(201).json({
      success: true,
      data: safeUser,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/////////////////////////
// CHANGE PASSWORD
/////////////////////////
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user?.userId;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const hashed = await bcrypt.hash(newPassword.trim(), 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        isFirstLogin: false,
      },
    });

    return res.json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/////////////////////////
// FORGOT PASSWORD
/////////////////////////
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.json({
        success: true,
        message: "If email exists, reset link will be sent",
      });
    }

    // TODO: Send actual email with reset link
    return res.json({
      success: true,
      message: "If email exists, reset link will be sent",
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/////////////////////////
// RESET PASSWORD
/////////////////////////
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const hashed = await bcrypt.hash(newPassword.trim(), 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        isFirstLogin: false,
      },
    });

    return res.json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

