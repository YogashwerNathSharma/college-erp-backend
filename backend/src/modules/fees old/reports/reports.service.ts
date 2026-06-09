import prisma from "../../../utils/prisma";

// 🔥 Dashboard Combined
export const getDashboardReportService = async ({
  tenantId,
  classId,
  studentId,
}: {
  tenantId: string;
  classId?: string;
  studentId?: string;
}) => {

  if (studentId) {
    return getStudentWiseReport(tenantId, studentId);
  }

  if (classId) {
    return getClassWiseFilteredReport(tenantId, classId);
  }

  const [collection, defaulters, classReport] = await Promise.all([
    getCollectionReport(tenantId),
    getDefaulterSummary(tenantId),
    getClassWiseReport(tenantId),
  ]);

  return { collection, defaulters, classReport };
};

//////////////////////////////
// 💰 Collection
//////////////////////////////
export const getCollectionReport = async (tenantId: string) => {
  const payments = await prisma.payment.findMany({
    where: { tenantId },
  });

  const today = new Date();

  let total = 0;
  let todayTotal = 0;

  payments.forEach((p: any) => {
    total += p.amount;

    if (
      new Date(p.createdAt).toDateString() === today.toDateString()
    ) {
      todayTotal += p.amount;
    }
  });

  return {
    totalCollection: total,
    todayCollection: todayTotal,
    totalTransactions: payments.length,
  };
};

//////////////////////////////
// 🚨 Defaulters
//////////////////////////////
export const getDefaulterSummary = async (tenantId: string) => {
  const today = new Date();

  const defaulters = await prisma.studentFee.findMany({
    where: {
      tenantId,
      status: { not: "PAID" },
      dueDate: { lt: today },
    },
  });

  let totalPending = 0;

  defaulters.forEach((d: any) => {
    totalPending += d.pendingAmount;
  });

  return {
    count: defaulters.length,
    totalPending,
  };
};

//////////////////////////////
// 🏫 FULL CLASS REPORT
//////////////////////////////
export const getClassWiseReport = async (tenantId: string) => {
  const data = await prisma.studentFee.findMany({
    where: { tenantId },
    include: {
      enrollment: {
        include: {
          class: true,
        },
      },
    },
  });

  const result: any = {};

  data.forEach((d: any) => {
    if (!d.enrollment?.class) return;

    const className = d.enrollment.class.name;

    if (!result[className]) {
      result[className] = {
        total: 0,
        paid: 0,
        pending: 0,
        students: 0,
      };
    }

    result[className].total += d.totalAmount || 0;
    result[className].paid += d.paidAmount || 0;
    result[className].pending += d.pendingAmount || 0;
    result[className].students += 1;
  });

  return result;
};

//////////////////////////////
// 🟦 CLASS FILTER (DB LEVEL FIX 🔥)
//////////////////////////////
const getClassWiseFilteredReport = async (
  tenantId: string,
  classId: string
) => {
  const data = await prisma.studentFee.findMany({
    where: {
      tenantId,
      enrollment: {
        is: {
          classId,
        },
      },
    },
    include: {
      enrollment: {
        include: {
          student: true,
          class: true,
        },
      },
    },
  });

  return data.map((d: any) => ({
    studentName: d.enrollment?.student?.name || "N/A",
    className: d.enrollment?.class?.name || "N/A",
    total: d.totalAmount || 0,
    paid: d.paidAmount || 0,
    pending: d.pendingAmount || 0,
  }));
};

//////////////////////////////
// 🟣 STUDENT FILTER
//////////////////////////////
const getStudentWiseReport = async (
  tenantId: string,
  studentId: string
) => {
  const fees = await prisma.studentFee.findMany({
    where: {
      tenantId,
      enrollment: {
        is: {
          studentId,
        },
      },
    },
    include: {
      payments: true,
      enrollment: true,
    },
  });

  let total = 0;
  let paid = 0;

  fees.forEach((f: any) => {
    total += f.totalAmount;
    paid += f.paidAmount;
  });

  return {
    total,
    paid,
    pending: total - paid,
    records: fees,
  };
};

//////////////////////////////
// 🧾 STUDENT LEDGER
//////////////////////////////
export const getStudentLedgerService = async ({
  studentId,
  tenantId,
}: {
  studentId: string;
  tenantId: string;
}) => {
  const fees = await prisma.studentFee.findMany({
    where: {
      tenantId,
      enrollment: {
        is: {
          studentId,
        },
      },
    },
    include: {
      payments: true,
    },
  });

  let total = 0;
  let paid = 0;

  fees.forEach((f: any) => {
    total += f.totalAmount;
    paid += f.paidAmount;
  });

  return {
    total,
    paid,
    pending: total - paid,
    records: fees,
  };
};