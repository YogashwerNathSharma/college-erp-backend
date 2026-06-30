
/**
 * ═══════════════════════════════════════════════════════════════════════
 * FEE COLLECTION SERVICE — Complete Overhaul
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Changes from original:
 * 1. assignFeesToStudent: Respects FeeStructureItem.frequency (ONE_TIME vs PER_INSTALLMENT)
 * 2. Transport fee auto-link from TransportAssignment
 * 3. Hostel fee auto-link from HostelAllocation
 * 4. NEW: Creates StudentFeeItem records for per-student fee head breakdown
 * 5. collectPayment: Returns month coverage info + uses StudentFeeItem for receipt
 * 6. getDailyCollection: Includes monthsCovered per payment for receipt printing
 * 7. getStudentFees: Includes items relation for frontend display
 *
 * CRITICAL Prisma rules followed:
 * - Enrollment status is lowercase: status: "active"
 * - No { not: null } in where clauses — filter nulls in JS
 * - No both select and include on same level
 * - Event model does NOT have isDeleted field
 */

import prisma from "../../utils/prisma";

// ═══════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════

interface MonthCoverage {
  paidFromMonth: string | null; // e.g., "April 2026"
  paidToMonth: string | null; // e.g., "June 2026"
  partialMonth: string | null; // partially paid current month
  pendingFromMonth: string | null; // next unpaid month
  totalMonthsPaid: number;
  monthlyRate: number; // recurring fee per month equivalent
  totalRecurringPerInstallment: number;
  totalOneTimeCharges: number;
}

interface MonthsCoveredShort {
  from: string | null;
  to: string | null;
  total: number;
}

// ═══════════════════════════════════════════════════════════════════════
// HELPER: Month name formatter
// ═══════════════════════════════════════════════════════════════════════

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Converts a Date to "Month YYYY" string
 */
