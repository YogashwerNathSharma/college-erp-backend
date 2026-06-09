import { Router } from "express";

import feeStructureRoutes from "./feeStructure/feeStructure.routes";
import paymentRoutes from "./payment/payment.routes";
import studentFeeRoutes from "./studentFee/studentFee.routes";
import receiptRoutes from "./receipt/receipt.routes";

const router = Router();

// 🎯 Fee Structure
router.use("/structures", feeStructureRoutes);

// 💰 Payments
router.use("/payments", paymentRoutes);

// 🎓 Student Fees
router.use("/student-fees", studentFeeRoutes);

// 🧾 Receipts
router.use("/receipts", receiptRoutes);

export default router;