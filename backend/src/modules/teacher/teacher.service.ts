
import { getPagination } from "../../utils/pagination";
import prisma from "../../utils/prisma";
import { buildPaginationMeta } from "../../utils/pagination";

//////////////////////////////////////////////////////
// CREATE TEACHER
//////////////////////////////////////////////////////
export const createTeacher = async (data: any, tenantId: string) => {
  // 🔐 DUPLICATE CHECK (tenant-safe)
  const existing = await prisma.teacher.findFirst({
    where: {
      email: data.email,
      tenantId,
      isDeleted: false,
    },
  });

  if (existing) {
    throw new Error("Teacher already exists with this email");
  }

  // 🔐 VALIDATE ACADEMIC YEAR
  if (!data.academicYearId) {
    throw new Error("Academic year is required");
  }

  const year = await prisma.academicYear.findFirst({
    where: {
      id: data.academicYearId,
      tenantId,
    },
  });

  if (!year) {
    throw new Error("Invalid academic year");
  }

  // 🔐 VALIDATE SUBJECTS
  if (data.subjectIds?.length) {
    const subjects = await prisma.subject.findMany({
      where: {
        id: { in: data.subjectIds },
        tenantId,
      },
    });

    if (subjects.length !== data.subjectIds.length) {
      throw new Error("Invalid subject(s)");
    }
  }

  // 🔐 VALIDATE CLASSES
  if (data.classIds?.length) {
    const classes = await prisma.class.findMany({
      where: {
        id: { in: data.classIds },
        tenantId,
      },
    });

    if (classes.length !== data.classIds.length) {
      throw new Error("Invalid class(es)");
    }
  }

  // 🚀 TRANSACTION
  return await prisma.$transaction(async (tx) => {
    const teacher = await tx.teacher.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        gender: data.gender || null,
        dob: data.dob ? new Date(data.dob) : null,
        employeeId: data.employeeId || null,
        maritalStatus: data.maritalStatus || null,
        photoUrl: data.photoUrl || null,
        tenantId,
        academicYearId: data.academicYearId,
      },
    });

    // SUBJECTS
    if (data.subjectIds?.length) {
      await tx.teacherSubject.createMany({
        data: data.subjectIds.map((id: string) => ({
          teacherId: teacher.id,
          subjectId: id,
        })),
      });
    }

    // CLASSES
    if (data.classIds?.length) {
      await tx.teacherClass.createMany({
        data: data.classIds.map((id: string) => ({
          teacherId: teacher.id,
          classId: id,
        })),
      });
    }

    return teacher;
  });
};

//////////////////////////////////////////////////////
// GET TEACHERS (with search + pagination)
//////////////////////////////////////////////////////
export const getTeachers = async (query: any, tenantId: string) => {
  const { skip, limit, page } = getPagination(query);

  const search = query.search?.trim() || "";

  const whereClause: any = {
    tenantId,
    isDeleted: false,
  };

  // Search filter
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { employeeId: { contains: search, mode: "insensitive" } },
    ];
  }

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where: whereClause,
      include: {
        subjects: {
          where: { isDeleted: false },
          include: { subject: true },
        },
        classes: {
          where: { isDeleted: false },
          include: { class: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),

    prisma.teacher.count({
      where: whereClause,
    }),
  ]);

  const data = teachers.map((t) => ({
    ...t,
    subjects: t.subjects.map((s) => s.subject),
    classes: t.classes.map((c) => c.class),
  }));

  return {
    data,
    meta: buildPaginationMeta(total, page, limit),
  };
};

//////////////////////////////////////////////////////
// GET TEACHER BY ID
//////////////////////////////////////////////////////
export const getTeacherById = async (id: string, tenantId: string) => {
  const teacher = await prisma.teacher.findFirst({
    where: {
      id,
      tenantId,
      isDeleted: false,
    },
    include: {
      subjects: {
        where: { isDeleted: false },
        include: { subject: true },
      },
      classes: {
        where: { isDeleted: false },
        include: { class: true },
      },
    },
  });

  if (!teacher) return null;

  return {
    ...teacher,
    subjects: teacher.subjects.map((s) => s.subject),
    classes: teacher.classes.map((c) => c.class),
  };
};

