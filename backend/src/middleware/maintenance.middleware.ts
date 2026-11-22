import { Request, Response, NextFunction } from "express";
import prisma from ".././utils/prisma";

/////////////////////////
// MAINTENANCE GATE MIDDLEWARE
//
// Two-level maintenance:
//   - Soft mode  (blockApp = false): app keeps working, frontend shows a banner.
//     This middleware does NOT block anything in soft mode.
//   - Hard mode  (blockApp = true):  app is blocked for everyone except SUPER_ADMIN,
//     returning 503 so the frontend can show a maintenance page.
//
// Security notes (per ERP self-guide):
//   - Fail-OPEN: any error reading the flag -> allow the request (never lock users out
//     because of a status-lookup failure).
//   - SUPER_ADMIN is never blocked, so they can always disable maintenance.
//   - Auth / super-admin / subscription paths are skipped so login + admin stay reachable.
/////////////////////////
export const maintenanceGateMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    // SUPER_ADMIN is never blocked (so they can turn maintenance off).
    if (user && user.role === "SUPER_ADMIN") {
      return next();
    }

    // Never block the paths needed to log in / manage / recover.
    const skipPaths = [
      "/api/auth",
      "/api/super-admin",
      "/api/settings",
      "/api/subscriptions",
      "/api/subscription-payments",
    ];
    const reqPath = req.originalUrl || req.path || "";
    if (skipPaths.some((p) => reqPath.startsWith(p))) {
      return next();
    }

    const setting = await (prisma as any).platformSetting.findFirst({
      where: { key: "maintenance_mode" },
    });

    const enabled = setting?.value === "true";
    const meta = (setting?.metadata as any) || {};
    const blockApp = meta.blockApp === true;

    // Only HARD maintenance (enabled + blockApp) blocks the app.
    // Soft maintenance lets everything through (frontend shows a banner).
    if (enabled && blockApp) {
      return res.status(503).json({
        success: false,
        maintenance: true,
        message: meta.message || "System is under maintenance",
        scheduledEnd: meta.scheduledEnd || null,
      });
    }

    return next();
  } catch (error) {
    // Fail-open: do not block the app due to a maintenance-flag lookup error.
    return next();
  }
};
