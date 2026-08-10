// ══════════════════════════════════════════════════════════════════
// AUTO-CACHE MIDDLEWARE — Tenant-safe cache for heavy GET endpoints
// ══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";

interface CacheEntry {
  body: any;
  status: number;
  expiry: number;
}

interface TokenUser {
  userId: string;
  tenantId: string;
  role: string;
}

const cache = new Map<string, CacheEntry>();

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

const TTL_MS = 30_000;

function isCacheable(req: Request): boolean {
  if (req.method !== "GET") return false;
  return CACHEABLE_PATTERNS.some((pattern) => pattern.test(req.originalUrl));
}

function shouldInvalidate(req: Request): boolean {
  if (req.method === "GET") return false;
  return INVALIDATION_PREFIXES.some((prefix) => req.originalUrl.startsWith(prefix));
}

function getVerifiedTokenUser(req: Request): TokenUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  try {
    return jwt.verify(parts[1], process.env.JWT_SECRET!) as TokenUser;
  } catch {
    return null;
  }
}

function invalidateTenantCache(tenantId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${tenantId}:`)) cache.delete(key);
  }
}

async function hasActiveSubscription(user: TokenUser): Promise<boolean> {
  if (user.role === "SUPER_ADMIN") return true;
  if (process.env.NODE_ENV !== "production") return true;

  const subscription = await prisma.tenantSubscription.findFirst({
    where: {
      tenantId: user.tenantId,
      isActive: true,
      status: "ACTIVE",
    },
  });

  return !!subscription && new Date(subscription.endDate) >= new Date();
}

export async function autoCacheMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Mutations invalidate only after a verified token provides tenant context.
  if (shouldInvalidate(req)) {
    const user = getVerifiedTokenUser(req);
    if (user?.tenantId) invalidateTenantCache(user.tenantId);
    return next();
  }

  if (!isCacheable(req)) return next();

  // Never serve a cached ERP response without a verified authenticated tenant.
  const user = getVerifiedTokenUser(req);
  if (!user?.tenantId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Cached responses must not bypass subscription enforcement.
  try {
    const active = await hasActiveSubscription(user);
    if (!active) {
      return res.status(403).json({
        success: false,
        subscriptionExpired: true,
        message: "Your subscription has expired. Please renew to continue.",
      });
    }
  } catch (error) {
    console.error("Cache subscription check error:", error);
    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({
        success: false,
        message: "Unable to verify subscription. Please try again.",
      });
    }
  }

  const key = `${user.tenantId}:${req.originalUrl}`;
  const now = Date.now();
  const existing = cache.get(key);

  if (existing && existing.expiry > now) {
    res.status(existing.status).json(existing.body);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.set(key, {
        body,
        status: res.statusCode,
        expiry: Date.now() + TTL_MS,
      });
    }
    return originalJson(body);
  } as any;

  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiry < now) cache.delete(key);
  }
}, 2 * 60 * 1000);

export default autoCacheMiddleware;
