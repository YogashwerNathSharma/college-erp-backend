import prisma from "../../config/prisma";
import { sendFCMNotification, sendFCMToTopic, sendFCMMulticast } from "./helpers/fcm.helper";

// ============================================
// PUSH NOTIFICATIONS
// ============================================

export const sendPushNotification = async (data: any, tenantId: string) => {
  const { userId, title, body, data: notifData, imageUrl } = data;

  // Get user device tokens
  const tokens = await prisma.deviceToken.findMany({
    where: { userId, tenantId, isActive: true },
  });

  if (tokens.length === 0) {
    throw new Error("No registered device tokens for this user");
  }

  const fcmTokens = tokens.map((t: any) => t.token);
  const result = await sendFCMMulticast(fcmTokens, { title, body, data: notifData, imageUrl });

  // Store in-app notification
  await prisma.notification.create({
    data: {
      userId,
      tenantId,
      title,
      body,
      type: notifData?.type || "GENERAL",
      data: notifData || {},
      isRead: false,
    },
  });

  return result;
};

export const sendBulkPush = async (data: any, tenantId: string) => {
  const { userIds, title, body, data: notifData, imageUrl } = data;

  // Get all device tokens for these users
  const tokens = await prisma.deviceToken.findMany({
    where: { userId: { in: userIds }, tenantId, isActive: true },
  });

  if (tokens.length === 0) {
    throw new Error("No registered device tokens found");
  }

  const fcmTokens = tokens.map((t: any) => t.token);
  const result = await sendFCMMulticast(fcmTokens, { title, body, data: notifData, imageUrl });

  // Store in-app notifications for all users
  await prisma.notification.createMany({
    data: userIds.map((userId: string) => ({
      userId,
      tenantId,
      title,
      body,
      type: notifData?.type || "GENERAL",
      data: notifData || {},
      isRead: false,
    })),
  });

  return result;
};

export const sendTopicNotification = async (data: any, tenantId: string) => {
  const { topic, title, body, data: notifData, imageUrl } = data;

  // FCM topic format: tenantId_topic
  const fcmTopic = `${tenantId}_${topic}`;
  const result = await sendFCMToTopic(fcmTopic, { title, body, data: notifData, imageUrl });

  return result;
};

// ============================================
// IN-APP NOTIFICATIONS
// ============================================

export const getUserNotifications = async (userId: string, tenantId: string, filters?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { userId, tenantId };
  if (filters?.isRead !== undefined) where.isRead = filters.isRead;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const markAsRead = async (id: string, userId: string, tenantId: string) => {
  return prisma.notification.update({
    where: { id, userId, tenantId },
    data: { isRead: true, readAt: new Date() },
  });
};

export const markAllAsRead = async (userId: string, tenantId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, tenantId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { updated: result.count };
};

export const getUnreadCount = async (userId: string, tenantId: string) => {
  return prisma.notification.count({
    where: { userId, tenantId, isRead: false },
  });
};

// ============================================
// DEVICE TOKEN MANAGEMENT
// ============================================

export const registerDeviceToken = async (data: any, userId: string, tenantId: string) => {
  const { token, platform, deviceInfo } = data;

  // Upsert — update if exists, create if new
  const existing = await prisma.deviceToken.findFirst({
    where: { token, userId, tenantId },
  });

  if (existing) {
    return prisma.deviceToken.update({
      where: { id: existing.id },
      data: { isActive: true, platform, deviceInfo, updatedAt: new Date() },
    });
  }

  return prisma.deviceToken.create({
    data: { token, userId, tenantId, platform, deviceInfo, isActive: true },
  });
};

export const removeDeviceToken = async (token: string, userId: string, tenantId: string) => {
  await prisma.deviceToken.updateMany({
    where: { token, userId, tenantId },
    data: { isActive: false },
  });
};

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export const getNotificationPreferences = async (userId: string, tenantId: string) => {
  const prefs = await prisma.notificationPreference.findFirst({
    where: { userId, tenantId },
  });

  return prefs || getDefaultPreferences();
};

export const updateNotificationPreferences = async (data: any, userId: string, tenantId: string) => {
  const existing = await prisma.notificationPreference.findFirst({
    where: { userId, tenantId },
  });

  if (existing) {
    return prisma.notificationPreference.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.notificationPreference.create({
    data: { ...data, userId, tenantId },
  });
};

const getDefaultPreferences = () => ({
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  feeReminders: true,
  attendanceAlerts: true,
  examNotifications: true,
  generalAnnouncements: true,
  quietHoursStart: null,
  quietHoursEnd: null,
});
