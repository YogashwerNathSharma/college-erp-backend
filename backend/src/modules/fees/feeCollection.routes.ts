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
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

// All fee routes require both authentication and an authoritative tenant context.
router.use(authMiddleware);
router.use(resolveTenant);

// POST routes
router.post("/assign/student", assignFeesToStudentController);
router.post("/assign/class", assignFeesToClassController);
router.post("/collect", collectPaymentController);
router.post("/discount", applyDiscountController);

// GET static routes (BEFORE dynamic /:id)
router.get("/search", searchStudentFeesController);
router.get("/defaulters", getDefaultersController);
router.get("/daily-collection", getDailyCollectionController);
router.get("/all-payments", getAllPaymentsController);

// GET dynamic routes
router.get("/student/:enrollmentId", getStudentFeesController);

export default router;
