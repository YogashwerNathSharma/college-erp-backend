
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FEE INTEGRATION SERVICE — Auto Fee Demand from External Modules
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This service allows external modules (Transport, Hostel, Library, Exam)
 * to ADD or REMOVE fee demands for students automatically.
 *
 * ARCHITECTURE:
 *   Transport Module → assignTransportFee() → Fee Demand created
 *   Hostel Module → assignHostelFee() → Fee Demand created
 *   Any Module → removeModuleFee() → Fee Demand stopped
 *
 * Fee Collection shows ALL demands (Academic + Transport + Hostel + Exam)
 * Receipt shows each head with its amount.
 *
 * SOURCE MODULE tracking: Every StudentFeeItem has sourceModule field
 * so reports can filter by source.
 */

import prisma from "../../utils/prisma";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Find or create a FeeHead by name
// ═══════════════════════════════════════════════════════════════════════════

const findOrCreateFeeHead = async (
  tenantId: string,
  name: string,
  options?: { code?: string; category?: string; sourceModule?: string }
) => {
  let head = await prisma.feeHead.findFirst({
    where: { tenantId, name: { equals: name, mode: "insensitive" }, isDeleted: false },
  });

  if (!head) {
    head = await prisma.feeHead.create({
      data: {
        tenantId,
        name,
        code: options?.code || name.substring(0, 3).toUpperCase(),
        type: "RECURRING",
        category: options?.category || "Transport",
        sourceModule: options?.sourceModule || "Transport",
        isTaxable: false,
        isRefundable: false,
      },
    });
  }

  return head;
};

// ═══════════════════════════════════════════════════════════════════════════
// ADD TRANSPORT FEE — Called when TransportAssignment is created
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Adds transport fee to a student's existing fee records.
 * If fees are already assigned, adds Transport Fee item to each PENDING/PARTIAL installment.
 * If fees are NOT yet assigned, stores it — assignFeesToStudent will pick it up later.
 */
export const addTransportFeeToStudent = async (
  studentId: string,
  tenantId: string,
  monthlyFee: number,
  routeName?: string
) => {
  if (monthlyFee <= 0) return { success: true, message: "No transport fee to add" };

  // Find active enrollment for this student
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, tenantId, isDeleted: false, status: "active" },
  });

  if (!enrollment) return { success: false, message: "No active enrollment found" };

  // Get or create Transport Fee head
  const transportHead = await findOrCreateFeeHead(tenantId, "Transport Fee", {
    code: "TRN",
    category: "Transport",
    sourceModule: "Transport",
  });

  // Find student's existing fee records (PENDING or PARTIAL)
  const pendingFees = await prisma.studentFee.findMany({
    where: {
      enrollmentId: enrollment.id,
      tenantId,
      isDeleted: false,
      status: { in: ["PENDING", "PARTIAL"] },
    },
    orderBy: { installmentNo: "asc" },
  });

  if (pendingFees.length === 0) {
    // No fees assigned yet — transport will be auto-added when fees are assigned
    return { success: true, message: "No pending installments — transport fee will be added when fees are assigned", pending: true };
  }

  // Add transport fee item to each pending installment
  let added = 0;
  for (const fee of pendingFees) {
    // Check if transport already exists for this installment
    const existing = await prisma.studentFeeItem.findFirst({
      where: { studentFeeId: fee.id, feeHeadId: transportHead.id },
    });

    if (existing) continue; // Already has transport fee

    // Add transport fee item
    await prisma.studentFeeItem.create({
      data: {
        studentFeeId: fee.id,
        feeHeadId: transportHead.id,
        name: routeName ? `Transport Fee (${routeName})` : "Transport Fee",
        amount: monthlyFee,
        frequency: "PER_INSTALLMENT",
      },
    });

    // Update StudentFee totals
    await prisma.studentFee.update({
      where: { id: fee.id },
      data: {
        totalAmount: { increment: monthlyFee },
        netAmount: { increment: monthlyFee },
        balanceAmount: { increment: monthlyFee },
      },
    });

    added++;
  }

  return { success: true, message: `Transport fee ₹${monthlyFee}/month added to ${added} installments`, added };
};

// ═══════════════════════════════════════════════════════════════════════════
// REMOVE TRANSPORT FEE — Called when TransportAssignment is ended/deleted
// ═══════════════════════════════════════════════════════════════════════════

export const removeTransportFeeFromStudent = async (
  studentId: string,
  tenantId: string
) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, tenantId, isDeleted: false, status: "active" },
  });

  if (!enrollment) return { success: false, message: "No active enrollment found" };

  const transportHead = await prisma.feeHead.findFirst({
    where: { tenantId, name: { contains: "transport", mode: "insensitive" }, isDeleted: false },
  });

  if (!transportHead) return { success: true, message: "No transport head found" };

  // Find pending fees with transport items
  const pendingFees = await prisma.studentFee.findMany({
    where: {
      enrollmentId: enrollment.id,
      tenantId,
      isDeleted: false,
      status: { in: ["PENDING"] }, // Only remove from fully PENDING (not PARTIAL — already collecting)
    },
    include: { items: { where: { feeHeadId: transportHead.id } } },
  });

  let removed = 0;
  for (const fee of pendingFees) {
    for (const item of fee.items) {
      // Remove the transport item
      await prisma.studentFeeItem.delete({ where: { id: item.id } });

      // Update StudentFee totals
      await prisma.studentFee.update({
        where: { id: fee.id },
        data: {
          totalAmount: { decrement: item.amount },
          netAmount: { decrement: item.amount },
          balanceAmount: { decrement: item.amount },
        },
      });

      removed++;
    }
  }

  return { success: true, message: `Transport fee removed from ${removed} pending installments`, removed };
};

