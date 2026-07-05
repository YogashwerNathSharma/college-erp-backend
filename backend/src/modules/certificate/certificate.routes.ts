import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  generateTCHandler,
  getTCByIdHandler,
  getAllTCsHandler,
  approveTCHandler,
  generateCharacterCertHandler,
  getCharacterCertsHandler,
  generateMigrationCertHandler,
  getMigrationCertsHandler,
  getCertificateStatsHandler,
} from "./certificate.controller";

const router = Router();

router.use(authMiddleware, resolveTenant);

// ============================================
// STATS
// ============================================
router.get("/stats", getCertificateStatsHandler);

// ============================================
// TRANSFER CERTIFICATE
// ============================================
router.get("/tc", getAllTCsHandler);
router.get("/tc/:id", getTCByIdHandler);
router.post("/tc/generate", allowRoles("ADMIN", "SUPER_ADMIN"), generateTCHandler);
router.post("/tc/:id/approve", allowRoles("ADMIN", "SUPER_ADMIN"), approveTCHandler);

// ============================================
// CHARACTER CERTIFICATE
// ============================================
router.get("/character", getCharacterCertsHandler);
router.post("/character/generate", allowRoles("ADMIN", "SUPER_ADMIN"), generateCharacterCertHandler);

// ============================================
// MIGRATION CERTIFICATE
// ============================================
router.get("/migration", getMigrationCertsHandler);
router.post("/migration/generate", allowRoles("ADMIN", "SUPER_ADMIN"), generateMigrationCertHandler);

export default router;
