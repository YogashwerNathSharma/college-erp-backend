

import express from "express";
import { get, update } from "./settings.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// GET SETTINGS
router.get("/", authMiddleware, resolveTenant, get);

// UPDATE SETTINGS
router.put("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, update);

export default router;

