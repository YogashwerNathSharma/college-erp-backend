
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { validateStudentAge } from "./age-validation.service";
import { uploadPhoto, uploadDocument } from "../../utils/upload";
import {
  uploadStudentPhoto,
  uploadStudentDocument,
  getStudentDocuments,
  deleteStudentDocument,
  deleteStudentPhoto,
} from "./upload.service";
import {
  createStudentHandler,
  getAllStudentsHandler,
  getStudentByIdHandler,
  updateStudentHandler,
  softDeleteStudentHandler,
  restoreStudentHandler,
  getDeletedStudentsHandler,
  getStudentStatsHandler,
  getEligibleStudentsHandler,
  promoteStudentHandler,
  bulkPromoteHandler,
  undoPromotionHandler,
  changeSectionHandler,
  createEnrollmentHandler,
  bulkCreateEnrollmentsHandler,
  getAgeConfigHandler,
  seedAgeConfigHandler,
  updateAgeConfigHandler,
  toggleAgeConfigHandler,
  printStudentsHandler,
} from "./student.controller";

const router = Router();

// ============================================
// ALL ROUTES USE AUTH + TENANT
// ============================================
router.use(authMiddleware, resolveTenant);

// ============================================
// STATIC ROUTES FIRST (before /:id)
// ============================================
// ============================================
// UPLOAD ROUTES (before /:id)
// ============================================

// Upload student photo
router.post("/:id/photo", (req: any, res: any) => {
  uploadPhoto(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No photo file provided" });
    }
    try {
      const result = await uploadStudentPhoto(req.params.id, req.tenantId, req.file);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
});

// Delete student photo
router.delete("/:id/photo", allowRoles("ADMIN"), async (req: any, res: any) => {
  try {
    const result = await deleteStudentPhoto(req.params.id, req.tenantId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Upload student document
router.post("/:id/documents", (req: any, res: any) => {
  uploadDocument(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No document file provided" });
    }
    try {
      const { type, name } = req.body;
      const result = await uploadStudentDocument(
        req.params.id,
        req.tenantId,
        req.file,
        type || "other",
        name
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
});

// Get student documents
router.get("/:id/documents", async (req: any, res: any) => {
  try {
    const documents = await getStudentDocuments(req.params.id, req.tenantId);
    res.json({ success: true, data: documents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete student document
router.delete("/documents/:documentId", allowRoles("ADMIN"), async (req: any, res: any) => {
  try {
    const result = await deleteStudentDocument(req.params.documentId, req.tenantId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});
// --- Stats ---
router.get("/stats", getStudentStatsHandler);

// --- Recycle Bin ---
router.get("/recycle-bin", getDeletedStudentsHandler);

// --- Age Config ---
router.get("/age-config", getAgeConfigHandler);
router.get("/age-config/validate", async (req: any, res: any) => {
  try {
    const { classId, dob, academicYearStart } = req.query;

    if (!classId || !dob || !academicYearStart) {
      return res.status(400).json({
        success: false,
        message: "classId, dob, and academicYearStart are required",
      });
    }

    const result = await validateStudentAge(
      req.tenantId,
      classId as string,
      new Date(dob as string),
      parseInt(academicYearStart as string)
    );

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post("/age-config/seed", allowRoles("ADMIN"), seedAgeConfigHandler);
router.put("/age-config/:configId", allowRoles("ADMIN"), updateAgeConfigHandler);
router.patch("/age-config/:configId/toggle", allowRoles("ADMIN"), toggleAgeConfigHandler);

// --- Promotion ---
router.get("/promotion/eligible", getEligibleStudentsHandler);
router.post("/promote", allowRoles("ADMIN"), promoteStudentHandler);
router.post("/promote/bulk", allowRoles("ADMIN"), bulkPromoteHandler);
router.post("/promote/undo/:promotionId", allowRoles("ADMIN"), undoPromotionHandler);
router.post("/promote/section-change", allowRoles("ADMIN"), changeSectionHandler);

// --- Enrollment (for existing students without enrollment) ---
router.post("/enrollment", allowRoles("ADMIN"), createEnrollmentHandler);
router.post("/enrollment/bulk", allowRoles("ADMIN"), bulkCreateEnrollmentsHandler);

// --- Print / Export ---
router.post("/print", printStudentsHandler);

// ============================================
// CRUD ROUTES
// ============================================
router.get("/", getAllStudentsHandler);
router.post("/", allowRoles("ADMIN"), createStudentHandler);

// ============================================
// DYNAMIC /:id ROUTES LAST
// ============================================
router.get("/:id", getStudentByIdHandler);
router.put("/:id", allowRoles("ADMIN"), updateStudentHandler);
router.delete("/:id", allowRoles("ADMIN"), softDeleteStudentHandler);
router.patch("/:id/restore", allowRoles("ADMIN"), restoreStudentHandler);

export default router;