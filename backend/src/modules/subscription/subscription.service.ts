import prisma from "../../utils/prisma";

import {
  SubscriptionStatus,
  PaymentStatus,
} from "@prisma/client";

//////////////////////////////////////////////////////////////
// CREATE PLAN
//////////////////////////////////////////////////////////////

export const createPlanService = async (data: any) => {
  return prisma.subscriptionPlan.create({ data });
};

//////////////////////////////////////////////////////////////
// GET PLANS
//////////////////////////////////////////////////////////////

export const getPlansService = async () => {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
};

//////////////////////////////////////////////////////////////
// GET SINGLE PLAN
//////////////////////////////////////////////////////////////

export const getSinglePlanService = async (id: string) => {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) throw new Error("Plan not found");
  return plan;
};

//////////////////////////////////////////////////////////////
// UPDATE PLAN
//////////////////////////////////////////////////////////////

export const updatePlanService = async (id: string, data: any) => {
  return prisma.subscriptionPlan.update({ where: { id }, data });
};

//////////////////////////////////////////////////////////////
// DELETE PLAN
//////////////////////////////////////////////////////////////

export const deletePlanService = async (id: string) => {
  return prisma.subscriptionPlan.update({
    where: { id },
    data: { isActive: false },
  });
};

//////////////////////////////////////////////////////////////
// ASSIGN SUBSCRIPTION (SuperAdmin use)
//////////////////////////////////////////////////////////////

export const assignSubscriptionService = async (
  tenantId: string,
  planId: string
) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plan not found");

  // Expire old
  await prisma.tenantSubscription.updateMany({
    where: { tenantId, isActive: true },
    data: { isActive: false, status: SubscriptionStatus.EXPIRED },
  });

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationInDays);

  return prisma.tenantSubscription.create({
    data: {
      tenantId,
      planId,
      subscriptionCode: `SUB-${Date.now()}`,
      startDate,
      endDate,
      status: SubscriptionStatus.PENDING,
      isActive: false,
      amount: plan.price,
      paymentStatus: PaymentStatus.PENDING,
      paymentGateway: "RAZORPAY",
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      maxAdmins: plan.maxAdmins,
      maxStorageInGB: plan.maxStorageInGB,
    },
    include: { tenant: true, plan: true },
  });
};

//////////////////////////////////////////////////////////////
// 🔥 FREE PLAN CHECK — ONLY FOR SELF-REGISTRATION
// Checks by: email, phone, name+address ONLY
// ❌ REMOVED: IP check, device fingerprint, old subscription check
// ✅ These are enough to prevent same person from taking free trial twice
//////////////////////////////////////////////////////////////

export const checkFreePlanAlreadyUsed = async (params: {
  tenantId: string;
  userId: string;
  email: string;
  phone?: string | null;
  name?: string | null;
  address?: string | null;
  ipAddress?: string | null;
  deviceFingerprint?: string | null;
}): Promise<{ used: boolean; reason: string }> => {

  const { email, phone, name, address } = params;

  // 1️⃣ Check by email (case-insensitive) — MOST IMPORTANT
  const byEmail = await prisma.freeTrialRecord.findFirst({
    where: { email: email.toLowerCase().trim() },
  });
  if (byEmail) {
    return { used: true, reason: "This email has already used a free trial." };
  }

  // 2️⃣ Check by phone (if provided)
  if (phone && phone.trim()) {
    const cleanPhone = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
    if (cleanPhone.length >= 10) {
      const byPhone = await prisma.freeTrialRecord.findFirst({
        where: { phone: cleanPhone },
      });
      if (byPhone) {
        return { used: true, reason: "This phone number has already used a free trial." };
      }
    }
  }

  // 3️⃣ Check by name + address combination
  if (name && name.trim() && address && address.trim()) {
    const byNameAddress = await prisma.freeTrialRecord.findFirst({
      where: {
        name: name.trim().toLowerCase(),
        address: address.trim().toLowerCase(),
      },
    });
    if (byNameAddress) {
      return { used: true, reason: "A free trial was already used with this name and address." };
    }
  }

  // ✅ NO IP CHECK — same network se multiple schools register ho sakte hain
  // ✅ NO DEVICE CHECK — same computer se testing/multiple registrations valid hain
  // ✅ NO OLD SUBSCRIPTION CHECK — Super Admin created tenants ko affect karta tha

  return { used: false, reason: "" };
};

