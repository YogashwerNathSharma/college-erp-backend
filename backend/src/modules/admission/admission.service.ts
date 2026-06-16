import prisma from "../../utils/prisma";

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

  return await prisma.$transaction(async (tx) => {
    ////////////////////////////
    // 🔒 0. BASIC VALIDATION
    ////////////////////////////
    if (!classId || !sectionId || !academicYearId) {
      throw new Error("Required fields missing");
    }

    ////////////////////////////
    // 🔒 1. DUPLICATE CHECK
    ////////////////////////////
    const existing = await tx.student.findFirst({
      where: {
        tenantId,
        OR: [
          { email: student.email },
          { admissionNo: student.admissionNo },
        ],
      },
    });

    if (existing) {
      throw new Error("Student already exists");
    }

    ////////////////////////////
    // 🔒 2. CHECK CLASS
    ////////////////////////////
    const classExists = await tx.class.findUnique({
      where: { id: classId },
    });

    if (!classExists || classExists.tenantId !== tenantId) {
      throw new Error("Class not found");
    }

    ////////////////////////////
    // 🔒 3. CHECK SECTION
    ////////////////////////////
    const sectionExists = await tx.section.findUnique({
      where: { id: sectionId },
    });

    if (!sectionExists || sectionExists.tenantId !== tenantId) {
      throw new Error("Section not found");
    }

    ////////////////////////////
    // 🔒 4. CREATE STUDENT
    ////////////////////////////
    const newStudent = await tx.student.create({
      data: {
        ...student,
        dob: new Date(student.dob),
        tenantId,
        academicYearId,
      },
    });

    ////////////////////////////
    // 🔒 5. CREATE ENROLLMENT
    ////////////////////////////
    const enrollment = await tx.enrollment.create({
      data: {
        studentId: newStudent.id,
        classId,
        sectionId,
        academicYearId,
        tenantId,
      },
    });

    ////////////////////////////
    // 🔒 6. ASSIGN FEE
    ////////////////////////////
const fee = await tx.studentFee.create({
  data: {
    tenantId,

    enrollmentId: enrollment.id,
    feeStructureId,

    totalAmount: Number(feeAmount),
    netAmount: Number(feeAmount),

    paidAmount: 0,
    balanceAmount: Number(feeAmount),

    installmentNo: 1,

    status: "PENDING",
    dueDate: new Date(),
  },
});    ////////////////////////////
    // ✅ FINAL RESPONSE
    ////////////////////////////
    return {
      student: newStudent,
      enrollment,
      fee,
    };
  });
};