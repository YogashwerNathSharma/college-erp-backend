import { Router } from "express";
import { createClass, getClasses } from "./class.controller";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

// 🔐 Class
router.post("/", authMiddleware, resolveTenant, allowRoles("ADMIN"), createClass);
router.get("/", authMiddleware, resolveTenant, getClasses);



export default router;