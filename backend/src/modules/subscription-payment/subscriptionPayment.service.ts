import crypto from "crypto";

import prisma from "../../utils/prisma";

import Razorpay from "razorpay";

import {
  PaymentStatus,
  SubscriptionStatus,
  Prisma,
} from "@prisma/client";

//////////////////////////////////////////////////////////////
// RAZORPAY
//////////////////////////////////////////////////////////////

const razorpay =
  new Razorpay({

    key_id:
      process.env.RAZORPAY_KEY_ID!,

    key_secret:
      process.env.RAZORPAY_KEY_SECRET!,

  });

console.log("✅ Razorpay initialized with key:", process.env.RAZORPAY_KEY_ID?.substring(0, 12) + "...");
console.log("✅ Razorpay secret present:", !!process.env.RAZORPAY_KEY_SECRET);

//////////////////////////////////////////////////////////////
// CREATE ORDER
//////////////////////////////////////////////////////////////

export const createOrderService =
  async (
    subscriptionId: string
  ) => {

    //////////////////////////////////////////////////
    // GET SUBSCRIPTION
    //////////////////////////////////////////////////

    const subscription =
      await prisma.tenantSubscription.findUnique({

        where: {
          id: subscriptionId,
        },

      });

    if (!subscription) {

      throw new Error(
        "Subscription not found"
      );

    }

    //////////////////////////////////////////////////
    // CHECK ALREADY PAID
    //////////////////////////////////////////////////

    const existingPayment =
      await prisma.subscriptionPayment.findFirst({

        where: {

          subscriptionId,

          status:
            PaymentStatus.PAID,

        },

      });

    if (existingPayment) {

      throw new Error(
        "Subscription already paid"
      );

    }

    //////////////////////////////////////////////////
    // CREATE RAZORPAY ORDER
    //////////////////////////////////////////////////

    const options = {

      amount:
        Math.round(
          subscription.amount * 100
        ),

      currency: "INR",

      receipt:
        subscription.subscriptionCode,

    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (rzpError: any) {
      console.error("RAZORPAY ORDER CREATE ERROR:", {
        statusCode: rzpError.statusCode,
        error: rzpError.error,
        message: rzpError.message,
        keyUsed: process.env.RAZORPAY_KEY_ID?.substring(0, 12) + "...",
      });
      throw new Error(
        rzpError?.error?.description || rzpError?.message || "Razorpay order creation failed"
      );
    }

    //////////////////////////////////////////////////
    // UPDATE SUBSCRIPTION
    //////////////////////////////////////////////////

    await prisma.tenantSubscription.update({

      where: {
        id: subscription.id,
      },

      data: {

        razorpayOrderId:
          order.id,

      },

    });

    //////////////////////////////////////////////////
    // CREATE PAYMENT ENTRY
    //////////////////////////////////////////////////

    await prisma.subscriptionPayment.create({

      data: {

        subscriptionId:
          subscription.id,

        amount:
          subscription.amount,

        currency: "INR",

        gateway: "RAZORPAY",

        status:
          PaymentStatus.PENDING,

        razorpayOrderId:
          order.id,

      },

    });

    return order;

  };

//////////////////////////////////////////////////////////////
// VERIFY PAYMENT
//////////////////////////////////////////////////////////////

export const verifyPaymentService =
  async (
    body: any
  ) => {

    const {

      subscriptionId,

      razorpay_order_id,

      razorpay_payment_id,

      razorpay_signature,

    } = body;

    //////////////////////////////////////////////////
    // VERIFY SIGNATURE
    //////////////////////////////////////////////////

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env
            .RAZORPAY_KEY_SECRET!
        )
        .update(
          razorpay_order_id +
            "|" +
            razorpay_payment_id
        )
        .digest("hex");

    const isAuthentic =
      generatedSignature ===
      razorpay_signature;

    if (!isAuthentic) {

      throw new Error(
        "Invalid payment signature"
      );

    }

    //////////////////////////////////////////////////
    // GET SUBSCRIPTION
    //////////////////////////////////////////////////

    const subscription =
      await prisma.tenantSubscription.findUnique({

        where: {
          id: subscriptionId,
        },

      });

    if (!subscription) {

      throw new Error(
        "Subscription not found"
      );

    }

    //////////////////////////////////////////////////
    // UPDATE SUBSCRIPTION
    //////////////////////////////////////////////////

    // First deactivate all other subscriptions for this tenant
    await prisma.tenantSubscription.updateMany({
      where: {
        tenantId: subscription.tenantId,
        id: { not: subscription.id },
        isActive: true,
      },
      data: { isActive: false, status: SubscriptionStatus.EXPIRED },
    });

    await prisma.tenantSubscription.update({

      where: {
        id: subscription.id,
      },

      data: {

        paymentStatus:
          PaymentStatus.PAID,

        status:
          SubscriptionStatus.ACTIVE,

        isActive: true,

        razorpayPaymentId:
          razorpay_payment_id,

        razorpaySignature:
          razorpay_signature,

        paymentReference:
          razorpay_payment_id,

        paymentGateway:
          "RAZORPAY",

      },

    });

    //////////////////////////////////////////////////
    // UPDATE TENANT LIMITS
    //////////////////////////////////////////////////

    await prisma.tenant.update({

      where: {
        id: subscription.tenantId,
      },

      data: {

        maxStudents:
          subscription.maxStudents,

        maxTeachers:
          subscription.maxTeachers,

        maxAdmins:
          subscription.maxAdmins,

        maxStorageInGB:
          subscription.maxStorageInGB,

      },

    });

    //////////////////////////////////////////////////
    // UPDATE PAYMENT HISTORY
    //////////////////////////////////////////////////

    await prisma.subscriptionPayment.updateMany({

      where: {

        razorpayOrderId:
          razorpay_order_id,

      },

      data: {

        status:
          PaymentStatus.PAID,

        razorpayPaymentId:
          razorpay_payment_id,

        razorpaySignature:
          razorpay_signature,

        paidAt:
          new Date(),

      },

    });

    return {

      success: true,

      message:
        "Payment verified successfully",

    };

  };

