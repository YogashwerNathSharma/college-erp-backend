
import { Router } from "express";
import {
  createClass,
  getClasses,
  getDeletedClasses,
  updateClass,
  toggleClassStatus,
  softDeleteClass,
  restoreClass,
} from "./class.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

// ─── Static routes FIRST ─────────────────────────────────────────────────────

// Recycle bin
router.get(
  "/recycle-bin",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  getDeletedClasses
);

// ─── CRUD routes ─────────────────────────────────────────────────────────────

// Create
router.post("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, createClass);

// Get All (non-deleted)
router.get("/", authMiddleware, resolveTenant, getClasses);

// ─── Dynamic :id routes AFTER static ────────────────────────────────────────

// Update
router.put("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, updateClass);

// Toggle active/inactive
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  toggleClassStatus
);

// Soft delete
router.delete("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, softDeleteClass);

// Restore
router.patch(
  "/:id/restore",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  restoreClass
);

export default router;
