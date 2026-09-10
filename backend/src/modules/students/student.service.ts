import prisma from "../../utils/prisma";
import { generateSrNumber, generateAdmissionNumber, syncAdmissionCounter } from "./admission-number.service";
import { cached } from "../../utils/cache";

const ACTIVE_STATUSES = ["active", "pending", "verified"] as const;

type StudentFilters = {
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
};

export const createStudent = async (data: any, tenantId: string, userId: string) => {
  const { firstName, lastName, gender, dob, email, phone, address, admissionNo, bloodGroup, aadharNo, fatherName, fatherPhone, fatherOccupation, motherName, motherPhone, motherOccupation, guardianName, guardianPhone, guardianRelation, photoUrl, classId, sectionId, academicYearId, rollNumber, religionId, casteId, categoryId, nationalityId } = data;

  let finalAdmissionNo = admissionNo;
  if (!finalAdmissionNo) {
    try {
      finalAdmissionNo = await generateAdmissionNumber(tenantId, academicYearId);
    } catch {
      await syncAdmissionCounter(tenantId, academicYearId);
      finalAdmissionNo = await generateAdmissionNumber(tenantId, academicYearId);
    }
  }

  const srNo = await generateSrNumber(tenantId, finalAdmissionNo);
  const genderValue = (() => {
    const value = String(gender || "MALE").toUpperCase();
    return value === "MALE" || value === "M" ? "MALE" : value === "FEMALE" || value === "F" ? "FEMALE" : "OTHER";
  })();
  const bloodMap: Record<string, string> = { "A+": "A_POSITIVE", "A-": "A_NEGATIVE", "B+": "B_POSITIVE", "B-": "B_NEGATIVE", "O+": "O_POSITIVE", "O-": "O_NEGATIVE", "AB+": "AB_POSITIVE", "AB-": "AB_NEGATIVE" };

  const student = await prisma.student.create({
    data: {
      firstName,
      lastName,
      fullName: `${firstName || ""} ${lastName || ""}`.trim(),
      gender: genderValue as any,
      dob: new Date(dob),
      email: email || null,
      phone: phone || null,
      address: address || "N/A",
      admissionNo: finalAdmissionNo,
      srNo,
      bloodGroup: (bloodGroup ? bloodMap[bloodGroup] || bloodGroup : null) as any,
      religionId: religionId || null,
      casteId: casteId || null,
      categoryId: categoryId || null,
      nationalityId: nationalityId || null,
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

  let enrollment = null;
  if (classId && sectionId) {
    enrollment = await prisma.enrollment.create({
      data: {
        student: { connect: { id: student.id } },
        class: { connect: { id: classId } },
        section: { connect: { id: sectionId } },
        academicYear: { connect: { id: academicYearId } },
        tenant: { connect: { id: tenantId } },
        rollNumber: rollNumber || null,
        status: "active",
      },
    });
  }

  prisma.studentHistory.create({
    data: {
      studentId: student.id,
      tenantId,
      action: "ADMISSION",
      details: JSON.stringify({ admissionNo: finalAdmissionNo, classId, sectionId, academicYearId, rollNumber: rollNumber || null }),
      toClassId: classId || null,
      toSectionId: sectionId || null,
      academicYearId,
      performedBy: userId || "system",
    },
  }).catch(() => {});

  return { student, enrollment };
};

export const getAllStudents = async (tenantId: string, filters: StudentFilters) => {
  const { classId, sectionId, academicYearId, status, admissionStatus, search, gender, dateFrom, dateTo, page = 1, limit = 50 } = filters;
  const safePage = Math.max(1, Number.isFinite(page) ? page : 1);
  const safeLimit = Math.min(1000, Math.max(1, Number.isFinite(limit) ? limit : 50));

  const where: any = { isDeleted: false };
  if (tenantId) where.tenantId = tenantId;
  if (status) where.status = status;
  if (admissionStatus) where.status = admissionStatus;
  if (gender) {
    const g = gender.toUpperCase();
    where.gender = g === "MALE" || g === "M" ? "MALE" : g === "FEMALE" || g === "F" ? "FEMALE" : "OTHER";
  }
  if (dateFrom || dateTo) {
    where.admissionDate = {};
    if (dateFrom) where.admissionDate.gte = new Date(dateFrom);
    if (dateTo) where.admissionDate.lte = new Date(dateTo);
  }
  if (search?.trim()) {
    const q = search.trim();
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { fullName: { contains: q, mode: "insensitive" } },
      { admissionNo: { contains: q, mode: "insensitive" } },
      { srNo: { contains: q, mode: "insensitive" } },
      { fatherName: { contains: q, mode: "insensitive" } },
      { fatherPhone: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      {
        enrollments: {
          some: {
            isDeleted: false,
            rollNumber: { contains: q, mode: "insensitive" },
          },
        },
      },
    ];
  }

  if (academicYearId || classId || sectionId) {
    const enrollmentFilter: any = { status: "active", isDeleted: false };
    if (academicYearId) enrollmentFilter.academicYearId = academicYearId;
    if (classId) enrollmentFilter.classId = classId;
    if (sectionId) enrollmentFilter.sectionId = sectionId;
    where.enrollments = { some: enrollmentFilter };
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        admissionNo: true,
        srNo: true,
        gender: true,
        dob: true,
        status: true,
        email: true,
        phone: true,
        fatherName: true,
        fatherPhone: true,
        photoUrl: true,
        categoryId: true,
        admissionDate: true,
        createdAt: true,
        enrollments: {
          where: { status: "active", isDeleted: false, ...(academicYearId ? { academicYearId } : {}) },
          select: {
            rollNumber: true,
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            academicYear: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.student.count({ where }),
  ]);

  const normalizedStudents = students.map((student: any) => ({
    ...student,
    rollNumber: student.enrollments?.[0]?.rollNumber ?? null,
  }));

  return { students: normalizedStudents, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
};

export const getStudentById = async (id: string, tenantId: string) => prisma.student.findFirst({
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

export const updateStudent = async (id: string, data: any, tenantId: string) => {
  const updateData: any = {};
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.firstName !== undefined || data.lastName !== undefined) updateData.fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
  if (data.gender !== undefined) {
    const g = String(data.gender).toUpperCase();
    updateData.gender = g === "MALE" || g === "M" ? "MALE" : g === "FEMALE" || g === "F" ? "FEMALE" : "OTHER";
  }
  if (data.dob) updateData.dob = new Date(data.dob);
  for (const field of ["email", "phone", "address", "aadharNo", "fatherName", "motherName", "fatherPhone", "motherPhone", "fatherOccupation", "motherOccupation", "guardianName", "guardianPhone", "guardianRelation", "photoUrl"]) {
    if (data[field] !== undefined) updateData[field] = data[field] || null;
  }
  if (data.bloodGroup !== undefined) {
    const bgMap: Record<string, string> = { "A+": "A_POSITIVE", "A-": "A_NEGATIVE", "B+": "B_POSITIVE", "B-": "B_NEGATIVE", "O+": "O_POSITIVE", "O-": "O_NEGATIVE", "AB+": "AB_POSITIVE", "AB-": "AB_NEGATIVE" };
    updateData.bloodGroup = data.bloodGroup ? bgMap[data.bloodGroup] || data.bloodGroup : null;
  }
  if (data.status) updateData.status = data.status;
  if (data.religionId !== undefined) updateData.religionId = data.religionId || null;
  if (data.casteId !== undefined) updateData.casteId = data.casteId || null;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
  if (data.nationalityId !== undefined) updateData.nationalityId = data.nationalityId || null;

  const result = await prisma.student.updateMany({ where: { id, tenantId, isDeleted: false }, data: updateData });

  if (data.rollNumber !== undefined) {
    const enrollmentWhere: any = { studentId: id, tenantId, isDeleted: false };
    if (data.academicYearId) enrollmentWhere.academicYearId = data.academicYearId;
    else enrollmentWhere.status = "active";
    await prisma.enrollment.updateMany({ where: enrollmentWhere, data: { rollNumber: data.rollNumber || null } });
  }
  if (data.status && ["active", "inactive"].includes(data.status)) {
    await prisma.enrollment.updateMany({ where: { studentId: id, tenantId, isDeleted: false }, data: { status: data.status } });
  }
  return result;
};

export const softDeleteStudent = async (id: string, tenantId: string) => prisma.student.updateMany({ where: { id, tenantId }, data: { isDeleted: true, deletedAt: new Date(), status: "inactive" } });
export const restoreStudent = async (id: string, tenantId: string) => prisma.student.updateMany({ where: { id, tenantId, isDeleted: true }, data: { isDeleted: false, deletedAt: null, status: "active" } });
export const getDeletedStudents = async (tenantId: string) => prisma.student.findMany({ where: { tenantId, isDeleted: true }, include: { enrollments: { include: { class: { select: { name: true } }, section: { select: { name: true } }, academicYear: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { deletedAt: "desc" } });

export const getStudentStats = async (tenantId: string, academicYearId?: string) => cached(`student-stats:${tenantId}:${academicYearId || "all"}`, 20000, async () => {
  if (academicYearId) {
    const enrollments = await prisma.enrollment.findMany({ where: { tenantId, academicYearId, isDeleted: false }, include: { student: { select: { gender: true, createdAt: true, status: true } } } });
    const getStatus = (e: any) => e.student.status || e.status;
    const total = enrollments.length;
    const active = enrollments.filter(e => ACTIVE_STATUSES.includes(getStatus(e))).length;
    const inactive = total - active;
    const left = enrollments.filter(e => getStatus(e) === "left" || e.status === "left").length;
    const boys = enrollments.filter(e => e.student.gender === "MALE" && ACTIVE_STATUSES.includes(getStatus(e))).length;
    const girls = enrollments.filter(e => e.student.gender === "FEMALE" && ACTIVE_STATUSES.includes(getStatus(e))).length;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newAdmissions = enrollments.filter(e => new Date(e.student.createdAt) >= monthStart).length;
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
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const newAdmissions = await prisma.student.count({ where: { ...baseWhere, createdAt: { gte: monthStart } } });
  return { total, active, inactive, left, boys, girls, newAdmissions, totalStudents: total };
});

export const createEnrollmentForStudent = async (studentId: string, data: { classId: string; sectionId: string; academicYearId: string; rollNumber?: string }, tenantId: string) => {
  const existing = await prisma.enrollment.findFirst({ where: { studentId, academicYearId: data.academicYearId, isDeleted: false } });
  if (existing) throw new Error("Student already has enrollment for this academic year");
  return prisma.enrollment.create({ data: { student: { connect: { id: studentId } }, class: { connect: { id: data.classId } }, section: { connect: { id: data.sectionId } }, academicYear: { connect: { id: data.academicYearId } }, tenant: { connect: { id: tenantId } }, rollNumber: data.rollNumber || null, status: "active" } });
};

export const bulkCreateEnrollments = async (students: { studentId: string; rollNumber?: string }[], classId: string, sectionId: string, academicYearId: string, tenantId: string) => {
  const results = { created: 0, skipped: 0, errors: [] as string[] };
  for (const student of students) {
    try {
      const existing = await prisma.enrollment.findFirst({ where: { studentId: student.studentId, academicYearId, isDeleted: false } });
      if (existing) { results.skipped++; continue; }
      await prisma.enrollment.create({ data: { student: { connect: { id: student.studentId } }, class: { connect: { id: classId } }, section: { connect: { id: sectionId } }, academicYear: { connect: { id: academicYearId } }, tenant: { connect: { id: tenantId } }, rollNumber: student.rollNumber || null, status: "active" } });
      results.created++;
    } catch (err: any) {
      results.errors.push(`${student.studentId}: ${err.message}`);
    }
  }
  return results;
};