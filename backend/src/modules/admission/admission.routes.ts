import { Router } from "express";
import { admissionController } from "./admission.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

// POST /api/admission → creates new admission
router.post("/", authMiddleware, resolveTenant, admissionController);

export default router;
