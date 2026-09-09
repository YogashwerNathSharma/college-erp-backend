
import prisma from "../../utils/prisma";

export const getFeeDashboard = async (tenantId: string, academicYearId?: string) => {
  // Get academic year filter
  let ayFilter: any = {};
  if (academicYearId) {
    ayFilter = { academicYearId };
  } else {
    const activeAY = await prisma.academicYear.findFirst({
      where: { tenantId, isActive: true, isDeleted: false },
      select: { id: true },
    });
    if (activeAY) ayFilter = { academicYearId: activeAY.id };
  }

  const enrollmentScope = { ...ayFilter, isDeleted: false };
  const feeBaseWhere = { tenantId, isDeleted: false, enrollment: enrollmentScope };
  const paymentBaseWhere = { tenantId, isDeleted: false, studentFee: { isDeleted: false, enrollment: enrollmentScope } };

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // ⚡ PERF: Run ALL independent queries in parallel (was 9 sequential → 1 batch)
  const [
    totalStudents,
    receivableAgg,
    collectedAgg,
    overdueAgg,
    discountAgg,
    fineAgg,
    payments,
    classwiseData,
    recentPayments,
  ] = await Promise.all([
    // 1. Total enrolled students
    prisma.enrollment.count({
      where: { tenantId, status: "active", isDeleted: false, ...ayFilter },
    }),
    // 2. Total Receivable
    prisma.studentFee.aggregate({
      where: feeBaseWhere,
      _sum: { netAmount: true },
    }),
    // 3. Total Collected
    prisma.payment.aggregate({
      where: paymentBaseWhere,
      _sum: { amount: true },
    }),
    // 4. Overdue Amount
    prisma.studentFee.aggregate({
      where: { ...feeBaseWhere, balanceAmount: { gt: 0 }, dueDate: { lt: today } },
      _sum: { balanceAmount: true },
    }),
    // 5. Total Discounts
    prisma.studentFee.aggregate({
      where: { ...feeBaseWhere, discountAmount: { gt: 0 } },
      _sum: { discountAmount: true },
    }),
    // 6. Total Fines
    prisma.studentFee.aggregate({
      where: { ...feeBaseWhere, fineAmount: { gt: 0 } },
      _sum: { fineAmount: true },
    }),
    // 7. Monthly payments (for chart)
    prisma.payment.findMany({
      where: paymentBaseWhere,
      select: { amount: true, paymentDate: true },
    }),
    // 8. Class-wise outstanding (groupBy)
    prisma.studentFee.groupBy({
      by: ["feeStructureId"],
      where: feeBaseWhere,
      _sum: { balanceAmount: true },
    }),
    // 9. Recent 10 payments
    prisma.payment.findMany({
      where: paymentBaseWhere,
      select: {
        receiptNo: true,
        paymentDate: true,
        amount: true,
        method: true,
        collectedBy: true,
        studentFee: {
          select: {
            enrollment: {
              select: {
                student: { select: { firstName: true, lastName: true } },
                class: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
      take: 10,
    }),
  ]);

  const totalReceivable = receivableAgg._sum.netAmount || 0;
  const totalCollected = collectedAgg._sum.amount || 0;
  const outstanding = totalReceivable - totalCollected;
  const overdueAmount = overdueAgg._sum.balanceAmount || 0;
  const totalDiscount = discountAgg._sum.discountAmount || 0;
  const totalFine = fineAgg._sum.fineAmount || 0;

  // Monthly collection chart (Apr-Mar academic year)
  const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const monthlyMap: { [key: string]: { collected: number } } = {};
  monthNames.forEach((m) => { monthlyMap[m] = { collected: 0 }; });

  payments.forEach((p: any) => {
    const d = new Date(p.paymentDate);
    const monthIdx = d.getMonth();
    const academicMonthIdx = (monthIdx - 3 + 12) % 12;
    const monthName = monthNames[academicMonthIdx];
    if (monthlyMap[monthName]) {
      monthlyMap[monthName].collected += p.amount;
    }
  });

  const monthlyReceivable = totalReceivable / 12;
  const monthlyCollection = monthNames.map((month) => ({
    month,
    receivable: Math.round(monthlyReceivable),
    collected: Math.round(monthlyMap[month].collected),
  }));

  // Class-wise outstanding
  const structureIds = classwiseData.map((d: any) => d.feeStructureId);
  const structures = structureIds.length > 0
    ? await prisma.feeStructure.findMany({
        where: { id: { in: structureIds } },
        select: { id: true, classId: true, class: { select: { name: true } } },
      })
    : [];

  const classMap: { [classId: string]: { className: string; outstanding: number } } = {};
  classwiseData.forEach((item: any) => {
    const structure = structures.find((s: any) => s.id === item.feeStructureId);
    if (structure?.class) {
      const classId = structure.classId;
      if (!classMap[classId]) {
        classMap[classId] = { className: structure.class.name, outstanding: 0 };
      }
      classMap[classId].outstanding += item._sum.balanceAmount || 0;
    }
  });

  const classwiseOutstanding = Object.values(classMap)
    .sort((a, b) => b.outstanding - a.outstanding);

  // Recent collections
  const recentCollections = recentPayments.map((p: any) => ({
    receiptNo: p.receiptNo,
    date: p.paymentDate ? new Date(p.paymentDate).toISOString() : null,
    studentName: (() => {
      const fn = p.studentFee?.enrollment?.student?.firstName ?? "";
      const ln = p.studentFee?.enrollment?.student?.lastName ?? "";
      return fn.toLowerCase() === ln.toLowerCase() ? fn : `${fn} ${ln}`.trim();
    })() || "Unknown",
    className: p.studentFee?.enrollment?.class?.name || "N/A",
    amount: p.amount,
    collectedBy: p.collectedBy || "Admin",
    method: p.method,
  }));

  return {
    summary: { totalStudents, totalReceivable, totalCollected, outstanding, overdueAmount, totalDiscount, totalFine },
    monthlyCollection,
    classwiseOutstanding,
    recentCollections,
  };
};
