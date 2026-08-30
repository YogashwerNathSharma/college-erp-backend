import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { cacheAside, invalidateCache } from "../../utils/cache";

// ⚡ Cache TTL: 30 minutes (1800 seconds)
const DASHBOARD_CACHE_TTL = 1800;

export const getDashboard = async (
  req: Request,
  res: Response
) => {

  try {
    const _startTime = Date.now();

    const {
      tenantId,
      role,
    } = req.user as any;

    // ⚡ PERF: Support ?refresh=true to force cache invalidation
    // Triggered by: refresh button click OR browser page refresh
    const forceRefresh = req.query.refresh === "true";

    //////////////////////////////////////////////////////
    // 🧠 SUPER ADMIN DASHBOARD
    //////////////////////////////////////////////////////

    if (role === "SUPER_ADMIN") {
      const cacheKey = `dashboard:superadmin`;

      if (forceRefresh) {
        await invalidateCache(cacheKey).catch(() => {});
      }

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
          totalSchools, totalStudents, totalTeachers,
          activeTenants, inactiveTenants,
          activeTenantList, inactiveTenantList, recentTenants,
          insights: {
            growth: `${growth}%`,
            message: Number(growth) > 70 ? "Most tenants are active 🚀" : Number(growth) > 40 ? "Platform is growing steadily 📈" : "Need more active tenants ⚠️",
          },
        };
      }, DASHBOARD_CACHE_TTL);

      const elapsed = Date.now() - _startTime;
      console.log(`✅ Super Admin Dashboard loaded in ${elapsed}ms`);

      return res.json({ success: true, data });
    }

    //////////////////////////////////////////////////////
    // ❌ TENANT VALIDATION
    //////////////////////////////////////////////////////

    if (!tenantId) {
      return res.status(400).json({ success: false, message: "Tenant not found" });
    }

    //////////////////////////////////////////////////////
    // 🚀 TENANT DASHBOARD — 30min CACHE + REFRESH SUPPORT
    //////////////////////////////////////////////////////

    const cacheKey = `dashboard:main:${tenantId}`;

    // ⚡ If refresh=true → delete old cache, new one will be created
    if (forceRefresh) {
      await invalidateCache(cacheKey).catch(() => {});
      console.log(`🔄 Dashboard cache cleared for tenant: ${tenantId}`);
    }

    const dashboardData = await cacheAside(cacheKey, async () => {
      // ─── BATCH 1: Core counts (5 queries) ───
      const [totalStudents, totalClasses, totalTeachers, fees, tenant] = await Promise.all([
        prisma.student.count({ where: { tenantId, isDeleted: false } }),
        prisma.class.count({ where: { tenantId, isDeleted: false } }),
        prisma.teacher.count({ where: { tenantId, isDeleted: false } }),
        prisma.studentFee.aggregate({ _sum: { paidAmount: true, balanceAmount: true, totalAmount: true }, where: { tenantId, isDeleted: false } }),
        prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, logoUrl: true, backgroundUrl: true, type: true, address: true, phone: true, email: true } }),
      ]);

      const totalPaid = Math.round(fees._sum.paidAmount ?? 0);
      const totalPending = Math.round(fees._sum.balanceAmount ?? 0);

      // ─── BATCH 2: Gender + attendance (5 queries) ───
      // ⚡ FIX: Calculate "today" in IST regardless of server timezone (UTC on Render, IST on local)
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const nowUTC = Date.now();
      const istMidnightUTC = new Date(nowUTC + IST_OFFSET_MS);
      istMidnightUTC.setUTCHours(0, 0, 0, 0); // midnight of IST "today" in UTC terms
      const today = new Date(istMidnightUTC.getTime() - IST_OFFSET_MS); // convert back to actual UTC
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const [maleCount, femaleCount, totalAttendanceToday, presentToday, classRecords] = await Promise.all([
        prisma.student.count({ where: { tenantId, isDeleted: false, gender: "MALE" } }),
        prisma.student.count({ where: { tenantId, isDeleted: false, gender: "FEMALE" } }),
        prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow } } }),
        prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow }, status: { in: ["PRESENT", "LATE"] } } }),
        prisma.class.findMany({ where: { tenantId, isDeleted: false }, select: { id: true, name: true } }),
      ]);

      const attendanceToday = totalAttendanceToday > 0 ? Math.round((presentToday / totalAttendanceToday) * 100) : null;
      const otherGenderCount = totalStudents - maleCount - femaleCount;

      // ─── Attendance Trend (last 7 days) ───
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const weekRecords = await prisma.attendance.findMany({
        where: { tenantId, isDeleted: false, date: { gte: sevenDaysAgo, lt: tomorrow } },
        select: { date: true, status: true },
      });

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const trendMap = new Map<string, { present: number; total: number }>();
      for (const r of weekRecords) {
        const key = r.date.toISOString().split("T")[0];
        if (!trendMap.has(key)) trendMap.set(key, { present: 0, total: 0 });
        const entry = trendMap.get(key)!;
        entry.total++;
        if (r.status === "PRESENT" || r.status === "LATE") entry.present++;
      }

      const attendanceTrend = Array.from(trendMap.entries())
        .map(([date, d]) => ({
          day: dayNames[new Date(date).getDay()],
          percentage: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
        }))
        .sort((a, b) => dayNames.indexOf(a.day) - dayNames.indexOf(b.day));

      const genderData = [
        { name: "Boys", value: maleCount },
        { name: "Girls", value: femaleCount },
        { name: "Other", value: otherGenderCount > 0 ? otherGenderCount : 0 },
      ];

      // ─── BATCH 3: Enrollments + recent data (5 queries) ───
      const [classStrength, recentPaymentsRaw, defaultersRaw, upcomingEvents, allStudents] = await Promise.all([
        prisma.enrollment.groupBy({ by: ["classId"], where: { tenantId, isDeleted: false, status: "active" }, _count: { id: true } }),
        prisma.payment.findMany({ where: { tenantId, isDeleted: false }, orderBy: { paymentDate: "desc" }, take: 5, select: { amount: true, paymentDate: true, receiptNo: true, method: true, studentFee: { select: { enrollment: { select: { student: { select: { firstName: true, lastName: true } }, class: { select: { name: true } }, section: { select: { name: true } } } } } } } }),
        prisma.studentFee.findMany({ where: { tenantId, isDeleted: false, balanceAmount: { gt: 0 }, enrollment: { status: "active" } }, orderBy: { balanceAmount: "desc" }, take: 5, select: { balanceAmount: true, enrollment: { select: { student: { select: { firstName: true, lastName: true } }, class: { select: { name: true } }, section: { select: { name: true } } } } } }),
        prisma.event.findMany({ where: { tenantId, startDate: { gte: new Date() } }, orderBy: { startDate: "asc" }, take: 10, select: { title: true, startDate: true, type: true, venue: true } }),
        prisma.student.findMany({ where: { tenantId, isDeleted: false }, select: { firstName: true, lastName: true, dob: true, enrollments: { where: { isDeleted: false, status: "active" }, orderBy: { createdAt: "desc" }, take: 1, select: { class: { select: { name: true } }, section: { select: { name: true } } } } } }),
      ]);

      // ─── PROCESS RESULTS ───
      const classWiseStrength = classStrength.map((cs: any) => {
        const cls = classRecords.find((c: any) => c.id === cs.classId);
        return { name: cls?.name || "Unknown", students: cs._count.id };
      }).sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      const recentPayments = recentPaymentsRaw.map((p: any) => ({
        amount: p.amount ?? 0,
        studentName: (() => { const fn = p.studentFee?.enrollment?.student?.firstName ?? ""; const ln = p.studentFee?.enrollment?.student?.lastName ?? ""; return fn.toLowerCase() === ln.toLowerCase() ? fn : `${fn} ${ln}`.trim(); })() || "Unknown",
        className: p.studentFee?.enrollment?.class?.name || "—",
        sectionName: p.studentFee?.enrollment?.section?.name || "",
        date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—",
        paidAt: p.paymentDate ? new Date(p.paymentDate).toISOString() : null,
        method: p.method,
        receiptNo: p.receiptNo,
      }));

      const defaulters = defaultersRaw.map((d: any) => ({
        pendingAmount: d.balanceAmount ?? 0,
        studentName: (() => { const fn = d.enrollment?.student?.firstName ?? ""; const ln = d.enrollment?.student?.lastName ?? ""; return fn.toLowerCase() === ln.toLowerCase() ? fn : `${fn} ${ln}`.trim(); })() || "Unknown",
        className: d.enrollment?.class?.name || "—",
        sectionName: d.enrollment?.section?.name || "",
      }));

      // Birthdays
      const todayDate = new Date();
      const birthdays = allStudents.filter((s: any) => {
        if (!s.dob) return false;
        const d = new Date(s.dob);
        return d.getDate() === todayDate.getDate() && d.getMonth() === todayDate.getMonth();
      }).map((s: any) => {
        const enrollment = s.enrollments?.[0];
        const className = enrollment?.class?.name || "";
        const section = enrollment?.section?.name || "";
        const name = s.firstName?.toLowerCase() === s.lastName?.toLowerCase() ? s.firstName : `${s.firstName} ${s.lastName}`.trim();
        return { name, className, section };
      }).slice(0, 10);

      // ─── Monthly Fee Collection (grouped by month for current academic year) ───
      const allPayments = await prisma.payment.findMany({
        where: { tenantId, isDeleted: false },
        select: { amount: true, paymentDate: true },
      });
      const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
      const monthlyMap: { [key: string]: number } = {};
      monthNames.forEach((m) => { monthlyMap[m] = 0; });
      allPayments.forEach((p: any) => {
        if (!p.paymentDate) return;
        const d = new Date(p.paymentDate);
        const monthIdx = d.getMonth(); // 0=Jan
        // Map to academic year: Apr(3)=0, May(4)=1, ..., Mar(2)=11
        const academicMonthIdx = (monthIdx - 3 + 12) % 12;
        const monthName = monthNames[academicMonthIdx];
        if (monthlyMap[monthName] !== undefined) {
          monthlyMap[monthName] += p.amount;
        }
      });
      const monthlyData = monthNames.map((month) => ({
        month,
        amount: Math.round(monthlyMap[month]),
      }));

      const insights = {
        growth: "0%",
        message: "Welcome to your dashboard",
        totalTeachers,
        // ⚡ If no attendance today (e.g., Sunday), show latest trend percentage
        attendanceToday: attendanceToday ?? (attendanceTrend.length > 0
          ? attendanceTrend[attendanceTrend.length - 1].percentage : null),
      };

      return {
        totalStudents, totalClasses, totalPaid, totalPending,
        totalTeachers, attendanceToday,
        monthlyData,
        recentPayments, defaulters, insights,
        genderData, classWiseStrength,
        attendanceTrend,
        todayTimetable: [],
        events: upcomingEvents,
        notifications: [],
        birthdays,
        announcements: [],
        upcomingExams: [],
        tenant,
      };
    }, DASHBOARD_CACHE_TTL);

    const elapsed = Date.now() - _startTime;
    console.log(`✅ Dashboard loaded in ${elapsed}ms`);

    return res.json({
      success: true,
      data: dashboardData,
    });

  } catch (err: any) {
    console.error("🔥 DASHBOARD ERROR:", err.message);
    return res.status(500).json({ success: false, message: "Dashboard failed", error: err.message });
  }
};
