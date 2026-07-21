import prisma from "../../utils/prisma";
import Razorpay from "razorpay";
import { PaymentStatus } from "@prisma/client";

//////////////////////////////////////////////////////
// RAZORPAY INSTANCE
//////////////////////////////////////////////////////

const razorpay = process.env.RAZORPAY_KEY_ID ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
}) : null;

/////////////////////////
// CREATE TENANT
/////////////////////////

export const createTenant = async (data: any) => {
  if (!data.name || !data.type) {
    throw new Error("Name and type are required");
  }

  const existing = await prisma.tenant.findFirst({
    where: { name: data.name },
  });

  if (existing) {
    throw new Error("Tenant already exists");
  }

  return prisma.tenant.create({ data });
};

/////////////////////////
// GET ALL TENANTS (🔥 FIXED — Subscription Include)
/////////////////////////

export const getTenants = async () => {
  return prisma.tenant.findMany({
    orderBy: { name: "asc" },
    include: {
      subscriptions: {
        where: { isActive: true },
        include: { plan: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          students: true,
          teachers: true,
        },
      },
    },
  });
};

/////////////////////////
// GET SINGLE TENANT
/////////////////////////

export const getTenantById = async (id: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  return tenant;
};

/////////////////////////
// UPDATE IMAGES
/////////////////////////

export const updateTenantImagesService = async ({
  tenantId,
  logoUrl,
  backgroundUrl,
}: {
  tenantId: string;
  logoUrl?: string;
  backgroundUrl?: string;
}) => {
  const existing = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!existing) {
    throw new Error("Tenant not found");
  }

  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(logoUrl && { logoUrl }),
      ...(backgroundUrl && { backgroundUrl }),
      updatedAt: new Date(),
    },
  });
};

//////////////////////////////////////////////////////
// 📋 GET MY SUBSCRIPTION (Tenant Dashboard)
//////////////////////////////////////////////////////

export const getMySubscriptionService = async (tenantId: string) => {
  const subscription = await prisma.tenantSubscription.findFirst({
    where: { tenantId, isActive: true },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return null;
  }

  const startDate = new Date(subscription.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + subscription.plan.durationInDays);

  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    planName: subscription.plan.name,
    amount: subscription.amount,
    startDate: subscription.startDate,
    endDate,
    daysRemaining,
    durationInDays: subscription.plan.durationInDays,
    status: subscription.status,
    maxStudents: subscription.maxStudents,
    maxTeachers: subscription.maxTeachers,
    maxAdmins: subscription.maxAdmins,
    maxStorageInGB: subscription.maxStorageInGB,
  };
};

//////////////////////////////////////////////////////
// 🛒 GET ALL PLANS (For tenant to browse)
//////////////////////////////////////////////////////

export const getAllPlansService = async () => {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
};

//////////////////////////////////////////////////////
// 🔥 TENANT SELF-SUBSCRIBE + CREATE ORDER
//////////////////////////////////////////////////////

export const tenantSelfSubscribeService = async (
  tenantId: string,
  planId: string,
) => {
  // Get plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  // Create subscription
  const subscriptionCode = `SUB-${tenantId.slice(-6)}-${Date.now()}`;

  // ✅ Calculate endDate
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationInDays);

  const subscription = await prisma.tenantSubscription.create({
    data: {
      tenantId,
      planId,
      subscriptionCode,
      amount: plan.price,
      currency: "INR",
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      maxAdmins: plan.maxAdmins,
      maxStorageInGB: plan.maxStorageInGB,
      startDate,
      endDate,
      status: plan.price === 0 ? "ACTIVE" : "PENDING",
      isActive: plan.price === 0 ? true : false,
    },
  });

  // ═══ FREE PLAN — Skip Razorpay, directly activate ═══
  if (plan.price === 0) {
    // Create payment entry as FREE
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        amount: 0,
        currency: "INR",
        gateway: "FREE",
        status: "PAID",
        razorpayOrderId: `FREE-${Date.now()}`,
      },
    });

    return {
      success: true,
      message: "Free plan activated successfully",
      subscriptionId: subscription.id,
    };
  }

  // ═══ PAID PLAN — Create Razorpay order ═══
  // Create Razorpay order
  let order;
  if (!razorpay) {
    throw new Error("Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
  }

  try {
    order = await razorpay.orders.create({
      amount: Math.round(plan.price * 100),
      currency: "INR",
      receipt: subscriptionCode,
    });
  } catch (rzpError: any) {
    console.error("RAZORPAY ORDER CREATE ERROR (self-subscribe):", {
      statusCode: rzpError.statusCode,
      error: rzpError.error,
      message: rzpError.message,
      keyUsed: process.env.RAZORPAY_KEY_ID?.substring(0, 12) + "...",
    });
    throw new Error(
      rzpError?.error?.description || rzpError?.message || "Razorpay order creation failed"
    );
  }

  // Update subscription with order id
  await prisma.tenantSubscription.update({
    where: { id: subscription.id },
    data: { razorpayOrderId: order.id },
  });

  // Create payment entry
  await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      amount: plan.price,
      currency: "INR",
      gateway: "RAZORPAY",
      status: PaymentStatus.PENDING,
      razorpayOrderId: order.id,
    },
  });

  return { order, subscriptionId: subscription.id };
};