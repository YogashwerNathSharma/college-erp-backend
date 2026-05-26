import express from "express";
import {
  getSuperAdminDashboard,
  getTenantsList,
} from "./superAdmin.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// 📊 Dashboard
router.get(
  "/dashboard",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  getSuperAdminDashboard
);

// 🏫 Tenants List
router.get(
  "/tenants",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  getTenantsList
);

export default router;