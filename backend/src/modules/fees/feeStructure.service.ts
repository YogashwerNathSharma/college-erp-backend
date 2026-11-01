
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

  // NOTE: `class` and `academicYear` are required relations, but a structure
  // may reference a class/year that was later deleted (orphaned row). Using
  // `include: { class: true }` would crash with "Field class is required to
  // return data, got null". So we fetch the relations separately and attach
  // them null-safely.
  const feeStructures = await prisma.feeStructure.findMany({
    where,
    include: {
      items: {
        include: {
          feeHead: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Collect referenced class/year ids and fetch them in bulk
  const classIds = [...new Set(feeStructures.map((f) => f.classId).filter(Boolean))];
  const yearIds = [...new Set(feeStructures.map((f) => f.academicYearId).filter(Boolean))];

  const [classList, yearList] = await Promise.all([
    prisma.class.findMany({ where: { id: { in: classIds } } }),
    prisma.academicYear.findMany({ where: { id: { in: yearIds } } }),
  ]);

  const classMap = new Map(classList.map((c) => [c.id, c]));
  const yearMap = new Map(yearList.map((y) => [y.id, y]));

  // Attach relations; skip orphaned structures whose class no longer exists
  const result = feeStructures
    .map((f) => ({
      ...f,
      class: classMap.get(f.classId) || null,
      academicYear: yearMap.get(f.academicYearId) || null,
    }))
    .filter((f) => f.class !== null);

  return result;
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
    },
  });

  if (!feeStructure) return null;

  // Attach class/year null-safely (relations may be orphaned)
  const [cls, year] = await Promise.all([
    prisma.class.findUnique({ where: { id: feeStructure.classId } }),
    prisma.academicYear.findUnique({ where: { id: feeStructure.academicYearId } }),
  ]);

  return { ...feeStructure, class: cls || null, academicYear: year || null };
};

// Create a fee structure with items
const create = async (data: CreateFeeStructureInput) => {
  const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

  // A fee structure is unique per (tenantId, classId, academicYearId).
  // Helper: revive a SOFT-DELETED row for this class+year with the new data.
  const reviveExisting = async (existingId: string) => {
    // Keep the transaction minimal and fast (just the two writes), and raise
    // the timeout so a slow DB connection doesn't trip the 5s default (P2028).
    const updated = await prisma.$transaction(
      async (tx) => {
        // Replace the old items with the newly submitted ones
        await tx.feeStructureItem.deleteMany({ where: { feeStructureId: existingId } });
        return tx.feeStructure.update({
          where: { id: existingId },
          data: {
            name: data.name,
            installmentType: (data.installmentType as any) || "MONTHLY",
            totalInstallments: data.totalInstallments || 12,
            dueDay: data.dueDay || 10,
            totalAmount,
            isActive: true,
            isDeleted: false,
            deletedAt: null,
            items: {
              create: data.items.map((item) => ({
                feeHeadId: item.feeHeadId,
                amount: item.amount,
                frequency: item.frequency || "PER_INSTALLMENT",
              })),
            },
          },
        });
      },
      { timeout: 20000, maxWait: 10000 }
    );

    // Fetch relations OUTSIDE the transaction to keep it short.
    return getById(updated.id, data.tenantId);
  };

  // Look up any existing row for this class + year using the SAME compound
  // unique key that enforces the DB constraint. Using findUnique on the
  // compound key (not findFirst with a plain where) guarantees we see exactly
  // the row the unique index would conflict with — avoiding the mismatch
  // where findFirst misses a row that create() then collides with.
  const existing = await prisma.feeStructure.findUnique({
    where: {
      tenantId_classId_academicYearId: {
        tenantId: data.tenantId,
        classId: data.classId,
        academicYearId: data.academicYearId,
      },
    },
  });

  if (existing) {
    // An ACTIVE structure already exists → do NOT silently overwrite it.
    if (!existing.isDeleted) {
      throw new Error("ALREADY_EXISTS");
    }
    // A SOFT-DELETED structure occupies this slot but is hidden from the
    // list. Revive it with the newly submitted data.
    return reviveExisting(existing.id);
  }

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
      items: { include: { feeHead: true } },
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

  const updatedStructure = await prisma.$transaction(async (tx) => {
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
    });

    return updated;
  }, { timeout: 20000, maxWait: 10000 });

  // Fetch relations OUTSIDE the transaction to keep it short/fast.
  return getById(updatedStructure.id, tenantId);
};

// Delete a fee structure.
// HARD delete so the (classId, academicYearId) slot is fully freed and a new
// structure can be created later. Blocked if any students already have fees
// assigned from this structure (to protect payment/ledger history).
const softDelete = async (id: string, tenantId: string) => {
  const existing = await prisma.feeStructure.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!existing) {
    throw new Error("Fee structure not found");
  }

  // Guard: do not delete if students already have fees from this structure.
  const assignedCount = await prisma.studentFee.count({
    where: { feeStructureId: id, tenantId, isDeleted: false },
  });

  if (assignedCount > 0) {
    throw new Error("HAS_ASSIGNED_FEES");
  }

  // Hard delete: remove child items first, then the structure itself, so the
  // unique (tenantId, classId, academicYearId) slot becomes free again.
  const deleted = await prisma.$transaction(async (tx) => {
    await tx.feeStructureItem.deleteMany({ where: { feeStructureId: id } });
    return tx.feeStructure.delete({ where: { id } });
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
    },
  });

  if (!feeStructure) return null;

  const [cls, year] = await Promise.all([
    prisma.class.findUnique({ where: { id: feeStructure.classId } }),
    prisma.academicYear.findUnique({ where: { id: feeStructure.academicYearId } }),
  ]);

  return { ...feeStructure, class: cls || null, academicYear: year || null };
};

export default {
  getAll,
  getById,
  create,
  update,
  softDelete,
  getByClass,
};

