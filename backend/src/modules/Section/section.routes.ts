import { Router } from "express";
import { createSection, getSections, updateSection, toggleSection } from "./section.controller";
import { allowRoles } from "../../middleware/role.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

const router = Router();

router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getSections);
router.post("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, createSection);
router.put("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, updateSection);
router.patch("/:id/toggle", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, toggleSection);
export default router;