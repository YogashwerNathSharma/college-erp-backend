
import prisma from "../../utils/prisma";
import { generateSrNumber, generateAdmissionNumber } from "./admission-number.service";

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
  } = data;

  // Auto-generate admission number if not provided
  let finalAdmissionNo = admissionNo;
  if (!finalAdmissionNo) {
    finalAdmissionNo = await generateAdmissionNumber(tenantId, academicYearId);
  }

  const srNo = await generateSrNumber(tenantId, finalAdmissionNo);

  // 1. Create Student (no transaction — avoids MongoDB replica set timeout)
  const student = await prisma.student.create({
    data: {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      gender,
      dob: new Date(dob),
      email: email || null,
      phone: phone || null,
      address: address || "N/A",
      admissionNo: finalAdmissionNo,
      srNo,
      bloodGroup: bloodGroup || null,
      religion: religion || null,
      caste: caste || null,
      category: category || null,
      nationality: nationality || "Indian",
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
      status: "active",
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
  const student = await prisma.student.updateMany({
    where: { id, tenantId, isDeleted: false },
    data: {
      ...data,
      dob: data.dob ? new Date(data.dob) : undefined,
    },
  });

  // If status changed, also update enrollment status so dashboard stats stay in sync
  if (data.status && (data.status === "active" || data.status === "inactive")) {
    await prisma.enrollment.updateMany({
      where: {
        studentId: id,
        tenantId,
        isDeleted: false,
      },
      data: { status: data.status },
    });
  }

  return student;
};

// ============================================
// SOFT DELETE STUDENT
// ============================================
export const softDeleteStudent = async (id: string, tenantId: string) => {
  const student = await prisma.student.updateMany({
    where: { id, tenantId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      status: "inactive",
    },
  });
  return student;
};

// ============================================
// RESTORE STUDENT
// ============================================
export const restoreStudent = async (id: string, tenantId: string) => {
  const student = await prisma.student.updateMany({
    where: { id, tenantId, isDeleted: true },
    data: {
      isDeleted: false,
      deletedAt: null,
      status: "active",
    },
  });
  return student;
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
// ============================================
export const getStudentStats = async (tenantId: string, academicYearId?: string) => {
  // If academicYearId is provided, count students via enrollments (handles promotions correctly)
  if (academicYearId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { tenantId, academicYearId, isDeleted: false },
      include: { student: { select: { gender: true, createdAt: true, status: true } } },
    });

    const total = enrollments.length;
    // Use student.status as source of truth (toggle updates student.status)
    // Fallback to enrollment.status for backward compatibility
    const getStatus = (e: any) => e.student.status || e.status;
    const active = enrollments.filter((e) => getStatus(e) === "active").length;
    const inactive = enrollments.filter((e) => getStatus(e) === "inactive").length;
    const left = enrollments.filter((e) => getStatus(e) === "left" || e.status === "left").length;
    const boys = enrollments.filter((e) => ["Male", "male", "M", "MALE"].includes(e.student.gender) && getStatus(e) === "active").length;
    const girls = enrollments.filter((e) => ["Female", "female", "F", "FEMALE"].includes(e.student.gender) && getStatus(e) === "active").length;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newAdmissions = enrollments.filter((e) => new Date(e.student.createdAt) >= monthStart).length;

    return { total, active, inactive, left, boys, girls, newAdmissions, totalStudents: total };
  }

  // Fallback: no academicYearId — count all students directly
  const baseWhere: any = { tenantId, isDeleted: false };

  const [total, active, inactive, left, boys, girls] = await Promise.all([
    prisma.student.count({ where: baseWhere }),
    prisma.student.count({ where: { ...baseWhere, status: "active" } }),
    prisma.student.count({ where: { ...baseWhere, status: "inactive" } }),
    prisma.student.count({ where: { ...baseWhere, status: "left" } }),
    prisma.student.count({ where: { ...baseWhere, gender: { in: ["Male", "male", "M", "MALE"] } } }),
    prisma.student.count({ where: { ...baseWhere, gender: { in: ["Female", "female", "F", "FEMALE"] } } }),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newAdmissions = await prisma.student.count({
    where: { ...baseWhere, createdAt: { gte: monthStart } },
  });

  return { total, active, inactive, left, boys, girls, newAdmissions, totalStudents: total };
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
    where: {
      studentId,
      academicYearId: data.academicYearId,
      isDeleted: false,
    },
  });

  if (existing) {
    throw new Error("Student already has enrollment for this academic year");
  }

  const enrollment = await prisma.enrollment.create({
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

  return enrollment;
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
        where: {
          studentId: s.studentId,
          academicYearId,
          isDeleted: false,
        },
      });

      if (existing) {
        results.skipped++;
        continue;
      }

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
