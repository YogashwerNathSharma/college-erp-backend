// ══════════════════════════════════════════════════════════════════════════════
// STUDENT COMMUNICATION ROUTES — SMS, Email, WhatsApp
// Mount at: app.use("/api/students/communication", studentCommunicationRoutes)
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Response } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  sendSMS, sendEmail, sendWhatsApp,
  bulkSMS, bulkEmail, bulkWhatsApp,
  sendBirthdayWishes, sendFeeReminder,
  getCommunicationLog,
} from "./student-communication.service";

const router = Router();
router.use(authMiddleware, resolveTenant);

// ── Send SMS to Student/Parent ───────────────────────────────────────────────
router.post("/:id/send-sms", async (req: any, res: Response) => {
  try {
    const { message, to } = req.body;
    if (!message || !to) {
      return res.status(400).json({ success: false, message: "Message and phone number are required" });
    }
    const result = await sendSMS(req.tenantId, req.params.id, message, to, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Send Email ───────────────────────────────────────────────────────────────
router.post("/:id/send-email", async (req: any, res: Response) => {
  try {
    const { subject, body, to } = req.body;
    if (!subject || !body || !to) {
      return res.status(400).json({ success: false, message: "Subject, body, and email address are required" });
    }
    const result = await sendEmail(req.tenantId, req.params.id, subject, body, to, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Send WhatsApp ────────────────────────────────────────────────────────────
router.post("/:id/send-whatsapp", async (req: any, res: Response) => {
  try {
    const { message, to } = req.body;
    if (!message || !to) {
      return res.status(400).json({ success: false, message: "Message and phone number are required" });
    }
    const result = await sendWhatsApp(req.tenantId, req.params.id, message, to, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Bulk SMS ─────────────────────────────────────────────────────────────────
router.post("/bulk-sms", allowRoles("ADMIN"), async (req: any, res: Response) => {
  try {
    const { studentIds, message, recipientType } = req.body;
    if (!studentIds?.length || !message) {
      return res.status(400).json({ success: false, message: "studentIds and message are required" });
    }
    const result = await bulkSMS(req.tenantId, studentIds, message, req.user.userId, recipientType);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Bulk Email ───────────────────────────────────────────────────────────────
router.post("/bulk-email", allowRoles("ADMIN"), async (req: any, res: Response) => {
  try {
    const { studentIds, subject, body, recipientType } = req.body;
    if (!studentIds?.length || !subject || !body) {
      return res.status(400).json({ success: false, message: "studentIds, subject, and body are required" });
    }
    const result = await bulkEmail(req.tenantId, studentIds, subject, body, req.user.userId, recipientType);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Bulk WhatsApp ────────────────────────────────────────────────────────────
router.post("/bulk-whatsapp", allowRoles("ADMIN"), async (req: any, res: Response) => {
  try {
    const { studentIds, message, recipientType } = req.body;
    if (!studentIds?.length || !message) {
      return res.status(400).json({ success: false, message: "studentIds and message are required" });
    }
    const result = await bulkWhatsApp(req.tenantId, studentIds, message, req.user.userId, recipientType);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Send Birthday Wishes ─────────────────────────────────────────────────────
router.post("/birthday-wishes", allowRoles("ADMIN"), async (req: any, res: Response) => {
  try {
    const result = await sendBirthdayWishes(req.tenantId, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Send Fee Reminder ────────────────────────────────────────────────────────
router.post("/fee-reminder", allowRoles("ADMIN"), async (req: any, res: Response) => {
  try {
    const { studentIds } = req.body;
    if (!studentIds?.length) {
      return res.status(400).json({ success: false, message: "studentIds are required" });
    }
    const result = await sendFeeReminder(req.tenantId, studentIds, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Communication Log ────────────────────────────────────────────────────────
router.get("/:id/log", async (req: any, res: Response) => {
  try {
    const { type, status, limit } = req.query;
    const data = await getCommunicationLog(req.tenantId, req.params.id, {
      type: type as string,
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
