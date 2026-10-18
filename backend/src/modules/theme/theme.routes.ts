import { Router } from "express";
import {
  getTheme,
  updateTheme,
  previewTheme,
  resetTheme,
  getPresets,
  getThemeHistory,
} from "./theme.controller";

import { authMiddleware } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Auth + Tenant middleware
router.use(authMiddleware);
router.use(resolveTenant);


// Theme CRUD
router.get("/", getTheme);
router.put("/", updateTheme);
router.post("/preview", previewTheme);
router.post("/reset", resetTheme);
router.get("/presets", getPresets);
router.get("/history", getThemeHistory);

export default router;
