import { Request, Response } from "express";
import prisma from "../../utils/prisma";

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const { tenantId, role } = req.user as any;

    console.log("USER:", req.user);

    //////////////////////////////////////////////////////
    // 🧠 SUPER ADMIN
    //////////////////////////////////////////////////////
    if (role === "SUPER_ADMIN") {
      const totalSchools = await prisma.tenant.count();
      const totalStudents = await prisma.student.count();
      const totalTeachers = await prisma.teacher.count();

      return res.json({
        success: true,
        data: {
          totalSchools,
          totalStudents,
          totalTeachers,
        },
      });
    }

    //////////////////////////////////////////////////////
    // ❌ VALIDATION
    //////////////////////////////////////////////////////
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant not found" });
    }

    //////////////////////////////////////////////////////
    // 📊 CORE COUNTS
    //////////////////////////////////////////////////////
    const totalStudents = await prisma.student.count({
      where: { tenantId },
    });

    const totalClasses = await prisma.class.count({
      where: { tenantId },
    });

    //////////////////////////////////////////////////////
    // 💰 FEES SUMMARY
    //////////////////////////////////////////////////////
    const fees = await prisma.studentFee.aggregate({
      where: { tenantId },
      _sum: {
        paidAmount: true,
        pendingAmount: true,
      },
    });

    const totalPaid = fees._sum.paidAmount ?? 0;
    const totalPending = fees._sum.pendingAmount ?? 0;

    //////////////////////////////////////////////////////
    // 🏫 TENANT DATA
    //////////////////////////////////////////////////////
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        logoUrl: true,
        backgroundUrl: true,
        type: true,
      },
    });

    //////////////////////////////////////////////////////
    // 📈 MONTHLY DATA
    //////////////////////////////////////////////////////
    const feeData = await prisma.studentFee.findMany({
      where: { tenantId },
      select: {
        paidAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const monthlyMap: Record<string, number> = {};

    feeData.forEach((f) => {
      if (!f.createdAt) return;

      const date = new Date(f.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      monthlyMap[key] = (monthlyMap[key] || 0) + (f.paidAmount ?? 0);
    });

    const monthlyData = Object.keys(monthlyMap).map((k) => {
      const [year, month] = k.split("-");
      const date = new Date(Number(year), Number(month));

      return {
        month: date.toLocaleString("default", { month: "short" }),
        fees: monthlyMap[k],
      };
    });

    //////////////////////////////////////////////////////
    // 💳 RECENT PAYMENTS
    //////////////////////////////////////////////////////
    const recentPaymentsRaw = await prisma.studentFee.findMany({
  where: { tenantId },
  orderBy: { createdAt: "desc" },
  take: 5,
  select: {
    paidAmount: true,
    createdAt: true,
    enrollment: {
      select: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    },
  },
});

const recentPayments = recentPaymentsRaw.map((p: any) => ({
  amount: p.paidAmount ?? 0,
  date: p.createdAt,
  studentName:
    `${p.enrollment?.student?.firstName ?? ""} ${p.enrollment?.student?.lastName ?? ""}`.trim() ||
    "Unknown",
}));

    //////////////////////////////////////////////////////
    // ⚠️ TOP DEFAULTERS
    //////////////////////////////////////////////////////
    const defaultersRaw = await prisma.studentFee.findMany({
  where: {
    tenantId,
    pendingAmount: { gt: 0 },
  },
  orderBy: {
    pendingAmount: "desc",
  },
  take: 5,
  select: {
    pendingAmount: true,
    enrollment: {
      select: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    },
  },
});

const defaulters = defaultersRaw.map((d: any) => ({
  amount: d.pendingAmount ?? 0,
  studentName:
    `${d.enrollment?.student?.firstName ?? ""} ${d.enrollment?.student?.lastName ?? ""}`.trim() ||
    "Unknown",
}));
    //////////////////////////////////////////////////////
    // 📊 INSIGHTS
    //////////////////////////////////////////////////////
const currentMonth =
  monthlyData[monthlyData.length - 1]?.fees ?? 0;

const prevMonth =
  monthlyData[monthlyData.length - 2]?.fees ?? 0;

    let growth = 0;
    if (prevMonth > 0) {
      growth = ((currentMonth - prevMonth) / prevMonth) * 100;
    }

    const insights = {
      growth: `${growth.toFixed(1)}%`,
      message:
        growth > 0
          ? "Fees collection increased this month 📈"
          : growth < 0
          ? "Fees collection dropped this month 📉"
          : "No change in fee collection",
    };

    //////////////////////////////////////////////////////
    // 🚀 FINAL RESPONSE
    //////////////////////////////////////////////////////
    return res.json({
      success: true,
      data: {
        totalStudents,
        totalClasses,
        totalPaid,
        totalPending,
        monthlyData,
        recentPayments,
        defaulters,
        insights,
        tenant,
      },
    });

  } catch (err: any) {
    console.error("🔥 DASHBOARD ERROR:", err.message);
    console.error(err);

    return res.status(500).json({
      message: "Dashboard failed",
      error: err.message,
    });
  }
};