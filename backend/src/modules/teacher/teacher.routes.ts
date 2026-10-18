import express from "express";
import { create, getAll, getById, update, partialUpdate, remove, upload, dashboard } from "./teacher.controller";
import { saveAssignments } from "./teacher.assignment.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { checkLimit } from "../../middleware/subscriptionLimit.middleware";

const router = express.Router();

// DASHBOARD (must be before /:id to avoid matching "dashboard" as an id)
router.get("/dashboard", authMiddleware, resolveTenant, resolveAcademicYear, dashboard);

// Teacher management is available to both institution admins and super admins.
const teacherAdminRoles = allowRoles("ADMIN", "SUPER_ADMIN");

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

router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getAll);

router.get("/:id", authMiddleware, resolveTenant, resolveAcademicYear, getById);

// Dedicated subject-assignment write endpoint. Keep it before /:id PUT/PATCH.
router.post(
  "/:id/assignments",
  authMiddleware,
  teacherAdminRoles,
  resolveTenant,
  resolveAcademicYear,
  saveAssignments
);

router.put(
  "/:id",
  authMiddleware,
  teacherAdminRoles,
  resolveTenant,
  upload.single("photo"),
  resolveAcademicYear,
  update
);

router.patch(
  "/:id",
  authMiddleware,
  teacherAdminRoles,
  resolveTenant,
  upload.single("photo"),
  resolveAcademicYear,
  partialUpdate
);

router.delete("/:id", authMiddleware, teacherAdminRoles, resolveTenant, resolveAcademicYear, remove);

export default router;
