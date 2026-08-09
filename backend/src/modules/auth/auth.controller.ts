import { Request, Response } from "express";
import { randomBytes, randomInt } from "crypto";
import { uploadToCloudinary } from "../../config/cloudinary";
import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import { loginService, registerService } from "./auth.service";
import { sendEmail } from "../communication/helpers/email.helper";
import {
  autoAssignFreePlanService,
  checkFreePlanAlreadyUsed,
} from "../subscription/subscription.service";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCK_MS = 15 * 60 * 1000;

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

interface LoginAttemptState {
  failures: number;
  windowStartedAt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttemptState>();

const getClientIp = (req: Request) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim();
  return req.ip || req.socket.remoteAddress || "unknown";
};

const getLoginKey = (req: Request, email: string) => `${getClientIp(req)}:${email.toLowerCase().trim()}`;

const isLoginLocked = (key: string, now: number) => {
  const state = loginAttempts.get(key);
  if (!state) return false;
  if (state.lockedUntil && state.lockedUntil > now) return true;
  if (now - state.windowStartedAt >= LOGIN_WINDOW_MS) loginAttempts.delete(key);
  return false;
};

const recordLoginFailure = (key: string, now: number) => {
  const current = loginAttempts.get(key);
  const state = !current || now - current.windowStartedAt >= LOGIN_WINDOW_MS
    ? { failures: 1, windowStartedAt: now }
    : { ...current, failures: current.failures + 1 };
  if (state.failures >= LOGIN_MAX_FAILURES) state.lockedUntil = now + LOGIN_LOCK_MS;
  loginAttempts.set(key, state);
};

const clearLoginFailures = (key: string) => loginAttempts.delete(key);

interface ResetOtpState {
  hash: string;
  attempts: number;
  requestedAt: number;
  lockedUntil?: number;
}

const parseResetOtpState = (value: string | null): ResetOtpState | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (
      typeof parsed?.hash !== "string" ||
      typeof parsed?.attempts !== "number" ||
      typeof parsed?.requestedAt !== "number"
    ) return null;
    return parsed as ResetOtpState;
  } catch {
    return null;
  }
};

const genericForgotPasswordResponse = (res: Response) =>
  res.json({ success: true, message: "If an account exists for this email, a password reset OTP has been sent." });

