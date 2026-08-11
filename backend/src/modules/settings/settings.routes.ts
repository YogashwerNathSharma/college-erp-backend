// Settings Routes (Enhanced v2)
// SUPER_ADMIN + ADMIN dono ke liye combined routes
// User Management endpoints included (sirf ADMIN access)

import { Router } from "express";
import multer from "multer";
import path from "path";

import {
  getSettings,
  updateTenantSettings,
  updateTheme,
  updateProfile,
  changePassword,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
} from "./settings.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { getDesignerSettings, updateDesignerSettings } from "./designer.controller";

const router = Router();

// Multer config
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"));
    }
  },
});

// Upload must authenticate + resolve tenant + authorize before multer reads the file.
router.post(
  "/upload",
  authMiddleware,
  resolveTenant,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  upload.single("file"),
  async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }
      const { uploadToCloudinary } = require("../../config/cloudinary");
      const fileUrl = await uploadToCloudinary(req.file.buffer, "settings");
      res.json({
        success: true,
        data: { url: fileUrl, filename: req.file.filename },
        message: "File uploaded successfully",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// ============================================================
// Common Middleware — Auth + Tenant resolve
// ============================================================
router.use(authMiddleware, resolveTenant, allowRoles("ADMIN", "SUPER_ADMIN"));

// ============================================================
// SETTINGS ROUTES (Both ADMIN + SUPER_ADMIN)
// ============================================================
router.get("/", getSettings);
router.put("/theme", updateTheme);

// ============================================================
// DESIGNER SETTINGS ROUTES
// ============================================================
router.get("/designer", getDesignerSettings);
router.put("/designer", updateDesignerSettings);

// Update tenant settings (branding/info) — sirf ADMIN controller-level policy ke saath
router.put("/", updateTenantSettings);

// Update profile (name, email, password) — dono
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);

// ============================================================
// USER MANAGEMENT ROUTES (Sirf Tenant ADMIN)
// ============================================================
router.get("/users", allowRoles("ADMIN"), getUsers);
router.get("/roles", allowRoles("ADMIN"), getRoles);
router.get("/users/:id", allowRoles("ADMIN"), getUserById);
router.post("/users", allowRoles("ADMIN"), createUser);
router.put("/users/:id", allowRoles("ADMIN"), updateUser);
router.delete("/users/:id", allowRoles("ADMIN"), deleteUser);

export default router;
