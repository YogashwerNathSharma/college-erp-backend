import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { createEnrollment, getEnrollments, getEnrollmentCount } from "./enrollment.controller";

const router = express.Router();

router.use(authMiddleware, resolveTenant);

// Enrollment changes are administrative operations; reads remain available to authenticated users.
router.post("/", allowRoles("ADMIN", "SUPER_ADMIN"), createEnrollment);
router.get("/", getEnrollments);
router.get("/count", getEnrollmentCount);

export default router;
