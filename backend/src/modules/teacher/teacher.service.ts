import { getPagination } from "../../utils/pagination";
import prisma from "../../utils/prisma";
import { buildPaginationMeta } from "../../utils/pagination";

export const createTeacher = async (data: any, tenantId: string) => {

  //////////////////////////
  // 🔒 DUPLICATE CHECK (tenant-safe)
  //////////////////////////
  const existing = await prisma.teacher.findFirst({
    where: {
      email: data.email,
      tenantId,
    },
  });

  if (existing) {
    throw new Error("Teacher already exists");
  }

  //////////////////////////
  // 🔒 VALIDATE ACADEMIC YEAR
  //////////////////////////
  if (data.academicYearId) {
    const year = await prisma.academicYear.findFirst({
      where: {
        id: data.academicYearId,
        tenantId,
      },
    });

    if (!year) {
      throw new Error("Invalid academic year");
    }
  }

  //////////////////////////
  // 🔒 VALIDATE SUBJECTS
  //////////////////////////
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

  //////////////////////////
  // 🔒 VALIDATE CLASSES
  //////////////////////////
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

  //////////////////////////
  // 🚀 TRANSACTION (important)
  //////////////////////////
  return await prisma.$transaction(async (tx) => {

    const teacher = await tx.teacher.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        tenantId,
        academicYearId: data.academicYearId,
      },
    });

    //////////////////////////
    // SUBJECTS
    //////////////////////////
    if (data.subjectIds?.length) {
      await tx.teacherSubject.createMany({
        data: data.subjectIds.map((id: string) => ({
          teacherId: teacher.id,
          subjectId: id,
        })),
      });
    }

    //////////////////////////
    // CLASSES
    //////////////////////////
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
// GET TEACHERS
//////////////////////////////////////////////////////
export const getTeachers = async (query: any, tenantId: string) => {
  const { skip, limit, page } = getPagination(query);

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where: { tenantId },
      include: {
        subjects: {
          include: { subject: true },
        },
        classes: {
          include: { class: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),

    prisma.teacher.count({
      where: { tenantId },
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