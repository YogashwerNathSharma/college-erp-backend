import express from "express";
import {
  createFeeStructure,
  getFeeStructures,
} from "./feeStructure.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { resolveTenant } from "../../../middleware/tenant.middleware";
import { allowRoles } from "../../../middleware/role.middleware";

const router = express.Router();

// 🎯 Create Fee Structure (only ADMIN / SUPER_ADMIN)
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  resolveTenant,
  createFeeStructure
);

// 🎯 Get Fee Structures (all authenticated users)
router.get(
  "/",
  authMiddleware,
  resolveTenant,
  getFeeStructures
);

export default router;