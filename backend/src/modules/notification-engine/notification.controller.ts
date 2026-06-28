import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════
// SEND NOTIFICATIONS
// ══════════════════════════════════════════════════════

export const sendNotification = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const {
      channel, to, toName, subject, body, htmlBody,
      data, priority, scheduledAt, module, entityId, entityType
    } = req.body;

    if (!channel || !to || !body) {
      return res.status(400).json({
        success: false,
        message: "channel, to, and body are required"
      });
    }

    // Check if channel is configured
    const config = await prisma.notificationConfig.findFirst({
      where: { tenantId, channel, isActive: true },
    });

    if (!config) {
      return res.status(400).json({
        success: false,
        message: `Channel ${channel} is not configured or inactive`
      });
    }

    // Add to queue
    const notification = await prisma.notificationQueue.create({
      data: {
        tenantId,
        channel,
        to,
        toName,
        subject,
        body,
        htmlBody,
        data: data || {},
        status: scheduledAt ? "QUEUED" : "QUEUED",
        priority: priority || "NORMAL",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        module,
        entityId,
        entityType,
      },
    });

    // Process immediately if not scheduled
    if (!scheduledAt) {
      await processNotification(notification.id, config);
    }

    return res.status(201).json({
      success: true,
      message: "Notification queued successfully",
      data: notification,
    });
  } catch (error: any) {
    console.error("Send notification error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendBulkNotification = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { channel, recipients, subject, body, htmlBody, data, module } = req.body;

    if (!channel || !recipients?.length || !body) {
      return res.status(400).json({
        success: false,
        message: "channel, recipients[], and body are required"
      });
    }

    const config = await prisma.notificationConfig.findFirst({
      where: { tenantId, channel, isActive: true },
    });

    if (!config) {
      return res.status(400).json({
        success: false,
        message: `Channel ${channel} is not configured`
      });
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create queue entries for all recipients
    const notifications = await prisma.notificationQueue.createMany({
      data: recipients.map((r: { to: string; toName?: string; customData?: any }) => ({
        tenantId,
        channel,
        to: r.to,
        toName: r.toName,
        subject,
        body: replaceVariables(body, { ...data, ...r.customData }),
        htmlBody: htmlBody ? replaceVariables(htmlBody, { ...data, ...r.customData }) : undefined,
        data: { ...data, ...r.customData },
        status: "QUEUED",
        priority: "NORMAL",
        batchId,
        module,
      })),
    });

    // Process batch asynchronously
    processBatch(tenantId, batchId, config);

    return res.status(201).json({
      success: true,
      message: `${recipients.length} notifications queued`,
      data: { batchId, count: notifications.count },
    });
  } catch (error: any) {
    console.error("Bulk notification error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// QUEUE MANAGEMENT
// ══════════════════════════════════════════════════════

export const getQueue = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { status, channel, page = "1", limit = "50" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { tenantId };
    if (status) where.status = status as string;
    if (channel) where.channel = channel as string;

    const [queue, total] = await Promise.all([
      prisma.notificationQueue.findMany({
        where,
        skip,
        take,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      }),
      prisma.notificationQueue.count({ where }),
    ]);

    return res.json({
      success: true,
      data: queue,
      pagination: { page: parseInt(page as string), limit: take, total, totalPages: Math.ceil(total / take) },
    });
  } catch (error: any) {
    console.error("Get queue error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const retryFailed = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { id } = req.params;

    const notification = await prisma.notificationQueue.findFirst({
      where: { id: id as string, tenantId, status: "FAILED" },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found or not failed" });
    }

    const config = await prisma.notificationConfig.findFirst({
      where: { tenantId, channel: notification.channel, isActive: true },
    });

    if (!config) {
      return res.status(400).json({ success: false, message: "Channel not configured" });
    }

    await prisma.notificationQueue.update({
      where: { id: id as string },
      data: { status: "QUEUED", error: null },
    });

    await processNotification(id as string, config);

    return res.json({ success: true, message: "Notification retry initiated" });
  } catch (error: any) {
    console.error("Retry error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelQueued = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { id } = req.params;

    await prisma.notificationQueue.updateMany({
      where: { id: id as string, tenantId, status: "QUEUED" },
      data: { status: "CANCELLED" },
    });

    return res.json({ success: true, message: "Notification cancelled" });
  } catch (error: any) {
    console.error("Cancel error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// NOTIFICATION LOGS
// ══════════════════════════════════════════════════════

export const getLogs = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { channel, status, dateFrom, dateTo, page = "1", limit = "50" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { tenantId };
    if (channel) where.channel = channel as string;
    if (status) where.status = status as string;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notificationLog.count({ where }),
    ]);

    return res.json({
      success: true,
      data: logs,
      pagination: { page: parseInt(page as string), limit: take, total, totalPages: Math.ceil(total / take) },
    });
  } catch (error: any) {
    console.error("Get logs error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// IN-APP NOTIFICATIONS
// ══════════════════════════════════════════════════════

export const getInAppNotifications = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).user?.id;
    const { unreadOnly, category, page = "1", limit = "20" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { tenantId, userId, isDismissed: false };
    if (unreadOnly === "true") where.isRead = false;
    if (category) where.category = category as string;

    // Don't show expired notifications
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gte: new Date() } },
    ];

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.inAppNotification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.inAppNotification.count({ where }),
      prisma.inAppNotification.count({ where: { tenantId, userId, isRead: false, isDismissed: false } }),
    ]);

    return res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { page: parseInt(page as string), limit: take, total, totalPages: Math.ceil(total / take) },
    });
  } catch (error: any) {
    console.error("Get in-app notifications error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (id === "all") {
      await prisma.inAppNotification.updateMany({
        where: { tenantId, userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return res.json({ success: true, message: "All notifications marked as read" });
    }

    await prisma.inAppNotification.update({
      where: { id: id as string },
      data: { isRead: true, readAt: new Date() },
    });

    return res.json({ success: true, message: "Notification marked as read" });
  } catch (error: any) {
    console.error("Mark as read error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const dismissNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.inAppNotification.update({
      where: { id: id as string },
      data: { isDismissed: true, dismissedAt: new Date() },
    });

    return res.json({ success: true, message: "Notification dismissed" });
  } catch (error: any) {
    console.error("Dismiss error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createInAppNotification = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { userId, title, body, type, category, actionUrl, actionLabel, imageUrl, expiresAt } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ success: false, message: "userId, title, and body are required" });
    }

    const notification = await prisma.inAppNotification.create({
      data: {
        tenantId,
        userId,
        title,
        body,
        type: type || "INFO",
        category: category || "GENERAL",
        actionUrl,
        actionLabel,
        imageUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });

    return res.status(201).json({ success: true, data: notification });
  } catch (error: any) {
    console.error("Create in-app notification error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// NOTIFICATION SCHEDULES
// ══════════════════════════════════════════════════════

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { name, description, event, channel, templateId, templateBody, recipients, timing, conditions } = req.body;

    if (!name || !event || !channel?.length || !recipients || !timing) {
      return res.status(400).json({
        success: false,
        message: "name, event, channel[], recipients, and timing are required"
      });
    }

    const schedule = await prisma.notificationSchedule.create({
      data: {
        tenantId,
        name,
        description,
        event,
        channel,
        templateId,
        templateBody,
        recipients,
        timing,
        conditions: conditions || undefined,
        nextRunAt: calculateNextRunFromTiming(timing),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Notification schedule created",
      data: schedule,
    });
  } catch (error: any) {
    console.error("Create schedule error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;

    const schedules = await prisma.notificationSchedule.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: schedules });
  } catch (error: any) {
    console.error("Get schedules error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { id } = req.params;

    const schedule = await prisma.notificationSchedule.update({
      where: { id: id as string },
      data: { ...req.body, updatedAt: new Date() },
    });

    return res.json({ success: true, message: "Schedule updated", data: schedule });
  } catch (error: any) {
    console.error("Update schedule error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notificationSchedule.delete({ where: { id: id as string } });
    return res.json({ success: true, message: "Schedule deleted" });
  } catch (error: any) {
    console.error("Delete schedule error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// CHANNEL CONFIGURATION
// ══════════════════════════════════════════════════════

export const getChannelConfigs = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;

    const configs = await prisma.notificationConfig.findMany({
      where: { tenantId },
      orderBy: { channel: "asc" },
    });

    // Mask sensitive data
    const masked = configs.map(c => ({
      ...c,
      apiKey: c.apiKey ? `${c.apiKey.substr(0, 4)}${"*".repeat(20)}` : null,
      apiSecret: c.apiSecret ? "********" : null,
    }));

    return res.json({ success: true, data: masked });
  } catch (error: any) {
    console.error("Get configs error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertChannelConfig = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { channel } = req.params;
    const { provider, apiKey, apiSecret, senderId, baseUrl, webhookUrl, dailyLimit, monthlyLimit, isActive } = req.body;

    const existing = await prisma.notificationConfig.findFirst({
      where: { tenantId, channel: channel as string },
    });

    let config;
    if (existing) {
      const updateData: any = { provider, senderId, baseUrl, webhookUrl, dailyLimit, monthlyLimit, isActive };
      if (apiKey && !apiKey.includes("*")) updateData.apiKey = apiKey;
      if (apiSecret && apiSecret !== "********") updateData.apiSecret = apiSecret;

      config = await prisma.notificationConfig.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      config = await prisma.notificationConfig.create({
        data: {
          tenantId,
          channel: channel as string,
          provider,
          apiKey,
          apiSecret,
          senderId,
          baseUrl,
          webhookUrl,
          dailyLimit,
          monthlyLimit,
          isActive: isActive ?? true,
        },
      });
    }

    return res.json({
      success: true,
      message: `${channel} configuration saved`,
      data: { ...config, apiKey: config.apiKey ? "****" : null, apiSecret: config.apiSecret ? "****" : null },
    });
  } catch (error: any) {
    console.error("Upsert config error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const testChannel = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { channel } = req.params;
    const { testTo } = req.body;

    if (!testTo) {
      return res.status(400).json({ success: false, message: "testTo is required" });
    }

    const config = await prisma.notificationConfig.findFirst({
      where: { tenantId, channel: channel as string, isActive: true },
    });

    if (!config) {
      return res.status(400).json({ success: false, message: "Channel not configured" });
    }

    // Send test message
    const testBody = `Test notification from your ERP system. Channel: ${channel}. Time: ${new Date().toLocaleString("en-IN")}`;

    const result = await sendViaProvider(config, testTo, "Test Notification", testBody);

    // Update last tested
    await prisma.notificationConfig.update({
      where: { id: config.id },
      data: { lastTestedAt: new Date(), isVerified: result.success },
    });

    return res.json({
      success: result.success,
      message: result.success ? "Test notification sent!" : `Failed: ${result.error}`,
    });
  } catch (error: any) {
    console.error("Test channel error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// DASHBOARD STATS
// ══════════════════════════════════════════════════════

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalSentToday,
      totalQueued,
      totalFailed,
      totalDelivered,
      channelStats,
      recentLogs,
      configuredChannels
    ] = await Promise.all([
      prisma.notificationLog.count({
        where: { tenantId, createdAt: { gte: todayStart }, status: "SENT" },
      }),
      prisma.notificationQueue.count({
        where: { tenantId, status: "QUEUED" },
      }),
      prisma.notificationQueue.count({
        where: { tenantId, status: "FAILED", createdAt: { gte: todayStart } },
      }),
      prisma.notificationLog.count({
        where: { tenantId, status: "DELIVERED", createdAt: { gte: todayStart } },
      }),
      prisma.notificationLog.groupBy({
        by: ["channel"],
        where: { tenantId, createdAt: { gte: todayStart } },
        _count: { id: true },
      }),
      prisma.notificationLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.notificationConfig.findMany({
        where: { tenantId },
        select: { channel: true, provider: true, isActive: true, isVerified: true, lastTestedAt: true },
      }),
    ]);

    // Calculate delivery rate
    const totalSentAll = await prisma.notificationLog.count({
      where: { tenantId, createdAt: { gte: todayStart } },
    });
    const deliveryRate = totalSentAll > 0 ? Math.round((totalDelivered / totalSentAll) * 100) : 0;

    // Weekly trend
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyLogs = await prisma.notificationLog.findMany({
      where: { tenantId, createdAt: { gte: weekAgo } },
      select: { createdAt: true, channel: true, status: true },
    });

    // Aggregate by day
    const dailyStats: Record<string, { date: string; SMS: number; EMAIL: number; WHATSAPP: number; PUSH: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      dailyStats[key] = { date: key, SMS: 0, EMAIL: 0, WHATSAPP: 0, PUSH: 0 };
    }
    for (const log of weeklyLogs) {
      const key = log.createdAt.toISOString().split("T")[0];
      if (dailyStats[key] && (log.channel as keyof typeof dailyStats[string]) in dailyStats[key]) {
        (dailyStats[key] as any)[log.channel]++;
      }
    }

    return res.json({
      success: true,
      data: {
        sentToday: totalSentToday,
        queueSize: totalQueued,
        failedToday: totalFailed,
        deliveredToday: totalDelivered,
        deliveryRate,
        channelStats: channelStats.map(c => ({ channel: c.channel, count: c._count.id })),
        recentLogs,
        configuredChannels,
        weeklyTrend: Object.values(dailyStats),
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════

async function processNotification(queueId: string, config: any) {
  try {
    await prisma.notificationQueue.update({
      where: { id: queueId },
      data: { status: "PROCESSING", lastAttemptAt: new Date(), attempts: { increment: 1 } },
    });

    const notification = await prisma.notificationQueue.findUnique({ where: { id: queueId } });
    if (!notification) return;

    const result = await sendViaProvider(config, notification.to, notification.subject || "", notification.body);

    if (result.success) {
      await prisma.notificationQueue.update({
        where: { id: queueId },
        data: { status: "SENT", sentAt: new Date(), externalId: result.messageId },
      });

      // Log it
      await prisma.notificationLog.create({
        data: {
          tenantId: notification.tenantId,
          channel: notification.channel,
          to: notification.to,
          toName: notification.toName,
          subject: notification.subject,
          body: notification.body,
          status: "SENT",
          messageId: result.messageId,
          module: notification.module,
          entityId: notification.entityId,
          batchId: notification.batchId,
        },
      });
    } else {
      const attempts = notification.attempts + 1;
      const maxAttempts = notification.maxAttempts;

      await prisma.notificationQueue.update({
        where: { id: queueId },
        data: {
          status: attempts >= maxAttempts ? "FAILED" : "QUEUED",
          error: result.error,
          failedAt: attempts >= maxAttempts ? new Date() : undefined,
        },
      });

      if (attempts >= maxAttempts) {
        await prisma.notificationLog.create({
          data: {
            tenantId: notification.tenantId,
            channel: notification.channel,
            to: notification.to,
            toName: notification.toName,
            subject: notification.subject,
            status: "FAILED",
            error: result.error,
            module: notification.module,
            batchId: notification.batchId,
          },
        });
      }
    }
  } catch (error: any) {
    console.error(`Process notification ${queueId} error:`, error);
    await prisma.notificationQueue.update({
      where: { id: queueId },
      data: { status: "FAILED", error: error.message },
    });
  }
}

async function processBatch(tenantId: string, batchId: string, config: any) {
  const notifications = await prisma.notificationQueue.findMany({
    where: { tenantId, batchId, status: "QUEUED" },
    take: 100,
  });

  for (const notification of notifications) {
    await processNotification(notification.id, config);
    // Rate limit: 100ms between sends
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function sendViaProvider(
  config: any,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    switch (config.channel) {
      case "SMS":
        return await sendSMS(config, to, body);
      case "EMAIL":
        return await sendEmail(config, to, subject, body);
      case "WHATSAPP":
        return await sendWhatsApp(config, to, body);
      case "PUSH":
        return await sendPush(config, to, subject, body);
      default:
        return { success: false, error: `Unknown channel: ${config.channel}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendSMS(config: any, to: string, body: string) {
  // Provider-specific SMS sending
  // Supports: MSG91, Twilio, TextLocal, etc.
  switch (config.provider) {
    case "MSG91":
      // MSG91 API integration
      const msg91Response = await fetch(`https://api.msg91.com/api/v5/flow/`, {
        method: "POST",
        headers: { "authkey": config.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: config.senderId,
          route: "4",
          mobiles: to,
          message: body,
        }),
      });
      const msg91Data = await msg91Response.json();
      return { success: msg91Data.type === "success", messageId: msg91Data.request_id };

    case "TWILIO":
      // Twilio SMS
      const twilioAuth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");
      const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.apiKey}/Messages.json`, {
        method: "POST",
        headers: { "Authorization": `Basic ${twilioAuth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: to, From: config.senderId, Body: body }),
      });
      const twilioData = await twilioResponse.json();
      return { success: !twilioData.error_code, messageId: twilioData.sid, error: twilioData.error_message };

    default:
      // Generic HTTP API
      if (config.baseUrl) {
        const response = await fetch(config.baseUrl, {
          method: "POST",
          headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ to, message: body, sender: config.senderId }),
        });
        const data = await response.json();
        return { success: response.ok, messageId: data.id || data.messageId };
      }
      return { success: false, error: "No provider configured" };
  }
}

async function sendEmail(config: any, to: string, subject: string, body: string) {
  switch (config.provider) {
    case "SENDGRID":
      const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: config.senderId },
          subject,
          content: [{ type: "text/html", value: body }],
        }),
      });
      return { success: sgResponse.ok, messageId: sgResponse.headers.get("x-message-id") || undefined };

    case "SMTP":
      // Use nodemailer for SMTP (would need to import)
      return { success: false, error: "SMTP requires nodemailer setup" };

    default:
      if (config.baseUrl) {
        const response = await fetch(config.baseUrl, {
          method: "POST",
          headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ to, subject, html: body, from: config.senderId }),
        });
        return { success: response.ok };
      }
      return { success: false, error: "Email provider not configured" };
  }
}

async function sendWhatsApp(config: any, to: string, body: string) {
  switch (config.provider) {
    case "META":
    case "WHATSAPP_BUSINESS":
      const waResponse = await fetch(`https://graph.facebook.com/v17.0/${config.senderId}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body },
        }),
      });
      const waData = await waResponse.json();
      return { success: !waData.error, messageId: waData.messages?.[0]?.id, error: waData.error?.message };

    case "TWILIO_WHATSAPP":
      const twilioAuth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.apiKey}/Messages.json`, {
        method: "POST",
        headers: { "Authorization": `Basic ${twilioAuth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: `whatsapp:${to}`, From: `whatsapp:${config.senderId}`, Body: body }),
      });
      const data = await response.json();
      return { success: !data.error_code, messageId: data.sid };

    default:
      return { success: false, error: "WhatsApp provider not configured" };
  }
}

async function sendPush(config: any, userId: string, title: string, body: string) {
  // Firebase Cloud Messaging
  if (config.provider === "FIREBASE" || config.provider === "FCM") {
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: { "Authorization": `key=${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        to: userId, // Should be FCM token
        notification: { title, body },
      }),
    });
    const data = await response.json();
    return { success: data.success === 1, messageId: data.multicast_id?.toString() };
  }
  return { success: false, error: "Push provider not configured" };
}

function replaceVariables(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

function calculateNextRunFromTiming(timing: any): Date | undefined {
  if (!timing) return undefined;

  const now = new Date();

  switch (timing.type) {
    case "IMMEDIATE":
      return now;
    case "DELAYED":
      const delay = parseDelay(timing.delay || "1h");
      return new Date(now.getTime() + delay);
    case "RECURRING":
      if (timing.cron) {
        // Simple cron parsing for common patterns
        // Full cron parsing would need a library like cron-parser
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default: next day
      }
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    default:
      return undefined;
  }
}

function parseDelay(delay: string): number {
  const match = delay.match(/^(\d+)(m|h|d)$/);
  if (!match) return 60 * 60 * 1000; // default 1 hour

  const value = parseInt(match[1]);
  switch (match[2]) {
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}
