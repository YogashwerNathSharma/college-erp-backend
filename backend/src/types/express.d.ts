import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        role: string;
      };
      /** Resolved tenant ID (set by resolveTenant middleware) */
      tenantId?: string;
      /** Resolved academic year ID (set by resolveAcademicYear middleware) */
      academicYearId?: string;
    }
  }
}

export {};
