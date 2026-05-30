import { Router } from "express";
import { getSettings, updatePlatform, updateProfile } from "./settings.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

router.use(authMiddleware);
router.use(allowRoles("SUPER_ADMIN"));

router.get("/", getSettings);
router.put("/platform", updatePlatform);
router.put("/profile", updateProfile);

export default router;