import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { createEnrollment, getEnrollments, getEnrollmentCount } from "./enrollment.controller";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";
const router = express.Router();

router.post("/", authMiddleware, resolveTenant, resolveAcademicYear, createEnrollment);
router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getEnrollments);
router.get("/count", authMiddleware, resolveTenant, resolveAcademicYear, getEnrollmentCount);

export default router;
