

import express from "express";
import { create, getByTeacher, getAll } from "./performance.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// CREATE / UPDATE PERFORMANCE
router.post("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, create);

// GET ALL PERFORMANCES
router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getAll);

// GET BY TEACHER
router.get("/:teacherId", authMiddleware, resolveTenant, resolveAcademicYear, getByTeacher);

export default router;

