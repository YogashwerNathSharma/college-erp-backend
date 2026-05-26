import express from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { resolveTenant } from "../../../middleware/tenant.middleware";
import { getDefaultersController } from "./defaulters.controller";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  resolveTenant, // 🔥 MUST
  getDefaultersController
);

export default router;