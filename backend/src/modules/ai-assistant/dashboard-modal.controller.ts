import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Dashboard Modal Endpoints
 * 
 * 1. GET /api/ai/dashboard/all-payments — All fee payments ever (for Print Receipts + Fee Collected)
 * 2. GET /api/ai/dashboard/defaulters — Students with actual pending fees > 0
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ALL PAYMENTS (Fee Receipts)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getAllPayments(req: Request, res: Response) {
  try {
    const tenantId = (req as any).user?.tenantId;

    const payments = await prisma.payment.findMany({
      where: { tenantId, isDeleted: false },
      include: {
        studentFee: {
          include: {
            feeStructure: {
              include: {
                items: {
                  include: {
                    feeHead: { select: { name: true, code: true } },
                  },
                },
              },
            },
            enrollment: {
              include: {
                student: { select: { firstName: true, lastName: true, fatherName: true, admissionNo: true, phone: true } },
                class: { select: { name: true } },
                section: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
      take: 500,
    });

    // Format for frontend
    const formatted = payments.map((p) => ({
      id: p.id,
      studentName: `${p.studentFee?.enrollment?.student?.firstName || ""} ${p.studentFee?.enrollment?.student?.lastName || ""}`.trim(),
      className: p.studentFee?.enrollment?.class?.name || "-",
      section: p.studentFee?.enrollment?.section?.name || "-",
      receiptNo: p.receiptNo,
      amount: p.amount,
      paymentDate: p.paymentDate,
      method: p.method,
      fatherName: p.studentFee?.enrollment?.student?.fatherName || "-",
      admissionNo: p.studentFee?.enrollment?.student?.admissionNo || "-",
      rollNumber: p.studentFee?.enrollment?.rollNumber || "-",
      feeHead: p.studentFee?.feeStructure?.items?.map((i: any) => i.feeHead?.name).filter(Boolean).join(", ") || "Fee",
      feeItems: p.studentFee?.feeStructure?.items?.map((i: any) => ({
        name: i.feeHead?.name || "Fee",
        amount: i.amount || 0,
        code: i.feeHead?.code || "",
      })) || [],
      installmentNo: 1,
      reference: p.reference || null,
    }));

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("getAllPayments error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REAL DEFAULTERS (Students who actually owe money)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getRealDefaulters(req: Request, res: Response) {
  try {
    const tenantId = (req as any).user?.tenantId;

    // Get all StudentFees with pending amounts
    const allFees = await prisma.studentFee.findMany({
      where: {
        tenantId,
      },
      include: {
        enrollment: {
          include: {
            student: { select: { firstName: true, lastName: true, fatherName: true, phone: true } },
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
      },
    });

    // Group by enrollmentId (= per student per class)
    const grouped: Record<string, any> = {};
    for (const sf of allFees) {
      const key = sf.enrollmentId;
      if (!grouped[key]) {
        grouped[key] = {
          id: sf.enrollmentId,
          studentName: `${sf.enrollment?.student?.firstName || ""} ${sf.enrollment?.student?.lastName || ""}`.trim(),
          className: sf.enrollment?.class?.name || "-",
          section: sf.enrollment?.section?.name || "-",
          fatherName: sf.enrollment?.student?.fatherName || "-",
          phone: sf.enrollment?.student?.phone || "-",
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
        };
      }
      grouped[key].totalAmount += sf.netAmount;
      grouped[key].paidAmount += sf.paidAmount;
      grouped[key].pendingAmount += (sf.netAmount - sf.paidAmount);
    }

    // Only return students with actual pending > 0
    const defaulters = Object.values(grouped)
      .filter((d: any) => d.pendingAmount > 0)
      .sort((a: any, b: any) => b.pendingAmount - a.pendingAmount);

    return res.json({ success: true, data: defaulters });
  } catch (error: any) {
    console.error("getRealDefaulters error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
