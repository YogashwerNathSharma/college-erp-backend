import { Router } from "express";
import { admissionController } from "./admission.controller";
import { authMiddleware } from "../../middleware/auth.middleware";


const router = Router();
router.post("/admission", authMiddleware, admissionController);

export default router;