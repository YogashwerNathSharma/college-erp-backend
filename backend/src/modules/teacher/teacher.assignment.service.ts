import prisma from "../../utils/prisma";

export type TeacherAssignment = { classId: string; subjectId: string };

/** Dedicated, year-scoped subject assignment write path. */
export const saveTeacherAssignments = async (
  teacherId: string,
  tenantId: string,
  academicYearId: string,
  assignments: TeacherAssignment[]
) => {
  if (!academicYearId) throw new Error("Academic year is required");

  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, tenantId, isDeleted: false },
    select: { id: true },
  });
  if (!teacher) throw new Error("Teacher not found");

  const uniqueAssignments = Array.from(
    new Map(
      (assignments || [])
        .filter((a) => a?.classId && a?.subjectId)
        .map((a) => [
          `${a.classId}:${a.subjectId}`,
          { classId: String(a.classId), subjectId: String(a.subjectId) },
        ])
    ).values()
  );

  if (!uniqueAssignments.length) throw new Error("Please add at least one subject assignment");

  const subjectIds = [...new Set(uniqueAssignments.map((a) => a.subjectId))];
  const classIds = [...new Set(uniqueAssignments.map((a) => a.classId))];

  // Subject/Class in the active Prisma schema do not expose isDeleted;
  // academicYearId is the authoritative year boundary for these masters.
  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds }, tenantId, academicYearId },
    select: { id: true, classId: true },
  });
  if (subjects.length !== subjectIds.length) {
    throw new Error("One or more selected subjects do not belong to the selected academic year");
  }

  const subjectMap = new Map<string, { id: string; classId: string }>(
    subjects.map((s: { id: string; classId: string }) => [s.id, s])
  );
  for (const assignment of uniqueAssignments) {
    const subject = subjectMap.get(assignment.subjectId);
    if (!subject || subject.classId !== assignment.classId) {
      throw new Error("Selected subject does not belong to the selected class");
    }
  }

  const classes = await prisma.class.findMany({
    where: { id: { in: classIds }, tenantId, academicYearId },
    select: { id: true },
  });
  if (classes.length !== classIds.length) {
    throw new Error("One or more selected classes are invalid for the selected academic year");
  }

  const current = await prisma.teacherSubject.findMany({
    where: { teacherId, isDeleted: false },
    include: { subject: { select: { id: true, academicYearId: true } } },
  });
  const desiredSubjectIds = new Set(subjectIds);

  for (const rel of current) {
    if (rel.subject?.academicYearId === academicYearId && !desiredSubjectIds.has(rel.subjectId)) {
      await prisma.teacherSubject.update({
        where: { id: rel.id },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    }
  }

  for (const assignment of uniqueAssignments) {
    const existing = await prisma.teacherSubject.findFirst({
      where: { teacherId, subjectId: assignment.subjectId },
    });
    if (existing) {
      await prisma.teacherSubject.update({
        where: { id: existing.id },
        data: { isDeleted: false, deletedAt: null },
      });
    } else {
      await prisma.teacherSubject.create({
        data: { teacherId, subjectId: assignment.subjectId },
      });
    }
  }

  const currentClasses = await prisma.teacherClass.findMany({
    where: { teacherId, isDeleted: false },
    include: { class: { select: { id: true, academicYearId: true } } },
  });
  const desiredClassIds = new Set(classIds);

  for (const rel of currentClasses) {
    if (rel.class?.academicYearId === academicYearId && !desiredClassIds.has(rel.classId)) {
      await prisma.teacherClass.update({
        where: { id: rel.id },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    }
  }

  for (const classId of desiredClassIds) {
    const existing = await prisma.teacherClass.findFirst({ where: { teacherId, classId } });
    if (existing) {
      await prisma.teacherClass.update({
        where: { id: existing.id },
        data: { isDeleted: false, deletedAt: null },
      });
    } else {
      await prisma.teacherClass.create({ data: { teacherId, classId } });
    }
  }

  return {
    teacherId,
    academicYearId,
    assignments: uniqueAssignments,
    count: uniqueAssignments.length,
  };
};
