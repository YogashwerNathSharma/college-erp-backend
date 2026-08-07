
import prisma from "../../utils/prisma";
import { generateSrNumber, generateAdmissionNumber, syncAdmissionCounter } from "./admission-number.service";
import { cached } from "../../utils/cache";

// Statuses that count as "active/enrolled" students (consistent with dashboard)
const ACTIVE_STATUSES = ["active", "pending", "verified"] as const;

// ============================================
// CREATE STUDENT — WITH AUTO ENROLLMENT
// ============================================
export const createStudent = async (data: any, tenantId: string, userId: string) => {
  const {
    firstName,
    lastName,
    gender,
    dob,
    email,
    phone,
    address,
    admissionNo,
    bloodGroup,
    religion,
    caste,
    category,
    nationality,
    aadharNo,
    fatherName,
    fatherPhone,
    fatherOccupation,
    motherName,
    motherPhone,
    motherOccupation,
    guardianName,
    guardianPhone,
    guardianRelation,
    photoUrl,
    classId,
    sectionId,
    academicYearId,
    rollNumber,
    religionId,
    casteId,
    categoryId,
    nationalityId,
  } = data;

  // Auto-generate admission number if not provided
  let finalAdmissionNo = admissionNo;
  if (!finalAdmissionNo) {
    try {
      finalAdmissionNo = await generateAdmissionNumber(tenantId, academicYearId);
      console.log(`✅ Generated admission number: ${finalAdmissionNo}`);
    } catch (err: any) {
      console.error("❌ Failed to generate admission number:", err.message);
      // Sync counter and retry once using the static import
      await syncAdmissionCounter(tenantId, academicYearId);
      finalAdmissionNo = await generateAdmissionNumber(tenantId, academicYearId);
      console.log(`✅ Generated after sync: ${finalAdmissionNo}`);
    }
  }

  const srNo = await generateSrNumber(tenantId, finalAdmissionNo);

  // Resolve master data: if string name provided (not ObjectId), find or create
  const isObjectId = (val: string) => /^[a-f0-9]{24}$/i.test(val);

  let resolvedReligionId = religionId || null;
  if (!resolvedReligionId && religion) {
    if (isObjectId(religion)) {
      resolvedReligionId = religion;
    } else {
      const found = await prisma.religion.findFirst({ where: { tenantId, name: { equals: religion, mode: "insensitive" } } });
      resolvedReligionId = found?.id || null;
    }
  }

  let resolvedCategoryId = categoryId || null;
  if (!resolvedCategoryId && category) {
    if (isObjectId(category)) {
      resolvedCategoryId = category;
    } else {
      const found = await prisma.category.findFirst({ where: { tenantId, name: { equals: category, mode: "insensitive" } } });
      resolvedCategoryId = found?.id || null;
    }
  }

  let resolvedNationalityId = nationalityId || null;
  if (!resolvedNationalityId && nationality) {
    if (isObjectId(nationality)) {
      resolvedNationalityId = nationality;
    } else {
      const found = await prisma.nationality.findFirst({ where: { tenantId, name: { equals: nationality, mode: "insensitive" } } });
      resolvedNationalityId = found?.id || null;
    }
  }

  // Normalize gender to enum value
  const normalizeGender = (g: string): string => {
    if (!g) return "MALE";
    const upper = g.toUpperCase();
    if (upper === "MALE" || upper === "M") return "MALE";
    if (upper === "FEMALE" || upper === "F") return "FEMALE";
    return "OTHER";
  };

  // Normalize blood group to enum value
  const normalizeBloodGroup = (bg: string): string | null => {
    if (!bg) return null;
    const map: Record<string, string> = {
      "A+": "A_POSITIVE", "A-": "A_NEGATIVE",
      "B+": "B_POSITIVE", "B-": "B_NEGATIVE",
      "O+": "O_POSITIVE", "O-": "O_NEGATIVE",
      "AB+": "AB_POSITIVE", "AB-": "AB_NEGATIVE",
    };
    return map[bg] || map[bg.toUpperCase()] || null;
  };

  // 1. Create Student (no transaction — avoids MongoDB replica set timeout)
  const student = await prisma.student.create({
    data: {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      gender: normalizeGender(gender),
      dob: new Date(dob),
      email: email || null,
      phone: phone || null,
      address: address || "N/A",
      admissionNo: finalAdmissionNo,
      srNo,
      bloodGroup: normalizeBloodGroup(bloodGroup) as any,
      religionId: resolvedReligionId || null,
      casteId: casteId || null,
      categoryId: resolvedCategoryId || null,
      nationalityId: resolvedNationalityId || null,
      aadharNo: aadharNo || null,
      fatherName: fatherName || "N/A",
      fatherPhone: fatherPhone || "N/A",
      fatherOccupation: fatherOccupation || null,
      motherName: motherName || "N/A",
      motherPhone: motherPhone || null,
      motherOccupation: motherOccupation || null,
      guardianName: guardianName || null,
      guardianPhone: guardianPhone || null,
      guardianRelation: guardianRelation || null,
      photoUrl: photoUrl || null,
      admissionDate: new Date(),
      status: "pending",
      isDeleted: false,
      tenant: { connect: { id: tenantId } },
      academicYear: { connect: { id: academicYearId } },
    },
  });

  // 2. Create Enrollment (if classId provided)
  let enrollment = null;
  if (classId && sectionId) {
    const enrollmentData: any = {
      student: { connect: { id: student.id } },
      class: { connect: { id: classId } },
      section: { connect: { id: sectionId } },
      academicYear: { connect: { id: academicYearId } },
      tenant: { connect: { id: tenantId } },
      rollNumber: rollNumber || null,
      status: "active",
    };
    enrollment = await prisma.enrollment.create({ data: enrollmentData });
  }

  // 3. Log to StudentHistory (fire-and-forget — non-critical)
  prisma.studentHistory.create({
    data: {
      studentId: student.id,
      tenantId,
      action: "ADMISSION",
      details: JSON.stringify({
        admissionNo: finalAdmissionNo,
        classId,
        sectionId,
        academicYearId,
        rollNumber: rollNumber || null,
      }),
      toClassId: classId || null,
      toSectionId: sectionId || null,
      academicYearId,
      performedBy: userId || "system",
    },
  }).catch(() => {}); // Don't block admission if history fails

  return { student, enrollment };
};

