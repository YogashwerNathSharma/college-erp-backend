import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  sendPushNotificationHandler,
  sendBulkPushHandler,
  sendTopicNotificationHandler,
  getUserNotificationsHandler,
  markNotificationReadHandler,
  markAllReadHandler,
  getUnreadCountHandler,
  registerDeviceTokenHandler,
  removeDeviceTokenHandler,
  getNotificationPreferencesHandler,
  updateNotificationPreferencesHandler,
} from "./notification.controller";

const router = Router();

router.use(authMiddleware, resolveTenant);

// ============================================
// IN-APP NOTIFICATIONS
// ============================================
router.get("/", getUserNotificationsHandler);
router.get("/unread-count", getUnreadCountHandler);
router.patch("/:id/read", markNotificationReadHandler);
router.patch("/read-all", markAllReadHandler);

// ============================================
// PUSH NOTIFICATIONS (Admin only)
// ============================================
router.post("/push/send", allowRoles("ADMIN"), sendPushNotificationHandler);
router.post("/push/bulk", allowRoles("ADMIN"), sendBulkPushHandler);
router.post("/push/topic", allowRoles("ADMIN"), sendTopicNotificationHandler);

// ============================================
// DEVICE TOKENS
// ============================================
router.post("/device-token", registerDeviceTokenHandler);
router.delete("/device-token/:token", removeDeviceTokenHandler);

// ============================================
// PREFERENCES
// ============================================
router.get("/preferences", getNotificationPreferencesHandler);
router.put("/preferences", updateNotificationPreferencesHandler);

export default router;
