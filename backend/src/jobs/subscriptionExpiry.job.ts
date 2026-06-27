import prisma from "../config/prisma";
import { sendEmail } from "../modules/communication/helpers/email.helper";

/**
 * Subscription Expiry Job
 * Checks for subscriptions nearing expiry and sends alerts
 * Scheduled to run daily at 8 AM
 */
export const runSubscriptionExpiryJob = async () => {
  console.log("[SubscriptionExpiryJob] Starting subscription expiry check...");

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Get subscriptions expiring in 7 days
    const expiringIn7Days = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        endDate: { gte: now, lte: sevenDaysFromNow },
      },
      include: {
        tenant: { select: { id: true, name: true, email: true } },
      },
    });

    // Get subscriptions expiring in 3 days
    const expiringIn3Days = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        endDate: { gte: now, lte: threeDaysFromNow },
      },
      include: {
        tenant: { select: { id: true, name: true, email: true } },
      },
    });

    // Get already expired subscriptions
    const expired = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        endDate: { lt: now },
      },
      include: {
        tenant: { select: { id: true, name: true, email: true } },
      },
    });

    let alertsSent = 0;

    // Send 7-day warnings
    for (const sub of expiringIn7Days) {
      if (sub.tenant?.email) {
        try {
          await sendEmail({
            to: sub.tenant.email,
            subject: "Subscription Expiring Soon - 7 Days Remaining",
            body: `Dear ${sub.tenant.name},\n\nYour subscription will expire on ${sub.endDate.toLocaleDateString("en-IN")}. Please renew to continue using all features.\n\nThank you.`,
          });
          alertsSent++;
        } catch (err) {
          console.error(`[SubscriptionExpiryJob] Email failed for ${sub.tenant.email}`);
        }
      }
    }

    // Send 3-day urgent warnings
    for (const sub of expiringIn3Days) {
      if (sub.tenant?.email) {
        try {
          await sendEmail({
            to: sub.tenant.email,
            subject: "⚠️ URGENT: Subscription Expiring in 3 Days",
            body: `Dear ${sub.tenant.name},\n\nYour subscription expires on ${sub.endDate.toLocaleDateString("en-IN")}. Please renew immediately to avoid service interruption.\n\nThank you.`,
          });
          alertsSent++;
        } catch (err) {
          console.error(`[SubscriptionExpiryJob] Email failed for ${sub.tenant.email}`);
        }
      }
    }

    // Deactivate expired subscriptions
    let deactivatedCount = 0;
    for (const sub of expired) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "EXPIRED" },
      });

      // Optionally restrict tenant access
      await prisma.tenant.update({
        where: { id: sub.tenant.id },
        data: { subscriptionStatus: "EXPIRED" },
      });

      if (sub.tenant?.email) {
        try {
          await sendEmail({
            to: sub.tenant.email,
            subject: "Subscription Expired",
            body: `Dear ${sub.tenant.name},\n\nYour subscription has expired. Some features may be restricted. Please renew to restore full access.\n\nThank you.`,
          });
        } catch (err) {
          console.error(`[SubscriptionExpiryJob] Expiry email failed for ${sub.tenant.email}`);
        }
      }

      deactivatedCount++;
    }

    console.log(`[SubscriptionExpiryJob] Completed. Alerts: ${alertsSent}, Deactivated: ${deactivatedCount}`);
    return { success: true, alertsSent, deactivatedCount };
  } catch (error: any) {
    console.error("[SubscriptionExpiryJob] Error:", error.message);
    return { success: false, error: error.message };
  }
};

export const SUBSCRIPTION_EXPIRY_SCHEDULE = "0 8 * * *"; // Every day at 8 AM
