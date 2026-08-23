import { Request, Response } from "express";
import logger from "../../config/logger";
import prisma from "../../utils/prisma";
import { cached, invalidateCache } from "../../utils/cache";
import {
  getDashboardStats,
  getDepartmentChart,
  getMonthlyOverview,
  getRecentTeachers,
} from "./dashboard.service";

// ⚡ Cache TTL: 30 minutes (1800000ms)
const TEACHER_CACHE_TTL = 1800000;

// ✅ GET STATS (cached 60s)
export const getStats = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ⚡ PERF: 30-min cache + refresh support
    const forceRefresh = req.query?.refresh === "true";
    const cacheKey = `teacher:dash:stats:${tenantId}`;
    if (forceRefresh) await invalidateCache(cacheKey).catch(() => {});
    const stats = await cached(cacheKey, TEACHER_CACHE_TTL, () => getDashboardStats(tenantId));
    return res.json({ success: true, data: stats });
  } catch (e: any) {
    logger.error("Dashboard stats error", { error: e.message, tenantId: req.user?.tenantId });
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ GET DEPARTMENT CHART (cached 120s)
export const getDeptChart = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ⚡ PERF: 30-min cache + refresh support
    const forceRefresh = req.query?.refresh === "true";
    const cacheKey = `teacher:dash:dept:${tenantId}`;
    if (forceRefresh) await invalidateCache(cacheKey).catch(() => {});
    const data = await cached(cacheKey, TEACHER_CACHE_TTL, () => getDepartmentChart(tenantId));
    return res.json({ success: true, data });
  } catch (e: any) {
    logger.error("Department chart error", { error: e.message, tenantId: req.user?.tenantId });
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ GET MONTHLY OVERVIEW (cached 300s)
export const getOverview = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ⚡ PERF: 30-min cache + refresh support
    const forceRefresh = req.query?.refresh === "true";
    const cacheKey = `teacher:dash:overview:${tenantId}`;
    if (forceRefresh) await invalidateCache(cacheKey).catch(() => {});
    const data = await cached(cacheKey, TEACHER_CACHE_TTL, () => getMonthlyOverview(tenantId));
    return res.json({ success: true, data });
  } catch (e: any) {
    logger.error("Monthly overview error", { error: e.message, tenantId: req.user?.tenantId });
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
    logger.error("Recent teachers error", { error: e.message, tenantId: req.user?.tenantId });
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

    const leaves = await prisma.leave?.findMany?.({
      where: { tenantId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        teacher: { select: { id: true, name: true } },
      },
    }).catch(() => []);

    return res.json({ success: true, data: leaves || [] });
  } catch (e: any) {
    logger.error("Teacher leaves error", { error: e.message, tenantId: req.user?.tenantId });
    return res.json({ success: true, data: [] });
  }
};
