import { Request, Response, NextFunction } from "express";

/**
 * superAdminIpAllowlist — God Mode Lock, P5.3 (IP allowlist).
 *
 * Restricts Super Admin (platform) routes to a list of trusted IPs.
 *
 * ── LOCKOUT-PROOF DESIGN ──────────────────────────────────────────────
 * This feature is OFF by default and is engineered so you can NEVER lock
 * yourself out:
 *   1. If env SUPER_ADMIN_IP_ALLOWLIST is empty/unset -> ALLOW everything
 *      (feature disabled). Nothing changes until you opt in.
 *   2. Localhost (::1, 127.0.0.1) is ALWAYS allowed (dev machine safe).
 *   3. On ANY error while checking -> ALLOW (fail-open) so a bad parse or
 *      proxy header never blocks a legitimate Super Admin.
 *   4. Only when the allowlist is set AND the request IP is not localhost
 *      AND not in the list -> block with 403.
 *
 * To enable later: set SUPER_ADMIN_IP_ALLOWLIST in .env to a comma-separated
 * list, e.g.  SUPER_ADMIN_IP_ALLOWLIST=203.0.113.4, 203.0.113.5
 *
 * Works for one OR many super admins (the allowlist applies platform-wide).
 */

const LOCALHOST_IPS = new Set(["::1", "127.0.0.1", "::ffff:127.0.0.1"]);

function getClientIP(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) {
    return (typeof fwd === "string" ? fwd : fwd[0]).split(",")[0].trim();
  }
  return (req.ip || req.socket.remoteAddress || "").trim();
}

function parseAllowlist(): string[] {
  const raw = process.env.SUPER_ADMIN_IP_ALLOWLIST || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const superAdminIpAllowlist = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const allowlist = parseAllowlist();

    // (1) Feature disabled -> allow everything.
    if (allowlist.length === 0) {
      return next();
    }

    const ip = getClientIP(req);

    // (2) Localhost always allowed (dev machine can never be locked out).
    if (LOCALHOST_IPS.has(ip)) {
      return next();
    }

    // (4) Enforce: block if not in the allowlist.
    const allowed = allowlist.some((entry) => ip === entry || ip.endsWith(entry));
    if (!allowed) {
      console.warn(`[GOD-MODE IP BLOCK] Super Admin access denied from IP: ${ip}`);
      return res.status(403).json({
        success: false,
        message: "Access denied: your IP is not allowed for Super Admin.",
      });
    }

    return next();
  } catch (error) {
    // (3) Fail-OPEN on error — never lock a legitimate Super Admin out due to
    // an IP-check glitch. (Other God Mode layers still protect the route.)
    console.error("superAdminIpAllowlist error (allowing through):", error);
    return next();
  }
};
