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
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

// Webhook (NO auth - called by Razorpay directly)
router.post("/webhook", webhookHandler);

// All other routes need authentication
router.use(authMiddleware);
router.use(resolveTenant);

// Payment operations
router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.post("/refund/:id", allowRoles("ADMIN", "SUPER_ADMIN"), initiateRefund);
router.get("/transactions", getTransactions);
router.post("/link", generatePaymentLink);
router.get("/stats", getPaymentStats);

// Gateway configuration is sensitive: only tenant admins / super admins.
router.get("/config", allowRoles("ADMIN", "SUPER_ADMIN"), getConfig);
router.put("/config", allowRoles("ADMIN", "SUPER_ADMIN"), updateConfig);

export default router;
