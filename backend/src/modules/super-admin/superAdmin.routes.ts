
import express from "express";
import multer from "multer";
import path from "path";
import {
  getSuperAdminDashboard,
  getTenantsList,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  toggleTenantStatus,
  getSuperAdminSettings,
  updatePlatformSettings,
  updateSuperAdminProfile,
  getSystemConfig,
  getDeveloperProfile,
  upsertDeveloperProfile,
} from "./superAdmin.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

//////////////////////////////////////////////////////
// MULTER CONFIG (logo & background upload)
//////////////////////////////////////////////////////

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../../uploads/tenants"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const tenantUpload = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "background", maxCount: 1 },
]);

// 🔒 All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

//////////////////////////////////////////////////////
// 📊 DASHBOARD
//////////////////////////////////////////////////////

router.get("/dashboard", getSuperAdminDashboard);

//////////////////////////////////////////////////////
// 🏫 TENANT CRUD (static routes first)
//////////////////////////////////////////////////////

router.get("/tenants", getTenantsList);
router.post("/tenants", tenantUpload, createTenant);

// Dynamic routes last
router.get("/tenants/:id", getTenantById);
router.put("/tenants/:id", tenantUpload, updateTenant);
router.delete("/tenants/:id", deleteTenant);
router.patch("/tenants/:id/toggle-status", toggleTenantStatus);

//////////////////////////////////////////////////////
// ⚙️ SUPER ADMIN SETTINGS
//////////////////////////////////////////////////////

router.get("/settings", getSuperAdminSettings);
router.put("/settings/platform", updatePlatformSettings);
router.put("/settings/profile", updateSuperAdminProfile);
router.get("/settings/system-config", getSystemConfig);

//////////////////////////////////////////////////////
// 👨💻 DEVELOPER PROFILE
//////////////////////////////////////////////////////

router.get("/developer-profile", getDeveloperProfile);
router.put("/developer-profile", upsertDeveloperProfile);

export default router;

