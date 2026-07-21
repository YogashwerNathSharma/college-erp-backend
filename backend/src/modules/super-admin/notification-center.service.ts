// ═══════════════════════════════════════════════════════════
// NOTIFICATION CENTER SERVICE - Multi-channel Messaging
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Types ───────────────────────────────────────────────
export type NotificationChannel = "email" | "sms" | "push" | "whatsapp" | "broadcast";
export type DeliveryStatus = "pending" | "sent" | "delivered" | "failed" | "bounced" | "read";

export interface SendNotificationInput {
  channel: NotificationChannel;
  recipients: string[];
  subject?: string;
  body: string;
  templateId?: string;
  scheduledAt?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  metadata?: any;
}

export interface NotificationTemplate {
  id?: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables?: string[];
  isActive?: boolean;
}

export interface NotificationFilter {
  channel?: NotificationChannel;
  status?: DeliveryStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Get Notifications ───────────────────────────────────
export async function getNotifications(filter: NotificationFilter) {
  const {
    channel,
    status,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 25,
  } = filter;

  const where: any = {};

  if (channel) where.channel = channel;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { body: { contains: search, mode: "insensitive" } },
      { recipientName: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Send Notification ───────────────────────────────────
export async function sendNotification(input: SendNotificationInput) {
  const { channel, recipients, subject, body, templateId, scheduledAt, priority, metadata } = input;

  const notifications = await Promise.all(
    recipients.map(async (recipient) => {
      return prisma.notification.create({
        data: {
          channel,
          recipient,
          subject: subject || "",
          body,
          templateId,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          priority: priority || "normal",
          status: scheduledAt ? "pending" : "sent",
          metadata: metadata || {},
          sentAt: scheduledAt ? null : new Date(),
        },
      });
    })
  );

  return { sent: notifications.length, notifications };
}

// ─── Get Notification Stats ──────────────────────────────
export async function getNotificationStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, todaySent, monthSent, byChannel, byStatus, pending, failed] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({ where: { createdAt: { gte: today }, status: { in: ["sent", "delivered"] } } }),
    prisma.notification.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.notification.groupBy({ by: ["channel"], _count: true }),
    prisma.notification.groupBy({ by: ["status"], _count: true }),
    prisma.notification.count({ where: { status: "pending" } }),
    prisma.notification.count({ where: { status: "failed" } }),
  ]);

  return {
    total,
    todaySent,
    monthSent,
    pending,
    failed,
    byChannel: byChannel.reduce((acc, item) => {
      acc[item.channel] = item._count;
      return acc;
    }, {} as Record<string, number>),
    byStatus: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>),
    deliveryRate: total > 0 ? Math.round(((total - (failed || 0)) / total) * 100) : 100,
  };
}

// ─── Template CRUD ───────────────────────────────────────
export async function getTemplates(channel?: NotificationChannel) {
  const where: any = {};
  if (channel) where.channel = channel;

  return prisma.notificationTemplate.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getTemplateById(id: string) {
  return prisma.notificationTemplate.findUnique({ where: { id } });
}

export async function createTemplate(data: NotificationTemplate) {
  return prisma.notificationTemplate.create({
    data: {
      name: data.name,
      channel: data.channel,
      subject: data.subject || "",
      body: data.body,
      variables: data.variables || [],
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateTemplate(id: string, data: Partial<NotificationTemplate>) {
  return prisma.notificationTemplate.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function deleteTemplate(id: string) {
  return prisma.notificationTemplate.delete({ where: { id } });
}

// ─── Broadcast Message ───────────────────────────────────
export async function sendBroadcast(input: {
  channels: NotificationChannel[];
  subject: string;
  body: string;
  targetAudience?: string; // all | students | teachers | admins
  scheduledAt?: string;
}) {
  const { channels, subject, body, targetAudience = "all", scheduledAt } = input;

  // Get recipients based on target audience
  const userWhere: any = {};
  if (targetAudience !== "all") {
    const roleMap: Record<string, string> = {
      students: "STUDENT",
      teachers: "TEACHER",
      admins: "ADMIN",
    };
    userWhere.role = roleMap[targetAudience] || undefined;
  }

  const users = await prisma.user.findMany({
    where: { ...userWhere, isActive: true },
    select: { id: true, email: true, phone: true, name: true },
    take: 10000,
  });

  const results: any[] = [];

  for (const channel of channels) {
    const recipients = users.map((u) => {
      if (channel === "email") return u.email;
      if (channel === "sms" || channel === "whatsapp") return u.phone;
      return u.id;
    }).filter(Boolean) as string[];

    if (recipients.length > 0) {
      const sent = await sendNotification({
        channel,
        recipients,
        subject,
        body,
        scheduledAt,
        priority: "high",
        metadata: { broadcast: true, targetAudience },
      });
      results.push({ channel, sent: sent.sent });
    }
  }

  return { broadcast: true, results, totalRecipients: users.length };
}

// ─── Scheduled Notifications ─────────────────────────────
export async function getScheduledNotifications() {
  return prisma.notification.findMany({
    where: {
      status: "pending",
      scheduledAt: { not: null },
    },
    orderBy: { scheduledAt: "asc" },
    take: 50,
  });
}

export async function cancelScheduledNotification(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { status: "failed", metadata: { cancelledAt: new Date().toISOString() } },
  });
}

// ─── Notification Analytics ──────────────────────────────
export async function getNotificationAnalytics(days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const dailyStats = await prisma.notification.groupBy({
    by: ["channel"],
    where: { createdAt: { gte: since } },
    _count: true,
  });

  // Generate daily breakdown
  const notifications = await prisma.notification.findMany({
    where: { createdAt: { gte: since } },
    select: { channel: true, status: true, createdAt: true },
  });

  const dailyBreakdown: Record<string, { sent: number; delivered: number; failed: number }> = {};

  notifications.forEach((n) => {
    const day = n.createdAt.toISOString().split("T")[0];
    if (!dailyBreakdown[day]) dailyBreakdown[day] = { sent: 0, delivered: 0, failed: 0 };
    if (n.status === "sent" || n.status === "delivered") dailyBreakdown[day].sent++;
    if (n.status === "delivered") dailyBreakdown[day].delivered++;
    if (n.status === "failed") dailyBreakdown[day].failed++;
  });

  return {
    byChannel: dailyStats,
    dailyBreakdown: Object.entries(dailyBreakdown)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    totalSent: notifications.filter((n) => n.status !== "failed").length,
    totalFailed: notifications.filter((n) => n.status === "failed").length,
    avgDeliveryRate:
      notifications.length > 0
        ? Math.round(
            (notifications.filter((n) => n.status === "delivered").length / notifications.length) * 100
          )
        : 0,
  };
}
