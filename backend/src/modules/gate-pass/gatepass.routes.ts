import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import {
  getGatePassDashboard,
  getAllGatePasses,
  createGatePass,
  updateGatePassStatus,
  deleteGatePass,
  getGatePassSettings,
  updateGatePassSettings,
} from "./gatepass.controller";

const router = express.Router();

// Dashboard
router.get("/dashboard", authMiddleware, resolveTenant, getGatePassDashboard);

// Settings
router.get("/settings", authMiddleware, resolveTenant, getGatePassSettings);
router.put("/settings", authMiddleware, resolveTenant, updateGatePassSettings);

// CRUD
router.get("/", authMiddleware, resolveTenant, getAllGatePasses);
router.post("/", authMiddleware, resolveTenant, createGatePass);
router.patch("/:id/status", authMiddleware, resolveTenant, updateGatePassStatus);
router.delete("/:id", authMiddleware, resolveTenant, deleteGatePass);

export default router;
