import { Router } from "express";
import {
  uploadSignature,
  listSignatures,
  getSignature,
  signDocument,
  verifySignature,
  revokeSignature,
  deleteSignature,
  getSignedDocuments,
} from "./signature.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

// Public verification endpoint (no auth needed)
router.get("/verify/:code", verifySignature);

// Authenticated routes
router.use(authMiddleware);
router.use(resolveTenant);

// Signature management
router.post("/upload", uploadSignature);
router.get("/", listSignatures);
router.get("/documents", getSignedDocuments);
router.get("/:id", getSignature);
router.post("/sign/:documentId", signDocument);
router.post("/revoke/:signedDocId", revokeSignature);
router.delete("/:id", deleteSignature);

export default router;