// ============================================
// GET ALL STUDENTS (with enrollment info)
// ============================================
export const getAllStudents = async (
  tenantId: string,
  filters: {
    classId?: string;
    sectionId?: string;
    academicYearId?: string;
    status?: string;
    admissionStatus?: string;
    search?: string;
    gender?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }
) => {
  const { classId, sectionId, academicYearId, status, admissionStatus, search, gender, dateFrom, dateTo, page = 1, limit = 50 } = filters;

  const where: any = {
    tenantId,
    isDeleted: false,
  };

  if (status) where.status = status;
  if (admissionStatus) where.status = admissionStatus;

  // Gender filter — DB now stores normalized enum: MALE / FEMALE / OTHER
  if (gender) {
    const g = gender.toUpperCase();
    if (g === "MALE" || g === "M") where.gender = "MALE";
    else if (g === "FEMALE" || g === "F") where.gender = "FEMALE";
    else where.gender = "OTHER";
  }

  if (dateFrom || dateTo) {
    where.admissionDate = {};
    if (dateFrom) where.admissionDate.gte = new Date(dateFrom);
    if (dateTo) where.admissionDate.lte = new Date(dateTo);
  }
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { admissionNo: { contains: search, mode: "insensitive" } },
      { fatherName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const enrollmentFilter: any = {};
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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.student.count({ where }),
  ]);

  return {
    students,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ============================================
// GET STUDENT BY ID
// ============================================
export const getStudentById = async (id: string, tenantId: string) => {
  const student = await prisma.student.findFirst({
    where: { id, tenantId, isDeleted: false },
    include: {
      enrollments: {
        where: { isDeleted: false },
        include: {
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
          academicYear: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return student;
};

// ============================================
// UPDATE STUDENT
// ============================================
export const updateStudent = async (id: string, data: any, tenantId: string) => {
  const {
    firstName, lastName, gender, dob, email, phone, address,
    bloodGroup, aadharNo, fatherName, motherName,
    fatherPhone, motherPhone, fatherOccupation, motherOccupation,
    guardianName, guardianPhone, guardianRelation,
    status, rollNumber, photoUrl,
    religionId, casteId, categoryId, nationalityId,
    religion, caste, category, nationality,
  } = data;

  let normalizedGender = gender;
  if (gender) {
    const upper = gender.toUpperCase();
    if (upper === "MALE" || upper === "M") normalizedGender = "MALE";
    else if (upper === "FEMALE" || upper === "F") normalizedGender = "FEMALE";
    else normalizedGender = "OTHER";
  }

  const updateData: any = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (firstName && lastName) updateData.fullName = `${firstName} ${lastName}`;
  if (normalizedGender) updateData.gender = normalizedGender;
  if (dob) updateData.dob = new Date(dob);
  if (email !== undefined) updateData.email = email || null;
  if (phone !== undefined) updateData.phone = phone || null;
  if (address !== undefined) updateData.address = address;
  if (bloodGroup !== undefined) {
    const bgMap: Record<string, string> = {
      "A+": "A_POSITIVE", "A-": "A_NEGATIVE",
      "B+": "B_POSITIVE", "B-": "B_NEGATIVE",
      "O+": "O_POSITIVE", "O-": "O_NEGATIVE",
      "AB+": "AB_POSITIVE", "AB-": "AB_NEGATIVE",
    };
    updateData.bloodGroup = bloodGroup ? (bgMap[bloodGroup] || bloodGroup) : null;
  }
  if (aadharNo !== undefined) updateData.aadharNo = aadharNo || null;
  if (fatherName !== undefined) updateData.fatherName = fatherName;
  if (motherName !== undefined) updateData.motherName = motherName;
  if (fatherPhone !== undefined) updateData.fatherPhone = fatherPhone;
  if (motherPhone !== undefined) updateData.motherPhone = motherPhone || null;
  if (fatherOccupation !== undefined) updateData.fatherOccupation = fatherOccupation || null;
  if (motherOccupation !== undefined) updateData.motherOccupation = motherOccupation || null;
  if (guardianName !== undefined) updateData.guardianName = guardianName || null;
  if (guardianPhone !== undefined) updateData.guardianPhone = guardianPhone || null;
  if (guardianRelation !== undefined) updateData.guardianRelation = guardianRelation || null;
  if (status) updateData.status = status;
  if (rollNumber !== undefined) updateData.rollNumber = rollNumber || null;
  if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

  const finalReligionId = religionId || religion || null;
  const finalCasteId = casteId || caste || null;
  const finalCategoryId = categoryId || category || null;
  const finalNationalityId = nationalityId || nationality || null;
  if (finalReligionId !== undefined) updateData.religionId = finalReligionId || null;
  if (finalCasteId !== undefined) updateData.casteId = finalCasteId || null;
  if (finalCategoryId !== undefined) updateData.categoryId = finalCategoryId || null;
  if (finalNationalityId !== undefined) updateData.nationalityId = finalNationalityId || null;

  const student = await prisma.student.updateMany({
    where: { id, tenantId, isDeleted: false },
    data: updateData,
  });

  // If status changed, also update enrollment status so dashboard stats stay in sync
  if (status && (status === "active" || status === "inactive")) {
    await prisma.enrollment.updateMany({
      where: { studentId: id, tenantId, isDeleted: false },
      data: { status },
    });
  }

  return student;
};

// ============================================
// SOFT DELETE STUDENT
// ============================================
export const softDeleteStudent = async (id: string, tenantId: string) => {
  return prisma.student.updateMany({
    where: { id, tenantId },
    data: { isDeleted: true, deletedAt: new Date(), status: "inactive" },
  });
};

// ============================================
// RESTORE STUDENT
// ============================================
export const restoreStudent = async (id: string, tenantId: string) => {
  return prisma.student.updateMany({
    where: { id, tenantId, isDeleted: true },
    data: { isDeleted: false, deletedAt: null, status: "active" },
  });
};

// ============================================
// GET DELETED STUDENTS (Recycle Bin)
// ============================================
export const getDeletedStudents = async (tenantId: string) => {
  return prisma.student.findMany({
    where: { tenantId, isDeleted: true },
    include: {
      enrollments: {
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
          academicYear: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { deletedAt: "desc" },
  });
};

// ============================================
// GET STUDENT STATS
// 🚀 CACHED (20s TTL) — the /students page hits this on every open,
// caching makes repeat clicks/navigation feel instant.
// ============================================
export const getStudentStats = async (tenantId: string, academicYearId?: string) => {
  return cached(`student-stats:${tenantId}:${academicYearId || "all"}`, 20000, async () => {
    if (academicYearId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { tenantId, academicYearId, isDeleted: false },
        include: { student: { select: { gender: true, createdAt: true, status: true } } },
      });

      const total = enrollments.length;
      const getStatus = (e: any) => e.student.status || e.status;
      const active = enrollments.filter((e) => ACTIVE_STATUSES.includes(getStatus(e))).length;
      const inactive = enrollments.filter((e) => !ACTIVE_STATUSES.includes(getStatus(e))).length;
      const left = enrollments.filter((e) => getStatus(e) === "left" || e.status === "left").length;
      const boys = enrollments.filter((e) => e.student.gender === "MALE" && ACTIVE_STATUSES.includes(getStatus(e))).length;
      const girls = enrollments.filter((e) => e.student.gender === "FEMALE" && ACTIVE_STATUSES.includes(getStatus(e))).length;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const newAdmissions = enrollments.filter((e) => new Date(e.student.createdAt) >= monthStart).length;

      return { total, active, inactive, left, boys, girls, newAdmissions, totalStudents: total };
    }

    const baseWhere: any = { tenantId, isDeleted: false };

    const [total, active, inactive, left, boys, girls] = await Promise.all([
      prisma.student.count({ where: baseWhere }),
      prisma.student.count({ where: { ...baseWhere, status: { in: [...ACTIVE_STATUSES] } } }),
      prisma.student.count({ where: { ...baseWhere, status: { notIn: [...ACTIVE_STATUSES] } } }),
      prisma.student.count({ where: { ...baseWhere, status: "left" } }),
      prisma.student.count({ where: { ...baseWhere, gender: "MALE" } }),
      prisma.student.count({ where: { ...baseWhere, gender: "FEMALE" } }),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newAdmissions = await prisma.student.count({
      where: { ...baseWhere, createdAt: { gte: monthStart } },
    });

    return { total, active, inactive, left, boys, girls, newAdmissions, totalStudents: total };
  });
};

// ============================================
// CREATE ENROLLMENT FOR EXISTING STUDENT
// ============================================
export const createEnrollmentForStudent = async (
  studentId: string,
  data: { classId: string; sectionId: string; academicYearId: string; rollNumber?: string },
  tenantId: string
) => {
  const existing = await prisma.enrollment.findFirst({
    where: { studentId, academicYearId: data.academicYearId, isDeleted: false },
  });

  if (existing) {
    throw new Error("Student already has enrollment for this academic year");
  }

  return prisma.enrollment.create({
    data: {
      student: { connect: { id: studentId } },
      class: { connect: { id: data.classId } },
      section: { connect: { id: data.sectionId } },
      academicYear: { connect: { id: data.academicYearId } },
      tenant: { connect: { id: tenantId } },
      rollNumber: data.rollNumber || null,
      status: "active",
    },
  });
};

// ============================================
// BULK CREATE ENROLLMENT
// ============================================
export const bulkCreateEnrollments = async (
  students: { studentId: string; rollNumber?: string }[],
  classId: string,
  sectionId: string,
  academicYearId: string,
  tenantId: string
) => {
  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const s of students) {
    try {
      const existing = await prisma.enrollment.findFirst({
        where: { studentId: s.studentId, academicYearId, isDeleted: false },
      });

      if (existing) { results.skipped++; continue; }

      await prisma.enrollment.create({
        data: {
          student: { connect: { id: s.studentId } },
          class: { connect: { id: classId } },
          section: { connect: { id: sectionId } },
          academicYear: { connect: { id: academicYearId } },
          tenant: { connect: { id: tenantId } },
          rollNumber: s.rollNumber || null,
          status: "active",
        },
      });
      results.created++;
    } catch (err: any) {
      results.errors.push(`${s.studentId}: ${err.message}`);
    }
  }

  return results;
};
