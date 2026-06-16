

import express from "express";
import { create, getAll, getById, update, remove, upload } from "./teacher.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { checkLimit } from "../../middleware/subscriptionLimit.middleware";
import { createTeacher } from "./teacher.service";
import { teacherList } from "./report.controller";

const router = express.Router();

// CREATE (with photo upload)
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  upload.single("photo"),
  create
);

// GET ALL
router.get(
  "/",
  authMiddleware,
  resolveTenant,
  getAll
);

// GET BY ID
router.get(
  "/:id",
  authMiddleware,
  resolveTenant,
  getById
);

// UPDATE (with photo upload)
router.put(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  upload.single("photo"),
  update
);

// DELETE (soft)
router.delete(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  remove
);

router.post("/", authMiddleware, checkLimit("teachers"), teacherList);
export default router;

