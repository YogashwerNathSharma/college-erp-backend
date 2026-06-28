import { Router } from "express";
import {
  getTheme,
  updateTheme,
  previewTheme,
  resetTheme,
  getPresets,
  getThemeHistory,
} from "./theme.controller";

const router = Router();

// Theme CRUD
router.get("/", getTheme);
router.put("/", updateTheme);
router.post("/preview", previewTheme);
router.post("/reset", resetTheme);
router.get("/presets", getPresets);
router.get("/history", getThemeHistory);

export default router;
