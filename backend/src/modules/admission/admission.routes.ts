import { Router } from "express";
import { admissionController } from "./admission.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

const router = Router();

// POST /api/admission → creates new admission
router.post("/", authMiddleware, resolveTenant, resolveAcademicYear, admissionController);

export default router;
