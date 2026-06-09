
import express from "express";
import { create, getAll, getById, update, remove } from "./teacher.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// CREATE
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
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

// UPDATE
router.put(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant,
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

export default router;

