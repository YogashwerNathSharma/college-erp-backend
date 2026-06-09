
import prisma from "../../utils/prisma";

export const feeDiscountService = {
  async getAll(tenantId: string) {
    return prisma.feeDiscount.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string, tenantId: string) {
    return prisma.feeDiscount.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
  },

  async create(data: {
    tenantId: string;
    name: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    description?: string;
    applicableHeadIds?: string[];
  }) {
    return prisma.feeDiscount.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        type: data.type,
        value: data.value,
        description: data.description || null,
        applicableHeadIds: data.applicableHeadIds || [],
      },
    });
  },

  async update(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      type?: "PERCENTAGE" | "FIXED";
      value?: number;
      description?: string;
      applicableHeadIds?: string[];
      isActive?: boolean;
    }
  ) {
    return prisma.feeDiscount.updateMany({
      where: { id, tenantId, isDeleted: false },
      data,
    });
  },

  async softDelete(id: string, tenantId: string) {
    return prisma.feeDiscount.updateMany({
      where: { id, tenantId, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },
};

