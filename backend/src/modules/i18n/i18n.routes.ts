import { Router } from "express";
import {
  getTranslations,
  getModuleTranslations,
  updateTranslations,
  importTranslations,
  exportTranslations,
  getConfig,
  updateConfig,
  getTranslationStats,
  deleteTranslation,
} from "./i18n.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

router.use(authMiddleware);
router.use(resolveTenant);

// Config
router.get("/config", getConfig);
router.put("/config", updateConfig);

// Stats
router.get("/stats", getTranslationStats);

// Import/Export
router.post("/import", importTranslations);
router.get("/export/:locale", exportTranslations);

// CRUD
router.get("/:locale", getTranslations);
router.get("/:locale/:module", getModuleTranslations);
router.put("/:locale", updateTranslations);
router.delete("/:locale/:module/:key", deleteTranslation);

export default router;
