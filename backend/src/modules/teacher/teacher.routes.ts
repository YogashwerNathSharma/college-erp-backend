import express from "express";
import { create, getAll, getById, update, remove, upload, dashboard } from "./teacher.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { checkLimit } from "../../middleware/subscriptionLimit.middleware";

const router = express.Router();

// DASHBOARD (must be before /:id)
router.get("/dashboard", authMiddleware, resolveTenant, dashboard);

// CREATE (with photo upload)
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
  checkLimit("teachers"),
  upload.single("photo"),
  create
);

// GET ALL
router.get("/", authMiddleware, resolveTenant, getAll);

// GET BY ID
router.get("/:id", authMiddleware, resolveTenant, getById);

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
router.delete("/:id", authMiddleware, allowRoles("ADMIN"), resolveTenant, remove);

export default router;
