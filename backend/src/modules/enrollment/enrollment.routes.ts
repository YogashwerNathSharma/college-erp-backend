import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { createEnrollment, getEnrollments } from "./enrollment.controller";
import { resolveTenant } from "../../middleware/tenant.middleware";
const router = express.Router();

router.post("/", authMiddleware, resolveTenant, createEnrollment);
router.get("/", authMiddleware, resolveTenant, getEnrollments);

export default router;