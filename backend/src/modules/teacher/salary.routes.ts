

import express from "express";
import { create, getAll, slip, update } from "./salary.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// CREATE SALARY RECORD
router.post("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, create);

// GET ALL SALARIES
router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getAll);

// GET PAYSLIP
router.get("/:teacherId/slip", authMiddleware, resolveTenant, resolveAcademicYear, slip);

// UPDATE SALARY
router.put("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, update);

export default router;

