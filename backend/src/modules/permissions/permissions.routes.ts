import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  getUserPermissionsController,
  updateUserPermissionsController,
  grantTemporaryAdminController,
  revokeTemporaryAdminController,
  getMyPermissionsController,
} from "./permissions.controller";

const router = express.Router();

//////////////////////////////////////////////////////
// GET MY PERMISSIONS (must be above /:userId to avoid conflict)
//////////////////////////////////////////////////////
router.get("/my", authMiddleware, getMyPermissionsController);

//////////////////////////////////////////////////////
// GET USER PERMISSIONS
//////////////////////////////////////////////////////
router.get("/:userId", authMiddleware, getUserPermissionsController);

//////////////////////////////////////////////////////
// UPDATE USER PERMISSIONS (ADMIN ONLY)
//////////////////////////////////////////////////////
router.put("/:userId", authMiddleware, updateUserPermissionsController);

//////////////////////////////////////////////////////
// GRANT TEMPORARY ADMIN
//////////////////////////////////////////////////////
router.post("/temp-admin/:userId", authMiddleware, grantTemporaryAdminController);

//////////////////////////////////////////////////////
// REVOKE TEMPORARY ADMIN
//////////////////////////////////////////////////////
router.delete("/temp-admin/:userId", authMiddleware, revokeTemporaryAdminController);

export default router;
