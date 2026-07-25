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

      //////////////////////////////////////////////////////
      // 📊 TOTAL COUNTS
      //////////////////////////////////////////////////////

      const totalSchools =
        await prisma.tenant.count();

      const totalStudents =
        await prisma.student.count();

      const totalTeachers =
        await prisma.teacher.count();

      //////////////////////////////////////////////////////
      // ✅ ACTIVE TENANTS COUNT
      //////////////////////////////////////////////////////

      const activeTenants =
        await prisma.tenant.count({
          where: {
            isActive: true,
          },
        });

      //////////////////////////////////////////////////////
      // ❌ INACTIVE TENANTS COUNT
      //////////////////////////////////////////////////////

      const inactiveTenants =
        await prisma.tenant.count({
          where: {
            isActive: false,
          },
        });

      //////////////////////////////////////////////////////
      // 🟢 ACTIVE TENANT LIST
      //////////////////////////////////////////////////////

      const activeTenantList =
        await prisma.tenant.findMany({

          where: {
            isActive: true,
          },

          //////////////////////////////////////////////////
          // 🔥 FIXED
          //////////////////////////////////////////////////

          orderBy: {
            updatedAt: "desc",
          },

          select: {
            id: true,
            name: true,
            logoUrl: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      //////////////////////////////////////////////////////
      // 🔴 INACTIVE TENANT LIST
      //////////////////////////////////////////////////////

      const inactiveTenantList =
        await prisma.tenant.findMany({

          where: {
            isActive: false,
          },

          //////////////////////////////////////////////////
          // 🔥 FIXED
          //////////////////////////////////////////////////

          orderBy: {
            updatedAt: "desc",
          },

          select: {
            id: true,
            name: true,
            logoUrl: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      //////////////////////////////////////////////////////
      // 🏫 RECENT TENANTS
      //////////////////////////////////////////////////////

      const recentTenants =
        await prisma.tenant.findMany({

          take: 5,

          //////////////////////////////////////////////////
          // 🔥 FIXED
          // Recent active/inactive changes show honge
          //////////////////////////////////////////////////

          orderBy: {
            updatedAt: "desc",
          },

          select: {
            id: true,
            name: true,
            logoUrl: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      //////////////////////////////////////////////////////
      // 📈 PLATFORM GROWTH
      //////////////////////////////////////////////////////

      const growth =
        totalSchools > 0
          ? (
              (activeTenants /
                totalSchools) *
              100
            ).toFixed(1)
          : "0";

      //////////////////////////////////////////////////////
      // 🚀 SUPER ADMIN RESPONSE
      //////////////////////////////////////////////////////

      return res.json({

        success: true,

        data: {

          //////////////////////////////////////////////////
          // COUNTS
          //////////////////////////////////////////////////

          totalSchools,
          totalStudents,
          totalTeachers,

          //////////////////////////////////////////////////
          // ACTIVE / INACTIVE
          //////////////////////////////////////////////////

          activeTenants,
          inactiveTenants,

          //////////////////////////////////////////////////
          // LISTS
          //////////////////////////////////////////////////

          activeTenantList,
          inactiveTenantList,
          recentTenants,

          //////////////////////////////////////////////////
          // INSIGHTS
          //////////////////////////////////////////////////

          insights: {

            growth: `${growth}%`,

            message:
              Number(growth) > 70
                ? "Most tenants are active 🚀"
                : Number(growth) > 40
                ? "Platform is growing steadily 📈"
                : "Need more active tenants ⚠️",

          },
        },
      });
    }

    //////////////////////////////////////////////////////
    // ❌ TENANT VALIDATION
    //////////////////////////////////////////////////////

    if (!tenantId) {

      return res.status(400).json({

        success: false,

        message: "Tenant not found",

      });
    }

    //////////////////////////////////////////////////////
    // 👨‍🎓 TOTAL STUDENTS
    //////////////////////////////////////////////////////

    // 🚀 CACHED DASHBOARD DATA (30s TTL — instant on repeated loads)
    const dashData = await cached(`dashboard:${tenantId}`, 30000, async () => {
    // ══════════════════════════════════════════════════════
    // 🚀 PARALLEL QUERY EXECUTION (all independent queries at once)
    // ══════════════════════════════════════════════════════

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const todayDay = dayNames[new Date().getDay()] as any;

    // ─── BATCH 1: All counts + aggregates (independent) ───
    const [
      totalStudents,
      totalClasses,
      totalTeachers,
      totalAttendanceToday,
      presentToday,
      maleCount,
      femaleCount,
      classStrength,
      classRecords,
      fees,
      tenant,
    ] = await Promise.all([
      prisma.student.count({ where: { tenantId, isDeleted: false } }),
      prisma.class.count({ where: { tenantId, isDeleted: false } }),
      prisma.teacher.count({ where: { tenantId, isDeleted: false } }),
      prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow } } }),
      prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow }, status: { in: ["PRESENT", "LATE"] } } }),
      prisma.student.count({ where: { tenantId, isDeleted: false, gender: "Male" } }),
      prisma.student.count({ where: { tenantId, isDeleted: false, gender: "Female" } }),
      prisma.enrollment.groupBy({ by: ["classId"], where: { tenantId, isDeleted: false, status: "active" }, _count: { id: true } }),
      prisma.class.findMany({ where: { tenantId, isDeleted: false }, select: { id: true, name: true } }),
      prisma.studentFee.aggregate({ _sum: { paidAmount: true, balanceAmount: true, totalAmount: true }, where: { tenantId, isDeleted: false } }),
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, logoUrl: true, backgroundUrl: true, type: true, address: true, phone: true, email: true } }),
    ]);

    // ─── BATCH 2: Data-heavy queries (also parallel) ───
    const [
      attendanceRecords,
      feeData,
      recentPaymentsRaw,
      defaultersRaw,
      todayTimetableRaw,
      upcomingEvents,
      noticesRaw,
      allStudents,
      upcomingExamsRaw,
    ] = await Promise.all([
      prisma.attendance.findMany({ where: { tenantId, date: { gte: sevenDaysAgo, lt: tomorrow } }, select: { date: true, status: true } }),
      prisma.studentFee.findMany({ where: { tenantId }, select: { paidAmount: true, createdAt: true }, orderBy: { createdAt: "asc" } }),
      prisma.payment.findMany({ where: { tenantId, isDeleted: false }, orderBy: { paymentDate: "desc" }, take: 5, select: { amount: true, paymentDate: true, receiptNo: true, method: true, studentFee: { select: { enrollment: { select: { student: { select: { firstName: true, lastName: true } }, class: { select: { name: true } }, section: { select: { name: true } } } } } } } }),
      prisma.studentFee.findMany({ where: { tenantId, isDeleted: false, balanceAmount: { gt: 0 }, enrollment: { status: "active" } }, orderBy: { balanceAmount: "desc" }, take: 5, select: { balanceAmount: true, enrollment: { select: { student: { select: { firstName: true, lastName: true } }, class: { select: { name: true } }, section: { select: { name: true } } } } } }),
      todayDay !== "SUN" ? prisma.timetable.findMany({ where: { tenantId, day: todayDay }, orderBy: { period: "asc" }, select: { period: true, subject: { select: { name: true } }, class: { select: { name: true } }, section: { select: { name: true } }, teacher: { select: { firstName: true, lastName: true } } } }) : Promise.resolve([]),
      prisma.event.findMany({ where: { tenantId, startDate: { gte: new Date() } }, orderBy: { startDate: "asc" }, take: 10, select: { title: true, startDate: true, type: true, venue: true } }),
      prisma.notice.findMany({ where: { tenantId, isDeleted: false, isActive: true }, orderBy: { createdAt: "desc" }, take: 10, select: { title: true, content: true, type: true, createdAt: true } }),
      prisma.student.findMany({ where: { tenantId, isDeleted: false }, select: { firstName: true, lastName: true, dob: true } }),
      prisma.examSchedule.findMany({ where: { tenantId, isDeleted: false, examDate: { gte: new Date() } }, orderBy: { examDate: "asc" }, take: 10, select: { examDate: true, startTime: true, subject: { select: { name: true } }, exam: { select: { name: true } } } }),
    ]);

    // ─── PROCESS RESULTS (CPU only, no I/O) ───

    const attendanceToday = totalAttendanceToday > 0 ? Math.round((presentToday / totalAttendanceToday) * 100) : null;

    const otherGenderCount = totalStudents - maleCount - femaleCount;
    const genderData = [
      { name: "Boys", value: maleCount },
      { name: "Girls", value: femaleCount },
      { name: "Other", value: otherGenderCount > 0 ? otherGenderCount : 0 },
    ];

    const classWiseStrength = classStrength.map((cs: any) => {
      const cls = classRecords.find((c: any) => c.id === cs.classId);
      return { name: cls?.name || "Unknown", students: cs._count.id };
    }).sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    const attendanceTrendMap: Record<string, { total: number; present: number }> = {};
    attendanceRecords.forEach((a: any) => {
      const day = new Date(a.date).toLocaleDateString("en-IN", { weekday: "short" });
      if (!attendanceTrendMap[day]) attendanceTrendMap[day] = { total: 0, present: 0 };
      attendanceTrendMap[day].total++;
      if (a.status === "PRESENT" || a.status === "LATE") attendanceTrendMap[day].present++;
    });
    const attendanceTrend = Object.entries(attendanceTrendMap).map(([day, val]) => ({
      day, percentage: val.total > 0 ? Math.round((val.present / val.total) * 100) : 0,
    }));

    const totalPaid = Math.round(fees._sum.paidAmount ?? 0);
    const totalPending = Math.round(fees._sum.balanceAmount ?? 0);

    const monthlyMap: Record<string, number> = {};
    feeData.forEach((f: any) => {
      if (!f.createdAt) return;
      const date = new Date(f.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + (f.paidAmount ?? 0);
    });
    const monthlyData = Object.keys(monthlyMap).map((k) => {
      const [year, month] = k.split("-");
      const date = new Date(Number(year), Number(month));
      return { month: date.toLocaleString("default", { month: "short" }), amount: monthlyMap[k] };
    });

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

    const currentMonth = monthlyData[monthlyData.length - 1]?.amount ?? 0;
    const prevMonth = monthlyData[monthlyData.length - 2]?.amount ?? 0;
    let growth = 0;
    if (prevMonth > 0 && currentMonth > 0) growth = ((currentMonth - prevMonth) / prevMonth) * 100;
    else if (prevMonth === 0 && currentMonth > 0) growth = 100;
    else if (prevMonth > 0 && currentMonth === 0) growth = -100;

    const insights = {
      growth: `${growth.toFixed(1)}%`,
      message: growth > 0 ? "Fees collection increased this month 📈" : growth < 0 ? "Fees collection dropped this month 📉" : "No change in fee collection",
    };

    const todayTimetable = todayTimetableRaw.map((t: any) => ({
      subject: t.subject?.name || "—", period: `Period ${t.period}`,
      class: t.class?.name || "", section: t.section?.name || "",
      teacher: `${t.teacher?.firstName || ""} ${t.teacher?.lastName || ""}`.trim(),
    }));

    const events = upcomingEvents.map((e: any) => ({
      title: e.title, date: new Date(e.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      type: e.type, venue: e.venue,
    }));

    const notifications = noticesRaw.map((n: any) => ({
      title: n.title, message: n.content?.substring(0, 100) || n.title, type: n.type, date: n.createdAt,
    }));

    const todayMonth = new Date().getMonth() + 1;
    const todayDateNum = new Date().getDate();
    const birthdays = allStudents.filter((s: any) => {
      if (!s.dob) return false;
      const d = new Date(s.dob);
      return d.getMonth() + 1 === todayMonth && d.getDate() === todayDateNum;
    }).map((s: any) => ({ name: `${s.firstName || ""} ${s.lastName || ""}`.trim(), role: "Student" }));

    const announcements = noticesRaw.slice(0, 5).map((n: any) => ({
      title: n.title, message: n.content?.substring(0, 80) || "",
    }));

    const upcomingExams = upcomingExamsRaw.map((e: any) => ({
      name: `${e.exam?.name || "Exam"} - ${e.subject?.name || "Subject"}`,
      date: new Date(e.examDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      time: e.startTime || "",
    }));



    
    return {
      totalStudents, totalClasses, totalTeachers, totalPaid, totalPending,
      monthlyData, recentPayments, defaulters, insights: { ...insights, totalTeachers, attendanceToday },
      genderData, classWiseStrength, attendanceTrend,
      todayTimetable, events, notifications, birthdays, announcements, upcomingExams,
      tenant,
    };
    });

    return res.json({ success: true, data: dashData });;

  } catch (err: any) {

    console.error(
      "🔥 DASHBOARD ERROR:",
      err.message
    );

    console.error(err);

    return res.status(500).json({

      success: false,

      message:
        "Dashboard failed",

      error:
        err.message,

    });
  }
};