// feeStructure.routes.ts

import express from "express";
import { createFeeStructure, getFeeStructures } from "./feeStructure.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = express.Router();

router.post("/", authMiddleware, createFeeStructure);
router.get("/", authMiddleware, getFeeStructures);

export default router;