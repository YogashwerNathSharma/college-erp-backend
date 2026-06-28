import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
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
router.get("/dashboard", authMiddleware, getGatePassDashboard);

// Settings
router.get("/settings", authMiddleware, getGatePassSettings);
router.put("/settings", authMiddleware, updateGatePassSettings);

// CRUD
router.get("/", authMiddleware, getAllGatePasses);
router.post("/", authMiddleware, createGatePass);
router.patch("/:id/status", authMiddleware, updateGatePassStatus);
router.delete("/:id", authMiddleware, deleteGatePass);

export default router;
