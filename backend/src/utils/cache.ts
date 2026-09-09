import { cacheGetJSON, cacheSetJSON, cacheDel, cacheDelPattern } from "../config/redis";
import logger from "../config/logger";

/**
 * ⚡ P2: Tiered Cache TTL constants (seconds)
 * Use these instead of hardcoded numbers throughout the app.
 */
export const CACHE_TTL = {
  MASTER_DATA: 3600,     // 1 hour — classes, sections, subjects (rarely change)
  DASHBOARD: 300,        // 5 minutes — balance freshness vs speed
  STUDENT_LIST: 60,      // 1 minute — changes on admission/transfer
  ATTENDANCE: 30,        // 30 seconds — teachers mark live
  REPORTS: 120,          // 2 minutes — heavy aggregations
  FEE_DASHBOARD: 120,    // 2 minutes — summary data
  // NOTE: fee collection/payment endpoints should NOT be cached (real-time for payments)
};

/**
 * Cache-aside pattern helper
 *
 * Usage:
 *   const data = await cacheAside(
 *     `dashboard:${tenantId}`,
 *     () => heavyDbQuery(),
 *     CACHE_TTL.DASHBOARD
 *   );
 */
export const cacheAside = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> => {
  // Try cache first
  const cached = await cacheGetJSON<T>(key);
  if (cached !== null) {
    logger.debug("Cache HIT", { key });
    return cached;
  }

  // Cache miss — fetch from DB
  logger.debug("Cache MISS", { key });
  const data = await fetcher();

  // Store in cache (non-blocking)
  cacheSetJSON(key, data, ttlSeconds).catch((err) => {
    logger.warn("Cache write failed", { key, error: err.message });
  });

  return data;
};

/**
 * Cache invalidation helpers
 */
export const invalidateCache = async (key: string) => {
  await cacheDel(key);
};

export const invalidateTenantCache = async (tenantId: string, prefix?: string) => {
  const pattern = prefix
    ? `${prefix}:${tenantId}:*`
    : `*:${tenantId}:*`;
  await cacheDelPattern(pattern);
};

/**
 * ⚡ P3: Smart cache invalidation — invalidate related keys on mutations
 * Call after create/update/delete operations to keep cache fresh.
 */
const INVALIDATION_MAP: Record<string, string[]> = {
  "student.create":     ["dashboard:*", "students:*"],
  "student.update":     ["dashboard:*", "students:*"],
  "student.delete":     ["dashboard:*", "students:*"],
  "attendance.create":  ["dashboard:*", "attendance:*"],
  "attendance.update":  ["dashboard:*", "attendance:*"],
  "fee.collect":        ["dashboard:*", "fees:*"],
  "fee.update":         ["dashboard:*", "fees:*"],
  "teacher.create":     ["dashboard:*", "teachers:*"],
  "teacher.update":     ["dashboard:*", "teachers:*"],
  "class.create":       ["dashboard:*", "classes:*", "students:*"],
  "class.update":       ["dashboard:*", "classes:*", "students:*"],
  "enrollment.create":  ["dashboard:*", "students:*"],
  "enrollment.update":  ["dashboard:*", "students:*"],
};

export const invalidateRelated = async (action: string, tenantId: string) => {
  const patterns = INVALIDATION_MAP[action] || [];
  for (const pattern of patterns) {
    await cacheDelPattern(`${pattern.replace("*", "")}${tenantId}:*`).catch(() => {});
  }
};

/**
 * Common cache key builders
 */
export const CacheKeys = {
  dashboardMain: (tenantId: string, yearId?: string) => `dashboard:main:${tenantId}:${yearId || "all"}`,
  dashboardStats: (tenantId: string) => `dashboard:stats:${tenantId}`,
  studentList: (tenantId: string, classId: string, page: number) => `students:${tenantId}:${classId}:page${page}`,
  teacherList: (tenantId: string) => `teachers:${tenantId}`,
  feesSummary: (tenantId: string, yearId: string) => `fees:summary:${tenantId}:${yearId}`,
  attendanceReport: (tenantId: string, date: string) => `attendance:${tenantId}:${date}`,
  timetable: (tenantId: string, classId: string) => `timetable:${tenantId}:${classId}`,
};

/**
 * cached() — alias used by existing controllers
 * Signature: cached(key, ttlMs, fetcher)
 * TTL is in milliseconds (converted to seconds internally)
 */
export const cached = async <T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> => {
  const ttlSeconds = Math.max(1, Math.round(ttlMs / 1000));
  return cacheAside<T>(key, fetcher, ttlSeconds);
};
