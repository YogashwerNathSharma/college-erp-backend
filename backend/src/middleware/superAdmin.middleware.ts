import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";

/**
 * verifySuperAdmin — God Mode Lock, P5.1 (DB verification).
 *
 * `allowRoles("SUPER_ADMIN")` only trusts the JWT `role` claim. A stolen,
 * forged, or stale token (e.g. a user who was demoted after the token was
 * issued) would still pass. This middleware adds a second, authoritative
 * check: it re-reads the user from the database and confirms they are STILL
 * an active SUPER_ADMIN right now.
 *
 * Usage (place AFTER authMiddleware, alongside/replacing allowRoles for
 * platform routes):
 *   router.use(authMiddleware, verifySuperAdmin);
 *
 * Fail-closed: any doubt (no user, not found, wrong role, inactive,
 * soft-deleted, or DB error) => 403/401. Never grants on uncertainty.
 */
export const verifySuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const claim = req.user;
    if (!claim || !claim.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // JWT claim must say SUPER_ADMIN first (cheap check)
    if (claim.role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: Super Admin only" });
    }

    // Authoritative DB check — the token is not enough.
    const user = await prisma.user.findUnique({
      where: { id: claim.userId },
      select: { id: true, role: true, status: true, isActive: true, isDeleted: true },
    });

    if (!user) {
      return res.status(403).json({ success: false, message: "Forbidden: account not found" });
    }
    if (user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: Super Admin privileges revoked" });
    }
    if (user.isDeleted || user.isActive === false || user.status === "INACTIVE" || user.status === "LOCKED") {
      return res.status(403).json({ success: false, message: "Forbidden: account is not active" });
    }

    next();
  } catch (error) {
    // Fail-closed: on any error, deny access to God Mode.
    console.error("verifySuperAdmin error:", error);
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
};
