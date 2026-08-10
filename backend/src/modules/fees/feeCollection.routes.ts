import { Router } from "express";
import {
  assignFeesToStudentController,
  assignFeesToClassController,
  getStudentFeesController,
  searchStudentFeesController,
  collectPaymentController,
  applyDiscountController,
  getDefaultersController,
  getDailyCollectionController,
  getAllPaymentsController,
} from "./feeCollection.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();
router.use(authMiddleware);

// Fee assignment/discount changes are administrative operations.
const feeAdmin = allowRoles("ADMIN", "SUPER_ADMIN");
// Collection may be performed by designated accounting staff.
const feeCollector = allowRoles("ADMIN", "SUPER_ADMIN", "ACCOUNTANT");

router.post("/assign/student", feeAdmin, assignFeesToStudentController);
router.post("/assign/class", feeAdmin, assignFeesToClassController);
router.post("/collect", feeCollector, collectPaymentController);
router.post("/discount", feeAdmin, applyDiscountController);

router.get("/search", searchStudentFeesController);
router.get("/defaulters", getDefaultersController);
router.get("/daily-collection", getDailyCollectionController);
router.get("/all-payments", getAllPaymentsController);
router.get("/student/:enrollmentId", getStudentFeesController);

export default router;
