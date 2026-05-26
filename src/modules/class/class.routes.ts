import { Router } from "express";
import { createClass, getClasses } from "./class.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

// 🔐 Class
router.post("/", authMiddleware, allowRoles("ADMIN"), createClass);
router.get("/", authMiddleware, getClasses);



export default router;