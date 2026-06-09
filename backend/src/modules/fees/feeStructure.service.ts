
import prisma from "../../utils/prisma";

interface FeeStructureItemInput {
  feeHeadId: string;
  amount: number;
  frequency?: string;
}

interface CreateFeeStructureInput {
  tenantId: string;
  name: string;
  classId: string;
  academicYearId: string;
  installmentType?: string;
  totalInstallments?: number;
  dueDay?: number;
  items: FeeStructureItemInput[];
}

interface UpdateFeeStructureInput {
  name?: string;
  classId?: string;
  academicYearId?: string;
  installmentType?: string;
  totalInstallments?: number;
  dueDay?: number;
  isActive?: boolean;
  items?: FeeStructureItemInput[];
}

interface GetAllFilters {
  academicYearId?: string;
  classId?: string;
}

// Get all fee structures for a tenant with optional filters
const getAll = async (tenantId: string, filters?: GetAllFilters) => {
  const where: any = {
    tenantId,
    isDeleted: false,
  };

  if (filters?.academicYearId) {
    where.academicYearId = filters.academicYearId;
  }

  if (filters?.classId) {
    where.classId = filters.classId;
  }

  const feeStructures = await prisma.feeStructure.findMany({
    where,
    include: {
      items: {
        include: {
          feeHead: true,
        },
      },
      class: true,
      academicYear: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return feeStructures;
};

// Get a single fee structure by ID
const getById = async (id: string, tenantId: string) => {
  const feeStructure = await prisma.feeStructure.findFirst({
    where: {
      id,
      tenantId,
      isDeleted: false,
    },
    include: {
      items: {
        include: {
          feeHead: true,
        },
      },
      class: true,
      academicYear: true,
    },
  });

  return feeStructure;
};

// Create a fee structure with items
const create = async (data: CreateFeeStructureInput) => {
  const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

  const feeStructure = await prisma.feeStructure.create({
    data: {
      tenantId: data.tenantId,
      name: data.name,
      classId: data.classId,
      academicYearId: data.academicYearId,
      installmentType: (data.installmentType as any) || "MONTHLY",
      totalInstallments: data.totalInstallments || 12,
      dueDay: data.dueDay || 10,
      totalAmount,
      items: {
        create: data.items.map((item) => ({
          feeHeadId: item.feeHeadId,
          amount: item.amount,
          frequency: item.frequency || "PER_INSTALLMENT",
        })),
      },
    },
    include: {
      items: {
        include: {
          feeHead: true,
        },
      },
      class: true,
      academicYear: true,
    },
  });

  return feeStructure;
};

// Update a fee structure and replace items
const update = async (id: string, data: UpdateFeeStructureInput, tenantId: string) => {
  const existing = await prisma.feeStructure.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!existing) {
    throw new Error("Fee structure not found");
  }

  // Calculate new total if items are provided
  const totalAmount = data.items
    ? data.items.reduce((sum, item) => sum + item.amount, 0)
    : undefined;

  const feeStructure = await prisma.$transaction(async (tx) => {
    // If items are provided, delete old items and create new ones
    if (data.items) {
      await tx.feeStructureItem.deleteMany({
        where: { feeStructureId: id },
      });
    }

    const updated = await tx.feeStructure.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.classId && { classId: data.classId }),
        ...(data.academicYearId && { academicYearId: data.academicYearId }),
        ...(data.installmentType && { installmentType: data.installmentType as any }),
        ...(data.totalInstallments !== undefined && { totalInstallments: data.totalInstallments }),
        ...(data.dueDay !== undefined && { dueDay: data.dueDay }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(totalAmount !== undefined && { totalAmount }),
        ...(data.items && {
          items: {
            create: data.items.map((item) => ({
              feeHeadId: item.feeHeadId,
              amount: item.amount,
              frequency: item.frequency || "PER_INSTALLMENT",
            })),
          },
        }),
      },
      include: {
        items: {
          include: {
            feeHead: true,
          },
        },
        class: true,
        academicYear: true,
      },
    });

    return updated;
  });

  return feeStructure;
};

// Soft delete a fee structure
const softDelete = async (id: string, tenantId: string) => {
  const existing = await prisma.feeStructure.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!existing) {
    throw new Error("Fee structure not found");
  }

  const deleted = await prisma.feeStructure.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return deleted;
};

// Get fee structure for a specific class and academic year
const getByClass = async (classId: string, academicYearId: string, tenantId: string) => {
  const feeStructure = await prisma.feeStructure.findFirst({
    where: {
      classId,
      academicYearId,
      tenantId,
      isDeleted: false,
    },
    include: {
      items: {
        include: {
          feeHead: true,
        },
      },
      class: true,
      academicYear: true,
    },
  });

  return feeStructure;
};

export default {
  getAll,
  getById,
  create,
  update,
  softDelete,
  getByClass,
};

