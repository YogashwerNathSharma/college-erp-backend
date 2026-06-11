
import prisma from "../../utils/prisma";

export const getFeeReports = async (
  tenantId: string,
  options: { academicYearId?: string; fromDate?: string; toDate?: string }
) => {
  const { academicYearId, fromDate, toDate } = options;

  // Build enrollment filter
  let enrollmentFilter: any = { tenantId, isDeleted: false, status: "ACTIVE" };
  if (academicYearId) enrollmentFilter.academicYearId = academicYearId;

  // Build payment date filter
  let paymentDateFilter: any = {};
  if (fromDate) paymentDateFilter.gte = new Date(fromDate);
  if (toDate) paymentDateFilter.lte = new Date(toDate + "T23:59:59.999Z");

  // Get all classes
  const classes = await prisma.class.findMany({
    where: { tenantId, isDeleted: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Get class-wise data
  const classwise: {
    className: string;
    classId: string;
    receivable: number;
    collected: number;
    outstanding: number;
  }[] = [];

  let totalReceivable = 0;
  let totalCollected = 0;

  for (const cls of classes) {
    // Receivable: sum of StudentFee.netAmount for this class
    const receivableAgg = await prisma.studentFee.aggregate({
      where: {
        tenantId,
        isDeleted: false,
        enrollment: {
          classId: cls.id,
          ...(academicYearId ? { academicYearId } : {}),
          isDeleted: false,
          status: "ACTIVE",
        },
      },
      _sum: { netAmount: true },
    });

    const receivable = receivableAgg._sum.netAmount || 0;
    if (receivable === 0) continue; // Skip classes with no fees

    // Collected: sum of payments for this class (with date filter)
    const collectedAgg = await prisma.payment.aggregate({
      where: {
        tenantId,
        isDeleted: false,
        ...(fromDate || toDate ? { paymentDate: paymentDateFilter } : {}),
        studentFee: {
          tenantId,
          isDeleted: false,
          enrollment: {
            classId: cls.id,
            ...(academicYearId ? { academicYearId } : {}),
            isDeleted: false,
          },
        },
      },
      _sum: { amount: true },
    });

    const collected = collectedAgg._sum.amount || 0;

    classwise.push({
      className: cls.name,
      classId: cls.id,
      receivable: Math.round(receivable),
      collected: Math.round(collected),
      outstanding: Math.round(receivable - collected),
    });

    totalReceivable += receivable;
    totalCollected += collected;
  }

  return {
    summary: {
      totalReceivable: Math.round(totalReceivable),
      totalCollected: Math.round(totalCollected),
      outstanding: Math.round(totalReceivable - totalCollected),
    },
    classwise,
  };
};

