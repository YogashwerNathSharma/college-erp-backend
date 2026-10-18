import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "yn-udp-secret-key";

export interface AuthRequest extends Request {
  userId?: string;
  tenantId?: string;
  role?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // For development, allow requests without auth but require tenantId in query/body
      const tenantId = req.query.tenantId || req.body?.tenantId;
      if (tenantId) {
        req.tenantId = tenantId as string;
        return next();
      }
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    req.userId = decoded.id;
    req.tenantId = decoded.tenantId;
    req.role = decoded.role;
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
