import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  createStaffHandler,
  getAllStaffHandler,
  getStaffByIdHandler,
  updateStaffHandler,
  deleteStaffHandler,
  generatePayrollHandler,
  getPayrollListHandler,
  getPayslipHandler,
  processPayrollHandler,
  applyLeaveHandler,
  getLeaveRequestsHandler,
  approveLeaveHandler,
  rejectLeaveHandler,
  getLeaveBalanceHandler,
  markStaffAttendanceHandler,
  getStaffAttendanceHandler,
  getStaffAttendanceReportHandler,
} from "./hr.controller";

const router = Router();

router.use(authMiddleware, resolveTenant);

// ============================================
// STAFF MANAGEMENT
// ============================================
router.get("/staff", getAllStaffHandler);
router.get("/staff/:id", getStaffByIdHandler);
router.post("/staff", allowRoles("ADMIN"), createStaffHandler);
router.put("/staff/:id", allowRoles("ADMIN"), updateStaffHandler);
router.delete("/staff/:id", allowRoles("ADMIN"), deleteStaffHandler);

// ============================================
// PAYROLL ROUTES
// ============================================
router.get("/payroll", allowRoles("ADMIN"), getPayrollListHandler);
router.get("/payroll/:id", allowRoles("ADMIN"), getPayslipHandler);
router.post("/payroll/generate", allowRoles("ADMIN"), generatePayrollHandler);
router.post("/payroll/:id/process", allowRoles("ADMIN"), processPayrollHandler);

// ============================================
// LEAVE MANAGEMENT
// ============================================
router.get("/leave", getLeaveRequestsHandler);
router.get("/leave/balance/:staffId", getLeaveBalanceHandler);
router.post("/leave/apply", applyLeaveHandler);
router.post("/leave/:id/approve", allowRoles("ADMIN"), approveLeaveHandler);
router.post("/leave/:id/reject", allowRoles("ADMIN"), rejectLeaveHandler);

// ============================================
// STAFF ATTENDANCE
// ============================================
router.get("/attendance", getStaffAttendanceHandler);
router.get("/attendance/report", allowRoles("ADMIN"), getStaffAttendanceReportHandler);
router.post("/attendance/mark", allowRoles("ADMIN"), markStaffAttendanceHandler);

export default router;
