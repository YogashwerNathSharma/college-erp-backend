
/**
 * ═══════════════════════════════════════════════════════════════════════
 * STUDENT LEDGER SERVICE — Enhanced with Month Summary
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Changes from original:
 * - Added monthSummary field using calculateMonthsCovered helper
 * - Provides a complete month-by-month picture alongside the ledger
 *
 * CRITICAL Prisma rules followed:
 * - Enrollment status is lowercase: status: "active"
 * - No { not: null } in where clauses
 * - No both select and include on same level
 */

import prisma from "../../utils/prisma";
import { calculateMonthsCovered } from "./feeCollection.service";

// ═══════════════════════════════════════════════════════════════════════
// GET STUDENT LEDGER — With month summary
// ═══════════════════════════════════════════════════════════════════════

export const getStudentLedger = async (enrollmentId: string, tenantId: string) => {
  // Get enrollment with student details
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, tenantId, isDeleted: false },
    include: {
      student: {
        select: { firstName: true, lastName: true, admissionNo: true, fatherName: true, phone: true },
      },
      class: { select: { name: true } },
      section: { select: { name: true } },
      academicYear: { select: { name: true } },
    },
  });

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  // Get all student fees with payments, discounts, and structure details
  const fees = await prisma.studentFee.findMany({
    where: { enrollmentId, tenantId, isDeleted: false },
    include: {
      payments: {
        where: {
          isDeleted: false,
        },
        orderBy: { paymentDate: "asc" },
      },
      feeStructure: {
        select: { name: true, items: { include: { feeHead: true } } },
      },
      discounts: {
        include: { feeDiscount: true },
      },
    },
    orderBy: [{ dueDate: "asc" }, { installmentNo: "asc" }],
  });

  // Calculate financial summary
  const totalFee = fees.reduce((sum, f) => sum + f.netAmount, 0);
  const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalDiscount = fees.reduce((sum, f) => sum + f.discountAmount, 0);
  const balance = totalFee - totalPaid;

  // Build ledger entries (debit/credit format)
  const entries: {
    date: string;
    particulars: string;
    receiptNo: string;
    debit: number;
    credit: number;
    balance: number;
  }[] = [];

  let runningBalance = 0;

  // Add fee assignments as debit entries
  for (const fee of fees) {
    const feeHeadNames = fee.feeStructure.items.map((i) => i.feeHead.name).join(", ");
    const particulars =
      `${fee.feeStructure.name} - Inst. #${fee.installmentNo}` +
      (feeHeadNames ? ` (${feeHeadNames})` : "");

    runningBalance += fee.netAmount;

    entries.push({
      date: new Date(fee.dueDate).toISOString(),
      particulars,
      receiptNo: "-",
      debit: fee.netAmount,
      credit: 0,
      balance: runningBalance,
    });

    // Add discount entries if any
    if (fee.discountAmount > 0) {
      const discountNames =
        fee.discounts.map((d) => d.feeDiscount.name).join(", ") || "Discount";
      runningBalance -= fee.discountAmount;
      entries.push({
        date: new Date(fee.updatedAt).toISOString(),
        particulars: `Discount: ${discountNames}`,
        receiptNo: "-",
        debit: 0,
        credit: fee.discountAmount,
        balance: runningBalance,
      });
    }

    // Add payment entries (credit)
    for (const payment of fee.payments) {
      runningBalance -= payment.amount;
      entries.push({
        date: new Date(payment.paymentDate).toISOString(),
        particulars: `Payment - ${fee.feeStructure.name} Inst.#${fee.installmentNo}`,
        receiptNo: payment.receiptNo,
        debit: 0,
        credit: payment.amount,
        balance: runningBalance,
      });
    }

    // Fallback: if paidAmount > 0 but no payment records (legacy/imported data)
    const totalPaymentAmount = fee.payments.reduce((sum, p) => sum + p.amount, 0);
    if (fee.paidAmount > 0 && totalPaymentAmount < fee.paidAmount) {
      const unrecordedAmount = fee.paidAmount - totalPaymentAmount;
      runningBalance -= unrecordedAmount;
      entries.push({
        date: new Date(fee.updatedAt).toISOString(),
        particulars: `Payment - ${fee.feeStructure.name} Inst.#${fee.installmentNo}`,
        receiptNo: "N/A",
        debit: 0,
        credit: unrecordedAmount,
        balance: runningBalance,
      });
    }
  }

  // Sort entries by date
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Recalculate running balance after sort
  let recalcBalance = 0;
  for (const entry of entries) {
    recalcBalance += entry.debit - entry.credit;
    entry.balance = recalcBalance;
  }

  // ═══════════════════════════════════════════════════════════════════
  // NEW: Calculate month coverage summary
  // ═══════════════════════════════════════════════════════════════════
  const monthCoverage = await calculateMonthsCovered(enrollmentId, tenantId);

  // Build a per-installment month status summary
  const installmentMonthStatus = fees.map((fee) => ({
    installmentNo: fee.installmentNo,
    dueDate: fee.dueDate,
    netAmount: fee.netAmount,
    paidAmount: fee.paidAmount,
    balanceAmount: fee.balanceAmount,
    status: fee.status,
  }));

  return {
    student: {
      name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      admissionNo: enrollment.student.admissionNo,
      fatherName: enrollment.student.fatherName,
      phone: enrollment.student.phone,
      class: enrollment.class.name,
      section: enrollment.section?.name || "",
      session: enrollment.academicYear.name,
      enrollmentId: enrollment.id,
    },
    summary: {
      totalFee: Math.round(totalFee),
      totalPaid: Math.round(totalPaid),
      totalDiscount: Math.round(totalDiscount),
      balance: Math.round(balance),
    },
    // NEW: Month-level summary for the student
    monthSummary: {
      paidFromMonth: monthCoverage.paidFromMonth,
      paidToMonth: monthCoverage.paidToMonth,
      partialMonth: monthCoverage.partialMonth,
      pendingFromMonth: monthCoverage.pendingFromMonth,
      totalMonthsPaid: monthCoverage.totalMonthsPaid,
      monthlyRate: monthCoverage.monthlyRate,
      totalRecurringPerInstallment: monthCoverage.totalRecurringPerInstallment,
      totalOneTimeCharges: monthCoverage.totalOneTimeCharges,
      // Readable status line for display
      statusLine: monthCoverage.totalMonthsPaid > 0
        ? `Paid: ${monthCoverage.paidFromMonth} to ${monthCoverage.paidToMonth} (${monthCoverage.totalMonthsPaid} month${monthCoverage.totalMonthsPaid > 1 ? "s" : ""})` +
          (monthCoverage.partialMonth ? ` | Partial: ${monthCoverage.partialMonth}` : "") +
          (monthCoverage.pendingFromMonth ? ` | Pending from: ${monthCoverage.pendingFromMonth}` : "")
        : monthCoverage.partialMonth
          ? `Partial payment for ${monthCoverage.partialMonth} | Pending from: ${monthCoverage.pendingFromMonth}`
          : `No months paid yet | Pending from: ${monthCoverage.pendingFromMonth || "N/A"}`,
    },
    // Per-installment quick status
    installmentStatus: installmentMonthStatus,
    entries,
    // Raw payments for receipt printing
    payments: fees.flatMap((fee) => 
      fee.payments.map((p) => ({
        id: p.id,
        receiptNo: p.receiptNo,
        amount: p.amount,
        method: p.method,
        reference: p.reference,
        paymentDate: p.paymentDate,
        installmentNo: fee.installmentNo,
        feeStructureName: fee.feeStructure.name,
        feeItems: fee.feeStructure.items.map((item) => ({ name: item.feeHead.name, amount: item.amount })),
      }))
    ),
  };
};

// ═══════════════════════════════════════════════════════════════════════
// SEARCH STUDENT FOR LEDGER
// ═══════════════════════════════════════════════════════════════════════

export const searchStudentForLedger = async (query: string, tenantId: string) => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      tenantId,
      isDeleted: false,
      OR: [
        { student: { firstName: { contains: query, mode: "insensitive" } } },
        { student: { lastName: { contains: query, mode: "insensitive" } } },
        { student: { admissionNo: { contains: query, mode: "insensitive" } } },
        { student: { fatherName: { contains: query, mode: "insensitive" } } },
      ],
    },
    include: {
      student: { select: { firstName: true, lastName: true, admissionNo: true, fatherName: true } },
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
    take: 10,
    orderBy: { student: { firstName: "asc" } },
  });

  return enrollments.map((e) => ({
    enrollmentId: e.id,
    name: `${e.student.firstName} ${e.student.lastName}`,
    admissionNo: e.student.admissionNo,
    fatherName: e.student.fatherName,
    className: e.class.name,
    sectionName: e.section?.name || "",
  }));
};
