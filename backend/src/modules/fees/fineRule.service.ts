
import prisma from "../../utils/prisma";

export const fineRuleService = {
  async getAll(tenantId: string) {
    return prisma.fineRule.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string, tenantId: string) {
    return prisma.fineRule.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
  },

  async create(data: {
    tenantId: string;
    name: string;
    afterDays: number;
    amountPerDay: number;
    maxAmount: number;
  }) {
    return prisma.fineRule.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        afterDays: data.afterDays,
        amountPerDay: data.amountPerDay,
        maxAmount: data.maxAmount,
      },
    });
  },

  async update(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      afterDays?: number;
      amountPerDay?: number;
      maxAmount?: number;
      isActive?: boolean;
    }
  ) {
    return prisma.fineRule.updateMany({
      where: { id, tenantId, isDeleted: false },
      data,
    });
  },

  async softDelete(id: string, tenantId: string) {
    return prisma.fineRule.updateMany({
      where: { id, tenantId, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },
};