// ═══════════════════════════════════════════════════════════════════════════
// ADD HOSTEL FEE — Called when HostelAllocation is created
// ═══════════════════════════════════════════════════════════════════════════

export const addHostelFeeToStudent = async (
  studentId: string,
  tenantId: string,
  monthlyFee: number,
  hostelName?: string
) => {
  if (monthlyFee <= 0) return { success: true, message: "No hostel fee to add" };

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, tenantId, isDeleted: false, status: "active" },
  });

  if (!enrollment) return { success: false, message: "No active enrollment found" };

  const hostelHead = await findOrCreateFeeHead(tenantId, "Hostel Fee", {
    code: "HST",
    category: "Hostel",
    sourceModule: "Hostel",
  });

  const pendingFees = await prisma.studentFee.findMany({
    where: {
      enrollmentId: enrollment.id,
      tenantId,
      isDeleted: false,
      status: { in: ["PENDING", "PARTIAL"] },
    },
    orderBy: { installmentNo: "asc" },
  });

  if (pendingFees.length === 0) {
    return { success: true, message: "No pending installments — hostel fee will be added when fees are assigned", pending: true };
  }

  let added = 0;
  for (const fee of pendingFees) {
    const existing = await prisma.studentFeeItem.findFirst({
      where: { studentFeeId: fee.id, feeHeadId: hostelHead.id },
    });

    if (existing) continue;

    await prisma.studentFeeItem.create({
      data: {
        studentFeeId: fee.id,
        feeHeadId: hostelHead.id,
        name: hostelName ? `Hostel Fee (${hostelName})` : "Hostel Fee",
        amount: monthlyFee,
        frequency: "PER_INSTALLMENT",
      },
    });

    await prisma.studentFee.update({
      where: { id: fee.id },
      data: {
        totalAmount: { increment: monthlyFee },
        netAmount: { increment: monthlyFee },
        balanceAmount: { increment: monthlyFee },
      },
    });

    added++;
  }

  return { success: true, message: `Hostel fee ₹${monthlyFee}/month added to ${added} installments`, added };
};

// ═══════════════════════════════════════════════════════════════════════════
// REMOVE HOSTEL FEE — Called when HostelAllocation is ended/vacated
// ═══════════════════════════════════════════════════════════════════════════

export const removeHostelFeeFromStudent = async (
  studentId: string,
  tenantId: string
) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, tenantId, isDeleted: false, status: "active" },
  });

  if (!enrollment) return { success: false, message: "No active enrollment found" };

  const hostelHead = await prisma.feeHead.findFirst({
    where: { tenantId, name: { contains: "hostel", mode: "insensitive" }, isDeleted: false },
  });

  if (!hostelHead) return { success: true, message: "No hostel head found" };

  const pendingFees = await prisma.studentFee.findMany({
    where: {
      enrollmentId: enrollment.id,
      tenantId,
      isDeleted: false,
      status: { in: ["PENDING"] },
    },
    include: { items: { where: { feeHeadId: hostelHead.id } } },
  });

  let removed = 0;
  for (const fee of pendingFees) {
    for (const item of fee.items) {
      await prisma.studentFeeItem.delete({ where: { id: item.id } });
      await prisma.studentFee.update({
        where: { id: fee.id },
        data: {
          totalAmount: { decrement: item.amount },
          netAmount: { decrement: item.amount },
          balanceAmount: { decrement: item.amount },
        },
      });
      removed++;
    }
  }

  return { success: true, message: `Hostel fee removed from ${removed} pending installments`, removed };
};

// ═══════════════════════════════════════════════════════════════════════════
// GENERIC: Add any module fee to student
// ═══════════════════════════════════════════════════════════════════════════

export const addModuleFeeToStudent = async (
  studentId: string,
  tenantId: string,
  feeHeadName: string,
  amount: number,
  options?: { category?: string; sourceModule?: string; frequency?: string; oneTimeOnly?: boolean }
) => {
  if (amount <= 0) return { success: true, message: "No fee to add" };

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, tenantId, isDeleted: false, status: "active" },
  });

  if (!enrollment) return { success: false, message: "No active enrollment found" };

  const head = await findOrCreateFeeHead(tenantId, feeHeadName, {
    category: options?.category || "Miscellaneous",
    sourceModule: options?.sourceModule || "Manual",
  });

  const pendingFees = await prisma.studentFee.findMany({
    where: {
      enrollmentId: enrollment.id,
      tenantId,
      isDeleted: false,
      status: { in: ["PENDING", "PARTIAL"] },
    },
    orderBy: { installmentNo: "asc" },
  });

  if (pendingFees.length === 0) {
    return { success: true, message: "No pending installments", pending: true };
  }

  // One-time: only add to first pending installment
  const feesToUpdate = options?.oneTimeOnly ? [pendingFees[0]] : pendingFees;

  let added = 0;
  for (const fee of feesToUpdate) {
    const existing = await prisma.studentFeeItem.findFirst({
      where: { studentFeeId: fee.id, feeHeadId: head.id },
    });
    if (existing) continue;

    await prisma.studentFeeItem.create({
      data: {
        studentFeeId: fee.id,
        feeHeadId: head.id,
        name: feeHeadName,
        amount,
        frequency: options?.frequency || "PER_INSTALLMENT",
      },
    });

    await prisma.studentFee.update({
      where: { id: fee.id },
      data: {
        totalAmount: { increment: amount },
        netAmount: { increment: amount },
        balanceAmount: { increment: amount },
      },
    });
    added++;
  }

  return { success: true, message: `${feeHeadName} ₹${amount} added to ${added} installments`, added };
};