//////////////////////////////////////////////////////////////
// 🔥 SAVE FREE TRIAL RECORD — Track who used free plan
//////////////////////////////////////////////////////////////

export const saveFreeTrialRecord = async (params: {
  tenantId: string;
  userId: string;
  email: string;
  phone?: string | null;
  name?: string | null;
  address?: string | null;
  ipAddress?: string | null;
  deviceFingerprint?: string | null;
  userAgent?: string | null;
  planId: string;
  planName: string;
}) => {
  const {
    tenantId, userId, email, phone, name, address,
    ipAddress, deviceFingerprint, userAgent, planId, planName,
  } = params;

  return prisma.freeTrialRecord.create({
    data: {
      tenantId,
      userId,
      email: email.toLowerCase().trim(),
      phone: phone ? phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "") : null,
      name: name ? name.trim().toLowerCase() : null,
      address: address ? address.trim().toLowerCase() : null,
      ipAddress: ipAddress || null,
      deviceFingerprint: deviceFingerprint || null,
      userAgent: userAgent || null,
      planId,
      planName,
    },
  });
};

//////////////////////////////////////////////////////////////
// 🔥 SELF SUBSCRIBE — Tenant subscribes themselves
// Free plan → anti-fraud check + directly ACTIVE
// Paid plan → PENDING (needs Razorpay payment)
//////////////////////////////////////////////////////////////

export const selfSubscribeService = async (
  tenantId: string,
  planId: string,
  fraudCheckData?: {
    userId: string;
    email: string;
    phone?: string | null;
    name?: string | null;
    address?: string | null;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    userAgent?: string | null;
  }
) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plan not found");

  // ✅ FREE PLAN — fraud check (only for self-subscribe, NOT super admin)
  if (plan.price === 0) {
    if (!fraudCheckData) {
      throw new Error("User identity data required for free plan activation.");
    }

    const fraudResult = await checkFreePlanAlreadyUsed({
      tenantId,
      userId: fraudCheckData.userId,
      email: fraudCheckData.email,
      phone: fraudCheckData.phone,
      name: fraudCheckData.name,
      address: fraudCheckData.address,
      ipAddress: fraudCheckData.ipAddress,
      deviceFingerprint: fraudCheckData.deviceFingerprint,
    });

    if (fraudResult.used) {
      throw new Error(fraudResult.reason);
    }
  }

  // Expire old
  await prisma.tenantSubscription.updateMany({
    where: { tenantId, isActive: true },
    data: { isActive: false, status: SubscriptionStatus.EXPIRED },
  });

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationInDays);

  const isFree = plan.price === 0;

  const subscription = await prisma.tenantSubscription.create({
    data: {
      tenantId,
      planId,
      subscriptionCode: `SUB-${Date.now()}`,
      startDate,
      endDate,
      status: isFree ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
      isActive: isFree ? true : false,
      amount: plan.price,
      paymentStatus: isFree ? PaymentStatus.PAID : PaymentStatus.PENDING,
      paymentGateway: isFree ? "FREE" : "RAZORPAY",
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      maxAdmins: plan.maxAdmins,
      maxStorageInGB: plan.maxStorageInGB,
    },
    include: { tenant: true, plan: true },
  });

  // If free — update limits + save record
  if (isFree && fraudCheckData) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        maxStudents: plan.maxStudents,
        maxTeachers: plan.maxTeachers,
        maxAdmins: plan.maxAdmins,
        maxStorageInGB: plan.maxStorageInGB,
      },
    });

    await saveFreeTrialRecord({
      tenantId,
      userId: fraudCheckData.userId,
      email: fraudCheckData.email,
      phone: fraudCheckData.phone,
      name: fraudCheckData.name,
      address: fraudCheckData.address,
      ipAddress: fraudCheckData.ipAddress,
      deviceFingerprint: fraudCheckData.deviceFingerprint,
      userAgent: fraudCheckData.userAgent,
      planId: plan.id,
      planName: plan.name,
    });
  }

  return subscription;
};

