import prisma from "../../utils/prisma";

export const createAcademicYear = async (data: any, tenantId: string) => {
  if (!tenantId) {
    throw new Error("TenantId missing");
  }

  return prisma.academicYear.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate), // ✅ FIX
      endDate: new Date(data.endDate),     // ✅ FIX
      tenantId,
    },
  });
};

export const getAcademicYears = async (tenantId: string) => {
  return prisma.academicYear.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
};

export const setActiveYear = async (id: string, tenantId: string) => {
  // 🔥 deactivate all first
  await prisma.academicYear.updateMany({
    where: { tenantId },
    data: { isActive: false },
  });

  // 🔥 activate selected
  return prisma.academicYear.update({
    where: { id },
    data: { isActive: true },
  });
};