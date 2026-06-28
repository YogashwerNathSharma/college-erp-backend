import { Router } from "express";
import {
  sendNotification,
  sendBulkNotification,
  getQueue,
  retryFailed,
  cancelQueued,
  getLogs,
  getInAppNotifications,
  markAsRead,
  dismissNotification,
  createInAppNotification,
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
  getChannelConfigs,
  upsertChannelConfig,
  testChannel,
  getDashboardStats,
} from "./notification.controller";

import { authMiddleware } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Auth + Tenant middleware
router.use(authMiddleware);
router.use(resolveTenant);


// Dashboard
router.get("/dashboard", getDashboardStats);

// Send
router.post("/send", sendNotification);
router.post("/bulk", sendBulkNotification);

// Queue management
router.get("/queue", getQueue);
router.post("/queue/:id/retry", retryFailed);
router.post("/queue/:id/cancel", cancelQueued);

// Logs
router.get("/logs", getLogs);

// In-App Notifications
router.get("/in-app", getInAppNotifications);
router.post("/in-app", createInAppNotification);
router.put("/in-app/:id/read", markAsRead);
router.put("/in-app/:id/dismiss", dismissNotification);

// Schedules
router.post("/schedules", createSchedule);
router.get("/schedules", getSchedules);
router.put("/schedules/:id", updateSchedule);
router.delete("/schedules/:id", deleteSchedule);

// Channel Configuration
router.get("/config", getChannelConfigs);
router.put("/config/:channel", upsertChannelConfig);
router.post("/config/:channel/test", testChannel);

export default router;
