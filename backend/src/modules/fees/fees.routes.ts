
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import feeHeadRoutes from "./feeHead.routes";
import feeStructureRoutes from "./feeStructure.routes";
import feeDiscountRoutes from "./feeDiscount.routes";
import fineRuleRoutes from "./fineRule.routes";
import feeCollectionRoutes from "./feeCollection.routes";

const router = Router();

// All routes are protected
router.use(authMiddleware);

// Sub-module routes
router.use("/heads", feeHeadRoutes);
router.use("/structures", feeStructureRoutes);
router.use("/discounts", feeDiscountRoutes);
router.use("/fine-rules", fineRuleRoutes);
router.use("/collection", feeCollectionRoutes);

export default router;

