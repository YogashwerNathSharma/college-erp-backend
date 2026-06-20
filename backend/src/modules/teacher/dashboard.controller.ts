
import { Request, Response } from "express";
import {
  getDashboardStats,
  getDepartmentChart,
  getMonthlyOverview,
  getRecentTeachers,
} from "./dashboard.service";

// ✅ GET STATS
export const getStats = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const stats = await getDashboardStats(tenantId);
    return res.json({ success: true, data: stats });
  } catch (e: any) {
    console.error("DASHBOARD STATS ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ GET DEPARTMENT CHART
export const getDeptChart = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getDepartmentChart(tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("DEPARTMENT CHART ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ GET MONTHLY OVERVIEW
export const getOverview = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getMonthlyOverview(tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("MONTHLY OVERVIEW ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ GET RECENT TEACHERS
export const getRecent = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getRecentTeachers(tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("RECENT TEACHERS ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ GET RECENT LEAVES
export const getLeaves = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const prisma = require("../../utils/prisma").default;
    const leaves = await prisma.teacherLeave.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return res.json({ success: true, data: leaves || [] });
  } catch (e: any) {
    console.error("TEACHER LEAVES ERROR:", e);
    return res.json({ success: true, data: [] });
  }
};
