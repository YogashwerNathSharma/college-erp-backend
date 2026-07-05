import prisma from "../../utils/prisma";
import { generateAdmissionNumber, generateSrNumber } from "../students/admission-number.service";

export const createAdmission = async (body: any, user: any) => {
  const tenantId = user.tenantId;

  const {
    student,
    classId,
    sectionId,
    academicYearId,
    feeAmount,
    feeStructureId,
  } = body;

    ////////////////////////////
    // 🔐 0. PRE-VALIDATION
    ////////////////////////////
    if (!classId || !sectionId || !academicYearId) {
      throw new Error("Required fields missing: classId, sectionId, academicYearId");
    }

    if (!student || !student.firstName || !student.lastName || !student.dob || !student.fatherName || !student.fatherPhone) {
      throw new Error("Required student fields missing: firstName, lastName, dob, fatherName, fatherPhone");
    }

    ////////////////////////////
    // 🔐 1. GENERATE ADMISSION NUMBER & SR (outside transaction to avoid deadlock)
    ////////////////////////////
    const admissionNo = await generateAdmissionNumber(tenantId, academicYearId);
    const srNo = await generateSrNumber(tenantId, admissionNo);

  return await prisma.$transaction(async (tx) => {
    ////////////////////////////
    // 🔐 2. DUPLICATE CHECK
    ////////////////////////////
    const orConditions: any[] = [];
    if (student.email) {
      orConditions.push({ email: student.email });
    }

    if (orConditions.length > 0) {
      const existing = await tx.student.findFirst({
        where: {
          tenantId,
          isDeleted: false,
          OR: orConditions,
        },
      });

      if (existing) {
        throw new Error("Student already exists with same email");
      }
    }

    ////////////////////////////
    // 🔐 2. CHECK CLASS
    ////////////////////////////
    const classExists = await tx.class.findUnique({
      where: { id: classId },
    });

    if (!classExists || classExists.tenantId !== tenantId) {
      throw new Error("Class not found");
    }

    ////////////////////////////
    // 🔐 3. CHECK SECTION
    ////////////////////////////
    const sectionExists = await tx.section.findUnique({
      where: { id: sectionId },
    });

    if (!sectionExists || sectionExists.tenantId !== tenantId) {
      throw new Error("Section not found");
    }

    ////////////////////////////
    // 🔐 4. CHECK ACADEMIC YEAR
    ////////////////////////////
    const academicYear = await tx.academicYear.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYear || academicYear.tenantId !== tenantId) {
      throw new Error("Academic Year not found");
    }

    ////////////////////////////
    // 🔐 6. CREATE STUDENT
    ////////////////////////////
    const newStudent = await tx.student.create({
      data: {
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName} ${student.lastName}`,
        gender: student.gender || "MALE",
        dob: new Date(student.dob),
        email: student.email || undefined,
        phone: student.fatherPhone || undefined,
        address: student.address || "N/A",
        admissionNo,
        srNo,
        fatherName: student.fatherName,
        motherName: student.motherName || "N/A",
        fatherPhone: student.fatherPhone,
        motherPhone: student.motherPhone || undefined,
        tenantId,
        academicYearId,
      },
    });

    ////////////////////////////
    // 🔐 7. CREATE ENROLLMENT
    ////////////////////////////
    const enrollment = await tx.enrollment.create({
      data: {
        studentId: newStudent.id,
        classId,
        sectionId,
        academicYearId,
        tenantId,
        status: "active",
      },
    });

    ////////////////////////////
    // 🔐 8. ASSIGN FEE (only if feeStructure exists for this class)
    ////////////////////////////
    let fee = null;

    // Find fee structure for this class + academic year (if not provided)
    let resolvedFeeStructureId = feeStructureId;
    if (!resolvedFeeStructureId) {
      const feeStructure = await tx.feeStructure.findFirst({
        where: {
          tenantId,
          classId,
          academicYearId,
          isActive: true,
          isDeleted: false,
        },
      });
      if (feeStructure) {
        resolvedFeeStructureId = feeStructure.id;
      }
    }

    // Only create fee if we have a valid fee structure
    if (resolvedFeeStructureId) {
      const feeStructure = await tx.feeStructure.findUnique({
        where: { id: resolvedFeeStructureId },
      });

      if (feeStructure) {
        const amount = Number(feeAmount) || feeStructure.totalAmount || 0;

        fee = await tx.studentFee.create({
          data: {
            tenantId,
            enrollmentId: enrollment.id,
            feeStructureId: resolvedFeeStructureId,
            totalAmount: amount,
            discountAmount: 0,
            fineAmount: 0,
            netAmount: amount,
            paidAmount: 0,
            balanceAmount: amount,
            installmentNo: 1,
            status: "PENDING",
            dueDate: new Date(),
          },
        });
      }
    }

    ////////////////////////////
    // ✅ FINAL RESPONSE
    ////////////////////////////
    return {
      student: newStudent,
      enrollment,
      fee,
      admissionNo,
    };
  });
};
