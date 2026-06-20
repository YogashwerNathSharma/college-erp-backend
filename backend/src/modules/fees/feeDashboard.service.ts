
import prisma from "../../utils/prisma";

export const getFeeDashboard = async (tenantId: string, academicYearId?: string) => {
  const filters: any = { tenantId, isDeleted: false };

  // Get academic year filter
  let ayFilter: any = {};
  if (academicYearId) {
    ayFilter = { academicYearId };
  } else {
    // Get current active academic year
    const activeAY = await prisma.academicYear.findFirst({
      where: { tenantId, isActive: true, isDeleted: false },
      select: { id: true },
    });
    if (activeAY) ayFilter = { academicYearId: activeAY.id };
  }

  // 1. Total Students (active enrollments)
  const totalStudents = await prisma.enrollment.count({
    where: { tenantId, status: "active", isDeleted: false, ...ayFilter },
  });

  // 2. Total Receivable (sum of all StudentFee.netAmount)
  const receivableAgg = await prisma.studentFee.aggregate({
    where: {
      tenantId,
      isDeleted: false,
      enrollment: { ...ayFilter, isDeleted: false },
    },
    _sum: { netAmount: true },
  });
  const totalReceivable = receivableAgg._sum.netAmount || 0;

  // 3. Total Collected (sum of all Payment.amount)
  const collectedAgg = await prisma.payment.aggregate({
    where: {
      tenantId,
      isDeleted: false,
      studentFee: {
        isDeleted: false,
        enrollment: { ...ayFilter, isDeleted: false },
      },
    },
    _sum: { amount: true },
  });
  const totalCollected = collectedAgg._sum.amount || 0;

  // 4. Outstanding
  const outstanding = totalReceivable - totalCollected;

  // 5. Monthly Collection (grouped by month)
  const payments = await prisma.payment.findMany({
    where: {
      tenantId,
      isDeleted: false,
      studentFee: {
        isDeleted: false,
        enrollment: { ...ayFilter, isDeleted: false },
      },
    },
    select: { amount: true, paymentDate: true },
  });

  // Group by month (Apr=0 to Mar=11 for Indian academic year)
  const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const monthlyMap: { [key: string]: { collected: number } } = {};
  monthNames.forEach((m) => { monthlyMap[m] = { collected: 0 }; });

  payments.forEach((p) => {
    const d = new Date(p.paymentDate);
    const monthIdx = d.getMonth(); // 0=Jan
    // Map to academic year: Apr(3)=0, May(4)=1, ..., Mar(2)=11
    const academicMonthIdx = (monthIdx - 3 + 12) % 12;
    const monthName = monthNames[academicMonthIdx];
    if (monthlyMap[monthName]) {
      monthlyMap[monthName].collected += p.amount;
    }
  });

  // Calculate monthly receivable (total / 12 as approximation, or from studentFees)
  const monthlyReceivable = totalReceivable / 12;
  const monthlyCollection = monthNames.map((month) => ({
    month,
    receivable: Math.round(monthlyReceivable),
    collected: Math.round(monthlyMap[month].collected),
  }));

  // 6. Class-wise Outstanding
  const classwiseData = await prisma.studentFee.groupBy({
    by: ["feeStructureId"],
    where: {
      tenantId,
      isDeleted: false,
      enrollment: { ...ayFilter, isDeleted: false },
    },
    _sum: { balanceAmount: true },
  });

  // Get class names for fee structures
  const structureIds = classwiseData.map((d) => d.feeStructureId);
  const structures = await prisma.feeStructure.findMany({
    where: { id: { in: structureIds } },
    include: { class: { select: { id: true, name: true } } },
  });

  const classMap: { [classId: string]: { className: string; outstanding: number } } = {};
  classwiseData.forEach((item) => {
    const structure = structures.find((s) => s.id === item.feeStructureId);
    if (structure) {
      const classId = structure.classId;
      if (!classMap[classId]) {
        classMap[classId] = { className: structure.class.name, outstanding: 0 };
      }
      classMap[classId].outstanding += item._sum.balanceAmount || 0;
    }
  });

  const classwiseOutstanding = Object.values(classMap)
    .sort((a, b) => b.outstanding - a.outstanding);

  // 7. Recent Collections (last 10)
  const recentPayments = await prisma.payment.findMany({
    where: {
      tenantId,
      isDeleted: false,
      studentFee: {
        isDeleted: false,
        enrollment: { ...ayFilter, isDeleted: false },
      },
    },
    include: {
      studentFee: {
        include: {
          enrollment: {
            include: {
              student: { select: { firstName: true, lastName: true } },
              class: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { paymentDate: "desc" },
    take: 10,
  });

  const recentCollections = recentPayments.map((p) => ({
    receiptNo: p.receiptNo,
    date: p.paymentDate,
    studentName: `${p.studentFee.enrollment.student.firstName} ${p.studentFee.enrollment.student.lastName}`,
    className: p.studentFee.enrollment.class.name,
    amount: p.amount,
    collectedBy: p.collectedBy || "Admin",
    method: p.method,
  }));

  return {
    summary: { totalStudents, totalReceivable, totalCollected, outstanding },
    monthlyCollection,
    classwiseOutstanding,
    recentCollections,
  };
};

