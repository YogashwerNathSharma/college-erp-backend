// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STUDENT PORTAL ROUTES
// Student role ke liye dedicated APIs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";
import { allowRoles } from "../../middleware/role.middleware";

import {
  getMyProfileControllerAY,
  getMyDashboardControllerAY,
  getMyTimetableControllerAY,
  getMyAttendanceSummaryControllerAY,
  getMyAttendanceDetailControllerAY,
  getMyFeeSummaryControllerAY,
  getMyFeeDetailsControllerAY,
  getMyExamsControllerAY,
  getMyMarksControllerAY,
  getMySubjectsControllerAY,
  getMyLibraryControllerAY,
} from "./studentPortal.academicYear.controller";

const router = Router();

// All routes need auth + tenant + selected academic year + STUDENT role.
// The academic year is validated against the tenant before any portal query runs.
router.use(authMiddleware, resolveTenant, resolveAcademicYear, allowRoles("STUDENT"));

router.get("/me", getMyProfileControllerAY);
router.get("/dashboard", getMyDashboardControllerAY);
router.get("/timetable", getMyTimetableControllerAY);
router.get("/attendance/summary", getMyAttendanceSummaryControllerAY);
router.get("/attendance/detail", getMyAttendanceDetailControllerAY);
router.get("/fees/summary", getMyFeeSummaryControllerAY);
router.get("/fees/details", getMyFeeDetailsControllerAY);
router.get("/exams", getMyExamsControllerAY);
router.get("/marks", getMyMarksControllerAY);
router.get("/subjects", getMySubjectsControllerAY);
router.get("/library", getMyLibraryControllerAY);

export default router;
