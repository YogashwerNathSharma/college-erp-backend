
import { Router } from "express";
import {
  create,
  getAll,
  getDeleted,
  setActive,
  toggleStatus,
  softDelete,
  restore,
  update,
} from "./academic.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

// ─── Static routes FIRST ─────────────────────────────────────────────────────

// Get deleted (recycle bin)
router.get(
  "/recycle-bin",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  getDeleted
);

// ─── CRUD routes ─────────────────────────────────────────────────────────────

// Create
router.post("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, create);

// Get All (non-deleted)
router.get("/", authMiddleware, resolveTenant, getAll);

// ─── Dynamic :id routes AFTER static ────────────────────────────────────────

// Update
router.put("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, update);

// Set as active year (only one active at a time)
router.patch(
  "/:id/active",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  setActive
);

// Toggle active/inactive status
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  toggleStatus
);

// Soft delete (move to recycle bin)
router.delete(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  softDelete
);

// Restore from recycle bin
router.patch(
  "/:id/restore",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  restore
);

export default router;
