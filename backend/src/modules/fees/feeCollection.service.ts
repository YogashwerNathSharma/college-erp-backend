
import prisma from "../../utils/prisma";

// Generate auto-increment receipt number per tenant: RCP/YYYY/XXXXX
export const generateReceiptNo = async (tenantId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `RCP/${year}/`;

  // Find the last receipt for this tenant in the current year
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
  // Get enrollment details
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, tenantId, isDeleted: false },
    include: {
      academicYear: true,
    },
  });

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  // Check if fees are already assigned
  const existingFees = await prisma.studentFee.findFirst({
    where: { enrollmentId, tenantId, isDeleted: false },
  });

  if (existingFees) {
    throw new Error("Fees already assigned for this enrollment");
  }

  // Get fee structures for the class
  const feeStructures = await prisma.feeStructure.findMany({
    where: {
      tenantId,
      classId: enrollment.classId,
      academicYearId: enrollment.academicYearId,
      isDeleted: false,
    },
  });
  console.log("Enrollment:", { classId: enrollment.classId, academicYearId: enrollment.academicYearId });
  console.log("Fee Structures found:", feeStructures.length, feeStructures.map(s => ({ id: s.id, classId: s.classId, academicYearId: s.academicYearId })));
    console.log("Enrollment:", { classId: enrollment.classId, academicYearId: enrollment.academicYearId });
  console.log("Structures found:", feeStructures.length);
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
      // Calculate due date: month offset from academic year start
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

  // Bulk create student fees
  const created = await prisma.studentFee.createMany({
    data: studentFees,
  });

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
  // Get all active enrollments in the class
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
      academicYearId,
      tenantId,
      status: "ACTIVE",
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

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

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

// Find student by admission number, return their fees
export const getStudentFeesByAdmissionNo = async (
  admissionNo: string,
  tenantId: string
) => {
  const student = await prisma.student.findFirst({
    where: { admissionNo, tenantId, isDeleted: false },
    select: { id: true },
  });

  if (!student) {
    throw new Error("Student not found with this admission number");
  }

  // Get the latest active enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: student.id,
      tenantId,
      status: "ACTIVE",
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!enrollment) {
    throw new Error("No active enrollment found for this student");
  }

  return getStudentFees(enrollment.id, tenantId);
};
//student search
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

