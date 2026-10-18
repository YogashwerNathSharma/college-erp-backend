import { Router } from "express";
import { createSubject, getSubjects, updateSubject, toggleSubject, bulkCreateSubjects } from "./subject.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

const router = Router();

router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getSubjects);
router.post("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, createSubject);
router.post("/bulk", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, bulkCreateSubjects);
router.put("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, updateSubject);
router.patch("/:id/toggle", authMiddleware, allowRoles("ADMIN"), resolveTenant, resolveAcademicYear, toggleSubject);

export default router;