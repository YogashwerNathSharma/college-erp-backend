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

// Teacher management is available to both institution admins and super admins.
// SUPER_ADMIN is intentionally supported here because academicYear middleware
// skips year resolution for SUPER_ADMIN and the selected year is carried in the request body/header.
const teacherAdminRoles = allowRoles("ADMIN", "SUPER_ADMIN");

// CREATE: parse multipart body before resolving academic year so the explicitly
// selected academicYearId is available to the year middleware.
router.post(
  "/",
  authMiddleware,
  teacherAdminRoles,
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
  teacherAdminRoles,
  resolveTenant,
  upload.single("photo"),
  resolveAcademicYear,
  update
);

// PARTIAL UPDATE
router.patch(
  "/:id",
  authMiddleware,
  teacherAdminRoles,
  resolveTenant,
  upload.single("photo"),
  resolveAcademicYear,
  partialUpdate
);

// DELETE (soft)
router.delete("/:id", authMiddleware, teacherAdminRoles, resolveTenant, resolveAcademicYear, remove);

export default router;
