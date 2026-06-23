
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

// Upload route — baaki routes ke saath add karo
router.post("/upload", upload.single("file"), async (req: any, res: any) => {
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
});
// ============================================================
// 🔒 Common Middleware — Auth + Tenant resolve
// Dono roles access kar sakte hain (SUPER_ADMIN + ADMIN)
// ============================================================

router.use(authMiddleware, resolveTenant, allowRoles("ADMIN", "SUPER_ADMIN"));

// ============================================================
// SETTINGS ROUTES (Both ADMIN + SUPER_ADMIN)
// ============================================================

// Get settings (role-based response automatically adjust hoga)
router.get("/", getSettings);

// Update theme (both SUPER_ADMIN + TENANT ADMIN)
router.put("/theme", updateTheme);

// ============================================================
// DESIGNER SETTINGS ROUTES
// ============================================================

// Get designer settings by type
router.get("/designer", getDesignerSettings);

// Update designer settings
router.put("/designer", updateDesignerSettings);

// Update tenant settings (branding/info) — sirf ADMIN
router.put("/", updateTenantSettings);

// Update profile (name, email, password) — dono
router.put("/profile", updateProfile);

// Change password — dono
router.put("/change-password", changePassword);

// ============================================================
// USER MANAGEMENT ROUTES (Sirf Tenant ADMIN)
// SUPER_ADMIN ke liye ye routes nahi hain — wo super-admin panel se manage karta hai
// ============================================================

// Get all users (with pagination + filters)
router.get("/users", allowRoles("ADMIN"), getUsers);

// Get available roles
router.get("/roles", allowRoles("ADMIN"), getRoles);

// Get single user by ID
router.get("/users/:id", allowRoles("ADMIN"), getUserById);

// Create new user
router.post("/users", allowRoles("ADMIN"), createUser);

// Update user
router.put("/users/:id", allowRoles("ADMIN"), updateUser);

// Delete (deactivate) user
router.delete("/users/:id", allowRoles("ADMIN"), deleteUser);

export default router;

