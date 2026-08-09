import { Request, Response } from "express";
import { randomBytes } from "crypto";
import { uploadToCloudinary } from "../../config/cloudinary";
import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import { loginService, registerService } from "./auth.service";
import {
  autoAssignFreePlanService,
  checkFreePlanAlreadyUsed,
} from "../subscription/subscription.service";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }
    const result = await loginService(email, password);
    return res.json({
      success: true,
      token: result.token,
      forcePasswordChange: result.forcePasswordChange,
      subscriptionExpired: result.subscriptionExpired || false,
      tenant: (result as any).tenant || null,
      data: result.user,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Login failed" });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerService(req.body);
    return res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/////////////////////////
// REGISTER TENANT + ADMIN
/////////////////////////
export const registerTenant = async (req: Request, res: Response) => {
  try {
    let { schoolName, name, email, phone, address } = req.body;

    if (!schoolName || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "School name, admin name and email are required",
      });
    }

    email = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Generate a unique temporary password instead of using a shared/default password.
    // It is marked as first-login so the administrator must change it immediately.
    const initialPassword = randomBytes(12).toString("base64url");

    const result = await prisma.$transaction(async (tx) => {
      const files = (req as any).files || {};
      const logoFile = files?.logo?.[0] || null;
      const bgFile = files?.background?.[0] || null;

      let logoUrl: string | null = null;
      let bgUrl: string | null = null;

      try {
        if (logoFile) logoUrl = await uploadToCloudinary(logoFile.buffer, "tenants");
      } catch (e: any) {
        console.warn("Logo upload failed (Cloudinary):", e.message);
      }

      try {
        if (bgFile) bgUrl = await uploadToCloudinary(bgFile.buffer, "tenants");
      } catch (e: any) {
        console.warn("Background upload failed (Cloudinary):", e.message);
      }

      const tenant = await tx.tenant.create({
        data: {
          name: schoolName,
          type: "SCHOOL",
          isDeleted: false,
          isActive: true,
          logoUrl,
          backgroundUrl: bgUrl,
        },
      });

      const hashedPassword = await bcrypt.hash(initialPassword, 10);

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

    let freeTrialAssigned = false;
    const freePlan = await prisma.subscriptionPlan.findFirst({
      where: { price: 0, isActive: true },
    });

    if (freePlan) {
      const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || null;
      const deviceFingerprint = req.headers["x-device-fingerprint"] || null;
      const userAgent = req.headers["user-agent"] || null;

      const fraudResult = await checkFreePlanAlreadyUsed({
        tenantId: result.tenant.id,
        userId: result.user.id,
        email,
        phone: phone || null,
        name: name || null,
        address: address || null,
        ipAddress: typeof ipAddress === "string" ? ipAddress : null,
        deviceFingerprint: typeof deviceFingerprint === "string" ? deviceFingerprint : null,
      });

      if (!fraudResult.used) {
        await autoAssignFreePlanService(result.tenant.id, {
          userId: result.user.id,
          email,
          phone: phone || null,
          name: name || null,
          address: address || null,
          ipAddress: typeof ipAddress === "string" ? ipAddress : null,
          deviceFingerprint: typeof deviceFingerprint === "string" ? deviceFingerprint : null,
          userAgent: typeof userAgent === "string" ? userAgent : null,
        });
        freeTrialAssigned = true;
      } else {
        console.log(`FREE PLAN BLOCKED: ${fraudResult.reason}`);
      }
    }

    const { password: _, ...safeUser } = result.user;

    // Compatibility: the existing registration page displays adminPassword.
    // This is a unique one-time temporary password, never a shared default.
    return res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      tenantId: result.tenant.id,
      adminPassword: initialPassword,
      freeTrialAssigned,
      data: safeUser,
    });
  } catch (error: any) {
    console.error("Tenant registration failed:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Tenant creation failed",
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user?.userId;

    if (!newPassword) return res.status(400).json({ success: false, message: "New password required" });
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    if (newPassword.trim().length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    const hashed = await bcrypt.hash(newPassword.trim(), 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed, isFirstLogin: false },
    });

    return res.json({ success: true, message: "Password updated successfully" });
  } catch {
    return res.status(500).json({ success: false, message: "Password update failed" });
  }
};

export const registerSuperAdmin = async (req: Request, res: Response) => {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }
    email = email.toLowerCase().trim();
    if (password.trim().length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        tenantId: null,
        isFirstLogin: false,
      },
    });

    const { password: _, ...safeUser } = user;
    return res.status(201).json({ success: true, message: "Super admin created", data: safeUser });
  } catch {
    return res.status(500).json({ success: false, message: "Super admin creation failed" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    email = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: "User not found with this email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { resetOtp: otp, resetOtpExpiry: otpExpiry },
    });

    // Email/SMS delivery will be hardened separately in the next P0 fix.
    return res.json({ success: true, message: "OTP generated successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to send OTP" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    let { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
    }
    email = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.resetOtp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (!user.resetOtpExpiry || new Date() > user.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one" });
    }
    if (newPassword.trim().length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpiry: null,
        isFirstLogin: false,
      },
    });

    return res.json({ success: true, message: "Password reset successful" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Password reset failed" });
  }
};
