import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  listApprovals,
  createApproval,
  approveApproval,
  rejectApproval,
  getStats,
} from "./approval.controller";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════
// APPROVAL QUEUE ROUTES
// ═══════════════════════════════════════════════════════

// Stats — must be before /:id routes
router.get("/stats", getStats);

// List approvals (role-filtered in controller)
router.get("/", listApprovals);

// Submit for approval (any authenticated user can submit)
router.post("/", createApproval);

// Approve — only ADMIN, PRINCIPAL, or HR_MANAGER can approve
router.post(
  "/:id/approve",
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HR_MANAGER"),
  approveApproval
);

// Reject — only ADMIN, PRINCIPAL, or HR_MANAGER can reject
router.post(
  "/:id/reject",
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HR_MANAGER"),
  rejectApproval
);

export default router;
