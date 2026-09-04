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

// CREATE: parse multipart body before resolving academic year so the explicitly
// selected academicYearId is available to the year middleware.
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

// FULL UPDATE: parse multipart body before resolving academic year.
router.put(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  upload.single("photo"),
  resolveAcademicYear,
  update
);

// PARTIAL UPDATE: keep normal auth -> tenant -> upload -> year ordering.
router.patch(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  upload.single("photo"),
  resolveAcademicYear,
  partialUpdate
);

// DELETE (soft)
router.delete("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, remove);

export default router;
