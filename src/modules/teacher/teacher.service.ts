import { getPagination } from "../../utils/pagination";
import prisma from "../../utils/prisma";
import { buildPaginationMeta } from "../../utils/pagination";
export const createTeacher = async (data: any, tenantId: string) => {
  // ✅ check existing
  const existing = await prisma.teacher.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("Teacher already exists");
  }

  // ✅ create teacher
  const teacher = await prisma.teacher.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      tenantId,
      academicYearId: data.academicYearId,
    },
  });

  // ✅ subjects
  if (data.subjectIds?.length) {
    await prisma.teacherSubject.createMany({
      data: data.subjectIds.map((id: string) => ({
        teacherId: teacher.id,
        subjectId: id,
      })),
    });
  }

  // ✅ classes
  if (data.classIds?.length) {
    await prisma.teacherClass.createMany({
      data: data.classIds.map((id: string) => ({
        teacherId: teacher.id,
        classId: id,
      })),
    });
  }

  return teacher;
};

export const getTeachers = async (query: any, tenantId: string) => {
  const { skip, limit, page } = getPagination(query);

  // 🔥 parallel queries (fast)
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
      take: limit, // ✅ pagination apply
    }),

    prisma.teacher.count({
      where: { tenantId },
    }),
  ]);

  // ✅ clean response
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