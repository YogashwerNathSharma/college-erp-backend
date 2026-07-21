// ══════════════════════════════════════════════════════════════════════════════
// STUDENT DUPLICATE SERVICE — Detection, Merge, Clone
// ══════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// CHECK DUPLICATE (pre-admission check)
// ============================================
export const checkDuplicate = async (
  tenantId: string,
  params: { aadharNo?: string; phone?: string; email?: string; admissionNo?: string; name?: string }
) => {
  const { aadharNo, phone, email, admissionNo, name } = params;
  const duplicates: Array<{ field: string; matchType: string; student: any }> = [];

  // Exact match checks
  if (aadharNo && aadharNo.length === 12) {
    const found = await prisma.student.findFirst({
      where: { tenantId, aadharNo, isDeleted: false },
      select: { id: true, fullName: true, firstName: true, lastName: true, admissionNo: true, status: true, photoUrl: true },
    });
    if (found) duplicates.push({ field: "aadharNo", matchType: "exact", student: found });
  }

  if (phone && phone.length >= 10) {
    const found = await prisma.student.findMany({
      where: {
        tenantId,
        isDeleted: false,
        OR: [
          { phone: { contains: phone } },
          { fatherPhone: { contains: phone } },
          { motherPhone: { contains: phone } },
        ],
      },
      select: { id: true, fullName: true, firstName: true, lastName: true, admissionNo: true, status: true, phone: true, fatherPhone: true },
      take: 5,
    });
    found.forEach((s) => duplicates.push({ field: "phone", matchType: "contains", student: s }));
  }

  if (email) {
    const found = await prisma.student.findFirst({
      where: { tenantId, email: { equals: email, mode: "insensitive" }, isDeleted: false },
      select: { id: true, fullName: true, firstName: true, lastName: true, admissionNo: true, status: true },
    });
    if (found) duplicates.push({ field: "email", matchType: "exact", student: found });
  }

  if (admissionNo) {
    const found = await prisma.student.findFirst({
      where: { tenantId, admissionNo },
      select: { id: true, fullName: true, firstName: true, lastName: true, admissionNo: true, status: true },
    });
    if (found) duplicates.push({ field: "admissionNo", matchType: "exact", student: found });
  }

  // Fuzzy name match
  if (name && name.length > 3) {
    const nameWords = name.split(" ").filter((w) => w.length > 2);
    if (nameWords.length > 0) {
      const found = await prisma.student.findMany({
        where: {
          tenantId,
          isDeleted: false,
          OR: nameWords.map((word) => ({
            OR: [
              { firstName: { contains: word, mode: "insensitive" as any } },
              { lastName: { contains: word, mode: "insensitive" as any } },
            ],
          })),
        },
        select: { id: true, fullName: true, firstName: true, lastName: true, admissionNo: true, status: true, dob: true, fatherName: true },
        take: 10,
      });
      found.forEach((s) => duplicates.push({ field: "name", matchType: "fuzzy", student: s }));
    }
  }

  // Deduplicate results by student ID
  const uniqueDuplicates = Array.from(
    new Map(duplicates.map((d) => [d.student.id, d])).values()
  );

  return {
    hasDuplicates: uniqueDuplicates.length > 0,
    count: uniqueDuplicates.length,
    duplicates: uniqueDuplicates,
  };
};

// ============================================
// FIND POTENTIAL DUPLICATES FOR EXISTING STUDENT
// ============================================
export const findPotentialDuplicates = async (tenantId: string, studentId: string) => {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    select: {
      firstName: true, lastName: true, fatherName: true,
      phone: true, fatherPhone: true, aadharNo: true, email: true, dob: true,
    },
  });

  if (!student) throw new Error("Student not found");

  const conditions: any[] = [];

  // Same father name + similar DOB
  if (student.fatherName && student.dob) {
    conditions.push({
      fatherName: { contains: student.fatherName, mode: "insensitive" },
      dob: student.dob,
    });
  }

  // Same phone
  if (student.phone) {
    conditions.push({ phone: student.phone });
  }
  if (student.fatherPhone) {
    conditions.push({ fatherPhone: student.fatherPhone });
  }

  // Same Aadhaar
  if (student.aadharNo) {
    conditions.push({ aadharNo: student.aadharNo });
  }

  if (conditions.length === 0) return [];

  const potentialDuplicates = await prisma.student.findMany({
    where: {
      tenantId,
      isDeleted: false,
      id: { not: studentId },
      OR: conditions,
    },
    select: {
      id: true, firstName: true, lastName: true, fullName: true,
      admissionNo: true, fatherName: true, phone: true, fatherPhone: true,
      aadharNo: true, dob: true, status: true, photoUrl: true,
      enrollments: {
        where: { status: "active", isDeleted: false },
        select: { class: { select: { name: true } } },
        take: 1,
      },
    },
    take: 20,
  });

  return potentialDuplicates.map((dup) => ({
    ...dup,
    class: dup.enrollments?.[0]?.class?.name || "N/A",
    matchReasons: getMatchReasons(student, dup),
  }));
};

