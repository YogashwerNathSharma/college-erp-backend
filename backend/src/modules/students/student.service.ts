import prisma from "../../utils/prisma";

/////////////////////////
// 🔥 STUDENT HISTORY
/////////////////////////
export const addStudentHistory = async (
  studentId: string,
  tenantId: string,
  action: string,
  message: string,
  userId: string
) => {
  return prisma.studentHistory.create({
    data: {
      studentId,
      tenantId,
      action,
      message,
      performedBy: userId,
    },
  });
};

/////////////////////////
// CREATE STUDENT
/////////////////////////
export const createStudentService = async (
  data: any,
  tenantId: string,
  userId: string
) => {
  const existing = await prisma.student.findFirst({
    where: {
      tenantId,
      OR: [
        ...(data.email ? [{ email: data.email }] : []),
        ...(data.admissionNo ? [{ admissionNo: data.admissionNo }] : []),
      ],
    },
  });

  if (existing) {
    throw new Error("Student already exists");
  }

  const student = await prisma.student.create({
    data: {
      ...data,
      dob: data.dob ? new Date(data.dob) : null,
      tenantId,
    },
  });

  await addStudentHistory(
    student.id,
    tenantId,
    "CREATED",
    "Student created",
    userId
  );

  return student;
};

/////////////////////////
// GET ALL STUDENTS
/////////////////////////
export const getStudentsService = async (
  tenantId: string,
  page: number,
  limit: number,
  classId?: string
) => {
  const activeYear = await prisma.academicYear.findFirst({
    where: {
      tenantId,
      isActive: true,
    },
  });

  if (!activeYear) {
    throw new Error("No active academic year");
  }

  const where: any = {
    tenantId,
    isDeleted: false,
  };

  if (classId) {
    where.enrollments = {
      some: {
        classId,
        academicYearId: activeYear.id,
      },
    };
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        enrollments: {
          where: {
            academicYearId: activeYear.id,
          },
          include: {
            class: true,
            section: true,
          },
        },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return {
    page,
    limit,
    total,
    data: students,
  };
};

/////////////////////////
// GET SINGLE STUDENT
/////////////////////////
export const getStudentByIdService = async (
  id: string,
  tenantId: string
) => {
  const student = await prisma.student.findFirst({
    where: {
      id,
      tenantId,
      isDeleted: false,
    },
    include: {
      enrollments: {
        include: {
          class: true,
          section: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  return student;
};

/////////////////////////
// UPDATE STUDENT
/////////////////////////
export const updateStudentService = async (
  id: string,
  data: any,
  tenantId: string,
  userId: string
) => {
  const existing = await prisma.student.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!existing) {
    throw new Error("Student not found");
  }

  if (data.email || data.admissionNo) {
    const duplicate = await prisma.student.findFirst({
      where: {
        tenantId,
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.admissionNo ? [{ admissionNo: data.admissionNo }] : []),
        ],
        NOT: { id },
      },
    });

    if (duplicate) {
      throw new Error("Duplicate email or admission number");
    }
  }

  const updated = await prisma.student.update({
    where: { id },
    data: {
      ...data,
      dob: data.dob ? new Date(data.dob) : undefined,
    },
  });

  await addStudentHistory(
    id,
    tenantId,
    "UPDATED",
    "Student updated",
    userId
  );

  return updated;
};

/////////////////////////
// DELETE (SOFT)
/////////////////////////
export const deleteStudentService = async (
  id: string,
  tenantId: string,
  userId: string
) => {
  const existing = await prisma.student.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!existing) {
    throw new Error("Student not found");
  }

  const deleted = await prisma.student.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  await addStudentHistory(
    id,
    tenantId,
    "DELETED",
    "Student moved to recycle bin",
    userId
  );

  return deleted;
};

/////////////////////////
// RESTORE STUDENT
/////////////////////////
export const restoreStudentService = async (
  id: string,
  tenantId: string,
  userId: string
) => {
  const existing = await prisma.student.findFirst({
    where: {
      id,
      tenantId,
      isDeleted: true,
    },
  });

  if (!existing) {
    throw new Error("Deleted student not found");
  }

  const restored = await prisma.student.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });

  await addStudentHistory(
    id,
    tenantId,
    "RESTORED",
    "Student restored",
    userId
  );

  return restored;
};

/////////////////////////
// GET DELETED STUDENTS
/////////////////////////
export const getDeletedStudentsService = async (
  tenantId: string,
  page: number,
  limit: number
) => {
  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where: {
        tenantId,
        isDeleted: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.student.count({
      where: {
        tenantId,
        isDeleted: true,
      },
    }),
  ]);

  return {
    page,
    limit,
    total,
    data: students,
  };
};

/////////////////////////
// BULK RESTORE
/////////////////////////
export const restoreManyStudentsService = async (
  ids: string[],
  tenantId: string,
  userId: string
) => {
  const result = await prisma.student.updateMany({
    where: {
      id: { in: ids },
      tenantId,
      isDeleted: true,
    },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });

  // 🔥 OPTIMIZED HISTORY
  await prisma.studentHistory.createMany({
    data: ids.map((id) => ({
      studentId: id,
      tenantId,
      action: "RESTORED",
      message: "Student restored (bulk)",
      performedBy: userId,
    })),
  });

  return result;
};

/////////////////////////
// TIMELINE
/////////////////////////
export const getStudentTimelineService = async (
  studentId: string,
  tenantId: string
) => {
  return prisma.studentHistory.findMany({
    where: {
      studentId,
      tenantId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/////////////////////////
// PROMOTE STUDENT
/////////////////////////
export const promoteStudentService = async (
  studentId: string,
  tenantId: string,
  newClassId: string,
  newSectionId: string,
  userId: string
) => {

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      tenantId,
      isDeleted: false,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const activeYear = await prisma.academicYear.findFirst({
    where: {
      tenantId,
      isActive: true,
    },
  });

  if (!activeYear) {
    throw new Error("No active academic year");
  }

  // 🔥 VALIDATION
  const classExists = await prisma.class.findFirst({
    where: { id: newClassId, tenantId },
  });

  if (!classExists) throw new Error("Class not found");

  const sectionExists = await prisma.section.findFirst({
    where: { id: newSectionId, tenantId },
  });

  if (!sectionExists) throw new Error("Section not found");

  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      academicYearId: activeYear.id,
      tenantId, // 🔥 FIX
    },
  });

  if (existingEnrollment) {
    throw new Error("Student already enrolled in this year");
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      classId: newClassId,
      sectionId: newSectionId,
      academicYearId: activeYear.id,
      tenantId,
    },
  });

  await prisma.studentHistory.create({
    data: {
      studentId,
      tenantId,
      action: "PROMOTED",
      message: "Student promoted to next class",
      performedBy: userId,
    },
  });

  return enrollment;
};