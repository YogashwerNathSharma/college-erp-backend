
// Backup Routes
// Data backup management for tenants
// ADMIN + SUPER_ADMIN access only

import { Router } from "express";
import {
  listBackups,
  createBackup,
  downloadBackup,
  deleteBackup,
  getBackupSettings,
  updateBackupSettings,
} from "./backup.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

// All routes require auth + tenant + admin role
router.use(authMiddleware, resolveTenant, allowRoles("ADMIN", "SUPER_ADMIN"));

// ============================================================
// BACKUP ROUTES
// ============================================================

// GET /api/backup - List all backups for the tenant
router.get("/", listBackups);

// POST /api/backup/create - Trigger a manual backup
router.post("/create", createBackup);

// GET /api/backup/settings - Get backup schedule settings
router.get("/settings", getBackupSettings);

// PUT /api/backup/settings - Update backup schedule settings
router.put("/settings", updateBackupSettings);

// GET /api/backup/download/:id - Download a specific backup
router.get("/download/:id", downloadBackup);

// DELETE /api/backup/:id - Delete a specific backup
router.delete("/:id", deleteBackup);

export default router;
