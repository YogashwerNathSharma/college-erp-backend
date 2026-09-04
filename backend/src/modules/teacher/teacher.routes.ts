import express from "express";
import { create, getAll, getById, update, partialUpdate, remove, upload, dashboard } from "./teacher.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { checkLimit } from "../../middleware/subscriptionLimit.middleware";

const router = express.Router();

// DASHBOARD (must be before /:id to avoid matching "dashboard" as an id)
router.get("/dashboard", authMiddleware, resolveTenant, resolveAcademicYear, dashboard);

// CREATE (with photo upload)
// multer must run before resolveAcademicYear so multipart academicYearId is
// available to the academic-year middleware. This keeps the selected year
// authoritative without relying on the current/default year.
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  upload.single("photo"),
  resolveAcademicYear,
  checkLimit("teachers"),
  create
);

// GET ALL
router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getAll);

// GET BY ID
router.get("/:id", authMiddleware, resolveTenant, resolveAcademicYear, getById);

// FULL UPDATE (with photo upload)
router.put(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  upload.single("photo"),
  resolveAcademicYear,
  update
);

// PARTIAL UPDATE (with photo upload)
router.patch(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  upload.single("photo"),
  resolveTenant,
  resolveAcademicYear,
  partialUpdate
);

// DELETE (soft)
router.delete("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, remove);

export default router;
