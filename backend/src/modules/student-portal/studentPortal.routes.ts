// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STUDENT PORTAL ROUTES
// Student role ke liye dedicated APIs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Router } from "express";
import prisma from "../../utils/prisma";
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

/**
 * Student portal fallback for newly created tenants.
 * Some new tenants have an academic year but have not marked one as
 * isCurrent yet. resolveAcademicYear intentionally leaves the context empty
 * in that case; for the student portal we can safely select the newest
 * non-deleted year belonging to the same tenant. This is tenant-scoped and
 * does not change the global academic-year middleware behavior.
 */
const resolveStudentAcademicYear = async (req: any, _res: any, next: any) => {
  try {
    if (!req.academicYearId && req.tenantId && req.user?.role !== "SUPER_ADMIN") {
      const year = await prisma.academicYear.findFirst({
        where: {
          tenantId: req.tenantId,
          isDeleted: false,
        },
        orderBy: [
          { isActive: "desc" },
          { startDate: "desc" },
        ],
        select: { id: true },
      });
      if (year) req.academicYearId = year.id;
    }
    next();
  } catch (error) {
    console.error("Student academic year fallback error:", error);
    next();
  }
};

// Auth + tenant isolation + academic-year resolution + student role.
// The student-only fallback runs after the normal resolver and only fills an
// otherwise-missing year for this portal.
router.use(
  authMiddleware,
  resolveTenant,
  resolveAcademicYear,
  resolveStudentAcademicYear,
  allowRoles("STUDENT")
);

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
