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

    // 🔥 FIX 1: Email normalize
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

      // 🔥 PASSWORD SET
      const defaultPassword = "123456";
      const cleanPassword = defaultPassword.trim();

      const hashedPassword = await bcrypt.hash(cleanPassword, 10);

      // 🔥 DEBUG 1: HASH CHECK
      console.log("STEP 1 - HASH CREATED:", {
        email,
        plain: cleanPassword,
        hash: hashedPassword,
      });

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

      // 🔥 DEBUG 2: DB SAVE CHECK
      const savedUser = await tx.user.findUnique({
        where: { email },
      });

      console.log("STEP 2 - DB STORED:", {
        dbEmail: savedUser?.email,
        dbPassword: savedUser?.password,
      });

      // 🔥 DEBUG 3: COMPARE TEST
      const matchTest = await bcrypt.compare(
        cleanPassword,
        savedUser!.password
      );

      console.log("STEP 3 - COMPARE RESULT:", matchTest);

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
    return res.status(500).json({
      success: false,
      message: "Password update failed",
    });
  }
};

/////////////////////////
// REGISTER SUPER ADMIN
/////////////////////////
export const registerSuperAdmin = async (req: Request, res: Response) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
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

    return res.status(201).json({
      success: true,
      message: "Super admin created",
      data: safeUser,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Super admin creation failed",
    });
  }
};
/////////////////////////
// FORGOT PASSWORD - SEND OTP
/////////////////////////
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    email = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // 🔥 Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Save OTP in DB
    await prisma.user.update({
      where: { email },
      data: {
        resetOtp: otp,
        resetOtpExpiry: otpExpiry,
      },
    });

    // 🔥 Send OTP via email (or console for now)
    console.log(`📧 OTP for ${email}: ${otp}`);

    // TODO: Integrate nodemailer here
    // await sendEmail(email, "Password Reset OTP", `Your OTP is: ${otp}`);
// Response mein OTP bhi bhejo (DEV mode only)
return res.json({
  success: true,
  message: "OTP sent to your email",
  otp: otp,  // 🔥 ADD THIS — sirf development ke liye
});
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
};

/////////////////////////
// VERIFY OTP & RESET PASSWORD
/////////////////////////
export const resetPassword = async (req: Request, res: Response) => {
  try {
    let { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    email = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔒 Verify OTP
    if (user.resetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // 🔒 Check expiry
    if (!user.resetOtpExpiry || new Date() > user.resetOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one",
      });
    }

    // ✅ Hash new password & update
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

    return res.json({
      success: true,
      message: "Password reset successful",
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Password reset failed",
    });
  }
};
