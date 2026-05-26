import { Router } from "express";
import { makePayment, getPayments } from "./payment.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, makePayment);
router.get("/:studentFeeId", authMiddleware, getPayments);

export default router;