// ============================================
// MERGE STUDENTS
// ============================================
export const mergeStudents = async (
  tenantId: string,
  primaryId: string,
  duplicateId: string,
  mergeConfig: {
    fieldsFromDuplicate: string[];  // fields to take from duplicate
  },
  userId: string
) => {
  if (primaryId === duplicateId) throw new Error("Cannot merge a student with itself");

  const [primary, duplicate] = await Promise.all([
    prisma.student.findFirst({ where: { id: primaryId, tenantId, isDeleted: false } }),
    prisma.student.findFirst({ where: { id: duplicateId, tenantId, isDeleted: false } }),
  ]);

  if (!primary) throw new Error("Primary student not found");
  if (!duplicate) throw new Error("Duplicate student not found");

  const mergeData: Record<string, any> = {};
  for (const field of mergeConfig.fieldsFromDuplicate) {
    const value = (duplicate as any)[field];
    if (value !== null && value !== undefined && value !== "") {
      mergeData[field] = value;
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update primary with merged fields
    if (Object.keys(mergeData).length > 0) {
      await tx.student.update({
        where: { id: primaryId },
        data: { ...mergeData, updatedBy: userId },
      });
    }

    // 2. Transfer all related records from duplicate to primary
    await tx.enrollment.updateMany({
      where: { studentId: duplicateId, tenantId },
      data: { studentId: primaryId },
    });

    await tx.studentDocument.updateMany({
      where: { studentId: duplicateId, tenantId },
      data: { studentId: primaryId },
    });

    await tx.studentAchievement.updateMany({
      where: { studentId: duplicateId, tenantId },
      data: { studentId: primaryId },
    });

    await tx.studentDisciplinaryRecord.updateMany({
      where: { studentId: duplicateId, tenantId },
      data: { studentId: primaryId },
    });

    await tx.studentTimelineEntry.updateMany({
      where: { studentId: duplicateId, tenantId },
      data: { studentId: primaryId },
    });

    await tx.studentHistory.updateMany({
      where: { studentId: duplicateId, tenantId },
      data: { studentId: primaryId },
    });

    // Transfer attendance
    await tx.attendance.updateMany({
      where: { studentId: duplicateId, tenantId },
      data: { studentId: primaryId },
    });

    // 3. Soft-delete the duplicate
    await tx.student.update({
      where: { id: duplicateId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        status: "deleted",
        statusReason: `Merged into student ${primary.admissionNo} (ID: ${primaryId})`,
      },
    });

    // 4. Create audit trail
    await tx.studentHistory.create({
      data: {
        studentId: primaryId,
        tenantId,
        action: "MERGE",
        details: JSON.stringify({
          mergedFromId: duplicateId,
          mergedFromAdmNo: duplicate.admissionNo,
          mergedFields: mergeConfig.fieldsFromDuplicate,
          mergedData: mergeData,
        }),
        performedBy: userId,
        academicYearId: primary.academicYearId,
      },
    });

    // Timeline
    await tx.studentTimelineEntry.create({
      data: {
        studentId: primaryId,
        tenantId,
        type: "merge",
        title: `Merged with duplicate record (${duplicate.admissionNo})`,
        description: `Fields merged: ${mergeConfig.fieldsFromDuplicate.join(", ")}`,
        createdBy: userId,
      },
    });

    return { primaryId, duplicateId, mergedFields: Object.keys(mergeData) };
  });

  return {
    ...result,
    message: `Successfully merged. ${Object.keys(mergeData).length} fields updated from duplicate record.`,
  };
};

// ============================================
// CLONE STUDENT
// ============================================
export const cloneStudent = async (
  tenantId: string,
  studentId: string,
  overrides: Record<string, any>,
  userId: string
) => {
  const source = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
  });

  if (!source) throw new Error("Source student not found");

  // Fields that should NOT be cloned (unique identifiers)
  const excludeFields = [
    "id", "admissionNo", "srNo", "rollNumber", "aadharNo", "rfidCardNo",
    "qrCode", "biometricId", "registrationNo", "boardRegNo", "penNumber",
    "apaarId", "passportNo", "createdAt", "updatedAt", "deletedAt",
    "isDeleted", "status", "tenantId", "academicYearId",
  ];

  const cloneData: Record<string, any> = {};
  for (const [key, value] of Object.entries(source as any)) {
    if (!excludeFields.includes(key) && value !== null) {
      cloneData[key] = value;
    }
  }

  // Apply overrides
  Object.assign(cloneData, overrides);

  // Generate new admission number
  const { generateAdmissionNumber } = require("./admission-number.service");
  const newAdmNo = overrides.admissionNo || await generateAdmissionNumber(tenantId, source.academicYearId);

  const cloned = await prisma.student.create({
    data: {
      ...cloneData,
      admissionNo: newAdmNo,
      fullName: `${cloneData.firstName || source.firstName} ${cloneData.lastName || source.lastName}`,
      status: "active",
      isDeleted: false,
      admissionDate: new Date(),
      createdBy: userId,
      tenant: { connect: { id: tenantId } },
      academicYear: { connect: { id: source.academicYearId } },
    },
  });

  // Timeline for cloned student
  await prisma.studentTimelineEntry.create({
    data: {
      studentId: cloned.id,
      tenantId,
      type: "admission",
      title: "Student record created (cloned)",
      description: `Cloned from ${source.admissionNo}`,
      createdBy: userId,
    },
  });

  return {
    id: cloned.id,
    admissionNo: cloned.admissionNo,
    name: cloned.fullName,
    clonedFrom: source.admissionNo,
  };
};

// ============================================
// HELPERS
// ============================================

function getMatchReasons(source: any, candidate: any): string[] {
  const reasons: string[] = [];
  if (source.aadharNo && source.aadharNo === candidate.aadharNo) reasons.push("Same Aadhaar");
  if (source.phone && source.phone === candidate.phone) reasons.push("Same Phone");
  if (source.fatherPhone && source.fatherPhone === candidate.fatherPhone) reasons.push("Same Father Phone");
  if (source.fatherName && candidate.fatherName &&
    source.fatherName.toLowerCase() === candidate.fatherName.toLowerCase()) reasons.push("Same Father Name");
  if (source.dob && candidate.dob &&
    new Date(source.dob).toDateString() === new Date(candidate.dob).toDateString()) reasons.push("Same DOB");
  return reasons;
}
