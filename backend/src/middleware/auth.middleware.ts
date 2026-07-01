import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from ".././utils/prisma";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const token = parts[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string;
      tenantId: string;
      role: string;
    };

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

/////////////////////////
// SUBSCRIPTION CHECK MIDDLEWARE
/////////////////////////
export const subscriptionCheckMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    // If no user attached (no auth), skip
    if (!user) {
      return next();
    }

    // Skip for SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      return next();
    }

    // Skip for these routes (so expired user can still pay)
    const skipPaths = [
  "/api/subscriptions",
  "/api/subscription-payments",
  "/api/auth",
  "/api/settings",
  "/api/super-admin",
];

    const shouldSkip = skipPaths.some((path) =>
      req.originalUrl.startsWith(path)
    );

    if (shouldSkip) {
      return next();
    }

    // Skip if no tenantId
    if (!user.tenantId) {
      return next();
    }

// Check active subscription
    // ═══ DEV MODE: Skip subscription check ═══
    if (process.env.NODE_ENV !== "production") {
      return next();
    }

    // ═══ Skip subscription check for print/report routes ═══
    const reqPath = req.originalUrl || req.path || "";
    if (reqPath.includes("/report-card") || reqPath.includes("/consolidated") || reqPath.includes("/print")) {
      return next();
    }

    const activeSubscription = await prisma.tenantSubscription.findFirst({
      where: {
        tenantId: user.tenantId,
        isActive: true,
        status: "ACTIVE",
      },
    });

    if (!activeSubscription || new Date(activeSubscription.endDate) < new Date()) {
      // Auto-expire if date passed
      if (activeSubscription) {
        await prisma.tenantSubscription.update({
          where: { id: activeSubscription.id },
          data: {
            isActive: false,
            status: "EXPIRED",
          },
        });
      }

      return res.status(403).json({
        success: false,
        subscriptionExpired: true,
        message: "Your subscription has expired. Please renew to continue.",
      });
    }

    next();
  } catch (error) {
    console.error("Subscription Check Error:", error);
    return next();
  }
};