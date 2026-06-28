import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  webhookHandler,
  initiateRefund,
  getTransactions,
  generatePaymentLink,
  getConfig,
  updateConfig,
  getPaymentStats,
} from "./payment.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

// Webhook (NO auth - called by Razorpay directly)
router.post("/webhook", webhookHandler);

// All other routes need authentication
router.use(authMiddleware);
router.use(resolveTenant);

// Payment operations
router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.post("/refund/:id", initiateRefund);
router.get("/transactions", getTransactions);
router.post("/link", generatePaymentLink);
router.get("/stats", getPaymentStats);

// Configuration (admin only)
router.get("/config", getConfig);
router.put("/config", updateConfig);

export default router;
