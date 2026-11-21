import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";

/**
 * superAdminAudit — God Mode Lock, P5.4 (immutable action trail + alert).
 *
 * Logs every Super Admin WRITE action (POST/PUT/PATCH/DELETE) to the
 * dedicated `SuperAdminAuditLog` table. This is separate from the
 * tenant-scoped `auditMiddleware` because Super Admins have no tenantId.
 *
 * Place AFTER authMiddleware + verifySuperAdmin on platform routes:
 *   router.use(authMiddleware, allowRoles("SUPER_ADMIN"), verifySuperAdmin, superAdminAudit, xRoutes);
 *
 * Fire-and-forget: never blocks or breaks the request, even if logging fails.
 */

function getClientIP(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return (typeof fwd === "string" ? fwd : fwd[0]).split(",")[0].trim();
  return req.ip || req.socket.remoteAddress || "Unknown";
}

function actionFromMethod(method: string, path: string): string {
  if (path.includes("/login")) return "LOGIN";
  if (path.includes("/logout")) return "LOGOUT";
  if (path.includes("/export")) return "EXPORT";
  if (path.includes("/restore")) return "RESTORE";
  switch (method) {
    case "POST": return "CREATE";
    case "PUT":
    case "PATCH": return "UPDATE";
    case "DELETE": return "DELETE";
    default: return "VIEW";
  }
}

function moduleFromPath(path: string): string {
  // /api/super-admin/<module>/... -> <module>
  const parts = path.split("?")[0].split("/").filter(Boolean);
  const i = parts.indexOf("super-admin");
  if (i !== -1 && parts[i + 1]) return parts[i + 1];
  // fallback: /api/<module>
  const a = parts.indexOf("api");
  return (a !== -1 && parts[a + 1]) || "platform";
}

// Actions considered high-impact -> severity "high" + eligible for alerting
const HIGH_IMPACT = ["DELETE", "CREATE"];
const CRITICAL_MODULES = ["users", "subscription-management", "iam", "database", "security"];

export const superAdminAudit = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return next();
  }

  const path = req.originalUrl || req.url;
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    try {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300 && body?.success !== false) {
        const user = (req as any).user || {};
        const module = moduleFromPath(path);
        const action = actionFromMethod(method, path);
        const severity =
          CRITICAL_MODULES.includes(module) && HIGH_IMPACT.includes(action)
            ? "high"
            : "info";

        const data: any = {
          actorId: user.userId || user.id || "unknown",
          actorEmail: user.email || undefined,
          actorName: user.name || undefined,
          action,
          module,
          method,
          path,
          targetId: req.params?.id || body?.data?.id || undefined,
          targetTenantId: req.params?.tenantId || req.body?.tenantId || undefined,
          ipAddress: getClientIP(req),
          userAgent: req.headers["user-agent"] as string | undefined,
          statusCode: res.statusCode,
          severity,
          metadata: { query: req.query, routeParams: req.params },
        };

        // Fire-and-forget
        prisma.superAdminAuditLog.create({ data }).catch((err) => {
          console.error("SuperAdmin audit log failed:", err.message);
        });

        // High-severity alert hook (SNS/email can be wired here later).
        if (severity === "high") {
          console.warn(
            `[GOD-MODE ALERT] ${data.actorEmail || data.actorId} did ${action} on ${module} (${path}) from ${data.ipAddress}`
          );
        }
      }
    } catch (e: any) {
      console.error("SuperAdmin audit middleware error:", e?.message);
    }
    return originalJson(body);
  } as any;

  next();
};
