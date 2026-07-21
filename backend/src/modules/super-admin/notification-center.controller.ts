// ═══════════════════════════════════════════════════════════
// NOTIFICATION CENTER CONTROLLER
// ═══════════════════════════════════════════════════════════

import { Request, Response } from "express";
import * as notifService from "./notification-center.service";

// GET /api/super-admin/notification-center/notifications
export async function getNotifications(req: Request, res: Response) {
  try {
    const result = await notifService.getNotifications({
      channel: req.query.channel as any,
      status: req.query.status as any,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 25,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/super-admin/notification-center/send
export async function sendNotification(req: Request, res: Response) {
  try {
    const result = await notifService.sendNotification(req.body);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/super-admin/notification-center/stats
export async function getStats(req: Request, res: Response) {
  try {
    const stats = await notifService.getNotificationStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Templates ───────────────────────────────────────────

// GET /api/super-admin/notification-center/templates
export async function getTemplates(req: Request, res: Response) {
  try {
    const templates = await notifService.getTemplates(req.query.channel as any);
    res.json({ success: true, templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/super-admin/notification-center/templates/:id
export async function getTemplateById(req: Request, res: Response) {
  try {
    const template = await notifService.getTemplateById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/super-admin/notification-center/templates
export async function createTemplate(req: Request, res: Response) {
  try {
    const template = await notifService.createTemplate(req.body);
    res.json({ success: true, template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// PUT /api/super-admin/notification-center/templates/:id
export async function updateTemplate(req: Request, res: Response) {
  try {
    const template = await notifService.updateTemplate(req.params.id, req.body);
    res.json({ success: true, template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// DELETE /api/super-admin/notification-center/templates/:id
export async function deleteTemplate(req: Request, res: Response) {
  try {
    await notifService.deleteTemplate(req.params.id);
    res.json({ success: true, message: "Template deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Broadcast ───────────────────────────────────────────

// POST /api/super-admin/notification-center/broadcast
export async function sendBroadcast(req: Request, res: Response) {
  try {
    const result = await notifService.sendBroadcast(req.body);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Scheduled ───────────────────────────────────────────

// GET /api/super-admin/notification-center/scheduled
export async function getScheduled(req: Request, res: Response) {
  try {
    const notifications = await notifService.getScheduledNotifications();
    res.json({ success: true, notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// DELETE /api/super-admin/notification-center/scheduled/:id
export async function cancelScheduled(req: Request, res: Response) {
  try {
    await notifService.cancelScheduledNotification(req.params.id);
    res.json({ success: true, message: "Scheduled notification cancelled" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Analytics ───────────────────────────────────────────

// GET /api/super-admin/notification-center/analytics
export async function getAnalytics(req: Request, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await notifService.getNotificationAnalytics(days);
    res.json({ success: true, analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
