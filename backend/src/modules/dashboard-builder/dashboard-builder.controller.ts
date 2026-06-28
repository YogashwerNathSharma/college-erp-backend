import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════════
// DASHBOARD BUILDER CONTROLLER
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/dashboard-builder/layouts
 * Get all layouts for the current user
 */
export const getLayouts = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;

    const layouts = await prisma.dashboardLayout.findMany({
      where: { tenantId, userId },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ success: true, data: layouts });
  } catch (error: any) {
    console.error("Error fetching layouts:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/dashboard-builder/layouts/:id
 * Get a single layout by ID
 */
export const getLayoutById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { id } = req.params;

    const layout = await prisma.dashboardLayout.findFirst({
      where: { id: id as string, tenantId },
    });

    if (!layout) {
      return res.status(404).json({ success: false, message: "Layout not found" });
    }

    res.json({ success: true, data: layout });
  } catch (error: any) {
    console.error("Error fetching layout:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/dashboard-builder/layouts
 * Create a new dashboard layout
 */
export const createLayout = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const { name, widgets, gridConfig, isDefault } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Layout name is required" });
    }

    // If this is being set as default, unset other defaults
    if (isDefault) {
      await prisma.dashboardLayout.updateMany({
        where: { tenantId, userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const layout = await prisma.dashboardLayout.create({
      data: {
        tenantId,
        userId,
        name,
        widgets: widgets || [],
        gridConfig: gridConfig || { cols: 12, rowHeight: 80, gap: 16 },
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({ success: true, data: layout });
  } catch (error: any) {
    console.error("Error creating layout:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/dashboard-builder/layouts/:id
 * Update a layout (save widget positions, add/remove widgets)
 */
export const updateLayout = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { name, widgets, gridConfig, isDefault } = req.body;

    const existing = await prisma.dashboardLayout.findFirst({
      where: { id: id as string, tenantId, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Layout not found" });
    }

    // If setting as default, unset others
    if (isDefault) {
      await prisma.dashboardLayout.updateMany({
        where: { tenantId, userId, isDefault: true, id: { not: id as string } },
        data: { isDefault: false },
      });
    }

    const layout = await prisma.dashboardLayout.update({
      where: { id: id as string },
      data: {
        ...(name && { name }),
        ...(widgets !== undefined && { widgets }),
        ...(gridConfig !== undefined && { gridConfig }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    res.json({ success: true, data: layout });
  } catch (error: any) {
    console.error("Error updating layout:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/dashboard-builder/layouts/:id
 * Delete a layout
 */
export const deleteLayout = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const existing = await prisma.dashboardLayout.findFirst({
      where: { id: id as string, tenantId, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Layout not found" });
    }

    await prisma.dashboardLayout.delete({ where: { id: id as string } });

    res.json({ success: true, message: "Layout deleted" });
  } catch (error: any) {
    console.error("Error deleting layout:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/dashboard-builder/widgets
 * Get all available widget templates (catalog)
 */
export const getWidgets = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;

    const widgets = await prisma.dashboardWidget.findMany({
      where: {
        OR: [
          { tenantId, isActive: true },
          { isPublic: true, isActive: true },
        ],
      },
      orderBy: { name: "asc" },
    });

    // Also include built-in widgets
    const builtInWidgets = [
      { id: "builtin-stat-students", name: "Total Students", type: "STAT_CARD", dataSource: "students_count", config: { color: "#3b82f6", icon: "Users" }, isPublic: true },
      { id: "builtin-stat-teachers", name: "Total Teachers", type: "STAT_CARD", dataSource: "teachers_count", config: { color: "#10b981", icon: "UserCog" }, isPublic: true },
      { id: "builtin-stat-fees-collected", name: "Fee Collected", type: "STAT_CARD", dataSource: "fees_collected", config: { color: "#8b5cf6", icon: "IndianRupee" }, isPublic: true },
      { id: "builtin-stat-fees-pending", name: "Fee Pending", type: "STAT_CARD", dataSource: "fees_pending", config: { color: "#ef4444", icon: "AlertCircle" }, isPublic: true },
      { id: "builtin-stat-attendance", name: "Today's Attendance", type: "STAT_CARD", dataSource: "attendance_today", config: { color: "#f59e0b", icon: "CalendarCheck" }, isPublic: true },
      { id: "builtin-stat-classes", name: "Active Classes", type: "STAT_CARD", dataSource: "classes_count", config: { color: "#06b6d4", icon: "School" }, isPublic: true },
      { id: "builtin-chart-monthly-fees", name: "Monthly Fee Collection", type: "BAR_CHART", dataSource: "monthly_fee_collection", config: { color: "#4f46e5" }, isPublic: true },
      { id: "builtin-chart-attendance-trend", name: "Attendance Trend", type: "LINE_CHART", dataSource: "attendance_trend", config: { color: "#10b981" }, isPublic: true },
      { id: "builtin-chart-gender-ratio", name: "Gender Ratio", type: "DONUT_CHART", dataSource: "student_gender_ratio", config: { colors: ["#3b82f6", "#ec4899", "#8b5cf6"] }, isPublic: true },
      { id: "builtin-chart-class-strength", name: "Class Strength", type: "BAR_CHART", dataSource: "class_wise_strength", config: { color: "#f59e0b" }, isPublic: true },
      { id: "builtin-table-recent-payments", name: "Recent Payments", type: "TABLE", dataSource: "recent_payments", config: { columns: ["student", "class", "amount", "date", "status"] }, isPublic: true },
      { id: "builtin-table-defaulters", name: "Fee Defaulters", type: "TABLE", dataSource: "fee_defaulters", config: { columns: ["student", "class", "pending", "daysOverdue"] }, isPublic: true },
      { id: "builtin-calendar", name: "Academic Calendar", type: "CALENDAR", dataSource: "events", config: {}, isPublic: true },
      { id: "builtin-activity", name: "Recent Activity", type: "ACTIVITY", dataSource: "recent_activity", config: {}, isPublic: true },
      { id: "builtin-clock", name: "Clock & Date", type: "CLOCK", dataSource: "none", config: {}, isPublic: true },
    ];

    res.json({ success: true, data: [...builtInWidgets, ...widgets] });
  } catch (error: any) {
    console.error("Error fetching widgets:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/dashboard-builder/widgets
 * Create a custom widget
 */
export const createWidget = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const { name, type, dataSource, config, isPublic } = req.body;

    if (!name || !type || !dataSource) {
      return res.status(400).json({ success: false, message: "name, type, and dataSource are required" });
    }

    const widget = await prisma.dashboardWidget.create({
      data: {
        tenantId,
        name,
        type,
        dataSource,
        config: config || {},
        isPublic: isPublic || false,
        createdBy: userId,
        isActive: true,
      },
    });

    res.status(201).json({ success: true, data: widget });
  } catch (error: any) {
    console.error("Error creating widget:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/dashboard-builder/widgets/:id
 * Delete a custom widget
 */
export const deleteWidget = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { id } = req.params;

    await prisma.dashboardWidget.update({
      where: { id: id as string },
      data: { isActive: false },
    });

    res.json({ success: true, message: "Widget deleted" });
  } catch (error: any) {
    console.error("Error deleting widget:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/dashboard-builder/data/:widgetType
 * Fetch actual data for a widget (dynamic data provider)
 */
export const getWidgetData = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { widgetType } = req.params;
    const { dataSource } = req.query;

    let data: any = null;

    switch (dataSource) {
      case "students_count":
        const studentsCount = await prisma.student.count({ where: { tenantId, isDeleted: false } });
        data = { value: studentsCount, label: "Total Students" };
        break;

      case "teachers_count":
        const teachersCount = await prisma.teacher.count({ where: { tenantId, isDeleted: false } });
        data = { value: teachersCount, label: "Total Teachers" };
        break;

      case "fees_collected":
        const feesCollected = await prisma.payment.aggregate({
          where: { tenantId },
          _sum: { amount: true },
        });
        data = { value: feesCollected._sum.amount || 0, label: "Fee Collected" };
        break;

      case "fees_pending":
        const feesPending = await prisma.studentFee.aggregate({
          where: { tenantId, status: { in: ["UNPAID", "PARTIAL"] } },
          _sum: { balanceAmount: true },
        });
        data = { value: feesPending._sum?.balanceAmount || 0, label: "Fee Pending" };
        break;

      case "attendance_today":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const totalStudents = await prisma.student.count({ where: { tenantId, isDeleted: false } });
        const presentToday = await prisma.attendance.count({
          where: { tenantId, date: { gte: today }, status: "PRESENT" },
        });
        const percentage = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;
        data = { value: `${percentage}%`, label: "Today's Attendance", raw: { present: presentToday, total: totalStudents } };
        break;

      case "classes_count":
        const classesCount = await prisma.class.count({ where: { tenantId, isDeleted: false } });
        data = { value: classesCount, label: "Active Classes" };
        break;

      case "monthly_fee_collection":
        const currentYear = new Date().getFullYear();
        const monthlyPayments = await prisma.payment.groupBy({
          by: ["createdAt"],
          where: {
            tenantId,
            createdAt: { gte: new Date(`${currentYear}-01-01`) },
          },
          _sum: { amount: true },
        });
        // Aggregate by month
        const monthlyData: { month: string; amount: number }[] = [];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        for (let i = 0; i < 12; i++) {
          monthlyData.push({ month: months[i], amount: 0 });
        }
        monthlyPayments.forEach((p: any) => {
          const monthIndex = new Date(p.createdAt).getMonth();
          monthlyData[monthIndex].amount += p._sum.amount || 0;
        });
        data = monthlyData;
        break;

      case "attendance_trend":
        const last7Days: { date: string; percentage: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          const nextD = new Date(d);
          nextD.setDate(nextD.getDate() + 1);
          const total = await prisma.student.count({ where: { tenantId, isDeleted: false } });
          const present = await prisma.attendance.count({
            where: { tenantId, date: { gte: d, lt: nextD }, status: "PRESENT" },
          });
          last7Days.push({
            date: d.toLocaleDateString("en-IN", { weekday: "short" }),
            percentage: total > 0 ? Math.round((present / total) * 100) : 0,
          });
        }
        data = last7Days;
        break;

      case "student_gender_ratio":
        const maleCount = await prisma.student.count({ where: { tenantId, isDeleted: false, gender: "Male" } });
        const femaleCount = await prisma.student.count({ where: { tenantId, isDeleted: false, gender: "Female" } });
        const otherCount = await prisma.student.count({ where: { tenantId, isDeleted: false, gender: { notIn: ["Male", "Female"] } } });
        data = [
          { name: "Boys", value: maleCount, color: "#3b82f6" },
          { name: "Girls", value: femaleCount, color: "#ec4899" },
          { name: "Other", value: otherCount, color: "#8b5cf6" },
        ];
        break;

      case "class_wise_strength":
        const classes = await prisma.class.findMany({
          where: { tenantId, isDeleted: false },
          select: { id: true, name: true },
        });
        const classStrength = await Promise.all(
          classes.map(async (cls: any) => {
            const count = await prisma.enrollment.count({
              where: { tenantId, classId: cls.id, status: "active" },
            });
            return { name: cls.name, students: count };
          })
        );
        data = classStrength.sort((a: any, b: any) => b.students - a.students);
        break;

      case "recent_payments":
        const recentPayments = await prisma.payment.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            studentFee: {
              include: {
                enrollment: {
                  include: {
                    student: { select: { firstName: true, lastName: true } },
                    class: { select: { name: true } },
                  },
                },
              },
            },
          },
        });
        data = recentPayments.map((p: any) => ({
          id: p.id,
          student: `${p.studentFee?.enrollment?.student?.firstName || ""} ${p.studentFee?.enrollment?.student?.lastName || ""}`.trim(),
          class: p.studentFee?.enrollment?.class?.name || "-",
          amount: p.amount,
          date: p.createdAt,
          status: p.status || "SUCCESS",
        }));
        break;

      case "fee_defaulters":
        const defaulters = await prisma.studentFee.findMany({
          where: { tenantId, status: { in: ["UNPAID", "PARTIAL"] }, balanceAmount: { gt: 0 } },
          orderBy: { balanceAmount: "desc" },
          take: 10,
          include: {
            enrollment: {
              include: {
                student: { select: { firstName: true, lastName: true } },
                class: { select: { name: true } },
              },
            },
          },
        });
        data = defaulters.map((d: any) => ({
          id: d.id,
          student: `${d.enrollment?.student?.firstName || ""} ${d.enrollment?.student?.lastName || ""}`.trim(),
          class: d.enrollment?.class?.name || "-",
          pending: d.balanceAmount,
          dueDate: d.dueDate,
        }));
        break;

      case "recent_activity":
        const recentActivity = await prisma.auditLog.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 15,
        });
        data = recentActivity.map((a: any) => ({
          id: a.id,
          user: a.userName || "System",
          action: a.action,
          module: a.module,
          description: `${a.userName || "System"} ${a.action.toLowerCase()} in ${a.module}`,
          time: a.createdAt,
        }));
        break;

      default:
        data = { message: "Unknown data source" };
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching widget data:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
