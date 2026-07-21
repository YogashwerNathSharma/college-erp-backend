import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  generateBonafideHandler,
  generateCharacterHandler,
  generateLeavingHandler,
  generateMigrationHandler,
  generateStudyHandler,
  generateCustomCertificateHandler,
  getCertificateHistoryHandler,
  bulkCertificateHandler,
} from "./student-certificate.controller";

const router = Router();

// ============================================
// ALL ROUTES USE AUTH + TENANT
// ============================================
router.use(authMiddleware, resolveTenant);

// ══════════════════════════════════════════════════════════════════
// STUDENT CERTIFICATE ROUTES
// ══════════════════════════════════════════════════════════════════

// POST /api/students/certificates/:id/certificate/bonafide
router.post("/:id/certificate/bonafide", generateBonafideHandler);

// POST /api/students/certificates/:id/certificate/character
router.post("/:id/certificate/character", generateCharacterHandler);

// POST /api/students/certificates/:id/certificate/leaving
router.post("/:id/certificate/leaving", allowRoles("ADMIN"), generateLeavingHandler);

// POST /api/students/certificates/:id/certificate/migration
router.post("/:id/certificate/migration", allowRoles("ADMIN"), generateMigrationHandler);

// POST /api/students/certificates/:id/certificate/study
router.post("/:id/certificate/study", generateStudyHandler);

// POST /api/students/certificates/:id/certificate/custom
router.post("/:id/certificate/custom", generateCustomCertificateHandler);

// GET /api/students/certificates/:id/certificate-history
router.get("/:id/certificate-history", getCertificateHistoryHandler);

// POST /api/students/certificates/bulk-certificate
router.post("/bulk-certificate", allowRoles("ADMIN"), bulkCertificateHandler);

export default router;
