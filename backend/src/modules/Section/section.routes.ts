import { Router } from "express";
import { createSection, getSections, updateSection, toggleSection } from "./section.controller";
import { allowRoles } from "../../middleware/role.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

router.get("/", authMiddleware, resolveTenant, getSections);
router.post("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, createSection);
router.put("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, updateSection);
router.patch("/:id/toggle", authMiddleware, allowRoles("ADMIN"), resolveTenant, toggleSection);
export default router;