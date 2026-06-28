import { Router } from "express";
import {
  globalSearch,
  getSuggestions,
  reindexAll,
  getRecentSearches,
} from "./search.controller";

import { authMiddleware } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';

const router = Router({ mergeParams: true });

// Global search
router.use(authMiddleware);
router.use(resolveTenant);

router.get("/", globalSearch);

// Autocomplete suggestions
router.get("/suggestions", getSuggestions);

// Recent searches
router.get("/recent", getRecentSearches);

// Reindex (admin only)
router.post("/reindex", reindexAll);

export default router;
