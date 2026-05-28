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
// ASSIGN SUBSCRIPTION
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