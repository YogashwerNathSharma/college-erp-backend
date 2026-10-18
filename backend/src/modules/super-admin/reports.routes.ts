import { Router } from "express";
import { getReports } from "./reports.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  getReports
);

export default router;