// studentFee.routes.ts

import express from "express";
import { assignStudentFee, getStudentFees } from "./studentFee.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { resolveTenant } from "../../../middleware/tenant.middleware";
const router = express.Router();

router.post("/assign", authMiddleware, resolveTenant, assignStudentFee);
router.get("/:studentId", authMiddleware, resolveTenant, getStudentFees);

export default router;