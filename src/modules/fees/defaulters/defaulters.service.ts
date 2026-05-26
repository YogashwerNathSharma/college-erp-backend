import  prisma from "../../../utils/prisma";

export const getDefaultersService = async ({
  user,
  classId,
  sectionId,
  academicYearId,
}: {
  user: { tenantId: string };
  classId?: string;
  sectionId?: string;
  academicYearId?: string;
}) => {
  const today = new Date();

  const defaulters = await prisma.studentFee.findMany({
    where: {
      tenantId: user.tenantId,

      // NOT fully paid
      status: {
        not: "PAID",
      },

      // still pending
      pendingAmount: {
        gt: 0,
      },

      // overdue
      dueDate: {
        lt: today,
      },

      // optional filters (VERY IMPORTANT 🔥)
      enrollment: {
        ...(classId && { classId }),
        ...(sectionId && { sectionId }),
        ...(academicYearId && { academicYearId }),
      },
    },

    include: {
      student: true,
      enrollment: {
        include: {
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
      ...d,
      overdueDays,
      severity,
    };
  });

  return result;
};