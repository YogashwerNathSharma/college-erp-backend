// ══════════════════════════════════════════════════════════════════
// AUTO-CACHE MIDDLEWARE — Caches heavy GET endpoints automatically
// Attach to app BEFORE routes: app.use(autoCacheMiddleware)
// ══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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
const MAX_CACHE_ENTRIES = 5_000; // prevent unbounded process-memory growth

/**
 * Generate cache key from request (includes tenantId for multi-tenant isolation)
 */
function getCacheKey(req: Request): string {
  const user = (req as any).user;
  const tenantId = user?.tenantId || "global";
  const userId = user?.userId || "anonymous";
  const role = user?.role || "unknown";

  // Dashboard/report responses can be permission- and user-scope-sensitive.
  // Include authenticated identity in the key to prevent cross-user cache reuse.
  return tenantId + ":" + userId + ":" + role + ":" + req.originalUrl;
}

/**
 * Authentication is currently router-level, but this cache runs before routers.
 * Authenticate cacheable requests here so a cache HIT can never bypass auth.
 */
function authenticateForCache(req: Request): boolean {
  if ((req as any).user) return true;

  const authHeader = req.headers.authorization;
  if (!authHeader) return false;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return false;

  try {
    const decoded = jwt.verify(
      parts[1],
      process.env.JWT_SECRET!
    ) as { userId: string; tenantId: string; role: string };

    (req as any).user = decoded;
    return true;
  } catch {
    return false;
  }
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

  // Never cache anonymous requests. Cacheable ERP endpoints are personalized.
  if (!authenticateForCache(req)) {
    return next();
  }

  const key = getCacheKey(req);
  const now = Date.now();
  const existing = cache.get(key);

  // Cache HIT
  if (existing && existing.expiry > now) {
    res.setHeader("Cache-Control", "private, no-cache");
    res.status(existing.status).json(existing.body);
    return;
  }

  // Cache MISS — intercept response to store it
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    // Only cache successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (cache.size >= MAX_CACHE_ENTRIES && !cache.has(key)) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }

      cache.set(key, { body, status: res.statusCode, expiry: now + TTL_MS });
      res.setHeader("Cache-Control", "private, no-cache");
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
