import express from "express";
import {
  getCurrentTheme,
  getAllThemes,
  createTheme,
  updateTheme,
  deleteTheme,
  activateTheme,
  applyPreset,
  uploadLogo,
  uploadFavicon,
  updateCustomCode,
  previewTheme,
} from "./theme-management.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

// ══════════════════════════════════════════════════════
// THEME MANAGEMENT ROUTES
// ══════════════════════════════════════════════════════

const router = express.Router();

// 🔐 All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

//////////////////////////////////////////////////////
// 🎨 THEME CRUD
//////////////////////////////////////////////////////

router.get("/current", getCurrentTheme);
router.get("/", getAllThemes);
router.post("/", createTheme);
router.put("/:id", updateTheme);
router.delete("/:id", deleteTheme);

//////////////////////////////////////////////////////
// ⚡ THEME ACTIONS
//////////////////////////////////////////////////////

router.patch("/:id/activate", activateTheme);
router.post("/apply-preset", applyPreset);
router.patch("/:id/logo", uploadLogo);
router.patch("/:id/favicon", uploadFavicon);
router.patch("/:id/custom-code", updateCustomCode);
router.post("/preview", previewTheme);

export default router;
