import { Router } from "express";
import { createSubject, getSubjects, updateSubject, toggleSubject } from "./subject.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

router.get("/", authMiddleware, resolveTenant, getSubjects);
router.post("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, createSubject);
router.put("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, updateSubject);
router.patch("/:id/toggle", authMiddleware, allowRoles("ADMIN"), resolveTenant, toggleSubject);

export default router;