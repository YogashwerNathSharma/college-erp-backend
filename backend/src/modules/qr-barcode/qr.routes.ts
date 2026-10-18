import { Router } from "express";
import {
  generateQR,
  scanQR,
  getEntityQR,
  bulkGenerateQR,
  getScanLogs,
  deleteQR,
  getQRStats,
} from "./qr.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(resolveTenant);

// QR Code Management
router.post("/generate", generateQR);
router.post("/scan", scanQR);
router.post("/bulk-generate", bulkGenerateQR);
router.get("/entity/:type/:id", getEntityQR);
router.get("/scan-logs", getScanLogs);
router.get("/stats", getQRStats);
router.delete("/:id", deleteQR);

export default router;
