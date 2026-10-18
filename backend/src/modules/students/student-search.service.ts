// ══════════════════════════════════════════════════════════════════════════════
// STUDENT SEARCH SERVICE — Advanced Search & Saved Filters
// ══════════════════════════════════════════════════════════════════════════════

import prisma from "../../utils/prisma";
import { StudentAdvancedSearch, SavedFilterInput } from "./student.types";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./student.constants";

// ============================================
// ADVANCED SEARCH (Multi-field)
// ============================================
export const advancedSearch = async (tenantId: string, filters: StudentAdvancedSearch) => {
  const {
    admissionNo,
    rollNo,
    name,
    fatherName,
    motherName,
    mobile,
    aadhaar,
    classId,
    sectionId,
    academicYearId,
    houseId,
    category,
    religion,
    transport,
    hostel,
    status,
    gender,
    bloodGroup,
    admissionDateFrom,
    admissionDateTo,
    dobFrom,
    dobTo,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    sortBy = "createdAt",
    sortDir = "desc",
  } = filters;

  const pageSize = Math.min(limit, MAX_PAGE_SIZE);

  // Build the where clause dynamically
  const where: Record<string, unknown> = {
    tenantId,
    isDeleted: false,
  };

  // Direct field filters
  if (admissionNo) {
    where.admissionNo = { contains: admissionNo, mode: "insensitive" };
  }

  if (rollNo) {
    where.rollNumber = { contains: rollNo, mode: "insensitive" };
  }

  if (name) {
    where.OR = [
      { firstName: { contains: name, mode: "insensitive" } },
      { lastName: { contains: name, mode: "insensitive" } },
      { fullName: { contains: name, mode: "insensitive" } },
    ];
  }

  if (fatherName) {
    where.fatherName = { contains: fatherName, mode: "insensitive" };
  }

  if (motherName) {
    where.motherName = { contains: motherName, mode: "insensitive" };
  }

  if (mobile) {
    const existing = (where.OR as unknown[]) || [];
    where.OR = [
      ...existing,
      { phone: { contains: mobile } },
      { fatherPhone: { contains: mobile } },
      { motherPhone: { contains: mobile } },
      { guardianPhone: { contains: mobile } },
    ];
  }

  if (aadhaar) {
    where.aadharNo = { contains: aadhaar };
  }

  if (status) {
    where.status = status;
  }

  if (gender) {
    // DB stores normalized enum: MALE / FEMALE / OTHER
    const g = gender.toUpperCase();
    if (g === "MALE" || g === "M") where.gender = "MALE";
    else if (g === "FEMALE" || g === "F") where.gender = "FEMALE";
    else where.gender = "OTHER";
  }

  if (bloodGroup) {
    where.bloodGroup = bloodGroup;
  }

  if (category) {
    where.category = category;
  }

  if (religion) {
    where.religion = { contains: religion, mode: "insensitive" };
  }

  if (houseId) {
    where.houseId = houseId;
  }

  // Date range filters
  if (admissionDateFrom || admissionDateTo) {
    const dateFilter: Record<string, Date> = {};
    if (admissionDateFrom) dateFilter.gte = new Date(admissionDateFrom);
    if (admissionDateTo) dateFilter.lte = new Date(admissionDateTo);
    where.admissionDate = dateFilter;
  }

  if (dobFrom || dobTo) {
    const dobFilter: Record<string, Date> = {};
    if (dobFrom) dobFilter.gte = new Date(dobFrom);
    if (dobTo) dobFilter.lte = new Date(dobTo);
    where.dob = dobFilter;
  }

  // Enrollment-based filters (class, section, academic year)
  const enrollmentFilter: Record<string, string> = {};
  if (classId) enrollmentFilter.classId = classId;
  if (sectionId) enrollmentFilter.sectionId = sectionId;
  if (academicYearId) enrollmentFilter.academicYearId = academicYearId;

  if (Object.keys(enrollmentFilter).length > 0) {
    where.enrollments = {
      some: {
        ...enrollmentFilter,
        status: "active",
        isDeleted: false,
      },
    };
  }

  // Transport filter
  if (transport === true) {
    const transportStudentIds = await getTransportStudentIds(tenantId);
    where.id = { in: transportStudentIds };
  }

  // Hostel filter
  if (hostel === true) {
    const hostelStudentIds = await getHostelStudentIds(tenantId);
    const existingIdFilter = where.id as { in?: string[] } | undefined;
    if (existingIdFilter?.in) {
      // Intersection of transport and hostel students
      where.id = { in: existingIdFilter.in.filter((id) => hostelStudentIds.includes(id)) };
    } else {
      where.id = { in: hostelStudentIds };
    }
  }

  // Build sort — only allow safe sort fields
  const allowedSortFields = ["firstName", "lastName", "admissionNo", "rollNumber", "createdAt", "admissionDate", "dob", "status"] as const;
  type SortField = typeof allowedSortFields[number];
  const safeSortBy: SortField = (allowedSortFields as readonly string[]).includes(sortBy) ? sortBy as SortField : "createdAt";
  const safeDir = sortDir === "asc" ? "asc" : "desc";
  const orderBy: Record<string, string> = { [safeSortBy]: safeDir };

  // Execute query
  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        enrollments: {
          where: {
            status: "active",
            isDeleted: false,
            ...(academicYearId ? { academicYearId } : {}),
          },
          include: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            academicYear: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  return {
    students,
    total,
    page,
    limit: pageSize,
    totalPages: Math.ceil(total / pageSize),
    appliedFilters: Object.keys(filters).filter(
      (k) => filters[k as keyof StudentAdvancedSearch] !== undefined && k !== "page" && k !== "limit"
    ).length,
  };
};

// ============================================
// CHECK DUPLICATE
// ============================================
export const checkDuplicate = async (
  tenantId: string,
  params: { aadharNo?: string; phone?: string; email?: string; admissionNo?: string }
) => {
  const { aadharNo, phone, email, admissionNo } = params;
  const duplicates: Array<{ field: string; student: unknown }> = [];

  if (aadharNo) {
    const found = await prisma.student.findFirst({
      where: { tenantId, aadharNo, isDeleted: false },
      select: { id: true, fullName: true, admissionNo: true, status: true },
    });
    if (found) duplicates.push({ field: "aadharNo", student: found });
  }

  if (phone) {
    const found = await prisma.student.findFirst({
      where: { tenantId, phone, isDeleted: false },
      select: { id: true, fullName: true, admissionNo: true, status: true },
    });
    if (found) duplicates.push({ field: "phone", student: found });
  }

  if (email) {
    const found = await prisma.student.findFirst({
      where: { tenantId, email, isDeleted: false },
      select: { id: true, fullName: true, admissionNo: true, status: true },
    });
    if (found) duplicates.push({ field: "email", student: found });
  }

  if (admissionNo) {
    const found = await prisma.student.findFirst({
      where: { tenantId, admissionNo },
      select: { id: true, fullName: true, admissionNo: true, status: true },
    });
    if (found) duplicates.push({ field: "admissionNo", student: found });
  }

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
};

// ============================================
// SAVED FILTERS
// ============================================
export const getSavedFilters = async (tenantId: string, userId: string) => {
  return prisma.studentSavedFilter.findMany({
    where: {
      tenantId,
      OR: [{ userId }, { isShared: true }],
    },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
};

export const createSavedFilter = async (
  tenantId: string,
  userId: string,
  input: SavedFilterInput
) => {
  // If this is set as default, unset other defaults
  if (input.isDefault) {
    await prisma.studentSavedFilter.updateMany({
      where: { tenantId, userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.studentSavedFilter.create({
    data: {
      tenantId,
      userId,
      name: input.name,
      description: input.description || null,
      filters: input.filters,
      isDefault: input.isDefault || false,
      isShared: input.isShared || false,
    },
  });
};

export const updateSavedFilter = async (
  id: string,
  tenantId: string,
  userId: string,
  input: Partial<SavedFilterInput>
) => {
  const filter = await prisma.studentSavedFilter.findFirst({
    where: { id, tenantId, userId },
  });

  if (!filter) throw new Error("Filter not found or access denied");

  if (input.isDefault) {
    await prisma.studentSavedFilter.updateMany({
      where: { tenantId, userId, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  return prisma.studentSavedFilter.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.filters && { filters: input.filters }),
      ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
      ...(input.isShared !== undefined && { isShared: input.isShared }),
    },
  });
};

export const deleteSavedFilter = async (id: string, tenantId: string, userId: string) => {
  const filter = await prisma.studentSavedFilter.findFirst({
    where: { id, tenantId, userId },
  });

  if (!filter) throw new Error("Filter not found or access denied");

  await prisma.studentSavedFilter.delete({ where: { id } });
  return { success: true };
};

// ============================================
// HELPER: Get transport student IDs
// ============================================
async function getTransportStudentIds(tenantId: string): Promise<string[]> {
  try {
    const assignments = await prisma.transportAssignment.findMany({
      where: { tenantId, isActive: true },
      select: { studentId: true },
    });
    return assignments.map((a) => a.studentId).filter((id): id is string => Boolean(id));
  } catch {
    return [];
  }
}

// ============================================
// HELPER: Get hostel student IDs
// ============================================
async function getHostelStudentIds(tenantId: string): Promise<string[]> {
  try {
    const allocations = await prisma.hostelAllocation.findMany({
      where: { tenantId, isActive: true },
      select: { studentId: true },
    });
    return allocations.map((a) => a.studentId).filter((id): id is string => Boolean(id));
  } catch {
    return [];
  }
}
