import { Router } from "express";
import {
  getAll,
  getOne,
  create,
  update,
  uploadTenantImages,
  getMySubscription,
  getAllPlans,
  selfSubscribe,
  getTenantUsage,
} from "./tenant.controller";
import { upload } from "../../middleware/upload.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

//////////////////////////////////////////////////
// 📋 TENANT SELF-SERVICE (Login hone ke baad tenant apna data dekhe)
// ⚠️ YE ROUTES "/:id" SE UPAR HONE CHAHIYE
//////////////////////////////////////////////////

router.get(
  "/my-subscription",
  authMiddleware,
  getMySubscription
);

router.get(
  "/plans",
  authMiddleware,
  getAllPlans
);

router.post(
  "/self-subscribe",
  authMiddleware,
  selfSubscribe
);

//////////////////////////////////////////////////
// 🔥 GET ALL TENANTS (SUPER ADMIN ONLY)
//////////////////////////////////////////////////

router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  getAll
);

//////////////////////////////////////////////////
// 🔥 CREATE TENANT (SUPER ADMIN ONLY)
//////////////////////////////////////////////////

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "background", maxCount: 1 },
  ]),
  create
);

//////////////////////////////////////////////////
// 🔥 UPLOAD IMAGES
//////////////////////////////////////////////////

router.post(
  "/upload-images",
  authMiddleware,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "background", maxCount: 1 },
  ]),
  uploadTenantImages
);
router.get("/usage", authMiddleware, getTenantUsage);
//////////////////////////////////////////////////
// 🔥 UPDATE / TOGGLE TENANT (SUPER ADMIN ONLY)
//////////////////////////////////////////////////

router.patch(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  update
);

//////////////////////////////////////////////////
// 🔥 GET SINGLE TENANT (SUPER ADMIN ONLY)
// ⚠️ YE SABSE LAST ME HONA CHAHIYE
//////////////////////////////////////////////////

router.get(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  getOne
);

export default router;