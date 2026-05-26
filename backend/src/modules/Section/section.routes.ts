import { Router } from "express";
import { createSection } from "./section.controller";
import { allowRoles } from "../../middleware/role.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

// 🔐 Section
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"), // 🔥 optional upgrade
  resolveTenant, // 🔥 MUST
  createSection
);

export default router;