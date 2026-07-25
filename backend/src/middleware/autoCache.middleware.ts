// ══════════════════════════════════════════════════════════════════
// AUTO-CACHE MIDDLEWARE — Caches heavy GET endpoints automatically
// Attach to app BEFORE routes: app.use(autoCacheMiddleware)
// ══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from "express";

interface CacheEntry {
  body: any;
  status: number;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();

// Routes to auto-cache (regex patterns)
const CACHEABLE_PATTERNS = [
  /^\/api\/dashboard/,
  /^\/api\/students\/dashboard/,
  /^\/api\/students\/stats/,
  /^\/api\/students\/class-strength/,
  /^\/api\/students\/category-distribution/,
  /^\/api\/students\/recent-admissions/,
  /^\/api\/fees\/dashboard/,
  /^\/api\/attendance\/dashboard/,
  /^\/api\/teacher\/dashboard/,
  /^\/api\/transport\/dashboard/,
  /^\/api\/hostel\/dashboard/,
  /^\/api\/library\/dashboard/,
  /^\/api\/exam\/dashboard/,
  /^\/api\/reports/,
];

// Routes that INVALIDATE the cache (POST/PUT/DELETE on these prefixes)
const INVALIDATION_PREFIXES = [
  "/api/students",
  "/api/fees",
  "/api/attendance",
  "/api/teacher",
  "/api/class",
  "/api/section",
  "/api/academic",
  "/api/transport",
  "/api/hostel",
  "/api/exam",
];

const TTL_MS = 30_000; // 30 seconds cache

/**
 * Generate cache key from request (includes tenantId for multi-tenant isolation)
 */
function getCacheKey(req: Request): string {
  const tenantId = (req as any).tenantId || (req as any).user?.tenantId || "global";
  return `${tenantId}:${req.originalUrl}`;
}

/**
 * Check if this request should be cached
 */
function isCacheable(req: Request): boolean {
  if (req.method !== "GET") return false;
  return CACHEABLE_PATTERNS.some(pattern => pattern.test(req.originalUrl));
}

/**
 * Check if this request should invalidate cache entries
 */
function shouldInvalidate(req: Request): boolean {
  if (req.method === "GET") return false; // Only mutations invalidate
  return INVALIDATION_PREFIXES.some(prefix => req.originalUrl.startsWith(prefix));
}

/**
 * Invalidate all cache entries for a tenant
 */
function invalidateTenantCache(tenantId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(tenantId + ":")) {
      cache.delete(key);
    }
  }
}

/**
 * Main middleware function
 */
export function autoCacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  // ─── INVALIDATION (on POST/PUT/DELETE to data routes) ───
  if (shouldInvalidate(req)) {
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
    if (tenantId) {
      invalidateTenantCache(tenantId);
    }
    return next();
  }

  // ─── CACHE CHECK (on cacheable GET routes) ───
  if (!isCacheable(req)) {
    return next();
  }

  const key = getCacheKey(req);
  const now = Date.now();
  const existing = cache.get(key);

  // Cache HIT
  if (existing && existing.expiry > now) {
    res.status(existing.status).json(existing.body);
    return;
  }

  // Cache MISS — intercept response to store it
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    // Only cache successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.set(key, { body, status: res.statusCode, expiry: now + TTL_MS });
    }
    return originalJson(body);
  } as any;

  next();
}

// ─── Cleanup expired entries every 2 minutes ───
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiry < now) cache.delete(key);
  }
}, 2 * 60 * 1000);

export default autoCacheMiddleware;