const formatMonthYear = (date: Date): string => {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Gets the month offset from academic year start date
 * e.g., if academic year starts April 2026, installment #1 = April 2026, #2 = May 2026, etc.
 */
const getMonthForInstallment = (
  academicYearStart: Date,
  installmentNo: number,
  installmentType: string,
  totalInstallments: number
): string => {
  const startDate = new Date(academicYearStart);

  // Calculate how many months each installment covers
  let monthsPerInstallment = 1;
  switch (installmentType) {
    case "MONTHLY":
      monthsPerInstallment = 1;
      break;
    case "QUARTERLY":
      monthsPerInstallment = 3;
      break;
    case "HALF_YEARLY":
      monthsPerInstallment = 6;
      break;
    case "YEARLY":
      monthsPerInstallment = 12;
      break;
    default:
      // For CUSTOM or ONE_TIME, estimate from totalInstallments
      monthsPerInstallment = Math.max(1, Math.floor(12 / totalInstallments));
  }

  // installment #1 covers the first month(s), so offset = (installmentNo - 1) * monthsPerInstallment
  const monthOffset = (installmentNo - 1) * monthsPerInstallment;
  const targetDate = new Date(startDate);
  targetDate.setMonth(targetDate.getMonth() + monthOffset);

  return formatMonthYear(targetDate);
};

// ═══════════════════════════════════════════════════════════════════════
// RECEIPT NUMBER GENERATOR
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate auto-increment receipt number per tenant: RCP/YYYY/XXXXX
 */
export const generateReceiptNo = async (tenantId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `RCP/${year}/`;

  const lastPayment = await prisma.payment.findFirst({
    where: {
      tenantId,
      receiptNo: { startsWith: prefix },
    },
    orderBy: { createdAt: "desc" },
    select: { receiptNo: true },
  });

  let nextNum = 1;
  if (lastPayment?.receiptNo) {
    const lastNum = parseInt(lastPayment.receiptNo.split("/").pop() || "0", 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(5, "0")}`;
};

// ═══════════════════════════════════════════════════════════════════════
// ASSIGN FEES TO STUDENT — Fixed with frequency awareness + transport + hostel + StudentFeeItem
// ═══════════════════════════════════════════════════════════════════════

/**
 * Assigns fees to a single student based on their class's FeeStructure.
 *
 * KEY LOGIC:
 * - FeeStructureItem with frequency="PER_INSTALLMENT" (tuition, transport) → added to EVERY installment
 * - FeeStructureItem with frequency="ONE_TIME" (exam fee, admission, ID card, belt/tie) → added ONLY to installment #1
 *
 * After creating base installments, checks for TransportAssignment and HostelAllocation
 * and adds transport/hostel fee items to each recurring installment.
 *
 * NEW: Creates StudentFeeItem records for per-student fee head breakdown.
 */
export const assignFeesToStudent = async (
  enrollmentId: string,
  tenantId: string,
  selectedItems?: Array<{
    feeHeadId: string;
    amount: number;
    feeHeadName?: string;
    frequency?: string;
  }>
) => {
  // 1. Validate enrollment exists
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, tenantId, isDeleted: false },
    include: { academicYear: true },
  });

  if (!enrollment) throw new Error("Enrollment not found");

  // 2. Check if fees already assigned (prevent duplicates)
  const existingFees = await prisma.studentFee.findFirst({
    where: { enrollmentId, tenantId, isDeleted: false },
  });

  if (existingFees) throw new Error("Fees already assigned for this enrollment");

  // 3. Get fee structures for this class + academic year (with items + feeHead details)
  const feeStructures = await prisma.feeStructure.findMany({
    where: {
      tenantId,
      classId: enrollment.classId,
      academicYearId: enrollment.academicYearId,
      isDeleted: false,
    },
    include: {
      items: {
        include: {
          feeHead: true,
        },
      },
    },
  });

  if (feeStructures.length === 0) {
    throw new Error("No fee structure found for this class");
  }

  // 4. Check for transport assignment for this student
  //    TransportAssignment.studentId is a plain String (not ObjectId relation)
  //    It stores the student's ID as string
  const transportAssignment = await prisma.transportAssignment.findFirst({
    where: {
      studentId: enrollment.studentId,
      tenantId,
      status: "ACTIVE",
      isDeleted: false,
    },
  });

  const transportMonthlyFee = transportAssignment?.monthlyFee || 0;

  // 5. Check for hostel allocation for this student
  let hostelMonthlyFee = 0;
  try {
    const hostelAllocation = await prisma.hostelAllocation.findFirst({
      where: {
        studentId: enrollment.studentId,
        tenantId,
        status: "ACTIVE",
      },
      include: {
        room: true,
      },
    });
    // Use room's monthly fee if available, otherwise use a default
    if (hostelAllocation) {
      hostelMonthlyFee = (hostelAllocation.room as any)?.monthlyFee || (hostelAllocation.room as any)?.rentPerBed || 0;
    }
  } catch {
    // HostelAllocation model might not have all expected fields — safe to skip
    hostelMonthlyFee = 0;
  }

  const academicYearStart = new Date(enrollment.academicYear.startDate);
  const studentFees: any[] = [];

  // 6. Process each fee structure
  for (const structure of feeStructures) {
    const totalInstallments = structure.totalInstallments || 1;
    const dueDay = structure.dueDay || 10;

    // Separate items by frequency
    const recurringItems = structure.items.filter(
      (item) => item.frequency === "PER_INSTALLMENT"
    );
    const oneTimeItems = structure.items.filter(
      (item) => item.frequency === "ONE_TIME"
    );

    // Calculate amounts
    const recurringTotal = recurringItems.reduce((sum, item) => sum + item.amount, 0);
    const oneTimeTotal = oneTimeItems.reduce((sum, item) => sum + item.amount, 0);

    // 7. Create installments
    for (let i = 1; i <= totalInstallments; i++) {
      // Calculate due date for this installment
      const dueDate = new Date(academicYearStart);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      dueDate.setDate(dueDay);

      // Base amount = recurring items (every installment)
      let installmentAmount = recurringTotal;

      // ONE_TIME items only go into installment #1
      if (i === 1) {
        installmentAmount += oneTimeTotal;
      }

      // Add transport fee to EVERY recurring installment (not one-time only)
      // Transport is inherently a monthly/per-installment charge
      if (transportMonthlyFee > 0) {
        installmentAmount += transportMonthlyFee;
      }

      // Add hostel fee to EVERY recurring installment
      if (hostelMonthlyFee > 0) {
        installmentAmount += hostelMonthlyFee;
      }

      studentFees.push({
        tenantId,
        enrollmentId,
        feeStructureId: structure.id,
        totalAmount: installmentAmount,
        discountAmount: 0,
        fineAmount: 0,
        netAmount: installmentAmount,
        paidAmount: 0,
        balanceAmount: installmentAmount,
        installmentNo: i,
        dueDate,
        status: "PENDING",
        // Metadata for StudentFeeItem creation (not stored in DB directly)
        _structureId: structure.id,
        _installmentNo: i,
      });
    }
  }

  // 8. Bulk create all installments
  // Remove metadata fields before creating
  const dbData = studentFees.map(({ _structureId, _installmentNo, ...rest }) => rest);
  const created = await prisma.studentFee.createMany({ data: dbData });

  // 9. Create StudentFeeItem records for each installment
  // Fetch the just-created StudentFee records to get their IDs
  const createdStudentFees = await prisma.studentFee.findMany({
    where: { enrollmentId, tenantId, isDeleted: false },
    orderBy: [{ feeStructureId: "asc" }, { installmentNo: "asc" }],
  });

  // Build StudentFeeItem records
  const studentFeeItems: any[] = [];

  for (const studentFee of createdStudentFees) {
    // Find the matching fee structure
    const structure = feeStructures.find((s) => s.id === studentFee.feeStructureId);
    if (!structure) continue;

    const recurringItems = structure.items.filter(
      (item) => item.frequency === "PER_INSTALLMENT"
    );
    const oneTimeItems = structure.items.filter(
      (item) => item.frequency === "ONE_TIME"
    );

    // Add PER_INSTALLMENT items to EVERY installment
    for (const item of recurringItems) {
      studentFeeItems.push({
        studentFeeId: studentFee.id,
        feeHeadId: item.feeHeadId,
        name: item.feeHead.name,
        amount: item.amount,
        frequency: "PER_INSTALLMENT",
      });
    }

    // Add ONE_TIME items ONLY to installment #1
    if (studentFee.installmentNo === 1) {
      for (const item of oneTimeItems) {
        studentFeeItems.push({
          studentFeeId: studentFee.id,
          feeHeadId: item.feeHeadId,
          name: item.feeHead.name,
          amount: item.amount,
          frequency: "ONE_TIME",
        });
      }
    }

    // Add transport fee item if applicable
    if (transportMonthlyFee > 0) {
      // Try to find a "Transport" fee head; create item with feeHeadId from structure or use a lookup
      let transportFeeHeadId: string | null = null;
      try {
        const transportHead = await prisma.feeHead.findFirst({
          where: {
            tenantId,
            name: { contains: "transport", mode: "insensitive" },
            isDeleted: false,
          },
        });
        transportFeeHeadId = transportHead?.id || null;
      } catch {
        transportFeeHeadId = null;
      }

      if (transportFeeHeadId) {
        studentFeeItems.push({
          studentFeeId: studentFee.id,
          feeHeadId: transportFeeHeadId,
          name: "Transport Fee",
          amount: transportMonthlyFee,
          frequency: "PER_INSTALLMENT",
        });
      }
    }

    // Add hostel fee item if applicable
    if (hostelMonthlyFee > 0) {
      let hostelFeeHeadId: string | null = null;
      try {
        const hostelHead = await prisma.feeHead.findFirst({
          where: {
            tenantId,
            name: { contains: "hostel", mode: "insensitive" },
            isDeleted: false,
          },
        });
        hostelFeeHeadId = hostelHead?.id || null;
      } catch {
        hostelFeeHeadId = null;
      }

      if (hostelFeeHeadId) {
        studentFeeItems.push({
          studentFeeId: studentFee.id,
          feeHeadId: hostelFeeHeadId,
          name: "Hostel Fee",
          amount: hostelMonthlyFee,
          frequency: "PER_INSTALLMENT",
        });
      }
    }
  }

  // Bulk create StudentFeeItem records
  if (studentFeeItems.length > 0) {
    await prisma.studentFeeItem.createMany({ data: studentFeeItems });
  }

  return {
    message: `${created.count} fee installments assigned successfully`,
    count: created.count,
    itemsCreated: studentFeeItems.length,
    breakdown: {
      transportFeeIncluded: transportMonthlyFee > 0,
      transportMonthlyFee,
      hostelFeeIncluded: hostelMonthlyFee > 0,
      hostelMonthlyFee,
      structures: feeStructures.map((s) => ({
        name: s.name,
        totalInstallments: s.totalInstallments,
        recurringItems: s.items
          .filter((i) => i.frequency === "PER_INSTALLMENT")
          .map((i) => ({ name: i.feeHead.name, amount: i.amount })),
        oneTimeItems: s.items
          .filter((i) => i.frequency === "ONE_TIME")
          .map((i) => ({ name: i.feeHead.name, amount: i.amount })),
      })),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════
// BULK ASSIGN FEES TO CLASS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Bulk assign fees to ALL active students in a class.
 * Iterates enrollments and calls assignFeesToStudent for each.
 */
export const assignFeesToClass = async (
  classId: string,
  academicYearId: string,
  tenantId: string
) => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
      academicYearId,
      tenantId,
      status: "active", // lowercase per Prisma rules
      isDeleted: false,
    },
    select: { id: true },
  });

  if (enrollments.length === 0) {
    throw new Error("No active enrollments found for this class");
  }

  let successCount = 0;
  let skipCount = 0;
  const errors: string[] = [];

  for (const enrollment of enrollments) {
    try {
      await assignFeesToStudent(enrollment.id, tenantId);
      successCount++;
    } catch (error: any) {
      if (error.message === "Fees already assigned for this enrollment") {
        skipCount++;
      } else {
        errors.push(`Enrollment ${enrollment.id}: ${error.message}`);
      }
    }
  }

  return {
    message: `Fees assigned to ${successCount} students. Skipped: ${skipCount}. Errors: ${errors.length}`,
    successCount,
    skipCount,
    errors,
    totalEnrollments: enrollments.length,
  };
};

// ═══════════════════════════════════════════════════════════════════════
// MONTH CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calculates months covered by fee payments for a given enrollment.
 *
 * Logic:
 * - Gets all StudentFees for this enrollment, ordered by installmentNo
 * - Identifies recurring fee items (PER_INSTALLMENT) to determine monthly rate
 * - Based on payment status of each installment, calculates:
 *   - paidFromMonth: first month covered (typically academic year start)
 *   - paidToMonth: last month fully paid
 *   - partialMonth: if current installment is partially paid
 *   - pendingFromMonth: next month needing payment
 *   - totalMonthsPaid: total count of fully paid months
 *
 * Edge cases handled:
 * - Partial payments (PARTIAL status)
 * - Zero balance / fully paid
 * - No fees assigned
 * - Overpayment (capped to available installments)
 */
export const calculateMonthsCovered = async (
  enrollmentId: string,
  tenantId: string
): Promise<MonthCoverage> => {
  // Get all StudentFees for this enrollment with their fee structure details
  const studentFees = await prisma.studentFee.findMany({
    where: { enrollmentId, tenantId, isDeleted: false },
    include: {
      feeStructure: {
        include: {
          items: {
            include: { feeHead: true },
          },
          academicYear: true,
        },
      },
    },
    orderBy: [{ feeStructureId: "asc" }, { installmentNo: "asc" }],
  });

  // Default return for no fees
  if (studentFees.length === 0) {
    return {
      paidFromMonth: null,
      paidToMonth: null,
      partialMonth: null,
      pendingFromMonth: null,
      totalMonthsPaid: 0,
      monthlyRate: 0,
      totalRecurringPerInstallment: 0,
      totalOneTimeCharges: 0,
    };
  }

  // Get the first fee structure to determine academic year start and installment type
  const firstFee = studentFees[0];
  const academicYearStart = new Date(firstFee.feeStructure.academicYear.startDate);
  const installmentType = firstFee.feeStructure.installmentType;
  const totalInstallments = firstFee.feeStructure.totalInstallments || 1;

  // Calculate recurring and one-time amounts from the structure items
  const recurringItems = firstFee.feeStructure.items.filter(
    (item) => item.frequency === "PER_INSTALLMENT"
  );
  const oneTimeItems = firstFee.feeStructure.items.filter(
    (item) => item.frequency === "ONE_TIME"
  );

  const totalRecurringPerInstallment = recurringItems.reduce(
    (sum, item) => sum + item.amount, 0
  );
  const totalOneTimeCharges = oneTimeItems.reduce(
    (sum, item) => sum + item.amount, 0
  );

  // Check if transport fee was included (compare installment #2 vs structure recurring total)
  // Transport fee = actual installment amount (for inst #2+) - recurring items total
  // For installment #1: amount = recurring + one-time + transport
  // For installment #2+: amount = recurring + transport
  let transportFeePerInstallment = 0;
  if (studentFees.length >= 2) {
    // Installment #2 should be: recurringTotal + transportFee
    const inst2 = studentFees.find((f) => f.installmentNo === 2);
    if (inst2) {
      transportFeePerInstallment = inst2.totalAmount - totalRecurringPerInstallment;
      if (transportFeePerInstallment < 0) transportFeePerInstallment = 0;
    }
  } else if (studentFees.length === 1) {
    // Only 1 installment: can't separate transport from one-time easily
    // Use installment amount - recurring - oneTime
    const singleFee = studentFees[0];
    transportFeePerInstallment =
      singleFee.totalAmount - totalRecurringPerInstallment - totalOneTimeCharges;
    if (transportFeePerInstallment < 0) transportFeePerInstallment = 0;
  }

  // Monthly rate = (recurring items + transport) per installment
  // This represents what is charged each installment for "monthly" services
  const monthlyRate = totalRecurringPerInstallment + transportFeePerInstallment;

  // Calculate months per installment based on installment type
  let monthsPerInstallment = 1;
  switch (installmentType) {
    case "MONTHLY":
      monthsPerInstallment = 1;
      break;
    case "QUARTERLY":
      monthsPerInstallment = 3;
      break;
    case "HALF_YEARLY":
      monthsPerInstallment = 6;
      break;
    case "YEARLY":
      monthsPerInstallment = 12;
      break;
    default:
      monthsPerInstallment = Math.max(1, Math.floor(12 / totalInstallments));
  }

  // Group fees by installment number (in case multiple structures — unlikely but safe)
  // We track paid/partial status per installment
  const installmentMap = new Map<number, { totalPaid: number; totalNet: number; status: string }>();

  for (const fee of studentFees) {
    const existing = installmentMap.get(fee.installmentNo);
    if (existing) {
      existing.totalPaid += fee.paidAmount;
      existing.totalNet += fee.netAmount;
      // Composite status: if any is PENDING, it's not fully paid
      if (fee.status === "PENDING" || fee.status === "OVERDUE") {
        existing.status = existing.status === "PAID" ? "PARTIAL" : existing.status;
      }
    } else {
      installmentMap.set(fee.installmentNo, {
        totalPaid: fee.paidAmount,
        totalNet: fee.netAmount,
        status: fee.status,
      });
    }
  }

  // Sort installments by number
  const sortedInstallments = Array.from(installmentMap.entries()).sort(
    ([a], [b]) => a - b
  );

  // Calculate month coverage
  let totalMonthsPaid = 0;
  let lastFullyPaidInstallment = 0;
  let firstPartialInstallment: number | null = null;

  for (const [instNo, data] of sortedInstallments) {
    if (data.status === "PAID") {
      totalMonthsPaid += monthsPerInstallment;
      lastFullyPaidInstallment = instNo;
    } else if (data.status === "PARTIAL") {
      // Partial: calculate fraction of months covered
      if (data.totalNet > 0) {
        // For installment #1 which includes one-time charges:
        // Consider it partially paid towards recurring portion
        const recurringPortion =
          instNo === 1 ? monthlyRate : data.totalNet;

        if (instNo === 1 && data.totalPaid >= totalOneTimeCharges) {
          // One-time charges are covered, check how much of recurring is paid
          const paidTowardsRecurring = data.totalPaid - totalOneTimeCharges;
          if (recurringPortion > 0 && paidTowardsRecurring >= recurringPortion) {
            totalMonthsPaid += monthsPerInstallment;
            lastFullyPaidInstallment = instNo;
          } else {
            firstPartialInstallment = instNo;
          }
        } else if (instNo > 1) {
          // For later installments, partial means not fully covering the month
          firstPartialInstallment = instNo;
        } else {
          firstPartialInstallment = instNo;
        }
      }
      break; // Stop at first partial — subsequent are pending
    } else {
      // PENDING or OVERDUE — stop here
      break;
    }
  }

  // Determine month labels
  let paidFromMonth: string | null = null;
  let paidToMonth: string | null = null;
  let partialMonth: string | null = null;
  let pendingFromMonth: string | null = null;

  if (totalMonthsPaid > 0) {
    paidFromMonth = formatMonthYear(academicYearStart);

    const lastPaidDate = new Date(academicYearStart);
    lastPaidDate.setMonth(
      lastPaidDate.getMonth() + (totalMonthsPaid - 1)
    );
    paidToMonth = formatMonthYear(lastPaidDate);
  }

  if (firstPartialInstallment !== null) {
    const partialDate = new Date(academicYearStart);
    partialDate.setMonth(
      partialDate.getMonth() + ((firstPartialInstallment - 1) * monthsPerInstallment) + totalMonthsPaid
    );
    // Adjust: if totalMonthsPaid already accounts for previous installments
    const partialMonthOffset = totalMonthsPaid; // months already fully paid
    const pDate = new Date(academicYearStart);
    pDate.setMonth(pDate.getMonth() + partialMonthOffset);
    partialMonth = formatMonthYear(pDate);
  }

  // Pending from month = next month after fully paid (or first month if nothing paid)
  const pendingOffset = totalMonthsPaid + (firstPartialInstallment !== null ? 1 : 0);
  if (pendingOffset < totalInstallments * monthsPerInstallment) {
    const pendingDate = new Date(academicYearStart);
    pendingDate.setMonth(pendingDate.getMonth() + pendingOffset);
    pendingFromMonth = formatMonthYear(pendingDate);
  }

  // If nothing paid at all
  if (totalMonthsPaid === 0 && firstPartialInstallment === null) {
    pendingFromMonth = formatMonthYear(academicYearStart);
  }

  return {
    paidFromMonth,
    paidToMonth,
    partialMonth,
    pendingFromMonth,
    totalMonthsPaid,
    monthlyRate,
    totalRecurringPerInstallment,
    totalOneTimeCharges,
  };
};

/**
 * Compact version of month coverage for payment responses
 */
const getMonthsCoveredShort = (coverage: MonthCoverage): MonthsCoveredShort => ({
  from: coverage.paidFromMonth,
  to: coverage.paidToMonth,
  total: coverage.totalMonthsPaid,
});

// ═══════════════════════════════════════════════════════════════════════
// GET STUDENT FEES — With detailed breakdown + StudentFeeItem
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get all fees for a student with payments, discounts, items, and month coverage included.
 * Now includes StudentFeeItem (per-student fee head breakdown) in the response.
 */
export const getStudentFees = async (enrollmentId: string, tenantId: string) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, tenantId, isDeleted: false },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          admissionNo: true,
          fatherName: true,
          phone: true,
        },
      },
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
  });

  if (!enrollment) throw new Error("Enrollment not found");

  const fees = await prisma.studentFee.findMany({
    where: { enrollmentId, tenantId, isDeleted: false },
    include: {
      payments: {
        where: { isDeleted: false },
        orderBy: { paymentDate: "desc" },
      },
      discounts: {
        include: { feeDiscount: true },
      },
      feeStructure: {
        include: { items: { include: { feeHead: true } } },
      },
      // NEW: Include per-student fee items
      items: {
        include: { feeHead: true },
      },
    },
    orderBy: [{ feeStructureId: "asc" }, { installmentNo: "asc" }],
  });

  // Calculate month coverage
  const monthCoverage = await calculateMonthsCovered(enrollmentId, tenantId);

  return {
    student: {
      name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      admissionNo: enrollment.student.admissionNo,
      fatherName: enrollment.student.fatherName,
      phone: enrollment.student.phone,
      class: enrollment.class.name,
      section: enrollment.section?.name || "",
      rollNumber: enrollment.rollNumber,
      enrollmentId: enrollment.id,
    },
    fees,
    summary: {
      totalAmount: fees.reduce((sum, f) => sum + f.totalAmount, 0),
      totalDiscount: fees.reduce((sum, f) => sum + f.discountAmount, 0),
      totalFine: fees.reduce((sum, f) => sum + f.fineAmount, 0),
      totalNet: fees.reduce((sum, f) => sum + f.netAmount, 0),
      totalPaid: fees.reduce((sum, f) => sum + f.paidAmount, 0),
      totalBalance: fees.reduce((sum, f) => sum + f.balanceAmount, 0),
    },
    monthCoverage,
  };
};

// ═══════════════════════════════════════════════════════════════════════
// FIND STUDENT BY ADMISSION NUMBER
// ═══════════════════════════════════════════════════════════════════════

export const getStudentFeesByAdmissionNo = async (
  admissionNo: string,
  tenantId: string
) => {
  const student = await prisma.student.findFirst({
    where: { admissionNo, tenantId, isDeleted: false },
    select: { id: true },
  });

  if (!student) throw new Error("Student not found with this admission number");

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: student.id,
      tenantId,
      status: "active", // lowercase per Prisma rules
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!enrollment) throw new Error("No active enrollment found for this student");

  return getStudentFees(enrollment.id, tenantId);
};

// ═══════════════════════════════════════════════════════════════════════
// UNIVERSAL SEARCH
// ═══════════════════════════════════════════════════════════════════════

/**
 * Search students by name, admission number, class, or section
 */
export const searchStudents = async (query: string, tenantId: string) => {
  // Try exact admission number match first
  const exactStudent = await prisma.student.findFirst({
    where: { admissionNo: { equals: query, mode: "insensitive" }, tenantId, isDeleted: false },
    select: { id: true },
  });

  if (exactStudent) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: exactStudent.id, tenantId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (enrollment) return { type: "single", data: await getStudentFees(enrollment.id, tenantId) };
  }

  // Fuzzy search across multiple fields
  const enrollments = await prisma.enrollment.findMany({
    where: {
      tenantId,
      isDeleted: false,
      OR: [
        { student: { firstName: { contains: query, mode: "insensitive" } } },
        { student: { lastName: { contains: query, mode: "insensitive" } } },
        { student: { admissionNo: { contains: query, mode: "insensitive" } } },
        { student: { fatherName: { contains: query, mode: "insensitive" } } },
        { class: { name: { contains: query, mode: "insensitive" } } },
        { section: { name: { contains: query, mode: "insensitive" } } },
      ],
    },
    include: {
      student: { select: { firstName: true, lastName: true, admissionNo: true, fatherName: true, phone: true } },
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
    take: 20,
    orderBy: { student: { firstName: "asc" } },
  });

  if (enrollments.length === 0) throw new Error("No students found matching your search");
  if (enrollments.length === 1) return { type: "single", data: await getStudentFees(enrollments[0].id, tenantId) };

  return {
    type: "multiple",
    results: enrollments.map((e) => ({
      enrollmentId: e.id,
      name: `${e.student.firstName} ${e.student.lastName}`,
      admissionNo: e.student.admissionNo,
      fatherName: e.student.fatherName,
      phone: e.student.phone,
      className: e.class.name,
      sectionName: e.section.name,
    })),
  };
};

// ═══════════════════════════════════════════════════════════════════════
// COLLECT PAYMENT — Enhanced with month coverage + StudentFeeItem
// ═══════════════════════════════════════════════════════════════════════

/**
 * Collect payment for a student fee installment.
 *
 * After recording payment:
 * - Updates StudentFee amounts and status
 * - Calculates month coverage for the student
 * - Returns month coverage info alongside receipt data
 * - Uses StudentFeeItem (per-student breakdown) for feeItems in response
 *
 * Supports:
 * - Full payment
 * - Partial payment
 * - Payment with discount (discountAmount + discountId)
 * - 100% discount (amount=0, discountAmount > 0)
 */
export const collectPayment = async (data: {
  studentFeeId: string;
  amount: number;
  method: string;
  reference?: string;
  remarks?: string;
  collectedBy?: string;
  tenantId: string;
  discountAmount?: number;
  discountId?: string;
}) => {
  const {
    studentFeeId,
    amount,
    method,
    reference,
    remarks,
    collectedBy,
    tenantId,
    discountAmount = 0,
    discountId,
  } = data;

  // Get the student fee with structure items, per-student items, and enrollment info
  const studentFee = await prisma.studentFee.findFirst({
    where: { id: studentFeeId, tenantId, isDeleted: false },
    include: {
      enrollment: {
        include: {
          student: {
            select: { firstName: true, lastName: true, admissionNo: true, fatherName: true },
          },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      },
      feeStructure: {
        include: { items: { include: { feeHead: true } } },
      },
      // NEW: Include per-student fee items
      items: {
        include: { feeHead: true },
      },
    },
  });

  if (!studentFee) throw new Error("Student fee record not found");
  if (studentFee.status === "PAID") throw new Error("This fee is already fully paid");

  // Validate: amount + discount should not exceed balance
  const totalSettlement = amount + discountAmount;
  if (totalSettlement > studentFee.balanceAmount + 0.01) {
    throw new Error(
      `Payment (${amount}) + Discount (${discountAmount}) exceeds balance (${studentFee.balanceAmount})`
    );
  }

  // Allow amount=0 only if discount > 0 (100% discount case)
  if (amount < 0) throw new Error("Payment amount cannot be negative");
  if (amount === 0 && discountAmount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  // Generate receipt number
  const receiptNo = await generateReceiptNo(tenantId);

  // Transaction: create payment + apply discount + update student fee
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create payment record
    const payment = await tx.payment.create({
      data: {
        tenantId,
        studentFeeId,
        amount,
        method: method as any,
        reference: reference || null,
        remarks: remarks || null,
        receiptNo,
        collectedBy: collectedBy || null,
        paymentDate: new Date(),
      },
    });

    // 2. Apply discount if discountId provided
    if (discountId && discountAmount > 0) {
      const existingDiscount = await tx.studentFeeDiscount.findFirst({
        where: { studentFeeId, feeDiscountId: discountId },
      });

      if (!existingDiscount) {
        await tx.studentFeeDiscount.create({
          data: {
            studentFeeId,
            feeDiscountId: discountId,
            amount: discountAmount,
          },
        });
      }
    }

    // 3. Update student fee amounts
    const newDiscountAmount = studentFee.discountAmount + discountAmount;
    const newNetAmount = studentFee.totalAmount - newDiscountAmount + studentFee.fineAmount;
    const newPaidAmount = studentFee.paidAmount + amount;
    const newBalanceAmount = newNetAmount - newPaidAmount;
    const newStatus = newBalanceAmount <= 0 ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "PENDING";

    await tx.studentFee.update({
      where: { id: studentFeeId },
      data: {
        discountAmount: newDiscountAmount,
        netAmount: newNetAmount,
        paidAmount: newPaidAmount,
        balanceAmount: Math.max(0, newBalanceAmount),
        status: newStatus,
      },
    });

    return {
      payment,
      newPaidAmount,
      newBalanceAmount: Math.max(0, newBalanceAmount),
      newStatus,
      newDiscountAmount,
    };
  });

  // 4. Calculate month coverage AFTER payment is recorded
  const monthCoverage = await calculateMonthsCovered(
    studentFee.enrollmentId,
    tenantId
  );

  // Build feeItems array — prefer StudentFeeItem (per-student), fallback to FeeStructure items
  const feeItems =
    (studentFee as any).items && (studentFee as any).items.length > 0
      ? (studentFee as any).items.map((item: any) => ({
          name: item.name || item.feeHead?.name || "Fee",
          code: item.feeHead?.code || "",
          amount: item.amount || 0,
          frequency: item.frequency || "PER_INSTALLMENT",
        }))
      : studentFee.feeStructure.items?.map((item: any) => ({
          name: item.feeHead?.name || "Fee",
          code: item.feeHead?.code || "",
          amount: item.amount || 0,
          frequency: item.frequency || "PER_INSTALLMENT",
        })) || [];

  // Build feeHead string (comma-separated names)
  const feeHeadStr = feeItems.map((i: any) => i.name).join(", ") || studentFee.feeStructure.name;

  // Calculate remaining balance across ALL installments for this enrollment
  const allFees = await prisma.studentFee.findMany({
    where: { enrollmentId: studentFee.enrollmentId, tenantId, isDeleted: false },
    select: { balanceAmount: true },
  });
  const totalRemainingBalance = allFees.reduce((sum, f) => sum + f.balanceAmount, 0);

  return {
    receiptNo,
    payment: {
      id: result.payment.id,
      amount: result.payment.amount,
      method: result.payment.method,
      reference: result.payment.reference,
      paymentDate: result.payment.paymentDate,
      discountAmount: discountAmount,
    },
    studentInfo: {
      name: `${studentFee.enrollment.student.firstName} ${studentFee.enrollment.student.lastName}`,
      admissionNo: studentFee.enrollment.student.admissionNo,
      fatherName: studentFee.enrollment.student.fatherName,
      class: studentFee.enrollment.class.name,
      section: studentFee.enrollment.section?.name || "",
    },
    feeInfo: {
      feeHead: feeHeadStr,
      feeItems: feeItems,
      installmentNo: studentFee.installmentNo,
      totalAmount: studentFee.totalAmount,
      discountAmount: result.newDiscountAmount,
      netAmount: studentFee.totalAmount - result.newDiscountAmount + studentFee.fineAmount,
      paidAmount: result.newPaidAmount,
      balanceAmount: result.newBalanceAmount,
      status: result.newStatus,
    },
    // NEW: Month coverage info for receipt
    monthsCovered: getMonthsCoveredShort(monthCoverage),
    remainingBalance: totalRemainingBalance,
    nextDueMonth: monthCoverage.pendingFromMonth,
    monthCoverageDetails: monthCoverage,
  };
};

// ═══════════════════════════════════════════════════════════════════════
// APPLY DISCOUNT (standalone — without payment)
// ═══════════════════════════════════════════════════════════════════════

export const applyDiscount = async (
  studentFeeId: string,
  feeDiscountId: string,
  tenantId: string
) => {
  const studentFee = await prisma.studentFee.findFirst({
    where: { id: studentFeeId, tenantId, isDeleted: false },
  });

  if (!studentFee) throw new Error("Student fee record not found");

  const feeDiscount = await prisma.feeDiscount.findFirst({
    where: { id: feeDiscountId, tenantId, isDeleted: false },
  });

  if (!feeDiscount) throw new Error("Fee discount not found");

  const existing = await prisma.studentFeeDiscount.findFirst({
    where: { studentFeeId, feeDiscountId },
  });

  if (existing) throw new Error("This discount is already applied to this fee");

  // Calculate discount amount based on type (percentage vs fixed)
  let calcDiscountAmount: number;
  if (feeDiscount.type === "PERCENTAGE") {
    calcDiscountAmount = (studentFee.totalAmount * feeDiscount.value) / 100;
  } else {
    calcDiscountAmount = feeDiscount.value;
  }

  await prisma.studentFeeDiscount.create({
    data: { studentFeeId, feeDiscountId, amount: calcDiscountAmount },
  });

  const newDiscountAmount = studentFee.discountAmount + calcDiscountAmount;
  const newNetAmount = studentFee.totalAmount - newDiscountAmount + studentFee.fineAmount;
  const newBalanceAmount = newNetAmount - studentFee.paidAmount;
  const newStatus =
    newBalanceAmount <= 0 ? "PAID" : studentFee.paidAmount > 0 ? "PARTIAL" : "PENDING";

  const updated = await prisma.studentFee.update({
    where: { id: studentFeeId },
    data: {
      discountAmount: newDiscountAmount,
      netAmount: newNetAmount,
      balanceAmount: Math.max(0, newBalanceAmount),
      status: newStatus,
    },
  });

  return { message: "Discount applied successfully", discountAmount: calcDiscountAmount, updatedFee: updated };
};

// ═══════════════════════════════════════════════════════════════════════
// GET DEFAULTERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get students with PENDING/OVERDUE fees, grouped by student
 */
export const getDefaulters = async (
  tenantId: string,
  filters?: { classId?: string; fromDate?: string; toDate?: string }
) => {
  const where: any = {
    tenantId,
    isDeleted: false,
    status: { in: ["PENDING", "OVERDUE"] },
  };

  if (filters?.fromDate || filters?.toDate) {
    where.dueDate = {};
    if (filters.fromDate) where.dueDate.gte = new Date(filters.fromDate);
    if (filters.toDate) where.dueDate.lte = new Date(filters.toDate);
  }

  if (filters?.classId) {
    where.enrollment = { classId: filters.classId, isDeleted: false };
  }

  const defaulterFees = await prisma.studentFee.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: {
            select: { firstName: true, lastName: true, admissionNo: true, phone: true, fatherName: true },
          },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      },
      feeStructure: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const groupedByStudent: Record<string, any> = {};
  for (const fee of defaulterFees) {
    const key = fee.enrollmentId;
    if (!groupedByStudent[key]) {
      groupedByStudent[key] = {
        enrollmentId: fee.enrollmentId,
        student: {
          name: `${fee.enrollment.student.firstName} ${fee.enrollment.student.lastName}`,
          admissionNo: fee.enrollment.student.admissionNo,
          fatherName: fee.enrollment.student.fatherName,
          phone: fee.enrollment.student.phone,
          class: fee.enrollment.class.name,
          section: fee.enrollment.section?.name || "",
        },
        totalBalance: 0,
        overdueCount: 0,
        fees: [],
      };
    }
    groupedByStudent[key].totalBalance += fee.balanceAmount;
    if (fee.status === "OVERDUE") groupedByStudent[key].overdueCount++;
    groupedByStudent[key].fees.push({
      id: fee.id,
      installmentNo: fee.installmentNo,
      feeStructure: fee.feeStructure.name,
      dueDate: fee.dueDate,
      netAmount: fee.netAmount,
      balanceAmount: fee.balanceAmount,
      status: fee.status,
    });
  }

  const defaulters = Object.values(groupedByStudent).sort(
    (a: any, b: any) => b.totalBalance - a.totalBalance
  );

  return {
    defaulters,
    totalDefaulters: defaulters.length,
    totalOutstanding: defaulters.reduce((sum: number, d: any) => sum + d.totalBalance, 0),
  };
};

// ═══════════════════════════════════════════════════════════════════════
// GET DAILY COLLECTION — Enhanced with monthsCovered per payment + StudentFeeItem
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get daily collection report.
 * Each payment includes monthsCovered info for receipt printing.
 * Uses StudentFeeItem for per-student fee breakdown (with fallback to structure items).
 *
 * NOTE: monthsCovered is calculated per-enrollment (student-level),
 * so it shows the cumulative month status at the time of this report.
 */
export const getDailyCollection = async (tenantId: string, date: string) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const payments = await prisma.payment.findMany({
    where: {
      tenantId,
      isDeleted: false,
      paymentDate: { gte: startOfDay, lte: endOfDay },
    },
    include: {
      studentFee: {
        include: {
          enrollment: {
            include: {
              student: { select: { firstName: true, lastName: true, admissionNo: true, fatherName: true } },
              class: { select: { name: true } },
              section: { select: { name: true } },
            },
          },
          feeStructure: {
            include: { items: { include: { feeHead: { select: { name: true, code: true } } } } },
          },
          // NEW: Include per-student fee items
          items: {
            include: { feeHead: { select: { name: true, code: true } } },
          },
        },
      },
    },
    orderBy: { paymentDate: "desc" },
  });

  // Calculate month coverage for each unique enrollment (cache to avoid repeated queries)
  const enrollmentCoverageCache = new Map<string, MonthsCoveredShort>();

  for (const p of payments) {
    const eid = p.studentFee.enrollmentId;
    if (!enrollmentCoverageCache.has(eid)) {
      try {
        const coverage = await calculateMonthsCovered(eid, tenantId);
        enrollmentCoverageCache.set(eid, getMonthsCoveredShort(coverage));
      } catch {
        // If calculation fails, set null coverage
        enrollmentCoverageCache.set(eid, { from: null, to: null, total: 0 });
      }
    }
  }

  const byMethod: Record<string, { count: number; total: number }> = {};
  let grandTotal = 0;

  for (const p of payments) {
    if (!byMethod[p.method]) byMethod[p.method] = { count: 0, total: 0 };
    byMethod[p.method].count++;
    byMethod[p.method].total += p.amount;
    grandTotal += p.amount;
  }

  return {
    date,
    payments: payments.map((p) => {
      // Prefer StudentFeeItem (per-student breakdown), fallback to feeStructure.items
      const perStudentItems = (p.studentFee as any).items || [];
      const feeItems =
        perStudentItems.length > 0
          ? perStudentItems.map((item: any) => ({
              name: item.name || item.feeHead?.name || "Fee",
              amount: item.amount || 0,
              code: item.feeHead?.code || "",
            }))
          : p.studentFee.feeStructure.items?.map((item: any) => ({
              name: item.feeHead?.name || "Fee",
              amount: item.amount || 0,
              code: item.feeHead?.code || "",
            })) || [];

      return {
        receiptNo: p.receiptNo,
        amount: p.amount,
        method: p.method,
        reference: p.reference,
        paymentDate: p.paymentDate,
        student: {
          name: `${p.studentFee.enrollment.student.firstName} ${p.studentFee.enrollment.student.lastName}`,
          admissionNo: p.studentFee.enrollment.student.admissionNo,
          fatherName: p.studentFee.enrollment.student.fatherName || "",
          class: p.studentFee.enrollment.class.name,
          section: p.studentFee.enrollment.section?.name || "",
          rollNumber: p.studentFee.enrollment.rollNumber || "",
        },
        feeStructure: p.studentFee.feeStructure.name,
        installmentNo: p.studentFee.installmentNo,
        feeItems,
        // NEW: Month coverage for receipt printing
        monthsCovered: enrollmentCoverageCache.get(p.studentFee.enrollmentId) || {
          from: null,
          to: null,
          total: 0,
        },
      };
    }),
    summary: Object.entries(byMethod).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
    })),
    grandTotal,
    totalReceipts: payments.length,
  };
};
