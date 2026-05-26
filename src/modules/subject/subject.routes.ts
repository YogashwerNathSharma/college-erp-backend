import { Router } from "express";
import { createSubject, getSubjects } from "./subject.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

// 🔐 Protected
router.post("/", authMiddleware, allowRoles("ADMIN"), createSubject);
router.get("/", authMiddleware, getSubjects);

export default router;