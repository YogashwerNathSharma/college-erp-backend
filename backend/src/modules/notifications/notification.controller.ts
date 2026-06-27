import { Request, Response } from "express";
import * as notifService from "./notification.service";

// ============================================
// PUSH NOTIFICATIONS
// ============================================

export const sendPushNotificationHandler = async (req: any, res: Response) => {
  try {
    const result = await notifService.sendPushNotification(req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const sendBulkPushHandler = async (req: any, res: Response) => {
  try {
    const result = await notifService.sendBulkPush(req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const sendTopicNotificationHandler = async (req: any, res: Response) => {
  try {
    const result = await notifService.sendTopicNotification(req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// IN-APP NOTIFICATIONS
// ============================================

export const getUserNotificationsHandler = async (req: any, res: Response) => {
  try {
    const { page, limit, isRead } = req.query;
    const result = await notifService.getUserNotifications(req.user?.userId, req.tenantId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      isRead: isRead === "true" ? true : isRead === "false" ? false : undefined,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const markNotificationReadHandler = async (req: any, res: Response) => {
  try {
    const result = await notifService.markAsRead(req.params.id, req.user?.userId, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const markAllReadHandler = async (req: any, res: Response) => {
  try {
    const result = await notifService.markAllAsRead(req.user?.userId, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getUnreadCountHandler = async (req: any, res: Response) => {
  try {
    const count = await notifService.getUnreadCount(req.user?.userId, req.tenantId);
    res.json({ success: true, data: { count } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// DEVICE TOKEN MANAGEMENT
// ============================================

export const registerDeviceTokenHandler = async (req: any, res: Response) => {
  try {
    const result = await notifService.registerDeviceToken(req.body, req.user?.userId, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const removeDeviceTokenHandler = async (req: any, res: Response) => {
  try {
    await notifService.removeDeviceToken(req.params.token, req.user?.userId, req.tenantId);
    res.json({ success: true, message: "Device token removed" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export const getNotificationPreferencesHandler = async (req: any, res: Response) => {
  try {
    const result = await notifService.getNotificationPreferences(req.user?.userId, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateNotificationPreferencesHandler = async (req: any, res: Response) => {
  try {
    const result = await notifService.updateNotificationPreferences(req.body, req.user?.userId, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
