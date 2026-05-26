import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    // ✅ Check header exists
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ Check Bearer format
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const token = parts[1];

    // ✅ Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string;
      tenantId: string;
      role: string;
    };

    // ✅ Attach user safely
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};