

import express from "express";
import { create, getByTeacher, getAll } from "./performance.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// CREATE / UPDATE PERFORMANCE
router.post("/", authMiddleware, allowRoles("ADMIN"), resolveTenant, create);

// GET ALL PERFORMANCES
router.get("/", authMiddleware, resolveTenant, getAll);

// GET BY TEACHER
router.get("/:teacherId", authMiddleware, resolveTenant, getByTeacher);

export default router;