export const login = async (req: Request, res: Response) => {
  const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : "";
  const key = getLoginKey(req, email);
  const now = Date.now();

  if (isLoginLocked(key, now)) {
    return res.status(429).json({ success: false, message: "Too many failed login attempts. Please try again later." });
  }

  try {
    const { password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });
    const result = await loginService(email, password);
    clearLoginFailures(key);
    return res.json({ success: true, token: result.token, forcePasswordChange: result.forcePasswordChange, subscriptionExpired: result.subscriptionExpired || false, tenant: (result as any).tenant || null, data: result.user });
  } catch (error: any) {
    recordLoginFailure(key, now);
    return res.status(400).json({ success: false, message: "Invalid email or password" });
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

export const registerTenant = async (req: Request, res: Response) => {
  try {
    let { schoolName, name, email, phone, address } = req.body;
    if (!schoolName || !name || !email) return res.status(400).json({ success: false, message: "School name, admin name and email are required" });
    email = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered" });
    const initialPassword = randomBytes(12).toString("base64url");
    const result = await prisma.$transaction(async (tx) => {
      const files = (req as any).files || {};
      const logoFile = files?.logo?.[0] || null;
      const bgFile = files?.background?.[0] || null;
      let logoUrl: string | null = null;
      let bgUrl: string | null = null;
      try { if (logoFile) logoUrl = await uploadToCloudinary(logoFile.buffer, "tenants"); } catch (e: any) { console.warn("Logo upload failed (Cloudinary):", e.message); }
      try { if (bgFile) bgUrl = await uploadToCloudinary(bgFile.buffer, "tenants"); } catch (e: any) { console.warn("Background upload failed (Cloudinary):", e.message); }
      const tenant = await tx.tenant.create({ data: { name: schoolName, type: "SCHOOL", isDeleted: false, isActive: true, logoUrl, backgroundUrl: bgUrl } });
      const hashedPassword = await bcrypt.hash(initialPassword, 10);
      const user = await tx.user.create({ data: { name, email, password: hashedPassword, role: "ADMIN", tenantId: tenant.id, isFirstLogin: true } });
      return { tenant, user };
    });
    let freeTrialAssigned = false;
    const freePlan = await prisma.subscriptionPlan.findFirst({ where: { price: 0, isActive: true } });
    if (freePlan) {
      const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || null;
      const deviceFingerprint = req.headers["x-device-fingerprint"] || null;
      const userAgent = req.headers["user-agent"] || null;
      const fraudResult = await checkFreePlanAlreadyUsed({ tenantId: result.tenant.id, userId: result.user.id, email, phone: phone || null, name: name || null, address: address || null, ipAddress: typeof ipAddress === "string" ? ipAddress : null, deviceFingerprint: typeof deviceFingerprint === "string" ? deviceFingerprint : null });
      if (!fraudResult.used) {
        await autoAssignFreePlanService(result.tenant.id, { userId: result.user.id, email, phone: phone || null, name: name || null, address: address || null, ipAddress: typeof ipAddress === "string" ? ipAddress : null, deviceFingerprint: typeof deviceFingerprint === "string" ? deviceFingerprint : null, userAgent: typeof userAgent === "string" ? userAgent : null });
        freeTrialAssigned = true;
      } else console.log(`FREE PLAN BLOCKED: ${fraudResult.reason}`);
    }
    const { password: _, ...safeUser } = result.user;
    return res.status(201).json({ success: true, message: "Tenant created successfully", tenantId: result.tenant.id, adminPassword: initialPassword, freeTrialAssigned, data: safeUser });
  } catch (error: any) {
    console.error("Tenant registration failed:", error?.message || error);
    return res.status(500).json({ success: false, message: error?.message || "Tenant creation failed" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user?.userId;
    if (!newPassword) return res.status(400).json({ success: false, message: "New password required" });
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (newPassword.trim().length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    const hashed = await bcrypt.hash(newPassword.trim(), 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed, isFirstLogin: false } });
    return res.json({ success: true, message: "Password updated successfully" });
  } catch { return res.status(500).json({ success: false, message: "Password update failed" }); }
};

export const registerSuperAdmin = async (req: Request, res: Response) => {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "All fields required" });
    email = email.toLowerCase().trim();
    if (password.trim().length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered" });
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const user = await prisma.user.create({ data: { name, email, password: hashedPassword, role: "SUPER_ADMIN", tenantId: null, isFirstLogin: false } });
    const { password: _, ...safeUser } = user;
    return res.status(201).json({ success: true, message: "Super admin created", data: safeUser });
  } catch { return res.status(500).json({ success: false, message: "Super admin creation failed" }); }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    let { email } = req.body;
    if (!email) return genericForgotPasswordResponse(res);
    email = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return genericForgotPasswordResponse(res);
    const now = Date.now();
    const existingState = parseResetOtpState(user.resetOtp);
    if (existingState?.lockedUntil && existingState.lockedUntil > now) return genericForgotPasswordResponse(res);
    if (existingState?.requestedAt && now - existingState.requestedAt < OTP_REQUEST_COOLDOWN_MS) return genericForgotPasswordResponse(res);
    const otp = randomInt(100000, 1000000).toString();
    const otpExpiry = new Date(now + OTP_TTL_MS);
    const otpHash = await bcrypt.hash(otp, 10);
    await sendEmail({ to: email, subject: "School ERP - Password Reset OTP", body: `Your password reset OTP is: ${otp}\n\nThis OTP will expire in 10 minutes. You have a maximum of ${OTP_MAX_ATTEMPTS} verification attempts. If you did not request a password reset, ignore this email.` });
    const state: ResetOtpState = { hash: otpHash, attempts: 0, requestedAt: now };
    await prisma.user.update({ where: { id: user.id }, data: { resetOtp: JSON.stringify(state), resetOtpExpiry: otpExpiry } });
    return genericForgotPasswordResponse(res);
  } catch (error: any) {
    console.error("Password reset request failed:", error?.message || error);
    return genericForgotPasswordResponse(res);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    let { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
    email = email.toLowerCase().trim();
    if (newPassword.trim().length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    const state = parseResetOtpState(user.resetOtp);
    const now = Date.now();
    if (!state || !user.resetOtpExpiry || user.resetOtpExpiry.getTime() <= now) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    if (state.lockedUntil && state.lockedUntil > now) return res.status(429).json({ success: false, message: "Too many OTP attempts. Please request a new OTP later" });
    if (state.attempts >= OTP_MAX_ATTEMPTS) {
      const lockedState: ResetOtpState = { ...state, lockedUntil: now + OTP_LOCK_MS };
      await prisma.user.update({ where: { id: user.id }, data: { resetOtp: JSON.stringify(lockedState) } });
      return res.status(429).json({ success: false, message: "Too many OTP attempts. Please request a new OTP later" });
    }
    const validOtp = await bcrypt.compare(String(otp).trim(), state.hash);
    if (!validOtp) {
      const nextAttempts = state.attempts + 1;
      const lockedUntil = nextAttempts >= OTP_MAX_ATTEMPTS ? now + OTP_LOCK_MS : undefined;
      await prisma.user.update({ where: { id: user.id }, data: { resetOtp: JSON.stringify({ ...state, attempts: nextAttempts, lockedUntil }) } });
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword, resetOtp: null, resetOtpExpiry: null, isFirstLogin: false } });
    return res.json({ success: true, message: "Password reset successful" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Password reset failed" });
  }
};
