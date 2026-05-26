import express from "express";
import { create, getAll } from "./teacher.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN"), // 🔥 recommended
  resolveTenant, // 🔥 MUST
  create
);

router.get(
  "/",
  authMiddleware,
  resolveTenant, // 🔥 MUST
  getAll
);

export default router;