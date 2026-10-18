// @ts-nocheck
import prisma from "../../config/prisma";

// ============================================
// HOSTEL CRUD
// ============================================

export const createHostel = async (data: any, tenantId: string) => {
  return prisma.hostel.create({
    data: { ...data, tenantId },
  });
};

export const getAllHostels = async (tenantId: string, filters?: { type?: string; search?: string }) => {
  const where: any = { tenantId, isDeleted: false };
  if (filters?.type) where.type = filters.type;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { wardenName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.hostel.findMany({
    where,
    include: { rooms: { where: { isDeleted: false } }, _count: { select: { rooms: true } } },
    orderBy: { name: "asc" },
  });
};

export const getHostelById = async (id: string, tenantId: string) => {
  return prisma.hostel.findFirst({
    where: { id, tenantId, isDeleted: false },
    include: {
      rooms: { where: { isDeleted: false }, orderBy: { roomNumber: "asc" } },
      messMenus: true,
    },
  });
};

export const updateHostel = async (id: string, data: any, tenantId: string) => {
  return prisma.hostel.update({
    where: { id, tenantId },
    data,
  });
};

export const deleteHostel = async (id: string, tenantId: string) => {
  return prisma.hostel.update({
    where: { id, tenantId },
    data: { isDeleted: true },
  });
};

// ============================================
// ROOM CRUD
// ============================================

export const createRoom = async (data: any, tenantId: string) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: data.hostelId, tenantId, isDeleted: false } });
  if (!hostel) throw new Error("Hostel not found");

  return prisma.hostelRoom.create({
    data: { ...data, tenantId },
  });
};

export const getRoomsByHostel = async (hostelId: string, tenantId: string, academicYearId?: string) => {
  return prisma.hostelRoom.findMany({
    where: { hostelId, tenantId, isDeleted: false },
    include: {
      allocations: {
        where: {
          isActive: true,
          ...(academicYearId ? { academicYearId } : {}),
        },
      },
    },
    orderBy: { roomNumber: "asc" },
  });
};

export const updateRoom = async (id: string, data: any, tenantId: string) => {
  return prisma.hostelRoom.update({
    where: { id, tenantId },
    data,
  });
};

export const deleteRoom = async (id: string, tenantId: string) => {
  return prisma.hostelRoom.update({
    where: { id, tenantId },
    data: { isDeleted: true },
  });
};

// ============================================
// ALLOCATION
// ============================================

export const allocateRoom = async (data: any, tenantId: string, academicYearId: string) => {
  if (!academicYearId) throw new Error("Academic year is required");

  const room = await prisma.hostelRoom.findFirst({
    where: { id: data.roomId, tenantId, isDeleted: false },
    include: {
      allocations: {
        where: { isActive: true, academicYearId },
      },
    },
  });

  if (!room) throw new Error("Room not found");
  if (room.allocations.length >= room.capacity) throw new Error("Room is at full capacity");

  // Check if student already has an active allocation in the selected academic year.
  const existingAllocation = await prisma.hostelAllocation.findFirst({
    where: { studentId: data.studentId, tenantId, academicYearId, isActive: true },
  });
  if (existingAllocation) throw new Error("Student already has an active room allocation in this academic year");

  const allocation = await prisma.hostelAllocation.create({
    data: {
      ...data,
      tenantId,
      academicYearId,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isActive: true,
    },
    include: { room: true },
  });

  // ═══ AUTO FEE INTEGRATION ═══
  // When hostel is allocated, auto-add hostel fee to student's pending installments
  try {
    // @ts-ignore - dynamic import for circular dependency avoidance
    const { addHostelFeeToStudent } = await import("../fees/feeIntegration.service");
    const monthlyFee = (allocation.room as any)?.monthlyFee || (allocation.room as any)?.rentPerBed || data.monthlyFee || 0;
    if (monthlyFee > 0) {
      const hostelName = (allocation.room as any)?.roomNumber || "";
      await addHostelFeeToStudent(data.studentId, tenantId, monthlyFee, hostelName);
    }
  } catch (err) {
    console.error("Auto hostel fee add failed (non-blocking):", err);
  }

  return allocation;
};

export const deallocateRoom = async (allocationId: string, tenantId: string, academicYearId: string, reason?: string) => {
  if (!academicYearId) throw new Error("Academic year is required");

  // Get allocation details before deallocation, restricted to selected academic year.
  const allocation = await prisma.hostelAllocation.findFirst({
    where: { id: allocationId, tenantId, academicYearId },
  });
  if (!allocation) throw new Error("Allocation not found in selected academic year");

  const result = await prisma.hostelAllocation.update({
    where: { id: allocationId, tenantId },
    data: { isActive: false, endDate: new Date(), reason },
  });

  // ═══ AUTO FEE INTEGRATION ═══
  // Remove hostel fee from pending installments when room is vacated
  if (allocation.studentId) {
    try {
      // @ts-ignore - dynamic import for circular dependency avoidance
      const { removeHostelFeeFromStudent } = await import("../fees/feeIntegration.service");
      await removeHostelFeeFromStudent(allocation.studentId, tenantId);
    } catch (err) {
      console.error("Auto hostel fee remove failed (non-blocking):", err);
    }
  }

  return result;
};

export const getAllocations = async (tenantId: string, academicYearId: string, filters?: { hostelId?: string; isActive?: boolean }) => {
  if (!academicYearId) throw new Error("Academic year is required");

  const where: any = { tenantId, academicYearId };
  if (filters?.hostelId) where.hostelId = filters.hostelId;
  if (filters?.isActive !== undefined) where.isActive = filters.isActive;

  return prisma.hostelAllocation.findMany({
    where,
    include: {
      student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      room: { select: { id: true, roomNumber: true } },
      hostel: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ============================================
// MESS MANAGEMENT
// ============================================

export const createMess = async (data: any, tenantId: string) => {
  return prisma.hostelMess.create({
    data: { ...data, tenantId },
  });
};

export const getMessByHostel = async (hostelId: string, tenantId: string) => {
  return prisma.hostelMess.findMany({
    where: { hostelId, tenantId, isDeleted: false },
  });
};

export const updateMess = async (id: string, data: any, tenantId: string) => {
  return prisma.hostelMess.update({
    where: { id, tenantId },
    data,
  });
};

export const setMessMenu = async (data: any, tenantId: string) => {
  const existing = await prisma.messMenu.findFirst({
    where: { messId: data.messId, dayOfWeek: data.dayOfWeek, tenantId },
  });

  if (existing) {
    return prisma.messMenu.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.messMenu.create({
    data: { ...data, tenantId },
  });
};

export const getMessMenu = async (messId: string, tenantId: string) => {
  return prisma.messMenu.findMany({
    where: { messId, tenantId },
    orderBy: { dayOfWeek: "asc" },
  });
};