// Collect payment for a student fee
export const collectPayment = async (data: {
  studentFeeId: string;
  amount: number;
  method: string;
  reference?: string;
  remarks?: string;
  collectedBy?: string;
  tenantId: string;
}) => {
  const { studentFeeId, amount, method, reference, remarks, collectedBy, tenantId } = data;

  // Get the student fee
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

  if (!studentFee) {
    throw new Error("Student fee record not found");
  }

  if (studentFee.status === "PAID") {
    throw new Error("This fee is already fully paid");
  }

  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  if (amount > studentFee.balanceAmount) {
    throw new Error(
      `Payment amount (${amount}) exceeds balance amount (${studentFee.balanceAmount})`
    );
  }

  // Generate receipt number
  const receiptNo = await generateReceiptNo(tenantId);

  // Create payment
  const payment = await prisma.payment.create({
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

  // Update student fee
  const newPaidAmount = studentFee.paidAmount + amount;
  const newBalanceAmount = studentFee.netAmount - newPaidAmount;
  const newStatus = newBalanceAmount <= 0 ? "PAID" : "PARTIAL";

  await prisma.studentFee.update({
    where: { id: studentFeeId },
    data: {
      paidAmount: newPaidAmount,
      balanceAmount: newBalanceAmount,
      status: newStatus,
    },
  });

  return {
    payment,
    receiptNo,
    studentInfo: {
      name: `${studentFee.enrollment.student.firstName} ${studentFee.enrollment.student.lastName}`,
      admissionNo: studentFee.enrollment.student.admissionNo,
      fatherName: studentFee.enrollment.student.fatherName,
      class: studentFee.enrollment.class.name,
      section: studentFee.enrollment.section?.name || "",
    },
    feeInfo: {
      feeHead: studentFee.feeStructure.items?.map((i: any) => i.feeHead?.name).join(", ") || studentFee.feeStructure.name,
      installmentNo: studentFee.installmentNo,
      totalAmount: studentFee.totalAmount,
      netAmount: studentFee.netAmount,
      paidAmount: newPaidAmount,
      balanceAmount: newBalanceAmount,
      status: newStatus,
    },
  };
};

// Apply a discount to a student fee
export const applyDiscount = async (
  studentFeeId: string,
  feeDiscountId: string,
  tenantId: string
) => {
  const studentFee = await prisma.studentFee.findFirst({
    where: { id: studentFeeId, tenantId, isDeleted: false },
  });

  if (!studentFee) {
    throw new Error("Student fee record not found");
  }

  // Get the discount details
  const feeDiscount = await prisma.feeDiscount.findFirst({
    where: { id: feeDiscountId, tenantId, isDeleted: false },
  });

  if (!feeDiscount) {
    throw new Error("Fee discount not found");
  }

  // Check if already applied
  const existing = await prisma.studentFeeDiscount.findFirst({
    where: { studentFeeId, feeDiscountId },
  });

  if (existing) {
    throw new Error("This discount is already applied to this fee");
  }

  // Calculate discount amount
  let discountAmount: number;
  if (feeDiscount.type === "PERCENTAGE") {
    discountAmount = (studentFee.totalAmount * feeDiscount.value) / 100;
  } else {
    discountAmount = feeDiscount.value;
  }

  // Create the discount record
  await prisma.studentFeeDiscount.create({
    data: {
      studentFeeId,
      feeDiscountId,
      amount: discountAmount,
    },
  });

  // Update student fee amounts
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
      balanceAmount: newBalanceAmount,
      status: newStatus,
    },
  });

  return {
    message: "Discount applied successfully",
    discountAmount,
    updatedFee: updated,
  };
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

  // Filter by due date range
  if (filters?.fromDate || filters?.toDate) {
    where.dueDate = {};
    if (filters.fromDate) where.dueDate.gte = new Date(filters.fromDate);
    if (filters.toDate) where.dueDate.lte = new Date(filters.toDate);
  }

  // Filter by class through enrollment
  if (filters?.classId) {
    where.enrollment = {
      classId: filters.classId,
      isDeleted: false,
    };
  }

  const defaulterFees = await prisma.studentFee.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              admissionNo: true,
              phone: true,
              fatherName: true,
            },
          },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      },
      feeStructure: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  // Group by student
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

// Get daily collection report grouped by payment method
export const getDailyCollection = async (tenantId: string, date: string) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const payments = await prisma.payment.findMany({
    where: {
      tenantId,
      isDeleted: false,
      paymentDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      studentFee: {
        include: {
          enrollment: {
            include: {
              student: {
                select: { firstName: true, lastName: true, admissionNo: true },
              },
              class: { select: { name: true } },
            },
          },
          feeStructure: { select: { name: true } },
        },
      },
    },
    orderBy: { paymentDate: "desc" },
  });

  // Group by method
  const byMethod: Record<string, { count: number; total: number }> = {};
  const methods = ["CASH", "ONLINE", "UPI", "CHEQUE", "BANK_TRANSFER", "DD"];
  for (const m of methods) {
    byMethod[m] = { count: 0, total: 0 };
  }

  for (const p of payments) {
    if (!byMethod[p.method]) byMethod[p.method] = { count: 0, total: 0 };
    byMethod[p.method].count++;
    byMethod[p.method].total += p.amount;
  }

  const totalCollection = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    date,
    totalCollection,
    totalTransactions: payments.length,
    byMethod,
    payments: payments.map((p) => ({
      id: p.id,
      receiptNo: p.receiptNo,
      amount: p.amount,
      method: p.method,
      reference: p.reference,
      paymentDate: p.paymentDate,
      student: p.studentFee?.enrollment
        ? {
            name: `${p.studentFee.enrollment.student.firstName} ${p.studentFee.enrollment.student.lastName}`,
            admissionNo: p.studentFee.enrollment.student.admissionNo,
            class: p.studentFee.enrollment.class.name,
          }
        : null,
      feeHead: p.studentFee?.feeStructure?.name || "",
    })),
  };
};

