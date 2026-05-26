import { Router } from "express";
import { getAll, getOne, create, update } from "./tenant.controller";
import { upload } from "../../middleware/upload.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

//////////////////////////////////////////////////
// 🔥 GET ALL TENANTS
//////////////////////////////////////////////////
router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  getAll
);

//////////////////////////////////////////////////
// 🔥 GET SINGLE TENANT
//////////////////////////////////////////////////
router.get(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  getOne
);

//////////////////////////////////////////////////
// 🔥 CREATE TENANT (🔥 FIXED ROUTE)
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
// 🔥 UPDATE / TOGGLE TENANT (🔥 NEW)
//////////////////////////////////////////////////
router.patch(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  update
);

export default router;