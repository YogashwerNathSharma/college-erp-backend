import express from "express";
import { promote } from "./promotion.controller";
import { authMiddleware } from "../../../../middleware/auth.middleware";
import { resolveTenant } from "../../../../middleware/tenant.middleware";
import { allowRoles } from "../../../../middleware/role.middleware";

const router = express.Router();

router.post(
  "/promote",
  authMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"), // 🔥 recommended
  resolveTenant, // 🔥 MUST
  promote
);

export default router;