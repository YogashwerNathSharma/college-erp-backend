import { Router } from "express";

import feeStructureRoutes from "./feeStructure/feeStructure.routes";
import paymentRoutes from "./payment/payment.routes";
import studentFeeRoutes from "./studentFee/studentFee.routes"; // ✅ ADD
import receiptRoutes from "./receipt/receipt.routes";
const router = Router();

router.use("/structure", feeStructureRoutes);
router.use("/payment", paymentRoutes);
router.use("/studentfee", studentFeeRoutes); // ✅ FIX
router.use("/receipt", receiptRoutes);
export default router;