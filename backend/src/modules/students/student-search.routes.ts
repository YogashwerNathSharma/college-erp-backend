// ══════════════════════════════════════════════════════════════════════════════
// STUDENT SEARCH ROUTES — Advanced Search & Saved Filters
// Mount at: app.use("/api/students/search", studentSearchRoutes)
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Response } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import {
  advancedSearch,
  checkDuplicate,
  getSavedFilters,
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
} from "./student-search.service";

const router = Router();
router.use(authMiddleware, resolveTenant);

// ── Advanced Search ──────────────────────────────────────────────────────────
router.post("/advanced", async (req: any, res: Response) => {
  try {
    const result = await advancedSearch(req.tenantId, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Check Duplicate ──────────────────────────────────────────────────────────
router.get("/check-duplicate", async (req: any, res: Response) => {
  try {
    const { aadharNo, phone, email, admissionNo, name } = req.query;
    const result = await checkDuplicate(req.tenantId, {
      aadharNo: aadharNo as string,
      phone: phone as string,
      email: email as string,
      admissionNo: admissionNo as string,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get Saved Filters ────────────────────────────────────────────────────────
router.get("/saved-filters", async (req: any, res: Response) => {
  try {
    const filters = await getSavedFilters(req.tenantId, req.user.userId);
    res.json({ success: true, data: filters });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Create Saved Filter ──────────────────────────────────────────────────────
router.post("/saved-filters", async (req: any, res: Response) => {
  try {
    const { name, description, filters, isDefault, isShared } = req.body;
    if (!name || !filters) {
      return res.status(400).json({ success: false, message: "Name and filters are required" });
    }
    const result = await createSavedFilter(req.tenantId, req.user.userId, {
      name, description, filters, isDefault, isShared,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Update Saved Filter ──────────────────────────────────────────────────────
router.put("/saved-filters/:id", async (req: any, res: Response) => {
  try {
    const result = await updateSavedFilter(req.params.id, req.tenantId, req.user.userId, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Delete Saved Filter ──────────────────────────────────────────────────────
router.delete("/saved-filters/:id", async (req: any, res: Response) => {
  try {
    await deleteSavedFilter(req.params.id, req.tenantId, req.user.userId);
    res.json({ success: true, message: "Filter deleted" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
