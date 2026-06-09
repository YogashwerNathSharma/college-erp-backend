
import { Router } from "express";
import { feeDiscountController } from "./feeDiscount.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", feeDiscountController.getAll);
router.get("/:id", feeDiscountController.getById);
router.post("/", feeDiscountController.create);
router.put("/:id", feeDiscountController.update);
router.delete("/:id", feeDiscountController.delete);

export default router;

