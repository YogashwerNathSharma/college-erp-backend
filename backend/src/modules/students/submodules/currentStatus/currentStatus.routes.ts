import express from "express";
import { getCurrent } from "./currentStatus.controller";
import { authMiddleware } from "../../../../middleware/auth.middleware";
import { resolveTenant } from "../../../../middleware/tenant.middleware";

const router = express.Router();

router.get(
  "/:studentId/current",
  authMiddleware,
  resolveTenant, // 🔥 MUST
  getCurrent
);

export default router;