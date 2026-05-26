// studentFee.routes.ts

import express from "express";
import { assignStudentFee, getStudentFees } from "./studentFee.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = express.Router();

router.post("/assign", authMiddleware, assignStudentFee);
router.get("/:studentId", authMiddleware, getStudentFees);

export default router;