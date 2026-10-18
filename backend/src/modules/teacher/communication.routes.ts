

import express from "express";
import { create, getAll, remove } from "./communication.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// CREATE COMMUNICATION
router.post("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, create);

// GET ALL COMMUNICATIONS
router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getAll);

// DELETE COMMUNICATION
router.delete("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, remove);

export default router;

