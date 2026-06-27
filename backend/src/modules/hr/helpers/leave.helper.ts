import prisma from "../../../config/prisma";

interface LeaveBalance {
  leaveType: string;
  totalEntitled: number;
  used: number;
  pending: number;
  available: number;
}

// Default leave entitlements per year
const DEFAULT_LEAVE_ENTITLEMENTS: Record<string, number> = {
  CASUAL: 12,
  SICK: 12,
  EARNED: 15,
  MATERNITY: 180,
  PATERNITY: 15,
  UNPAID: 365, // Unlimited but tracked
};

export const calculateLeaveBalance = async (
  staffId: string,
  tenantId: string
): Promise<LeaveBalance[]> => {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31);

  // Get approved leaves for current year
  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      staffId,
      tenantId,
      status: "APPROVED",
      startDate: { gte: startOfYear },
      endDate: { lte: endOfYear },
    },
  });

  // Get pending leaves
  const pendingLeaves = await prisma.leaveRequest.findMany({
    where: {
      staffId,
      tenantId,
      status: "PENDING",
      startDate: { gte: startOfYear },
    },
  });

  const balances: LeaveBalance[] = [];

  for (const [type, total] of Object.entries(DEFAULT_LEAVE_ENTITLEMENTS)) {
    const used = approvedLeaves
      .filter((l) => l.leaveType === type)
      .reduce((sum, l) => sum + l.numberOfDays, 0);

    const pending = pendingLeaves
      .filter((l) => l.leaveType === type)
      .reduce((sum, l) => sum + l.numberOfDays, 0);

    balances.push({
      leaveType: type,
      totalEntitled: total,
      used,
      pending,
      available: Math.max(0, total - used - pending),
    });
  }

  return balances;
};

export const checkLeaveAvailability = async (
  staffId: string,
  tenantId: string,
  leaveType: string,
  numberOfDays: number
): Promise<{ available: boolean; balance: number; message?: string }> => {
  const balances = await calculateLeaveBalance(staffId, tenantId);
  const typeBalance = balances.find((b) => b.leaveType === leaveType);

  if (!typeBalance) {
    return { available: false, balance: 0, message: "Invalid leave type" };
  }

  if (typeBalance.available < numberOfDays) {
    return {
      available: false,
      balance: typeBalance.available,
      message: `Insufficient ${leaveType} leave balance. Available: ${typeBalance.available} days`,
    };
  }

  return { available: true, balance: typeBalance.available };
};

export const getLeaveHistory = async (staffId: string, tenantId: string, year?: number) => {
  const targetYear = year || new Date().getFullYear();
  const startOfYear = new Date(targetYear, 0, 1);
  const endOfYear = new Date(targetYear, 11, 31);

  return prisma.leaveRequest.findMany({
    where: {
      staffId,
      tenantId,
      startDate: { gte: startOfYear, lte: endOfYear },
    },
    orderBy: { startDate: "desc" },
  });
};
