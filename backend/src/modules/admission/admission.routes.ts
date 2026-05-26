import { Router } from "express";
import { admissionController } from "./admission.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

router.post("/admission", authMiddleware, resolveTenant, admissionController);

export default router;