import { Router } from "express";
import { createSubject, getSubjects } from "./subject.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware"; // 🔥 ADD

const router = Router();

// 🔐 Protected
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant, // 🔥 MUST
  createSubject
);

router.get(
  "/",
  authMiddleware,
  resolveTenant, // 🔥 MUST
  getSubjects
);

export default router;