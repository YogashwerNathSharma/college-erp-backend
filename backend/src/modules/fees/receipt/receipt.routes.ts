import express from "express";
import { getReceiptController } from "./receipt.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { resolveTenant } from "../../../middleware/tenant.middleware";
import { allowRoles } from "../../../middleware/role.middleware";

const router = express.Router();

// 🔒 GET RECEIPT
router.get(
  "/:paymentId",
  authMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"), // 🔥 optional but recommended
  resolveTenant,
  getReceiptController
);

export default router;