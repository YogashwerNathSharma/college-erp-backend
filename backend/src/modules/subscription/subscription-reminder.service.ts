/**
 * 📧 Subscription Reminder Service
 *
 * Provides queries for expiring / recently-expired subscriptions.
 * Used by:
 *  - Super Admin dashboard (list tenants about to expire)
 *  - Future: cron job to send email/SMS reminders
 */

import prisma from "../../utils/prisma";

// ─── Get tenants with subscriptions expiring within N days ────
export async function getExpiringSubscriptions(daysThreshold: number) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysThreshold);

  return prisma.tenantSubscription.findMany({
    where: {
      isActive: true,
      status: "ACTIVE",
      endDate: {
        gte: now,
        lte: futureDate,
      },
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          type: true,
        },
      },
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
          durationInDays: true,
        },
      },
    },
    orderBy: { endDate: "asc" },
  });
}

// ─── Get tenants currently in grace period (expired ≤7 days ago) ────
export async function getGracePeriodSubscriptions() {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return prisma.tenantSubscription.findMany({
    where: {
      OR: [
        // Still marked active but expired
        {
          isActive: true,
          status: "ACTIVE",
          endDate: { lt: now, gte: sevenDaysAgo },
        },
        // Already marked expired recently
        {
          status: "EXPIRED",
          endDate: { gte: sevenDaysAgo },
        },
      ],
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      plan: {
        select: { name: true, price: true },
      },
    },
    orderBy: { endDate: "asc" },
  });
}

// ─── Subscription summary stats for Super Admin ────
export async function getSubscriptionStats() {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [total, active, expiringIn7, inGrace, expired] = await Promise.all([
    prisma.tenantSubscription.count(),
    prisma.tenantSubscription.count({
      where: { isActive: true, status: "ACTIVE", endDate: { gte: now } },
    }),
    prisma.tenantSubscription.count({
      where: {
        isActive: true,
        status: "ACTIVE",
        endDate: { gte: now, lte: sevenDaysFromNow },
      },
    }),
    prisma.tenantSubscription.count({
      where: {
        endDate: { lt: now, gte: sevenDaysAgo },
        OR: [{ status: "ACTIVE" }, { status: "EXPIRED" }],
      },
    }),
    prisma.tenantSubscription.count({
      where: { status: "EXPIRED" },
    }),
  ]);

  return { total, active, expiringIn7, inGrace, expired };
}
