import express from "express";
import { getDashboard } from "./dashboard.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

const router = express.Router();

router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getDashboard);

export default router;
