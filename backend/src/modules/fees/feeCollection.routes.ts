
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
} from "./feeCollection.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST routes
router.post("/assign/student", assignFeesToStudentController);
router.post("/assign/class", assignFeesToClassController);
router.post("/collect", collectPaymentController);
router.post("/discount", applyDiscountController);

// GET static routes (BEFORE dynamic /:id)
router.get("/search", searchStudentFeesController);
router.get("/defaulters", getDefaultersController);
router.get("/daily-collection", getDailyCollectionController);

// GET dynamic routes
router.get("/student/:enrollmentId", getStudentFeesController);

export default router;

