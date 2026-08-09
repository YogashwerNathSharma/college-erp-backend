// ══════════════════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD ROUTES
// Mount at: app.use("/api/students/dashboard", studentDashboardRoutes)
// ══════════════════════════════════════════════════════════════════════════════
console.log("✅ Student Dashboard Routes Loaded");
import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import {
  getFullDashboardData,
  getBirthdayToday,
  getSectionStrength,
  getMonthlyAdmissionTrend,
  getStudentGrowth,
  getTransportStudentCount,
  getHostelStudentCount,
  getScholarshipStudentCount,
  getGenderRatio,
  getNewAdmissionsCount,
  getLeavingStudentsCount,
  getDashboardStats,
  getClassStrength,
  getCategoryDistribution,
} from "./student-dashboard.service";

const router = Router();
router.use(authMiddleware, resolveTenant);

// ── Full Dashboard (single call) — with 20s timeout ──────────────────────────
router.get("/full", async (req: any, res: Response) => {
  try {
    const _start = Date.now();
    const yearId = req.query.academicYearId as string || "";

    // Race between actual data fetch and 20s timeout
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve("TIMEOUT"), 20000);
    });

    const dataPromise = getFullDashboardData(req.tenantId, req.query.academicYearId as string);
    const result = await Promise.race([dataPromise, timeoutPromise]);

    if (result === "TIMEOUT") {
      console.warn("⏱️ Student Dashboard TIMEOUT after 20s");
      return res.json({ success: true, data: { stats: { totalStudents: 0, activeStudents: 0, inactiveStudents: 0, newAdmissions: 0, leavingStudents: 0, boys: 0, girls: 0, transportStudents: 0, hostelStudents: 0, scholarshipStudents: 0, feeDefaulters: 0, birthdayTodayCount: 0 }, birthdayStudents: [], classStrength: [], sectionStrength: [], categoryDistribution: [], genderRatio: { male: 0, female: 0, other: 0, total: 0 }, monthlyAdmission: [], studentGrowth: [], admissionTrend: [], recentAdmissions: [], feeDefaultersList: [], _timeout: true } });
    }

    console.log(`⚡ Student Dashboard loaded in ${Date.now() - _start}ms`);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Student Dashboard Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Stats Only ───────────────────────────────────────────────────────────────
router.get("/stats", async (req: any, res: Response) => {
  try {
    const stats = await getDashboardStats(req.tenantId, req.query.academicYearId as string);
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Birthday Today ───────────────────────────────────────────────────────────
router.get("/birthday-today", async (req: any, res: Response) => {
  try {
    const data = await getBirthdayToday(req.tenantId);
    res.json({ success: true, data, count: data.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Section Strength ─────────────────────────────────────────────────────────
router.get("/section-strength", async (req: any, res: Response) => {
  try {
    const data = await getSectionStrength(req.tenantId, req.query.academicYearId as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Class Strength ───────────────────────────────────────────────────────────
router.get("/class-strength", async (req: any, res: Response) => {
  try {
    const data = await getClassStrength(req.tenantId, req.query.academicYearId as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Monthly Admission Trend ──────────────────────────────────────────────────
router.get("/monthly-admission", async (req: any, res: Response) => {
  try {
    const data = await getMonthlyAdmissionTrend(req.tenantId, req.query.academicYearId as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Student Growth (Year over Year) ──────────────────────────────────────────
router.get("/student-growth", async (req: any, res: Response) => {
  try {
    const data = await getStudentGrowth(req.tenantId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Gender Ratio ─────────────────────────────────────────────────────────────
router.get("/gender-ratio", async (req: any, res: Response) => {
  try {
    const data = await getGenderRatio(req.tenantId, req.query.academicYearId as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Category Distribution ────────────────────────────────────────────────────
router.get("/category-distribution", async (req: any, res: Response) => {
  try {
    const data = await getCategoryDistribution(req.tenantId, req.query.academicYearId as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Transport Student Count ──────────────────────────────────────────────────
router.get("/transport-count", async (req: any, res: Response) => {
  try {
    const count = await getTransportStudentCount(req.tenantId);
    res.json({ success: true, data: { count } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Hostel Student Count ─────────────────────────────────────────────────────
router.get("/hostel-count", async (req: any, res: Response) => {
  try {
    const count = await getHostelStudentCount(req.tenantId);
    res.json({ success: true, data: { count } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Scholarship Student Count ────────────────────────────────────────────────
router.get("/scholarship-count", async (req: any, res: Response) => {
  try {
    const count = await getScholarshipStudentCount(req.tenantId);
    res.json({ success: true, data: { count } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── New Admissions Count ─────────────────────────────────────────────────────
router.get("/new-admissions", async (req: any, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const count = await getNewAdmissionsCount(req.tenantId, days);
    res.json({ success: true, data: { count, days } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Leaving Students Count ───────────────────────────────────────────────────
router.get("/leaving-students", async (req: any, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const count = await getLeavingStudentsCount(req.tenantId, days);
    res.json({ success: true, data: { count, days } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
