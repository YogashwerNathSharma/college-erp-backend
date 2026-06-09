
import { Router } from "express";
import feeStructureController from "./feeStructure.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Static routes MUST come before /:id
router.get("/by-class/:classId", feeStructureController.getByClass);

// CRUD routes
router.get("/", feeStructureController.getAll);
router.post("/", feeStructureController.create);
router.get("/:id", feeStructureController.getById);
router.put("/:id", feeStructureController.update);
router.delete("/:id", feeStructureController.softDelete);

export default router;