//////////////////////////////////////////////////////////////
// 🔥 AUTO-ASSIGN FREE PLAN ON REGISTRATION
// Called from auth.controller.ts → registerTenant()
// Has fraud check for SELF-REGISTRATION only
//////////////////////////////////////////////////////////////

export const autoAssignFreePlanService = async (
  tenantId: string,
  fraudCheckData?: {
    userId: string;
    email: string;
    phone?: string | null;
    name?: string | null;
    address?: string | null;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    userAgent?: string | null;
  }
) => {
  const freePlan = await prisma.subscriptionPlan.findFirst({
    where: { isActive: true, price: 0 },
  });

  if (!freePlan) {
    console.log("No free plan found in DB, skipping auto-assign");
    return null;
  }

  // 🔥 FRAUD CHECK (only if data provided — self-registration)
  if (fraudCheckData) {
    const fraudResult = await checkFreePlanAlreadyUsed({
      tenantId,
      userId: fraudCheckData.userId,
      email: fraudCheckData.email,
      phone: fraudCheckData.phone,
      name: fraudCheckData.name,
      address: fraudCheckData.address,
      ipAddress: fraudCheckData.ipAddress,
      deviceFingerprint: fraudCheckData.deviceFingerprint,
    });

    if (fraudResult.used) {
      console.log(`⚠️ FREE PLAN BLOCKED: ${fraudResult.reason}`);
      return null;
    }
  }

  // Assign free plan directly as ACTIVE
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + freePlan.durationInDays);

  const subscription = await prisma.tenantSubscription.create({
    data: {
      tenantId,
      planId: freePlan.id,
      subscriptionCode: `SUB-FREE-${Date.now()}`,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
      isActive: true,
      amount: 0,
      paymentStatus: PaymentStatus.PAID,
      paymentGateway: "FREE",
      maxStudents: freePlan.maxStudents,
      maxTeachers: freePlan.maxTeachers,
      maxAdmins: freePlan.maxAdmins,
      maxStorageInGB: freePlan.maxStorageInGB,
    },
  });

  // Update tenant limits
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      maxStudents: freePlan.maxStudents,
      maxTeachers: freePlan.maxTeachers,
      maxAdmins: freePlan.maxAdmins,
      maxStorageInGB: freePlan.maxStorageInGB,
    },
  });

  // Save record for future fraud prevention
  if (fraudCheckData) {
    await saveFreeTrialRecord({
      tenantId,
      userId: fraudCheckData.userId,
      email: fraudCheckData.email,
      phone: fraudCheckData.phone,
      name: fraudCheckData.name,
      address: fraudCheckData.address,
      ipAddress: fraudCheckData.ipAddress,
      deviceFingerprint: fraudCheckData.deviceFingerprint,
      userAgent: fraudCheckData.userAgent,
      planId: freePlan.id,
      planName: freePlan.name,
    });
  }

  return subscription;
};

//////////////////////////////////////////////////////////////
// GET SUBSCRIPTIONS
//////////////////////////////////////////////////////////////

export const getSubscriptionsService = async () => {
  return prisma.tenantSubscription.findMany({
    include: { tenant: true, plan: true },
    orderBy: { createdAt: "desc" },
  });
};

//////////////////////////////////////////////////////////////
// GET ACTIVE SUBSCRIPTION
//////////////////////////////////////////////////////////////

export const getTenantActiveSubscriptionService = async (tenantId: string) => {
  return prisma.tenantSubscription.findFirst({
    where: { tenantId, isActive: true, status: SubscriptionStatus.ACTIVE },
    include: { plan: true },
  });
};

//////////////////////////////////////////////////////////////
// CANCEL SUBSCRIPTION
//////////////////////////////////////////////////////////////

export const cancelSubscriptionService = async (id: string) => {
  return prisma.tenantSubscription.update({
    where: { id },
    data: {
      isActive: false,
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
    },
  });
};

//////////////////////////////////////////////////////////////
// RENEW SUBSCRIPTION
//////////////////////////////////////////////////////////////

export const renewSubscriptionService = async (id: string) => {
  const subscription = await prisma.tenantSubscription.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!subscription) throw new Error("Subscription not found");

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + subscription.plan.durationInDays);

  return prisma.tenantSubscription.update({
    where: { id },
    data: {
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
      isActive: true,
      cancelledAt: null,
    },
  });
};