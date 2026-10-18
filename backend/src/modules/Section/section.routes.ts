import { Router } from "express";
import { createSection, getSections, getSectionDropdown, getSectionById, updateSection, toggleSection } from "./section.controller";
import { allowRoles } from "../../middleware/role.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

const router = Router();

// Must remain before parameter routes and is dedicated to lightweight dropdown use.
router.get("/dropdown", authMiddleware, resolveTenant, resolveAcademicYear, getSectionDropdown);
router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getSections);
// Exact ID lookup intentionally keeps tenant isolation but does not require the
// current academic year, because timetable rows may reference older sections.
router.get("/:id", authMiddleware, resolveTenant, resolveAcademicYear, getSectionById);
router.post("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, createSection);
router.put("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, updateSection);
router.patch("/:id/toggle", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, toggleSection);
export default router;
