import express from "express";
import { getReceiptController } from "./receipt.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = express.Router();

// 🔒 GET RECEIPT (protected)
router.get("/:paymentId", authMiddleware, getReceiptController);

export default router;