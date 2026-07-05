
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FEE REPORTS SERVICE — Complete 21 Reports Professional Module
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Reports:
 * 1.  Daily Collection
 * 2.  Monthly Collection
 * 3.  Head-wise Collection
 * 4.  Category-wise Collection
 * 5.  Pending Fee (Outstanding)
 * 6.  Defaulter Report
 * 7.  Fine Report
 * 8.  Concession/Discount Report
 * 9.  Scholarship Report
 * 10. Transport Fee Report
 * 11. Hostel Fee Report
 * 12. Exam Fee Report
 * 13. Collection Register
 * 14. Receipt Register
 * 15. Student Ledger
 * 16. Class Ledger
 * 17. Cash Book
 * 18. Bank Book
 * 19. Advance Balance Report
 * 20. Refund Report (placeholder)
 * 21. Adjustment Report (placeholder)
 */

import prisma from "../../utils/prisma";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Date filters
// ═══════════════════════════════════════════════════════════════════════════

const buildDateFilter = (fromDate?: string, toDate?: string) => {
  const filter: any = {};
  if (fromDate) filter.gte = new Date(fromDate);
  if (toDate) filter.lte = new Date(toDate + "T23:59:59.999Z");
  return Object.keys(filter).length > 0 ? filter : undefined;
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. DAILY COLLECTION REPORT
// ═══════════════════════════════════════════════════════════════════════════

export const getDailyCollection = async (
  tenantId: string,
  options: { date?: string; fromDate?: string; toDate?: string }
) => {
  const targetDate = options.date || new Date().toISOString().split("T")[0];
  const startOfDay = new Date(targetDate + "T00:00:00.000Z");
  const endOfDay = new Date(targetDate + "T23:59:59.999Z");

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
              student: { select: { firstName: true, lastName: true, admissionNo: true } },
              class: { select: { name: true } },
              section: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const records = payments.map((p, idx) => ({
    sNo: idx + 1,
    receiptNo: p.receiptNo,
    studentName: `${p.studentFee.enrollment.student.firstName} ${p.studentFee.enrollment.student.lastName}`,
    admissionNo: p.studentFee.enrollment.student.admissionNo,
    class: `${p.studentFee.enrollment.class.name} ${p.studentFee.enrollment.section?.name || ""}`.trim(),
    amount: p.amount,
    method: p.method,
    reference: p.reference || "",
    time: p.createdAt,
  }));

  const totalCash = payments.filter((p) => p.method === "CASH").reduce((s, p) => s + p.amount, 0);
  const totalOnline = payments.filter((p) => p.method !== "CASH").reduce((s, p) => s + p.amount, 0);
  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);

  return {
    date: targetDate,
    records,
    summary: {
      totalReceipts: payments.length,
      totalAmount: Math.round(totalAmount),
      totalCash: Math.round(totalCash),
      totalOnline: Math.round(totalOnline),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. MONTHLY COLLECTION REPORT
// ═══════════════════════════════════════════════════════════════════════════

export const getMonthlyCollection = async (
  tenantId: string,
  options: { year?: number; month?: number; academicYearId?: string }
) => {
  const year = options.year || new Date().getFullYear();
  const month = options.month; // 1-12, if undefined = all months

  let dateFilter: any = {};
  if (month) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    dateFilter = { gte: startOfMonth, lte: endOfMonth };
  } else {
    dateFilter = { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59, 999) };
  }

  // Get month-wise aggregation
  const payments = await prisma.payment.findMany({
    where: {
      tenantId,
      isDeleted: false,
      paymentDate: dateFilter,
    },
    select: { amount: true, method: true, paymentDate: true },
  });

  // Group by month
  const monthlyData: Record<string, { cash: number; online: number; total: number; count: number }> = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (const p of payments) {
    const d = new Date(p.paymentDate);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (!monthlyData[key]) monthlyData[key] = { cash: 0, online: 0, total: 0, count: 0 };
    monthlyData[key].total += p.amount;
    monthlyData[key].count += 1;
    if (p.method === "CASH") monthlyData[key].cash += p.amount;
    else monthlyData[key].online += p.amount;
  }

  const records = Object.entries(monthlyData).map(([month, data], idx) => ({
    sNo: idx + 1,
    month,
    receipts: data.count,
    cash: Math.round(data.cash),
    online: Math.round(data.online),
    total: Math.round(data.total),
  }));

  const grandTotal = payments.reduce((s, p) => s + p.amount, 0);

  return {
    year,
    records,
    summary: {
      totalReceipts: payments.length,
      totalAmount: Math.round(grandTotal),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. HEAD-WISE COLLECTION REPORT
// ═══════════════════════════════════════════════════════════════════════════

export const getHeadWiseCollection = async (
  tenantId: string,
  options: { fromDate?: string; toDate?: string; academicYearId?: string }
) => {
  const dateFilter = buildDateFilter(options.fromDate, options.toDate);

  // Get all payments with their student fee items
  const payments = await prisma.payment.findMany({
    where: {
      tenantId,
      isDeleted: false,
      ...(dateFilter ? { paymentDate: dateFilter } : {}),
    },
    include: {
      studentFee: {
        include: {
          items: { include: { feeHead: true } },
          feeStructure: { include: { items: { include: { feeHead: true } } } },
        },
      },
    },
  });

  // Aggregate by fee head
  const headMap: Record<string, { name: string; code: string; category: string; collected: number; count: number }> = {};

  for (const payment of payments) {
    const items = payment.studentFee.items.length > 0
      ? payment.studentFee.items
      : payment.studentFee.feeStructure.items;

    // Proportionally distribute payment amount across fee heads
    const totalItemAmount = items.reduce((s: number, i: any) => s + (i.amount || 0), 0);
    if (totalItemAmount === 0) continue;

    for (const item of items) {
      const proportion = (item.amount || 0) / totalItemAmount;
      const headAmount = payment.amount * proportion;
      const headId = item.feeHeadId || (item as any).feeHead?.id;
      const headName = (item as any).name || (item as any).feeHead?.name || "Unknown";
      const headCode = (item as any).feeHead?.code || "";
      const headCategory = (item as any).feeHead?.category || "Uncategorized";

      if (!headMap[headId]) {
        headMap[headId] = { name: headName, code: headCode, category: headCategory, collected: 0, count: 0 };
      }
      headMap[headId].collected += headAmount;
      headMap[headId].count += 1;
    }
  }

  const records = Object.values(headMap)
    .sort((a, b) => b.collected - a.collected)
    .map((h, idx) => ({
      sNo: idx + 1,
      headName: h.name,
      code: h.code,
      category: h.category,
      collected: Math.round(h.collected),
      receipts: h.count,
    }));

  return {
    records,
    summary: {
      totalHeads: records.length,
      totalCollected: records.reduce((s, r) => s + r.collected, 0),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. CATEGORY-WISE COLLECTION REPORT
// ═══════════════════════════════════════════════════════════════════════════

export const getCategoryWiseCollection = async (
  tenantId: string,
  options: { fromDate?: string; toDate?: string }
) => {
  const headWise = await getHeadWiseCollection(tenantId, options);

  // Group by category
  const catMap: Record<string, { collected: number; heads: number }> = {};
  for (const r of headWise.records) {
    const cat = r.category || "Uncategorized";
    if (!catMap[cat]) catMap[cat] = { collected: 0, heads: 0 };
    catMap[cat].collected += r.collected;
    catMap[cat].heads += 1;
  }

  const records = Object.entries(catMap)
    .sort((a, b) => b[1].collected - a[1].collected)
    .map(([category, data], idx) => ({
      sNo: idx + 1,
      category,
      heads: data.heads,
      collected: Math.round(data.collected),
    }));

  return {
    records,
    summary: { totalCategories: records.length, totalCollected: records.reduce((s, r) => s + r.collected, 0) },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. PENDING FEE REPORT (Outstanding)
// ═══════════════════════════════════════════════════════════════════════════

export const getPendingFeeReport = async (
  tenantId: string,
  options: { classId?: string; sectionId?: string; academicYearId?: string }
) => {
  const where: any = {
    tenantId,
    isDeleted: false,
    balanceAmount: { gt: 0 },
    enrollment: {
      isDeleted: false,
      status: "active",
      ...(options.classId ? { classId: options.classId } : {}),
      ...(options.sectionId ? { sectionId: options.sectionId } : {}),
      ...(options.academicYearId ? { academicYearId: options.academicYearId } : {}),
    },
  };

  const fees = await prisma.studentFee.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { firstName: true, lastName: true, admissionNo: true, fatherName: true, phone: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      },
    },
    orderBy: { balanceAmount: "desc" },
  });

  // Group by student
  const studentMap: Record<string, any> = {};
  for (const fee of fees) {
    const studentId = fee.enrollment.studentId || fee.enrollmentId;
    if (!studentMap[studentId]) {
      studentMap[studentId] = {
        studentName: `${fee.enrollment.student.firstName} ${fee.enrollment.student.lastName}`,
        admissionNo: fee.enrollment.student.admissionNo,
        fatherName: fee.enrollment.student.fatherName || "",
        phone: fee.enrollment.student.phone || "",
        class: `${fee.enrollment.class.name} ${fee.enrollment.section?.name || ""}`.trim(),
        totalDue: 0,
        totalPaid: 0,
        totalBalance: 0,
        pendingInstallments: 0,
      };
    }
    studentMap[studentId].totalDue += fee.netAmount;
    studentMap[studentId].totalPaid += fee.paidAmount;
    studentMap[studentId].totalBalance += fee.balanceAmount;
    studentMap[studentId].pendingInstallments += 1;
  }

  const records = Object.values(studentMap)
    .sort((a: any, b: any) => b.totalBalance - a.totalBalance)
    .map((s: any, idx: number) => ({ sNo: idx + 1, ...s, totalDue: Math.round(s.totalDue), totalPaid: Math.round(s.totalPaid), totalBalance: Math.round(s.totalBalance) }));

  return {
    records,
    summary: {
      totalStudents: records.length,
      totalPending: records.reduce((s, r) => s + r.totalBalance, 0),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. DEFAULTER REPORT (with filters: class/section/month/transport/hostel/exam)
// ═══════════════════════════════════════════════════════════════════════════

export const getDefaulterReport = async (
  tenantId: string,
  options: {
    classId?: string;
    sectionId?: string;
    academicYearId?: string;
    month?: number;
    year?: number;
    feeCategory?: string; // Transport, Hostel, Examination
  }
) => {
  const where: any = {
    tenantId,
    isDeleted: false,
    status: { in: ["PENDING", "OVERDUE", "PARTIAL"] },
    enrollment: {
      isDeleted: false,
      status: "active",
      ...(options.classId ? { classId: options.classId } : {}),
      ...(options.sectionId ? { sectionId: options.sectionId } : {}),
      ...(options.academicYearId ? { academicYearId: options.academicYearId } : {}),
    },
  };

  // Due date filter for specific month
  if (options.month && options.year) {
    const startOfMonth = new Date(options.year, options.month - 1, 1);
    const endOfMonth = new Date(options.year, options.month, 0, 23, 59, 59, 999);
    where.dueDate = { gte: startOfMonth, lte: endOfMonth };
  }

  const fees = await prisma.studentFee.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { firstName: true, lastName: true, admissionNo: true, fatherName: true, phone: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      },
      items: { include: { feeHead: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  // If feeCategory filter, filter by items
  let filteredFees = fees;
  if (options.feeCategory) {
    filteredFees = fees.filter((f) =>
      f.items.some((item) => (item.feeHead as any)?.category === options.feeCategory)
    );
  }

  const records = filteredFees.map((fee, idx) => ({
    sNo: idx + 1,
    studentName: `${fee.enrollment.student.firstName} ${fee.enrollment.student.lastName}`,
    admissionNo: fee.enrollment.student.admissionNo,
    fatherName: fee.enrollment.student.fatherName || "",
    phone: fee.enrollment.student.phone || "",
    class: `${fee.enrollment.class.name} ${fee.enrollment.section?.name || ""}`.trim(),
    installmentNo: fee.installmentNo,
    dueDate: fee.dueDate,
    totalAmount: Math.round(fee.netAmount),
    paidAmount: Math.round(fee.paidAmount),
    balance: Math.round(fee.balanceAmount),
    status: fee.status,
    daysPending: Math.max(0, Math.floor((Date.now() - new Date(fee.dueDate).getTime()) / 86400000)),
  }));

  return {
    records,
    summary: {
      totalDefaulters: records.length,
      totalPending: records.reduce((s, r) => s + r.balance, 0),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. FINE REPORT
// ═══════════════════════════════════════════════════════════════════════════

export const getFineReport = async (
  tenantId: string,
  options: { fromDate?: string; toDate?: string; classId?: string }
) => {
  const where: any = {
    tenantId,
    isDeleted: false,
    fineAmount: { gt: 0 },
    enrollment: {
      isDeleted: false,
      ...(options.classId ? { classId: options.classId } : {}),
    },
  };

  const fees = await prisma.studentFee.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      },
    },
    orderBy: { fineAmount: "desc" },
  });

  const records = fees.map((fee, idx) => ({
    sNo: idx + 1,
    studentName: `${fee.enrollment.student.firstName} ${fee.enrollment.student.lastName}`,
    admissionNo: fee.enrollment.student.admissionNo,
    class: `${fee.enrollment.class.name} ${fee.enrollment.section?.name || ""}`.trim(),
    installmentNo: fee.installmentNo,
    fineAmount: Math.round(fee.fineAmount),
    dueDate: fee.dueDate,
  }));

  return {
    records,
    summary: {
      totalFineCollected: records.reduce((s, r) => s + r.fineAmount, 0),
      totalStudents: records.length,
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 8. CONCESSION / DISCOUNT REPORT
// ═══════════════════════════════════════════════════════════════════════════

export const getConcessionReport = async (
  tenantId: string,
  options: { academicYearId?: string; classId?: string }
) => {
  const discounts = await prisma.studentFeeDiscount.findMany({
    where: {
      studentFee: {
        tenantId,
        isDeleted: false,
        enrollment: {
          isDeleted: false,
          ...(options.classId ? { classId: options.classId } : {}),
          ...(options.academicYearId ? { academicYearId: options.academicYearId } : {}),
        },
      },
    },
    include: {
      feeDiscount: { select: { name: true, type: true, value: true } },
      studentFee: {
        include: {
          enrollment: {
            include: {
              student: { select: { firstName: true, lastName: true, admissionNo: true } },
              class: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const records = discounts.map((d, idx) => ({
    sNo: idx + 1,
    studentName: `${d.studentFee.enrollment.student.firstName} ${d.studentFee.enrollment.student.lastName}`,
    admissionNo: d.studentFee.enrollment.student.admissionNo,
    class: d.studentFee.enrollment.class.name,
    discountName: d.feeDiscount.name,
    discountType: d.feeDiscount.type,
    discountValue: d.feeDiscount.value,
    amountGiven: Math.round(d.amount),
  }));

  return {
    records,
    summary: {
      totalConcessions: records.length,
      totalAmount: records.reduce((s, r) => s + r.amountGiven, 0),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 9. SCHOLARSHIP REPORT (Discounts with scholarship-type names)
// ═══════════════════════════════════════════════════════════════════════════

export const getScholarshipReport = async (tenantId: string, options: { academicYearId?: string }) => {
  // Scholarships are FeeDiscounts with specific names/types
  const scholarships = await prisma.feeDiscount.findMany({
    where: {
      tenantId,
      isDeleted: false,
      name: { contains: "scholar", mode: "insensitive" },
    },
  });

  const scholarshipIds = scholarships.map((s) => s.id);

  if (scholarshipIds.length === 0) {
    return { records: [], summary: { totalScholarships: 0, totalAmount: 0 } };
  }

  const applied = await prisma.studentFeeDiscount.findMany({
    where: {
      feeDiscountId: { in: scholarshipIds },
      studentFee: {
        tenantId,
        isDeleted: false,
        ...(options.academicYearId ? { enrollment: { academicYearId: options.academicYearId } } : {}),
      },
    },
    include: {
      feeDiscount: true,
      studentFee: {
        include: {
          enrollment: {
            include: {
              student: { select: { firstName: true, lastName: true, admissionNo: true } },
              class: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const records = applied.map((a, idx) => ({
    sNo: idx + 1,
    studentName: `${a.studentFee.enrollment.student.firstName} ${a.studentFee.enrollment.student.lastName}`,
    admissionNo: a.studentFee.enrollment.student.admissionNo,
    class: a.studentFee.enrollment.class.name,
    scholarshipName: a.feeDiscount.name,
    amount: Math.round(a.amount),
  }));

  return {
    records,
    summary: {
      totalScholarships: records.length,
      totalAmount: records.reduce((s, r) => s + r.amount, 0),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 10-12. MODULE-WISE FEE REPORTS (Transport, Hostel, Exam)
// ═══════════════════════════════════════════════════════════════════════════

export const getModuleWiseFeeReport = async (
  tenantId: string,
  moduleCategory: string, // "Transport" | "Hostel" | "Examination"
  options: { classId?: string; academicYearId?: string }
) => {
  // Find fees that have items linked to this module category
  const fees = await prisma.studentFee.findMany({
    where: {
      tenantId,
      isDeleted: false,
      items: {
        some: {
          feeHead: { category: moduleCategory },
        },
      },
      enrollment: {
        isDeleted: false,
        status: "active",
        ...(options.classId ? { classId: options.classId } : {}),
        ...(options.academicYearId ? { academicYearId: options.academicYearId } : {}),
      },
    },
    include: {
      enrollment: {
        include: {
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      },
      items: { where: { feeHead: { category: moduleCategory } }, include: { feeHead: true } },
    },
  });

  const records = fees.map((fee, idx) => {
    const moduleItems = fee.items;
    const moduleFee = moduleItems.reduce((s, i) => s + i.amount, 0);
    return {
      sNo: idx + 1,
      studentName: `${fee.enrollment.student.firstName} ${fee.enrollment.student.lastName}`,
      admissionNo: fee.enrollment.student.admissionNo,
      class: `${fee.enrollment.class.name} ${fee.enrollment.section?.name || ""}`.trim(),
      installmentNo: fee.installmentNo,
      feeAmount: Math.round(moduleFee),
      paidAmount: Math.round(fee.paidAmount > 0 ? (fee.paidAmount / fee.netAmount) * moduleFee : 0),
      balance: Math.round(fee.balanceAmount > 0 ? (fee.balanceAmount / fee.netAmount) * moduleFee : 0),
      status: fee.status,
    };
  });

  return {
    module: moduleCategory,
    records,
    summary: {
      totalStudents: new Set(fees.map((f) => f.enrollmentId)).size,
      totalFee: records.reduce((s, r) => s + r.feeAmount, 0),
      totalCollected: records.reduce((s, r) => s + r.paidAmount, 0),
      totalPending: records.reduce((s, r) => s + r.balance, 0),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 13. COLLECTION REGISTER (All payments chronological)
// ═══════════════════════════════════════════════════════════════════════════

export const getCollectionRegister = async (
  tenantId: string,
  options: { fromDate?: string; toDate?: string; method?: string }
) => {
  const dateFilter = buildDateFilter(options.fromDate, options.toDate);

  const payments = await prisma.payment.findMany({
    where: {
      tenantId,
      isDeleted: false,
      ...(dateFilter ? { paymentDate: dateFilter } : {}),
      ...(options.method ? { method: options.method as any } : {}),
    },
    include: {
      studentFee: {
        include: {
          enrollment: {
            include: {
              student: { select: { firstName: true, lastName: true, admissionNo: true } },
              class: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { paymentDate: "asc" },
  });

  const records = payments.map((p, idx) => ({
    sNo: idx + 1,
    date: p.paymentDate,
    receiptNo: p.receiptNo,
    studentName: `${p.studentFee.enrollment.student.firstName} ${p.studentFee.enrollment.student.lastName}`,
    admissionNo: p.studentFee.enrollment.student.admissionNo,
    class: p.studentFee.enrollment.class.name,
    amount: Math.round(p.amount),
    method: p.method,
    reference: p.reference || "",
  }));

  return {
    records,
    summary: {
      totalReceipts: records.length,
      totalAmount: records.reduce((s, r) => s + r.amount, 0),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 14. RECEIPT REGISTER (All receipts with full details)
// ═══════════════════════════════════════════════════════════════════════════

export const getReceiptRegister = async (
  tenantId: string,
  options: { fromDate?: string; toDate?: string }
) => {
  return await getCollectionRegister(tenantId, options); // Same data, different frontend view
};

// ═══════════════════════════════════════════════════════════════════════════
// 15. STUDENT LEDGER (Per-student debit/credit/balance timeline)
// ═══════════════════════════════════════════════════════════════════════════

export const getStudentLedger = async (enrollmentId: string, tenantId: string) => {
  const fees = await prisma.studentFee.findMany({
    where: { enrollmentId, tenantId, isDeleted: false },
    include: {
      payments: { orderBy: { paymentDate: "asc" } },
      items: { include: { feeHead: true } },
      enrollment: {
        include: {
          student: { select: { firstName: true, lastName: true, admissionNo: true, fatherName: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      },
    },
    orderBy: { installmentNo: "asc" },
  });

  if (fees.length === 0) return { student: null, entries: [], summary: null };

  const student = {
    name: `${fees[0].enrollment.student.firstName} ${fees[0].enrollment.student.lastName}`,
    admissionNo: fees[0].enrollment.student.admissionNo,
    fatherName: fees[0].enrollment.student.fatherName || "",
    class: `${fees[0].enrollment.class.name} ${fees[0].enrollment.section?.name || ""}`.trim(),
  };

  // Build ledger entries (like bank statement)
  const entries: any[] = [];
  let runningBalance = 0;

  for (const fee of fees) {
    // Debit entry (fee charged)
    runningBalance += fee.netAmount;
    entries.push({
      date: fee.dueDate,
      particular: `Installment #${fee.installmentNo} - Fee Demand`,
      debit: Math.round(fee.netAmount),
      credit: 0,
      balance: Math.round(runningBalance),
      type: "DEMAND",
      reference: "",
    });

    // Fine entry (if any)
    if (fee.fineAmount > 0) {
      runningBalance += fee.fineAmount;
      entries.push({
        date: fee.dueDate,
        particular: `Fine - Installment #${fee.installmentNo}`,
        debit: Math.round(fee.fineAmount),
        credit: 0,
        balance: Math.round(runningBalance),
        type: "FINE",
        reference: "",
      });
    }

    // Discount entry (if any)
    if (fee.discountAmount > 0) {
      runningBalance -= fee.discountAmount;
      entries.push({
        date: fee.dueDate,
        particular: `Discount - Installment #${fee.installmentNo}`,
        debit: 0,
        credit: Math.round(fee.discountAmount),
        balance: Math.round(runningBalance),
        type: "DISCOUNT",
        reference: "",
      });
    }

    // Payment entries (credit)
    for (const payment of fee.payments) {
      runningBalance -= payment.amount;
      entries.push({
        date: payment.paymentDate,
        particular: `Payment - ${payment.method}`,
        debit: 0,
        credit: Math.round(payment.amount),
        balance: Math.round(runningBalance),
        type: "PAYMENT",
        reference: payment.receiptNo,
      });
    }
  }

  const totalDebit = entries.filter((e) => e.debit > 0).reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.filter((e) => e.credit > 0).reduce((s, e) => s + e.credit, 0);

  return {
    student,
    entries,
    summary: {
      totalCharged: totalDebit,
      totalPaid: totalCredit,
      currentBalance: Math.round(runningBalance),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 16. CLASS LEDGER (Per-class summary)
// ═══════════════════════════════════════════════════════════════════════════

export const getClassLedger = async (
  tenantId: string,
  options: { academicYearId?: string; fromDate?: string; toDate?: string }
) => {
  const classes = await prisma.class.findMany({
    where: { tenantId, isDeleted: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const records: any[] = [];

  for (const cls of classes) {
    const feeAgg = await prisma.studentFee.aggregate({
      where: {
        tenantId,
        isDeleted: false,
        enrollment: {
          classId: cls.id,
          isDeleted: false,
          status: "active",
          ...(options.academicYearId ? { academicYearId: options.academicYearId } : {}),
        },
      },
      _sum: { netAmount: true, paidAmount: true, balanceAmount: true, fineAmount: true, discountAmount: true },
      _count: true,
    });

    if (feeAgg._count === 0) continue;

    records.push({
      className: cls.name,
      classId: cls.id,
      totalDemand: Math.round(feeAgg._sum.netAmount || 0),
      totalCollected: Math.round(feeAgg._sum.paidAmount || 0),
      totalPending: Math.round(feeAgg._sum.balanceAmount || 0),
      totalFine: Math.round(feeAgg._sum.fineAmount || 0),
      totalDiscount: Math.round(feeAgg._sum.discountAmount || 0),
      students: feeAgg._count,
    });
  }

  return {
    records,
    summary: {
      totalClasses: records.length,
      totalDemand: records.reduce((s, r) => s + r.totalDemand, 0),
      totalCollected: records.reduce((s, r) => s + r.totalCollected, 0),
      totalPending: records.reduce((s, r) => s + r.totalPending, 0),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 17. CASH BOOK (Only CASH payments)
// ═══════════════════════════════════════════════════════════════════════════

export const getCashBook = async (
  tenantId: string,
  options: { fromDate?: string; toDate?: string }
) => {
  return await getCollectionRegister(tenantId, { ...options, method: "CASH" });
};

// ═══════════════════════════════════════════════════════════════════════════
// 18. BANK BOOK (Online, UPI, Bank Transfer, Cheque, DD)
// ═══════════════════════════════════════════════════════════════════════════

export const getBankBook = async (
  tenantId: string,
  options: { fromDate?: string; toDate?: string }
) => {
  const dateFilter = buildDateFilter(options.fromDate, options.toDate);

  const payments = await prisma.payment.findMany({
    where: {
      tenantId,
      isDeleted: false,
      method: { in: ["ONLINE", "UPI", "BANK_TRANSFER", "CHEQUE", "DD"] },
      ...(dateFilter ? { paymentDate: dateFilter } : {}),
    },
    include: {
      studentFee: {
        include: {
          enrollment: {
            include: {
              student: { select: { firstName: true, lastName: true, admissionNo: true } },
              class: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { paymentDate: "asc" },
  });

  const records = payments.map((p, idx) => ({
    sNo: idx + 1,
    date: p.paymentDate,
    receiptNo: p.receiptNo,
    studentName: `${p.studentFee.enrollment.student.firstName} ${p.studentFee.enrollment.student.lastName}`,
    admissionNo: p.studentFee.enrollment.student.admissionNo,
    class: p.studentFee.enrollment.class.name,
    amount: Math.round(p.amount),
    method: p.method,
    reference: p.reference || "",
  }));

  return {
    records,
    summary: {
      totalReceipts: records.length,
      totalAmount: records.reduce((s, r) => s + r.amount, 0),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 19. ADVANCE BALANCE REPORT
// ═══════════════════════════════════════════════════════════════════════════

export const getAdvanceBalanceReport = async (tenantId: string) => {
  // Students with negative balance (overpaid) across all installments
  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, isDeleted: false, status: "active" },
    include: {
      student: { select: { firstName: true, lastName: true, admissionNo: true } },
      class: { select: { name: true } },
      section: { select: { name: true } },
      studentFees: {
        where: { isDeleted: false },
        select: { netAmount: true, paidAmount: true },
      },
    },
  });

  const records: any[] = [];
  for (const enr of enrollments) {
    const totalNet = (enr as any).studentFees.reduce((s: number, f: any) => s + f.netAmount, 0);
    const totalPaid = (enr as any).studentFees.reduce((s: number, f: any) => s + f.paidAmount, 0);
    const advance = totalPaid - totalNet;
    if (advance > 0) {
      records.push({
        studentName: `${enr.student.firstName} ${enr.student.lastName}`,
        admissionNo: enr.student.admissionNo,
        class: `${enr.class.name} ${enr.section?.name || ""}`.trim(),
        totalPaid: Math.round(totalPaid),
        totalDue: Math.round(totalNet),
        advanceBalance: Math.round(advance),
      });
    }
  }

  records.sort((a, b) => b.advanceBalance - a.advanceBalance);
  records.forEach((r, idx) => { r.sNo = idx + 1; });

  return {
    records,
    summary: {
      totalStudents: records.length,
      totalAdvance: records.reduce((s, r) => s + r.advanceBalance, 0),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 20. REFUND REPORT (Placeholder — future module)
// ═══════════════════════════════════════════════════════════════════════════

export const getRefundReport = async (tenantId: string) => {
  return { records: [], summary: { totalRefunds: 0, totalAmount: 0 }, message: "Refund module coming soon" };
};

// ═══════════════════════════════════════════════════════════════════════════
// 21. ADJUSTMENT REPORT (Placeholder — future module)
// ═══════════════════════════════════════════════════════════════════════════

export const getAdjustmentReport = async (tenantId: string) => {
  return { records: [], summary: { totalAdjustments: 0, totalAmount: 0 }, message: "Adjustment module coming soon" };
};

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY: Class-wise overview report (keep for dashboard)
// ═══════════════════════════════════════════════════════════════════════════

export const getFeeReports = async (
  tenantId: string,
  options: { academicYearId?: string; fromDate?: string; toDate?: string }
) => {
  return await getClassLedger(tenantId, options);
};
