import { Router } from "express";
import {
  globalSearch,
  getSuggestions,
  reindexAll,
  getRecentSearches,
} from "./search.controller";

const router = Router({ mergeParams: true });

// Global search
router.get("/", globalSearch);

// Autocomplete suggestions
router.get("/suggestions", getSuggestions);

// Recent searches
router.get("/recent", getRecentSearches);

// Reindex (admin only)
router.post("/reindex", reindexAll);

export default router;
