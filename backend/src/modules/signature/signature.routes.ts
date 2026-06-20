
// ═══════════════════════════════════════════════════════════
// signature.routes.ts — Signature Master CRUD Routes
// Place at: src/modules/signature/signature.routes.ts
// ═══════════════════════════════════════════════════════════

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  getAllSignatures,
  createSignature,
  updateSignature,
  deleteSignature,
} from "./signature.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

// ============================================================
// Multer Config — Save to uploads/signatures/
// ============================================================

const uploadDir = path.join(__dirname, "../../../uploads/signatures");

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req: any, file: any, cb: any) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed (png, jpg, jpeg, webp, gif)"));
    }
  },
});

// ============================================================
// 🔐 Middleware — Auth + Tenant + Admin Only
// ============================================================

router.use(authMiddleware, resolveTenant, allowRoles("ADMIN"));

// ============================================================
// ROUTES
// ============================================================

// GET /api/signature — Get all signatures for tenant
router.get("/", getAllSignatures);

// POST /api/signature — Upload a new signature (with image)
router.post("/", upload.single("image"), createSignature);

// PUT /api/signature/:id — Update signature
router.put("/:id", upload.single("image"), updateSignature);

// DELETE /api/signature/:id — Delete signature
router.delete("/:id", deleteSignature);

export default router;
