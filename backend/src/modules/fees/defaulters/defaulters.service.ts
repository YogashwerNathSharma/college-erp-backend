import prisma from "../../../utils/prisma";

export const getDefaultersService = async ({
  tenantId,
  classId,
  sectionId,
  academicYearId,
}: {
  tenantId: string;
  classId?: string;
  sectionId?: string;
  academicYearId?: string;
}) => {
  const today = new Date();

  const defaulters = await prisma.studentFee.findMany({
    where: {
      tenantId,

      // ❌ NOT fully paid
      status: {
        not: "PAID",
      },

      // ❌ still pending
      pendingAmount: {
        gt: 0,
      },

      // ❌ overdue
      dueDate: {
        lt: today,
      },

      // 🔥 RELATION FILTER (CORRECT WAY)
      enrollment: {
        is: {
          ...(classId && { classId }),
          ...(sectionId && { sectionId }),
          ...(academicYearId && { academicYearId }),
        },
      },
    },

    include: {
      enrollment: {
        include: {
          student: true,
          class: true,
          section: true,
          academicYear: true,
        },
      },
    },
  });

  // 🔥 Add overdue days + severity
  const result = defaulters.map((d) => {
    const overdueDays = Math.floor(
      (today.getTime() - new Date(d.dueDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    let severity: "LOW" | "MEDIUM" | "HIGH" = "LOW";

    if (overdueDays > 60) severity = "HIGH";
    else if (overdueDays > 30) severity = "MEDIUM";

    return {
      id: d.id,
      studentName: d.enrollment.student.firstName + " " + d.enrollment.student.lastName,
      className: d.enrollment.class.name,
      sectionName: d.enrollment.section.name,
      total: d.totalAmount,
      paid: d.paidAmount,
      pending: d.pendingAmount,
      overdueDays,
      severity,
    };
  });

  return result;
};