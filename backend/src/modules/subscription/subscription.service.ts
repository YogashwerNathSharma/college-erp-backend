
import prisma from "../../utils/prisma";

import {
  SubscriptionStatus,
  PaymentStatus,
} from "@prisma/client";

//////////////////////////////////////////////////////////////
// CREATE PLAN
//////////////////////////////////////////////////////////////

export const createPlanService =
  async (data: any) => {

    return prisma.subscriptionPlan.create({
      data,
    });

  };

//////////////////////////////////////////////////////////////
// GET PLANS
//////////////////////////////////////////////////////////////

export const getPlansService =
  async () => {

    return prisma.subscriptionPlan.findMany({

      where: {
        isActive: true,
      },

      orderBy: {
        createdAt: "desc",
      },

    });

  };

//////////////////////////////////////////////////////////////
// GET SINGLE PLAN
//////////////////////////////////////////////////////////////

export const getSinglePlanService =
  async (id: string) => {

    const plan =
      await prisma.subscriptionPlan.findUnique({
        where: { id },
      });

    if (!plan) {
      throw new Error("Plan not found");
    }

    return plan;
  };

//////////////////////////////////////////////////////////////
// UPDATE PLAN
//////////////////////////////////////////////////////////////

export const updatePlanService =
  async (
    id: string,
    data: any
  ) => {

    return prisma.subscriptionPlan.update({

      where: { id },

      data,

    });

  };

//////////////////////////////////////////////////////////////
// DELETE PLAN
//////////////////////////////////////////////////////////////

export const deletePlanService =
  async (id: string) => {

    return prisma.subscriptionPlan.update({

      where: { id },

      data: {
        isActive: false,
      },

    });

  };

//////////////////////////////////////////////////////////////
// ASSIGN SUBSCRIPTION (SuperAdmin use)
//////////////////////////////////////////////////////////////

export const assignSubscriptionService =
  async (
    tenantId: string,
    planId: string
  ) => {

    const tenant =
      await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

    if (!tenant) {
      throw new Error(
        "Tenant not found"
      );
    }

    const plan =
      await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

    if (!plan) {
      throw new Error(
        "Plan not found"
      );
    }

    //////////////////////////////////////////////////
    // EXPIRE OLD ACTIVE SUBSCRIPTIONS
    //////////////////////////////////////////////////

    await prisma.tenantSubscription.updateMany({

      where: {

        tenantId,

        isActive: true,

      },

      data: {

        isActive: false,

        status:
          SubscriptionStatus.EXPIRED,

      },

    });

    //////////////////////////////////////////////////
    // DATES
    //////////////////////////////////////////////////

    const startDate =
      new Date();

    const endDate =
      new Date();

    endDate.setDate(
      endDate.getDate() +
      plan.durationInDays
    );

    //////////////////////////////////////////////////
    // CREATE SUBSCRIPTION
    //////////////////////////////////////////////////

    return prisma.tenantSubscription.create({

      data: {

        tenantId,

        planId,

        subscriptionCode:
          `SUB-${Date.now()}`,

        startDate,

        endDate,

        //////////////////////////////////////////////////
        // STATUS
        //////////////////////////////////////////////////

        status:
          SubscriptionStatus.PENDING,

        isActive: false,

        //////////////////////////////////////////////////
        // PAYMENT
        //////////////////////////////////////////////////

        amount:
          plan.price,

        paymentStatus:
          PaymentStatus.PENDING,

        paymentGateway:
          "RAZORPAY",

        //////////////////////////////////////////////////
        // LIMIT SNAPSHOT
        //////////////////////////////////////////////////

        maxStudents:
          plan.maxStudents,

        maxTeachers:
          plan.maxTeachers,

        maxAdmins:
          plan.maxAdmins,

        maxStorageInGB:
          plan.maxStorageInGB,

      },

      include: {

        tenant: true,

        plan: true,

      },

    });

  };

//////////////////////////////////////////////////////////////
// 🔥 SELF SUBSCRIBE — Tenant subscribes themselves
// Free plan → directly ACTIVE (no Razorpay)
// Paid plan → PENDING (needs Razorpay payment)
//////////////////////////////////////////////////////////////

