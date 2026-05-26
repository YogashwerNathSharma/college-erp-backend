import { Router } from "express";
import { createSection } from "./section.controller";
import { allowRoles } from "../../middleware/role.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router(); // ✅ THIS IS IMPORTANT
// 🔐 Section
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN"),
  createSection
);

export default router;