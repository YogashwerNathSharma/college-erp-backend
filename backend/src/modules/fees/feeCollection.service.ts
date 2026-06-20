

import prisma from "../../utils/prisma";

// Generate auto-increment receipt number per tenant: RCP/YYYY/XXXXX
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

// Assign fees to a single student based on their class's FeeStructure
export const assignFeesToStudent = async (
  enrollmentId: string,
  tenantId: string
) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, tenantId, isDeleted: false },
    include: { academicYear: true },
  });

  if (!enrollment) throw new Error("Enrollment not found");

  const existingFees = await prisma.studentFee.findFirst({
    where: { enrollmentId, tenantId, isDeleted: false },
  });

  if (existingFees) throw new Error("Fees already assigned for this enrollment");

  const feeStructures = await prisma.feeStructure.findMany({
    where: {
      tenantId,
      classId: enrollment.classId,
      academicYearId: enrollment.academicYearId,
      isDeleted: false,
    },
  });

  if (feeStructures.length === 0) {
    throw new Error("No fee structure found for this class");
  }

  const academicYearStart = new Date(enrollment.academicYear.startDate);
  const studentFees: any[] = [];

  for (const structure of feeStructures) {
    const totalInstallments = structure.totalInstallments || 1;
    const amountPerInstallment = structure.totalAmount / totalInstallments;
    const dueDay = structure.dueDay || 10;

    for (let i = 1; i <= totalInstallments; i++) {
      const dueDate = new Date(academicYearStart);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      dueDate.setDate(dueDay);

      studentFees.push({
        tenantId,
        enrollmentId,
        feeStructureId: structure.id,
        totalAmount: amountPerInstallment,
        discountAmount: 0,
        fineAmount: 0,
        netAmount: amountPerInstallment,
        paidAmount: 0,
        balanceAmount: amountPerInstallment,
        installmentNo: i,
        dueDate,
        status: "PENDING",
      });
    }
  }

  const created = await prisma.studentFee.createMany({ data: studentFees });

  return {
    message: `${created.count} fee installments assigned successfully`,
    count: created.count,
  };
};

// Bulk assign fees to ALL students in a class
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
      status: "active",
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

// Get all fees for a student with payments included
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
    },
    orderBy: [{ feeStructureId: "asc" }, { installmentNo: "asc" }],
  });

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
  };
};

// Find student by admission number
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
      status: "active",
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!enrollment) throw new Error("No active enrollment found for this student");

  return getStudentFees(enrollment.id, tenantId);
};

// Universal search — by name, admission number, class, or section
export const searchStudents = async (query: string, tenantId: string) => {
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

  const enrollments = await prisma.enrollment.findMany({
    where: {
      tenantId, isDeleted: false,
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

// ═══════════════════════════════════════════════════════════════
// COLLECT PAYMENT — With Discount Support + feeItems in response
// ═══════════════════════════════════════════════════════════════
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

  // Get the student fee with structure items
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
    // 1. Create payment record (even if amount is 0 for 100% discount — it's a valid receipt)
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
      // Check if already applied
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

  // Build feeItems array from structure items (for receipt)
  const feeItems = studentFee.feeStructure.items?.map((item: any) => ({
    name: item.feeHead?.name || "Fee",
    code: item.feeHead?.code || "",
    amount: item.amount || 0,
  })) || [];

  // Build feeHead string (comma-separated names)
  const feeHeadStr = feeItems.map((i: any) => i.name).join(", ") || studentFee.feeStructure.name;

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
  };
};

// Apply a discount to a student fee (standalone — without payment)
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

  // Calculate discount amount
  let discountAmount: number;
  if (feeDiscount.type === "PERCENTAGE") {
    discountAmount = (studentFee.totalAmount * feeDiscount.value) / 100;
  } else {
    discountAmount = feeDiscount.value;
  }

  await prisma.studentFeeDiscount.create({
    data: { studentFeeId, feeDiscountId, amount: discountAmount },
  });

  const newDiscountAmount = studentFee.discountAmount + discountAmount;
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

  return { message: "Discount applied successfully", discountAmount, updatedFee: updated };
};

// Get students with PENDING/OVERDUE fees
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

// Get daily collection report
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
        },
      },
    },
    orderBy: { paymentDate: "desc" },
  });

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
    payments: payments.map((p) => ({
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
      feeItems: p.studentFee.feeStructure.items?.map((item: any) => ({
        name: item.feeHead?.name || "Fee",
        amount: item.amount || 0,
        code: item.feeHead?.code || "",
      })) || [],
    })),
    summary: Object.entries(byMethod).map(([method, data]) => ({ method, count: data.count, total: data.total })),
    grandTotal,
    totalReceipts: payments.length,
  };
};

