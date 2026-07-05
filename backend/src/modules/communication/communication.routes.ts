import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  createNoticeHandler,
  getAllNoticesHandler,
  getNoticeByIdHandler,
  updateNoticeHandler,
  deleteNoticeHandler,
  sendSmsHandler,
  sendWhatsAppHandler,
  sendEmailHandler,
  getCommunicationLogsHandler,
} from "./communication.controller";

const router = Router();

const noticeUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware, resolveTenant);

// ============================================
// NOTICE ROUTES
// ============================================
router.get("/notices", getAllNoticesHandler);
router.get("/notices/:id", getNoticeByIdHandler);
router.post("/notices", allowRoles("ADMIN", "TEACHER"), noticeUpload.single("attachment"), createNoticeHandler);
router.put("/notices/:id", allowRoles("ADMIN", "TEACHER"), noticeUpload.single("attachment"), updateNoticeHandler);
router.delete("/notices/:id", allowRoles("ADMIN"), deleteNoticeHandler);

// ============================================
// SMS ROUTES
// ============================================
router.post("/sms/send", allowRoles("ADMIN"), sendSmsHandler);

// ============================================
// WHATSAPP ROUTES
// ============================================
router.post("/whatsapp/send", allowRoles("ADMIN"), sendWhatsAppHandler);

// ============================================
// EMAIL ROUTES
// ============================================
router.post("/email/send", allowRoles("ADMIN"), sendEmailHandler);

// ============================================
// COMMUNICATION LOGS
// ============================================
router.get("/logs", allowRoles("ADMIN"), getCommunicationLogsHandler);

export default router;
