import { Request, Response, NextFunction } from "express";

export const resolveTenant = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId =
    user.role === "SUPER_ADMIN"
      ? (req.query.tenantId as string)
      : user.tenantId;

  if (!tenantId) {
    return res.status(400).json({
      message: "tenantId required",
    });
  }

  // 🔥 inject into request
  (req as any).tenantId = tenantId;

  next();
};