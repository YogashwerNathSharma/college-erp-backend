import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { cached, invalidateCache } from "../../utils/cache";

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

    //////////////////////////////////////////////////////
    // 🧠 SUPER ADMIN DASHBOARD
    //////////////////////////////////////////////////////

    if (role === "SUPER_ADMIN") {
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

      return res.json({
        success: true,
        data: {
          totalSchools, totalStudents, totalTeachers,
          activeTenants, inactiveTenants,
          activeTenantList, inactiveTenantList, recentTenants,
          insights: {
            growth: `${growth}%`,
            message: Number(growth) > 70 ? "Most tenants are active 🚀" : Number(growth) > 40 ? "Platform is growing steadily 📈" : "Need more active tenants ⚠️",
          },
        },
      });
    }

    //////////////////////////////////////////////////////
    // ❌ TENANT VALIDATION
    //////////////////////////////////////////////////////

    if (!tenantId) {
      return res.status(400).json({ success: false, message: "Tenant not found" });
    }

    //////////////////////////////////////////////////////
    // 🚀 TENANT DASHBOARD — LIGHTWEIGHT (max 5 queries per batch)
    //////////////////////////////////////////////////////

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [maleCount, femaleCount, totalAttendanceToday, presentToday, classRecords] = await Promise.all([
      prisma.student.count({ where: { tenantId, isDeleted: false, gender: "MALE" } }),
      prisma.student.count({ where: { tenantId, isDeleted: false, gender: "FEMALE" } }),
      prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow } } }),
      prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow }, status: { in: ["PRESENT", "LATE"] } } }),
      prisma.class.findMany({ where: { tenantId, isDeleted: false }, select: { id: true, name: true } }),
    ]);

    const attendanceToday = totalAttendanceToday > 0 ? Math.round((presentToday / totalAttendanceToday) * 100) : null;
    const otherGenderCount = totalStudents - maleCount - femaleCount;
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
      prisma.student.findMany({ where: { tenantId, isDeleted: false }, select: { firstName: true, lastName: true, dob: true } }),
    ]);

    // ─── PROCESS RESULTS ───
    const classWiseStrength = classStrength.map((cs: any) => {
      const cls = classRecords.find((c: any) => c.id === cs.classId);
      return { name: cls?.name || "Unknown", students: cs._count.id };
    }).sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    const recentPayments = recentPaymentsRaw.map((p: any) => ({
      amount: p.amount ?? 0,
      studentName: `${p.studentFee?.enrollment?.student?.firstName ?? ""} ${p.studentFee?.enrollment?.student?.lastName ?? ""}`.trim() || "Unknown",
      className: p.studentFee?.enrollment?.class?.name || "—",
      sectionName: p.studentFee?.enrollment?.section?.name || "",
      date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—",
      method: p.method,
      receiptNo: p.receiptNo,
    }));

    const defaulters = defaultersRaw.map((d: any) => ({
      pendingAmount: d.balanceAmount ?? 0,
      studentName: `${d.enrollment?.student?.firstName ?? ""} ${d.enrollment?.student?.lastName ?? ""}`.trim() || "Unknown",
      className: d.enrollment?.class?.name || "—",
      sectionName: d.enrollment?.section?.name || "",
    }));

    // Birthdays
    const todayDate = new Date();
    const birthdays = allStudents.filter((s: any) => {
      if (!s.dob) return false;
      const d = new Date(s.dob);
      return d.getDate() === todayDate.getDate() && d.getMonth() === todayDate.getMonth();
    }).map((s: any) => ({ name: `${s.firstName} ${s.lastName}`.trim() })).slice(0, 10);

    const insights = {
      growth: "0%",
      message: "Welcome to your dashboard",
      totalTeachers,
      attendanceToday,
    };

    const elapsed = Date.now() - _startTime;
    console.log(`✅ Dashboard loaded in ${elapsed}ms (${totalStudents} students)`);

    return res.json({
      success: true,
      data: {
        totalStudents, totalClasses, totalPaid, totalPending,
        totalTeachers, attendanceToday,
        monthlyData: [], // Lazy load separately if needed
        recentPayments, defaulters, insights,
        genderData, classWiseStrength,
        attendanceTrend: [], // Lazy load
        todayTimetable: [], // Lazy load
        events: upcomingEvents,
        notifications: [],
        birthdays,
        announcements: [],
        upcomingExams: [],
        tenant,
      },
    });

  } catch (err: any) {
    console.error("🔥 DASHBOARD ERROR:", err.message);
    return res.status(500).json({ success: false, message: "Dashboard failed", error: err.message });
  }
};