export const selfSubscribeService =
  async (
    tenantId: string,
    planId: string
  ) => {

    const tenant =
      await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const plan =
      await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

    if (!plan) {
      throw new Error("Plan not found");
    }

    //////////////////////////////////////////////////
    // ✅ FREE PLAN — Check if already used
    //////////////////////////////////////////////////

    if (plan.price === 0) {
      const existingFree =
        await prisma.tenantSubscription.findFirst({
          where: {
            tenantId,
            amount: 0,
            status: {
              in: [
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.EXPIRED,
              ],
            },
          },
        });

      if (existingFree) {
        throw new Error(
          "Free trial already used. Please choose a paid plan."
        );
      }
    }

    //////////////////////////////////////////////////
    // EXPIRE OLD ACTIVE SUBSCRIPTIONS
    //////////////////////////////////////////////////

    await prisma.tenantSubscription.updateMany({
      where: { tenantId, isActive: true },
      data: {
        isActive: false,
        status: SubscriptionStatus.EXPIRED,
      },
    });

    //////////////////////////////////////////////////
    // DATES
    //////////////////////////////////////////////////

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(
      endDate.getDate() + plan.durationInDays
    );

    //////////////////////////////////////////////////
    // ✅ FREE = directly ACTIVE, PAID = PENDING
    //////////////////////////////////////////////////

    const isFree = plan.price === 0;

    const subscription =
      await prisma.tenantSubscription.create({
        data: {
          tenantId,
          planId,
          subscriptionCode: `SUB-${Date.now()}`,
          startDate,
          endDate,
          status: isFree
            ? SubscriptionStatus.ACTIVE
            : SubscriptionStatus.PENDING,
          isActive: isFree ? true : false,
          amount: plan.price,
          paymentStatus: isFree
            ? PaymentStatus.PAID
            : PaymentStatus.PENDING,
          paymentGateway: isFree ? "FREE" : "RAZORPAY",
          maxStudents: plan.maxStudents,
          maxTeachers: plan.maxTeachers,
          maxAdmins: plan.maxAdmins,
          maxStorageInGB: plan.maxStorageInGB,
        },
        include: {
          tenant: true,
          plan: true,
        },
      });

    //////////////////////////////////////////////////
    // ✅ If free — update tenant limits immediately
    //////////////////////////////////////////////////

    if (isFree) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          maxStudents: plan.maxStudents,
          maxTeachers: plan.maxTeachers,
          maxAdmins: plan.maxAdmins,
          maxStorageInGB: plan.maxStorageInGB,
        },
      });
    }

    return subscription;
  };

//////////////////////////////////////////////////////////////
// 🔥 AUTO-ASSIGN FREE PLAN ON REGISTRATION
// Call this from your auth/register service after tenant creation
//////////////////////////////////////////////////////////////

export const autoAssignFreePlanService =
  async (tenantId: string) => {

    // Find the free plan (price = 0)
    const freePlan =
      await prisma.subscriptionPlan.findFirst({
        where: {
          isActive: true,
          price: 0,
        },
      });

    if (!freePlan) {
      console.log("No free plan found in DB, skipping auto-assign");
      return null;
    }

    // Assign free plan directly as ACTIVE
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(
      endDate.getDate() + freePlan.durationInDays
    );

    const subscription =
      await prisma.tenantSubscription.create({
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

    return subscription;
  };

//////////////////////////////////////////////////////////////
// GET SUBSCRIPTIONS
//////////////////////////////////////////////////////////////

export const getSubscriptionsService =
  async () => {

    return prisma.tenantSubscription.findMany({

      include: {

        tenant: true,

        plan: true,

      },

      orderBy: {

        createdAt: "desc",

      },

    });

  };

//////////////////////////////////////////////////////////////
// GET ACTIVE SUBSCRIPTION
//////////////////////////////////////////////////////////////

export const getTenantActiveSubscriptionService =
  async (
    tenantId: string
  ) => {

    return prisma.tenantSubscription.findFirst({

      where: {

        tenantId,

        isActive: true,

        status:
          SubscriptionStatus.ACTIVE,

      },

      include: {

        plan: true,

      },

    });

  };

//////////////////////////////////////////////////////////////
// CANCEL SUBSCRIPTION
//////////////////////////////////////////////////////////////

export const cancelSubscriptionService =
  async (id: string) => {

    return prisma.tenantSubscription.update({

      where: { id },

      data: {

        status:
          SubscriptionStatus.CANCELLED,

        isActive: false,

        cancelledAt:
          new Date(),

      },

    });

  };

//////////////////////////////////////////////////////////////
// RENEW SUBSCRIPTION
//////////////////////////////////////////////////////////////

export const renewSubscriptionService =
  async (id: string) => {

    const oldSubscription =
      await prisma.tenantSubscription.findUnique({

        where: { id },

      });

    if (!oldSubscription) {

      throw new Error(
        "Subscription not found"
      );

    }

    return assignSubscriptionService(
      oldSubscription.tenantId,
      oldSubscription.planId
    );

  };

