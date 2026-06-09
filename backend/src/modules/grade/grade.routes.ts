
// ═══════════════════════════════════════════════════════
// grade.routes.ts — Grade Settings Routes
// ═══════════════════════════════════════════════════════

import express from "express";
import {
  createGrade,
  bulkSetGrades,
  getGrades,
  deleteGrade,
} from "./grade.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// Get all grades for tenant
router.get(
  "/",
  authMiddleware,
  getGrades
);

// Create single grade
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  createGrade
);

// Bulk set grades (replace all)
router.post(
  "/bulk",
  authMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  bulkSetGrades
);

// Delete grade
router.delete(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  deleteGrade
);

export default router;

