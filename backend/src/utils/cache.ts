import { cacheGetJSON, cacheSetJSON, cacheDel, cacheDelPattern } from "../config/redis";
import logger from "../config/logger";

/**
 * Cache-aside pattern helper
 * 
 * Usage:
 *   const data = await cacheAside(
 *     `dashboard:${tenantId}`,
 *     () => heavyDbQuery(),
 *     300 // 5 min TTL
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
 * Common cache key builders
 */
export const CacheKeys = {
  dashboardStats: (tenantId: string) => `dashboard:stats:${tenantId}`,
  studentList: (tenantId: string, classId: string, page: number) => `students:${tenantId}:${classId}:page${page}`,
  teacherList: (tenantId: string) => `teachers:${tenantId}`,
  feesSummary: (tenantId: string, yearId: string) => `fees:summary:${tenantId}:${yearId}`,
  attendanceReport: (tenantId: string, date: string) => `attendance:${tenantId}:${date}`,
  timetable: (tenantId: string, classId: string) => `timetable:${tenantId}:${classId}`,
};
