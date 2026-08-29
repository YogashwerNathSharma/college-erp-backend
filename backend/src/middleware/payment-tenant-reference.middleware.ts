import { NextFunction, Request, Response } from "express";
import prisma from "../utils/prisma";

/**
 * Enterprise tenant-boundary validation for payment creation flows.
 * The authenticated tenant is authoritative; client-supplied student/fee IDs
 * must belong to that same tenant before an online payment is created.
 */
export const validatePaymentTenantReferences = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Tenant context is required" });
    }

    const { studentId, feeId } = req.body || {};

    if (studentId) {
      const student = await prisma.student.findFirst({
        where: { id: studentId, tenantId, isDeleted: false },
        select: { id: true },
      });

      if (!student) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }
    }

    if (feeId) {
      const fee = await prisma.studentFee.findFirst({
        where: { id: feeId, tenantId, isDeleted: false },
        select: {
          id: true,
          enrollment: { select: { studentId: true } },
        },
      });

      if (!fee) {
        return res.status(404).json({ success: false, message: "Student fee not found" });
      }

      if (studentId && fee.enrollment?.studentId !== studentId) {
        return res.status(400).json({
          success: false,
          message: "Student and fee references do not match",
        });
      }
    }

    return next();
  } catch (error) {
    console.error("Payment tenant reference validation error:", error);
    return res.status(500).json({ success: false, message: "Unable to validate payment references" });
  }
};