//////////////////////////////////////////////////////
// UPDATE TEACHER
//////////////////////////////////////////////////////
export const updateTeacher = async (
  id: string,
  data: any,
  tenantId: string
) => {
  // Check teacher exists
  const existing = await prisma.teacher.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!existing) {
    throw new Error("Teacher not found");
  }

  // Check email uniqueness (excluding self)
  if (data.email && data.email !== existing.email) {
    const emailExists = await prisma.teacher.findFirst({
      where: {
        email: data.email,
        tenantId,
        isDeleted: false,
        id: { not: id },
      },
    });

    if (emailExists) {
      throw new Error("Email already in use by another teacher");
    }
  }

  // Validate academic year
  if (data.academicYearId) {
    const year = await prisma.academicYear.findFirst({
      where: { id: data.academicYearId, tenantId },
    });
    if (!year) throw new Error("Invalid academic year");
  }

  // Validate subjects
  if (data.subjectIds?.length) {
    const subjects = await prisma.subject.findMany({
      where: { id: { in: data.subjectIds }, tenantId },
    });
    if (subjects.length !== data.subjectIds.length) {
      throw new Error("Invalid subject(s)");
    }
  }

  // Validate classes
  if (data.classIds?.length) {
    const classes = await prisma.class.findMany({
      where: { id: { in: data.classIds }, tenantId },
    });
    if (classes.length !== data.classIds.length) {
      throw new Error("Invalid class(es)");
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Update teacher basic info
    const teacher = await tx.teacher.update({
      where: { id },
      data: {
        firstName: data.firstName || existing.firstName,
        lastName: data.lastName || existing.lastName,
        name: data.firstName && data.lastName
          ? `${data.firstName} ${data.lastName}`
          : existing.name,
        email: data.email || existing.email,
        phone: data.phone || existing.phone,
        gender: data.gender !== undefined ? data.gender : existing.gender,
        dob: data.dob ? new Date(data.dob) : existing.dob,
        employeeId: data.employeeId !== undefined ? data.employeeId : existing.employeeId,
        maritalStatus: data.maritalStatus !== undefined ? data.maritalStatus : existing.maritalStatus,
        photoUrl: data.photoUrl !== undefined ? data.photoUrl : existing.photoUrl,
        academicYearId: data.academicYearId || existing.academicYearId,
      },
    });

    // ✅ Replace subjects (soft-delete old, create new)
    if (data.subjectIds !== undefined) {
      await tx.teacherSubject.updateMany({
        where: { teacherId: id, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date() },
      });

      if (data.subjectIds.length > 0) {
        await tx.teacherSubject.createMany({
          data: data.subjectIds.map((subId: string) => ({
            teacherId: id,
            subjectId: subId,
          })),
        });
      }
    }

    // ✅ Replace classes (soft-delete old, create new)
    if (data.classIds !== undefined) {
      await tx.teacherClass.updateMany({
        where: { teacherId: id, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date() },
      });

      if (data.classIds.length > 0) {
        await tx.teacherClass.createMany({
          data: data.classIds.map((clsId: string) => ({
            teacherId: id,
            classId: clsId,
          })),
        });
      }
    }

    return teacher;
  });
};

//////////////////////////////////////////////////////
// DELETE TEACHER (soft)
//////////////////////////////////////////////////////
export const deleteTeacher = async (id: string, tenantId: string) => {
  const existing = await prisma.teacher.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!existing) {
    throw new Error("Teacher not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.teacher.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await tx.teacherSubject.updateMany({
      where: { teacherId: id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await tx.teacherClass.updateMany({
      where: { teacherId: id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  });
};

