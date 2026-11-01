/**
 * 👨👩👧 Parent Portal — Routes
 *
 * All routes are protected by authMiddleware.
 * POST /register is open to any authenticated user (for initial linking).
 * All other routes require PARENT role.
 */

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import * as parentController from "./parent.controller";

const router = Router();

// ─── Public (auth required, but any role can register as parent) ───
router.post("/register", parentController.register);

// ─── Protected: PARENT + ADMIN (admin can view parent data too) ───
router.get(
  "/my-children",
  allowRoles("PARENT", "ADMIN"),
  parentController.getMyChildren
);

router.get(
  "/notices",
  allowRoles("PARENT", "ADMIN"),
  parentController.getNotices
);

router.get(
  "/profile",
  allowRoles("PARENT"),
  parentController.getProfile
);

router.put(
  "/profile",
  allowRoles("PARENT"),
  parentController.updateProfile
);

// ─── Child-specific routes (must come after static routes) ───
router.get(
  "/child/:studentId/attendance",
  allowRoles("PARENT", "ADMIN"),
  parentController.getChildAttendance
);

router.get(
  "/child/:studentId/results",
  allowRoles("PARENT", "ADMIN"),
  parentController.getChildResults
);

router.get(
  "/child/:studentId/fees",
  allowRoles("PARENT", "ADMIN"),
  parentController.getChildFees
);

export default router;
