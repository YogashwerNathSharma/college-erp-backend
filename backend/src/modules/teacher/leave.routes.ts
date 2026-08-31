

import express from "express";
import { apply, getAll, stats, approve, remove } from "./leave.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// APPLY LEAVE
router.post("/", authMiddleware, resolveTenant, resolveAcademicYear, apply);

// GET ALL LEAVES
router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getAll);

// GET LEAVE STATS
router.get("/stats", authMiddleware, resolveTenant, resolveAcademicYear, stats);

// APPROVE / REJECT LEAVE
router.put("/:id/approve", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, approve);

// CANCEL / DELETE LEAVE
router.delete("/:id", authMiddleware, resolveTenant, resolveAcademicYear, remove);

export default router;

