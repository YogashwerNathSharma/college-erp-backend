import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { cacheAside, invalidateCache } from "../../utils/cache";

// Performance-focused dashboard controller.
// Keeps the existing response contract while avoiding unbounded payment reads
// for the monthly chart. The existing controller remains available for rollback.
const DASHBOARD_CACHE_TTL = 1800;

const nameOf = (firstName?: string | null, lastName?: string | null) => {
  const fn = firstName ?? "";
  const ln = lastName ?? "";
  return fn && ln && fn.toLowerCase() === ln.toLowerCase() ? fn : `${fn} ${ln}`.trim();
};

export const getDashboardPerformance = async (req: Request, res: Response) => {
  const startedAt = Date.now();

  try {
    const { tenantId, role } = req.user as any;
    const forceRefresh = req.query.refresh === "true";

    if (role === "SUPER_ADMIN") {
      const cacheKey = "dashboard:superadmin";
      if (forceRefresh) await invalidateCache(cacheKey).catch(() => {});

      const data = await cacheAside(cacheKey, async () => {
        const [totalSchools, totalStudents, totalTeachers, activeTenants, inactiveTenants] = await Promise.all([
          prisma.tenant.count(),
          prisma.student.count(),
          prisma.teacher.count(),
          prisma.tenant.count({ where: { isActive: true } }),
          prisma.tenant.count({ where: { isActive: false } }),
        ]);

        const [activeTenantList, inactiveTenantList, recentTenants] = await Promise.all([
          prisma.tenant.findMany({ where: { isActive: true }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, logoUrl: true, isActive: true, createdAt: true, updatedAt: true } }),
          prisma.tenant.findMany({ where: { isActive: false }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, logoUrl: true, isActive: true, createdAt: true, updatedAt: true } }),
          prisma.tenant.findMany({ take: 5, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, logoUrl: true, isActive: true, createdAt: true, updatedAt: true } }),
        ]);

        const growth = totalSchools > 0 ? ((activeTenants / totalSchools) * 100).toFixed(1) : "0";
        return {
          totalSchools, totalStudents, totalTeachers, activeTenants, inactiveTenants,
          activeTenantList, inactiveTenantList, recentTenants,
          insights: {
            growth: `${growth}%`,
            message: Number(growth) > 70 ? "Most tenants are active 🚀" : Number(growth) > 40 ? "Platform is growing steadily 📈" : "Need more active tenants ⚠️",
          },
        };
      }, DASHBOARD_CACHE_TTL);

      console.log(`✅ Super Admin Dashboard loaded in ${Date.now() - startedAt}ms`);
      return res.json({ success: true, data });
    }

    if (!tenantId) return res.status(400).json({ success: false, message: "Tenant not found" });

    const academicYearId: string | undefined =
      (req as any).academicYearId ||
      (req.query.academicYearId as string) ||
      (req.headers["x-academic-year-id"] as string) ||
      undefined;

    const cacheKey = `dashboard:main:${tenantId}:${academicYearId || "all"}`;
    if (forceRefresh) await invalidateCache(cacheKey).catch(() => {});

    const data = await cacheAside(cacheKey, async () => {
      const enrollmentWhere: any = { tenantId, isDeleted: false, status: "active" };
      if (academicYearId) enrollmentWhere.academicYearId = academicYearId;

      // Resolve the selected academic year once. This gives the monthly payment
      // query a bounded date range instead of reading the tenant's full history.
      const academicYear = academicYearId
        ? await prisma.academicYear.findUnique({ where: { id: academicYearId }, select: { startDate: true, endDate: true } })
        : null;

      const [totalStudents, totalClasses, totalTeachers, fees, tenant] = await Promise.all([
        academicYearId
          ? prisma.enrollment.count({ where: enrollmentWhere })
          : prisma.student.count({ where: { tenantId, isDeleted: false } }),
        prisma.class.count({ where: { tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}) } }),
        prisma.teacher.count({ where: { tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}) } }),
        prisma.studentFee.aggregate({
          _sum: { paidAmount: true, balanceAmount: true, totalAmount: true },
          where: { tenantId, isDeleted: false, ...(academicYearId ? { enrollment: { academicYearId, isDeleted: false } } : {}) },
        }),
        prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { name: true, logoUrl: true, backgroundUrl: true, type: true, address: true, phone: true, email: true },
        }),
      ]);

      const totalPaid = Math.round(fees._sum.paidAmount ?? 0);
      const totalPending = Math.round(fees._sum.balanceAmount ?? 0);

      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const nowUTC = Date.now();
      const istMidnightUTC = new Date(nowUTC + IST_OFFSET_MS);
      istMidnightUTC.setUTCHours(0, 0, 0, 0);
      const today = new Date(istMidnightUTC.getTime() - IST_OFFSET_MS);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const genderEnrollmentFilter: any = academicYearId
        ? { enrollments: { some: { academicYearId, status: "active", isDeleted: false } } }
        : {};
      const attendanceYearFilter: any = academicYearId ? { academicYearId } : {};
      const classYearFilter: any = academicYearId ? { academicYearId } : {};

      const [maleCount, femaleCount, totalAttendanceToday, presentToday, classRecords, weekRecords] = await Promise.all([
        prisma.student.count({ where: { tenantId, isDeleted: false, gender: "MALE", ...genderEnrollmentFilter } }),
        prisma.student.count({ where: { tenantId, isDeleted: false, gender: "FEMALE", ...genderEnrollmentFilter } }),
        prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow }, ...attendanceYearFilter } }),
        prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow }, status: { in: ["PRESENT", "LATE"] }, ...attendanceYearFilter } }),
        prisma.class.findMany({ where: { tenantId, isDeleted: false, ...classYearFilter }, select: { id: true, name: true } }),
        prisma.attendance.findMany({ where: { tenantId, isDeleted: false, date: { gte: sevenDaysAgo, lt: tomorrow }, ...attendanceYearFilter }, select: { date: true, status: true } }),
      ]);

      const attendanceToday = totalAttendanceToday > 0 ? Math.round((presentToday / totalAttendanceToday) * 100) : null;
      const otherGenderCount = Math.max(0, totalStudents - maleCount - femaleCount);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const trendMap = new Map<string, { present: number; total: number }>();
      for (const r of weekRecords) {
        const key = r.date.toISOString().split("T")[0];
        const entry = trendMap.get(key) || { present: 0, total: 0 };
        entry.total++;
        if (r.status === "PRESENT" || r.status === "LATE") entry.present++;
        trendMap.set(key, entry);
      }
      const attendanceTrend = Array.from(trendMap.entries()).map(([date, d]) => ({
        day: dayNames[new Date(date).getDay()],
        percentage: d.total ? Math.round((d.present / d.total) * 100) : 0,
      }));

      const [classStrength, recentPaymentsRaw, defaultersRaw, upcomingEvents, allStudents] = await Promise.all([
        prisma.enrollment.groupBy({ by: ["classId"], where: enrollmentWhere, _count: { id: true } }),
        prisma.payment.findMany({
          where: { tenantId, isDeleted: false, ...(academicYearId ? { studentFee: { enrollment: { academicYearId, isDeleted: false } } } : {}) },
          orderBy: { paymentDate: "desc" }, take: 5,
          select: { amount: true, paymentDate: true, receiptNo: true, method: true, studentFee: { select: { enrollment: { select: { student: { select: { firstName: true, lastName: true } }, class: { select: { name: true } }, section: { select: { name: true } } } } } } },
        }),
        prisma.studentFee.findMany({
          where: { tenantId, isDeleted: false, balanceAmount: { gt: 0 }, enrollment: { status: "active", isDeleted: false, ...(academicYearId ? { academicYearId } : {}) } },
          orderBy: { balanceAmount: "desc" }, take: 5,
          select: { balanceAmount: true, enrollment: { select: { student: { select: { firstName: true, lastName: true } }, class: { select: { name: true } }, section: { select: { name: true } } } } },
        }),
        prisma.event.findMany({ where: { tenantId, startDate: { gte: new Date() } }, orderBy: { startDate: "asc" }, take: 10, select: { title: true, startDate: true, type: true, venue: true } }),
        prisma.student.findMany({
          where: { tenantId, isDeleted: false, ...(academicYearId ? { enrollments: { some: { academicYearId, status: "active", isDeleted: false } } } : {}) },
          select: { firstName: true, lastName: true, dob: true, enrollments: { where: { isDeleted: false, status: "active", ...(academicYearId ? { academicYearId } : {}) }, orderBy: { createdAt: "desc" }, take: 1, select: { class: { select: { name: true } }, section: { select: { name: true } } } } },
        }),
      ]);

      const classWiseStrength = classStrength.map((cs: any) => ({
        name: classRecords.find((c: any) => c.id === cs.classId)?.name || "Unknown",
        students: cs._count.id,
      })).sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      const recentPayments = recentPaymentsRaw.map((p: any) => ({
        amount: p.amount ?? 0,
        studentName: nameOf(p.studentFee?.enrollment?.student?.firstName, p.studentFee?.enrollment?.student?.lastName) || "Unknown",
        className: p.studentFee?.enrollment?.class?.name || "—",
        sectionName: p.studentFee?.enrollment?.section?.name || "",
        date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—",
        paidAt: p.paymentDate ? new Date(p.paymentDate).toISOString() : null,
        method: p.method,
        receiptNo: p.receiptNo,
      }));

      const defaulters = defaultersRaw.map((d: any) => ({
        pendingAmount: d.balanceAmount ?? 0,
        studentName: nameOf(d.enrollment?.student?.firstName, d.enrollment?.student?.lastName) || "Unknown",
        className: d.enrollment?.class?.name || "—",
        sectionName: d.enrollment?.section?.name || "",
      }));

      const todayDate = new Date();
      const birthdays = allStudents.filter((s: any) => {
        if (!s.dob) return false;
        const d = new Date(s.dob);
        return d.getDate() === todayDate.getDate() && d.getMonth() === todayDate.getMonth();
      }).map((s: any) => {
        const e = s.enrollments?.[0];
        return { name: nameOf(s.firstName, s.lastName), className: e?.class?.name || "", section: e?.section?.name || "" };
      }).filter((b: any) => b.name).slice(0, 10);

      // Bounded monthly read: selected academic year, or only the last 12 months
      // when no year is selected. This removes the previous unbounded tenant-wide
      // payment scan from the dashboard hot path.
      const rangeStart = academicYear?.startDate || new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      const rangeEnd = academicYear?.endDate || tomorrow;
      const boundedPayments = await prisma.payment.findMany({
        where: { tenantId, isDeleted: false, paymentDate: { gte: rangeStart, lt: rangeEnd }, ...(academicYearId ? { studentFee: { enrollment: { academicYearId, isDeleted: false } } } : {}) },
        select: { amount: true, paymentDate: true },
      });

      const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
      const monthlyMap: Record<string, number> = Object.fromEntries(monthNames.map((m) => [m, 0]));
      for (const p of boundedPayments) {
        if (!p.paymentDate) continue;
        const idx = (new Date(p.paymentDate).getMonth() - 3 + 12) % 12;
        monthlyMap[monthNames[idx]] += p.amount ?? 0;
      }
      const monthlyData = monthNames.map((month) => ({ month, amount: Math.round(monthlyMap[month]) }));

      const insights = {
        growth: "0%",
        message: "Welcome to your dashboard",
        totalTeachers,
        attendanceToday: attendanceToday ?? (attendanceTrend.length ? attendanceTrend[attendanceTrend.length - 1].percentage : null),
      };

      return {
        totalStudents, totalClasses, totalPaid, totalPending, totalTeachers,
        attendanceToday, monthlyData, recentPayments, defaulters, insights,
        genderData: [{ name: "Boys", value: maleCount }, { name: "Girls", value: femaleCount }, { name: "Other", value: otherGenderCount }],
        classWiseStrength, attendanceTrend,
        todayTimetable: [], events: upcomingEvents, notifications: [], birthdays,
        announcements: [], upcomingExams: [], tenant,
        academicYearId: academicYearId || null,
      };
    }, DASHBOARD_CACHE_TTL);

    console.log(`✅ Dashboard loaded in ${Date.now() - startedAt}ms (year: ${academicYearId || "all"})`);
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("🔥 DASHBOARD ERROR:", err.message);
    return res.status(500).json({ success: false, message: "Dashboard failed", error: err.message });
  }
};
