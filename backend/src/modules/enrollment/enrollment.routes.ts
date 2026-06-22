import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { createEnrollment, getEnrollments, getEnrollmentCount } from "./enrollment.controller";
import { resolveTenant } from "../../middleware/tenant.middleware";
const router = express.Router();

router.post("/", authMiddleware, resolveTenant, createEnrollment);
router.get("/", authMiddleware, resolveTenant, getEnrollments);
router.get("/count", authMiddleware, resolveTenant, getEnrollmentCount);

export default router;
