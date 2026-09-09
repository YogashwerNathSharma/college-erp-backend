// ══════════════════════════════════════════════════════════════════════
// AUTO-CACHE MIDDLEWARE — Caches heavy GET endpoints automatically
// ⚡ P2+P4: Tiered TTL + bounded memory + LRU eviction
// Attach to app BEFORE routes: app.use(autoCacheMiddleware)
// ══════════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from "express";

interface CacheEntry {
  body: any;
  status: number;
  etag?: string;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();

// ⚡ P4: Bounded cache — prevent memory leak with many tenants
const MAX_CACHE_ENTRIES = 1000;

// ⚡ P2: Tiered TTL per route category (milliseconds)
const CACHE_TIERS: Array<{ patterns: RegExp[]; ttl: number; label: string }> = [
  {
    label: "master",
    ttl: 60_000, // 60 seconds — class/section lists rarely change
    patterns: [
      /^\/api\/class$/,
      /^\/api\/section$/,
      /^\/api\/subject$/,
      /^\/api\/academic/,
      /^\/api\/grade$/,
    ],
  },
  {
    label: "dashboard",
    ttl: 30_000, // 30 seconds — dashboards
    patterns: [
      /^\/api\/dashboard/,
      /^\/api\/students\/dashboard/,
      /^\/api\/teacher\/dashboard/,
      /^\/api\/fees\/dashboard/,
      /^\/api\/transport\/dashboard/,
      /^\/api\/hostel\/dashboard/,
      /^\/api\/library\/dashboard/,
      /^\/api\/exam\/dashboard/,
    ],
  },
  {
    label: "stats",
    ttl: 20_000, // 20 seconds — stats/counts
    patterns: [
      /^\/api\/students\/stats/,
      /^\/api\/students\/class-strength/,
      /^\/api\/students\/category-distribution/,
      /^\/api\/students\/recent-admissions/,
    ],
  },
  {
    label: "reports",
    ttl: 15_000, // 15 seconds — reports
    patterns: [/^\/api\/reports/],
  },
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
  "/api/enrollment",
];

/**
 * Generate cache key from request.
 * Includes tenantId AND academicYearId for proper isolation:
 *   "tenantId:academicYearId:originalUrl"
 * This prevents data from one academic year bleeding into another year's cache.
 */
function getCacheKey(req: Request): string {
  const tenantId = (req as any).tenantId || (req as any).user?.tenantId || "global";
  const academicYearId = (req as any).academicYearId || (req.headers["x-academic-year-id"] as string) || "default";
  return `${tenantId}:${academicYearId}:${req.originalUrl}`;
}

/**
 * Check if this request matches a cache tier
 */
function matchCacheTier(req: Request): { ttl: number; label: string } | null {
  if (req.method !== "GET") return null;
  for (const tier of CACHE_TIERS) {
    if (tier.patterns.some(pattern => pattern.test(req.originalUrl))) {
      return { ttl: tier.ttl, label: tier.label };
    }
  }
  return null;
}

/**
 * Check if this request should invalidate cache entries
 */
function shouldInvalidate(req: Request): boolean {
  if (req.method === "GET") return false; // Only mutations invalidate
  return INVALIDATION_PREFIXES.some(prefix => req.originalUrl.startsWith(prefix));
}

/**
 * Invalidate all cache entries for a tenant (across ALL academic years).
 * This ensures mutations in any year properly clear stale data.
 */
function invalidateTenantCache(tenantId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(tenantId + ":")) {
      cache.delete(key);
    }
  }
}

/**
 * ⚡ P4: Evict oldest entries when cache exceeds max size
 */
function evictIfNeeded(): void {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  // Remove oldest 20% of entries
  const toRemove = Math.floor(MAX_CACHE_ENTRIES * 0.2);
  const iterator = cache.keys();
  for (let i = 0; i < toRemove; i++) {
    const key = iterator.next().value;
    if (key) cache.delete(key);
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
  const tier = matchCacheTier(req);
  if (!tier) {
    return next();
  }

  const key = getCacheKey(req);
  const now = Date.now();
  const existing = cache.get(key);

  // Cache HIT
  if (existing && existing.expiry > now) {
    // ⚡ P7: ETag support — return 304 if content unchanged
    if (existing.etag && req.headers["if-none-match"] === existing.etag) {
      res.status(304).end();
      return;
    }
    if (existing.etag) {
      res.setHeader("ETag", existing.etag);
    }
    res.setHeader("X-Cache", "HIT");
    res.setHeader("X-Cache-Tier", tier.label);
    res.status(existing.status).json(existing.body);
    return;
  }

  // Cache MISS — intercept response to store it
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    // Only cache successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // ⚡ P7: Generate ETag from response body
      let etag: string | undefined;
      try {
        const crypto = require("crypto");
        etag = `"${crypto.createHash("md5").update(JSON.stringify(body)).digest("hex").slice(0, 16)}"`;
        res.setHeader("ETag", etag);
      } catch {}

      cache.set(key, { body, status: res.statusCode, etag, expiry: now + tier.ttl });
      evictIfNeeded();
    }
    res.setHeader("X-Cache", "MISS");
    res.setHeader("X-Cache-Tier", tier.label);
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
