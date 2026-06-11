

import express from "express";
import { apply, getAll, stats, approve, remove } from "./leave.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// APPLY LEAVE
router.post("/", authMiddleware, resolveTenant, apply);

// GET ALL LEAVES
router.get("/", authMiddleware, resolveTenant, getAll);

// GET LEAVE STATS
router.get("/stats", authMiddleware, resolveTenant, stats);

// APPROVE / REJECT LEAVE
router.put("/:id/approve", authMiddleware, allowRoles("ADMIN"), resolveTenant, approve);

// CANCEL / DELETE LEAVE
router.delete("/:id", authMiddleware, resolveTenant, remove);

export default router;

