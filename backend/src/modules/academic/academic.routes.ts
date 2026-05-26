import { Router } from "express";
import { create, getAll, setActive } from "./academic.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

// 🔐 Protected routes
router.post("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, create);

router.get("/", authMiddleware, resolveTenant, getAll);

router.patch(
  "/:id/active",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  setActive
);

export default router;