//////////////////////////////////////////////////////////////
// GET PAYMENTS
//////////////////////////////////////////////////////////////

export const getPaymentsService =
  async () => {

    return prisma.subscriptionPayment.findMany({

      include: {

        subscription: {

          include: {

            tenant: true,

            plan: true,

          },

        },

      },

      orderBy: {

        createdAt: "desc",

      },

    });

  };

//////////////////////////////////////////////////////////////
// CREATE CUSTOM ORDER (Super Admin - custom amount payment)
//////////////////////////////////////////////////////////////

export const createCustomOrderService = async (
  tenantId: string,
  amount: number
) => {
  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  // Find a plan to reference (planId is required in schema)
  const defaultPlan = await prisma.subscriptionPlan.findFirst({
    orderBy: { price: "asc" },
  });

  if (!defaultPlan) throw new Error("No subscription plans exist. Create at least one plan first.");

  // Create a subscription entry for tracking
  const subscriptionCode = `CUSTOM-${Date.now()}`;
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30); // Default 30 days for custom

  const subscription = await prisma.tenantSubscription.create({
    data: ({
      tenantId,
      planId: defaultPlan.id,
      subscriptionCode,
      amount,
      currency: "INR",
      startDate,
      endDate,
      status: SubscriptionStatus.PENDING,
      isActive: false,
      maxStudents: tenant.maxStudents || 300,
      maxTeachers: tenant.maxTeachers || 20,
      maxAdmins: tenant.maxAdmins || 2,
      maxStorageInGB: tenant.maxStorageInGB || 5,
    }) as any,
  });

  // Create Razorpay order
  let order;
  try {
    order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: subscriptionCode,
    });
  } catch (rzpError: any) {
    console.error("RAZORPAY CUSTOM ORDER ERROR:", rzpError?.error || rzpError?.message);
    throw new Error(rzpError?.error?.description || rzpError?.message || "Razorpay order creation failed");
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
      amount,
      currency: "INR",
      gateway: "RAZORPAY",
      status: PaymentStatus.PENDING,
      razorpayOrderId: order.id,
    },
  });

  return { order, subscriptionId: subscription.id };
};
