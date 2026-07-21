import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  getDatabaseHealth,
  getSlowQueries,
  getIndexes,
  getOptimizations,
  getBackups,
  createBackup,
  getMigrations,
  getQueryStats,
} from "./database.controller";

const router = Router();

// All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

// Health
router.get("/health", getDatabaseHealth);

// Slow Queries
router.get("/slow-queries", getSlowQueries);

// Indexes
router.get("/indexes", getIndexes);

// Optimizations
router.get("/optimizations", getOptimizations);

// Backups
router.get("/backups", getBackups);
router.post("/backups", createBackup);

// Migrations
router.get("/migrations", getMigrations);

// Query Stats
router.get("/query-stats", getQueryStats);

export default router;
