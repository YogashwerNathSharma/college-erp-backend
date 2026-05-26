import prisma from "../../utils/prisma";

// 📊 Dashboard
export const getSuperAdminDashboardService = async () => {
  const [totalTenants, totalStudents, totalRevenue] = await Promise.all([
    prisma.tenant.count(),
    prisma.student.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
    }),
  ]);

  return {
    totalTenants,
    totalStudents,
    totalRevenue: totalRevenue._sum.amount || 0,
  };
};

// 🏫 Tenants List
export const getTenantsService = async () => {
  return prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};