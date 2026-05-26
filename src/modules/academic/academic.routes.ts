import { Router } from "express";
import { create, getAll, setActive } from "./academic.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

// 🔐 Protected routes
router.post("/", authMiddleware, allowRoles("ADMIN"), create);
router.get("/", authMiddleware, getAll);
router.patch("/:id/active", authMiddleware, allowRoles("ADMIN"), setActive);

export default router;