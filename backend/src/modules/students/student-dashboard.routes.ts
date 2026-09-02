// ══════════════════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD ROUTES
// Mount at: app.use("/api/students/dashboard", studentDashboardRoutes)
// ══════════════════════════════════════════════════════════════════════════════
console.log("✅ Student Dashboard Routes Loaded");
import { Router, Response } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";
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
import {
  getFullDashboardDataAcademicYear,
  getTransportStudentCountAcademicYear,
  getHostelStudentCountAcademicYear,
} from "./student-dashboard.academicYear.service";

const router = Router();
router.use(authMiddleware, resolveTenant, resolveAcademicYear);

// ── Dashboard Cache (30 minutes) ──────────────────────────────────────────────
const dashboardCache = new Map<string, { data: any; expiry: number; createdAt: number }>();
const CACHE_TTL = 30 * 60 * 1000;

function resolveAcademicYearId(req: any): string | undefined {
  return req.academicYearId
    || (req.query.academicYearId as string)
    || (req.headers["x-academic-year-id"] as string)
    || undefined;
}

function requireAcademicYearId(req: any): string {
  const id = resolveAcademicYearId(req);
  if (!id) throw new Error("Academic year context is required");
  return id;
}

router.get("/full", async (req: any, res: Response) => {
  try {
    const _start = Date.now();
    const yearId = requireAcademicYearId(req);
    const forceRefresh = req.query.refresh === "true";
    const cacheKey = `${req.tenantId}|${yearId}`;

    if (forceRefresh) dashboardCache.delete(cacheKey);

    const cached = dashboardCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return res.json({ success: true, data: cached.data, _cached: true });
    }

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve("TIMEOUT"), 30000);
    });
    const dataPromise = getFullDashboardDataAcademicYear(req.tenantId, yearId);
    const result = await Promise.race([dataPromise, timeoutPromise]);

    if (result === "TIMEOUT") {
      console.warn("⏱️ Student Dashboard TIMEOUT after 30s");
      return res.json({
        success: true,
        data: {
          stats: { totalStudents: 0, activeStudents: 0, inactiveStudents: 0, newAdmissions: 0, leavingStudents: 0, boys: 0, girls: 0, transportStudents: 0, hostelStudents: 0, scholarshipStudents: 0, feeDefaulters: 0, birthdayTodayCount: 0 },
          birthdayStudents: [], classStrength: [], sectionStrength: [], categoryDistribution: [],
          genderRatio: { male: 0, female: 0, other: 0, total: 0 }, monthlyAdmission: [], studentGrowth: [],
          admissionTrend: [], recentAdmissions: [], feeDefaultersList: [], _timeout: true,
        },
      });
    }

    dashboardCache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL, createdAt: Date.now() });
    console.log(`⚡ Student Dashboard loaded in ${Date.now() - _start}ms`);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Student Dashboard Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/stats", async (req: any, res: Response) => {
  try { res.json({ success: true, data: await getDashboardStats(req.tenantId, requireAcademicYearId(req)) }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/birthday-today", async (req: any, res: Response) => {
  try { const data = await getBirthdayToday(req.tenantId, requireAcademicYearId(req)); res.json({ success: true, data, count: data.length }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/section-strength", async (req: any, res: Response) => {
  try { res.json({ success: true, data: await getSectionStrength(req.tenantId, requireAcademicYearId(req)) }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/class-strength", async (req: any, res: Response) => {
  try { res.json({ success: true, data: await getClassStrength(req.tenantId, requireAcademicYearId(req)) }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/monthly-admission", async (req: any, res: Response) => {
  try { res.json({ success: true, data: await getMonthlyAdmissionTrend(req.tenantId, requireAcademicYearId(req)) }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/student-growth", async (req: any, res: Response) => {
  try { res.json({ success: true, data: await getStudentGrowth(req.tenantId) }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/gender-ratio", async (req: any, res: Response) => {
  try { res.json({ success: true, data: await getGenderRatio(req.tenantId, requireAcademicYearId(req)) }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/category-distribution", async (req: any, res: Response) => {
  try { res.json({ success: true, data: await getCategoryDistribution(req.tenantId, requireAcademicYearId(req)) }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/transport-count", async (req: any, res: Response) => {
  try { res.json({ success: true, data: { count: await getTransportStudentCountAcademicYear(req.tenantId, requireAcademicYearId(req)) } }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/hostel-count", async (req: any, res: Response) => {
  try { res.json({ success: true, data: { count: await getHostelStudentCountAcademicYear(req.tenantId, requireAcademicYearId(req)) } }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/scholarship-count", async (req: any, res: Response) => {
  try { res.json({ success: true, data: { count: await getScholarshipStudentCount(req.tenantId) } }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/new-admissions", async (req: any, res: Response) => {
  try { const days = parseInt(req.query.days as string) || 30; const count = await getNewAdmissionsCount(req.tenantId, days, requireAcademicYearId(req)); res.json({ success: true, data: { count, days } }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/leaving-students", async (req: any, res: Response) => {
  try { const days = parseInt(req.query.days as string) || 30; const count = await getLeavingStudentsCount(req.tenantId, days); res.json({ success: true, data: { count, days } }); }
  catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
