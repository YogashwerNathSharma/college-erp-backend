import { Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";

/**
 * Allow Super Admin creation only during the initial bootstrap.
 *
 * The /super-admin endpoint remains usable for first-time deployment,
 * but once any SUPER_ADMIN exists, further public creation is blocked.
 */
export const allowInitialSuperAdminSetup = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        role: "SUPER_ADMIN",
        isDeleted: false,
      },
      select: { id: true },
    });

    if (existingSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Super Admin registration is disabled after initial setup",
      });
    }

    return next();
  } catch (error) {
    console.error("Super Admin bootstrap check failed:", error);

    // Fail closed: if we cannot verify whether setup is complete,
    // do not allow a privileged account to be created.
    return res.status(503).json({
      success: false,
      message: "Super Admin setup is temporarily unavailable",
    });
  }
};
