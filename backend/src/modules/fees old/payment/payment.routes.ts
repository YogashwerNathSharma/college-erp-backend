import { Router } from "express";
import { makePayment, getPayments } from "./payment.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { resolveTenant } from "../../../middleware/tenant.middleware";
import { allowRoles } from "../../../middleware/role.middleware";

const router = Router();

// 💰 Make Payment (ADMIN / SUPER_ADMIN / ACCOUNTANT)
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  resolveTenant,
  makePayment
);

// 📄 Get Payments
router.get(
  "/:studentFeeId",
  authMiddleware,
  resolveTenant,
  getPayments
);

export default router;