import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  createForm,
  listForms,
  getForm,
  updateForm,
  deleteForm,
  duplicateForm,
  submitForm,
  getFormSubmissions,
  getSubmission,
  updateSubmissionStatus,
  exportSubmissions,
  getFormStats,
} from "./form-builder.controller";

const router = Router();

// ═══════════════════════════════════════════
// STATS (before :id routes)
// ═══════════════════════════════════════════
router.get("/stats", authMiddleware, getFormStats);

// ═══════════════════════════════════════════
// FORM TEMPLATES (authenticated)
// ═══════════════════════════════════════════
router.post("/", authMiddleware, createForm);
router.get("/", authMiddleware, listForms);
router.get("/:id", authMiddleware, getForm);
router.put("/:id", authMiddleware, updateForm);
router.delete("/:id", authMiddleware, deleteForm);
router.post("/:id/duplicate", authMiddleware, duplicateForm);

// ═══════════════════════════════════════════
// FORM SUBMISSIONS
// ═══════════════════════════════════════════
// Submit can be public or authenticated (controlled by form settings)
router.post("/:id/submit", submitForm);

// View submissions (authenticated - admin only)
router.get("/:id/submissions", authMiddleware, getFormSubmissions);
router.get("/:id/submissions/export", authMiddleware, exportSubmissions);
router.get("/:id/submissions/:subId", authMiddleware, getSubmission);
router.put("/:id/submissions/:subId/status", authMiddleware, updateSubmissionStatus);

export default router;
