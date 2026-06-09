
import { Router } from "express";
import { feeHeadController } from "./feeHead.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

// GET /api/fees/heads - Get all fee heads
router.get("/", feeHeadController.getAll);

// GET /api/fees/heads/:id - Get fee head by ID
router.get("/:id", feeHeadController.getById);

// POST /api/fees/heads - Create a new fee head
router.post("/", feeHeadController.create);

// PUT /api/fees/heads/:id - Update a fee head
router.put("/:id", feeHeadController.update);

// DELETE /api/fees/heads/:id - Soft delete a fee head
router.delete("/:id", feeHeadController.softDelete);

export default router;

