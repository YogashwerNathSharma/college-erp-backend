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
import { validatePaymentTenantReferences } from "../../middleware/payment-tenant-reference.middleware";

const router = Router();

// Webhook (NO auth - called by Razorpay directly)
router.post("/webhook", webhookHandler);

// All other routes need authentication
router.use(authMiddleware);
router.use(resolveTenant);

// Payment operations
router.post("/create-order", validatePaymentTenantReferences, createOrder);
router.post("/verify", verifyPayment);
router.post("/refund/:id", allowRoles("ADMIN", "SUPER_ADMIN"), initiateRefund);
router.get("/transactions", getTransactions);
router.post("/link", validatePaymentTenantReferences, generatePaymentLink);
router.get("/stats", getPaymentStats);

// Configuration (admin only)
router.get("/config", allowRoles("ADMIN", "SUPER_ADMIN"), getConfig);
router.put("/config", allowRoles("ADMIN", "SUPER_ADMIN"), updateConfig);

export default router;
