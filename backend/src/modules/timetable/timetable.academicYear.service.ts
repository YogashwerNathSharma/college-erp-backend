import prisma from "../../utils/prisma";
import { DayOfWeek } from "@prisma/client";
import { CreateTimetableInput } from "./timetable.types";

const classInYear = (classId: string, tenantId: string, academicYearId: string) =>
  prisma.class.findFirst({ where: { id: classId, tenantId, academicYearId, isDeleted: false } });

const sectionInYear = (sectionId: string, classId: string, tenantId: string, academicYearId: string) =>
  prisma.section.findFirst({ where: { id: sectionId, classId, tenantId, academicYearId, isDeleted: false } });

export const createTimetableService = async (data: CreateTimetableInput, tenantId: string, academicYearId: string) => {
  const { classId, sectionId, day, period, teacherId, subjectId } = data;

  const classExists = await classInYear(classId, tenantId, academicYearId);
  if (!classExists) throw new Error("Invalid class for selected academic year");

  const sectionExists = await sectionInYear(sectionId, classId, tenantId, academicYearId);
  if (!sectionExists) throw new Error("Invalid section for selected academic year");

  const teacherExists = await prisma.teacher.findFirst({ where: { id: teacherId, tenantId, isDeleted: false } });
  if (!teacherExists) throw new Error("Invalid teacher");

  const subjectExists = await prisma.subject.findFirst({ where: { id: subjectId, tenantId, academicYearId, classId, isActive: true } });
  if (!subjectExists) throw new Error("Invalid subject for selected academic year");

  const classConflict = await prisma.timetable.findFirst({
    where: { classId, sectionId, day, period, tenantId, isDeleted: false },
  });
  if (classConflict) throw new Error("This slot already has a subject assigned");

  const teacherConflict = await prisma.timetable.findFirst({
    where: {
      teacherId, day, period, tenantId, isDeleted: false,
      class: { academicYearId },
    },
    include: { class: true, section: true },
  });
  if (teacherConflict) {
    throw new Error(`Teacher already assigned to ${teacherConflict.class?.name || ""} (${teacherConflict.section?.name || ""}) at this time`);
  }

  return prisma.timetable.create({
    data: {
      day, period,
      class: { connect: { id: classId } },
      section: { connect: { id: sectionId } },
      subject: { connect: { id: subjectId } },
      teacher: { connect: { id: teacherId } },
      tenant: { connect: { id: tenantId } },
    },
    include: { subject: true, teacher: true },
  });
};

export const getTimetableService = async (classId: string, sectionId: string, tenantId: string, academicYearId: string) => {
  const valid = await sectionInYear(sectionId, classId, tenantId, academicYearId);
  if (!valid) throw new Error("Invalid class/section for selected academic year");
  return prisma.timetable.findMany({
    where: { classId, sectionId, tenantId, isDeleted: false },
    orderBy: [{ day: "asc" }, { period: "asc" }],
    include: { teacher: { select: { id: true, name: true } }, subject: { select: { id: true, name: true } } },
  });
};

export const getTimetableByTeacherService = async (teacherId: string, tenantId: string, academicYearId: string) => {
  return prisma.timetable.findMany({
    where: { teacherId, tenantId, isDeleted: false, class: { academicYearId } },
    orderBy: [{ day: "asc" }, { period: "asc" }],
    include: {
      subject: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
    },
  });
};

export const deleteTimetableService = async (id: string, tenantId: string, academicYearId: string) => {
  const entry = await prisma.timetable.findFirst({ where: { id, tenantId, isDeleted: false, class: { academicYearId } } });
  if (!entry) throw new Error("Timetable entry not found for selected academic year");
  return prisma.timetable.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
};

export const getTeachersBySubjectService = async (subjectId: string, tenantId: string, academicYearId: string) => {
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, tenantId, academicYearId, isActive: true }, select: { id: true } });
  if (!subject) return [];
  const teacherSubjectEntries = await prisma.teacherSubject.findMany({ where: { subjectId, isDeleted: false }, select: { teacherId: true } });
  const teacherIds = teacherSubjectEntries.map((ts) => ts.teacherId);
  if (!teacherIds.length) return [];
  return prisma.teacher.findMany({ where: { id: { in: teacherIds }, tenantId, isDeleted: false }, select: { id: true, name: true, email: true } });
};

export const bulkSaveTimetableService = async (teacherId: string, entries: any[], clearedEntries: any[], tenantId: string, academicYearId: string) => {
  const validEntries = (entries || []).filter(Boolean);
  for (const entry of validEntries) {
    const cls = await classInYear(entry.classId, tenantId, academicYearId);
    if (!cls) throw new Error("One or more timetable entries belong to a different academic year");
    const section = await sectionInYear(entry.sectionId, entry.classId, tenantId, academicYearId);
    if (!section) throw new Error("One or more timetable sections belong to a different academic year");
  }

  await prisma.$transaction(async (tx) => {
    for (const cleared of clearedEntries || []) {
      await tx.timetable.updateMany({
        where: { teacherId, tenantId, day: cleared.day, period: cleared.period, isDeleted: false, class: { academicYearId } },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    }
    for (const entry of validEntries) {
      await tx.timetable.updateMany({
        where: { teacherId, tenantId, day: entry.day, period: entry.period, isDeleted: false, class: { academicYearId } },
        data: { isDeleted: true, deletedAt: new Date() },
      });
      await tx.timetable.create({ data: { classId: entry.classId, sectionId: entry.sectionId, subjectId: entry.subjectId, teacherId: entry.teacherId, tenantId, day: entry.day, period: entry.period } });
    }
  });
  return { message: "Timetable saved successfully" };
};

export const autoGenerateTimetableService = async (classId: string, sectionId: string, tenantId: string, academicYearId: string) => {
  const DAYS: DayOfWeek[] = [DayOfWeek.MON, DayOfWeek.TUE, DayOfWeek.WED, DayOfWeek.THU, DayOfWeek.FRI, DayOfWeek.SAT];
  const PERIODS_PER_DAY = 8;
  const TOTAL_SLOTS = DAYS.length * PERIODS_PER_DAY;

  const classExists = await classInYear(classId, tenantId, academicYearId);
  if (!classExists) throw new Error("Invalid class for selected academic year");
  const sectionExists = await sectionInYear(sectionId, classId, tenantId, academicYearId);
  if (!sectionExists) throw new Error("Invalid section for selected academic year");

  const existing = await prisma.timetable.findFirst({ where: { classId, sectionId, tenantId, isDeleted: false } });
  if (existing) throw new Error("Timetable already exists. Clear it first or use custom mode.");

  const subjects = await prisma.subject.findMany({
    where: { classId, tenantId, academicYearId, isActive: true },
    include: { teachers: { where: { isDeleted: false }, include: { teacher: { select: { id: true, name: true, isDeleted: true } } } } },
  });
  if (!subjects.length) throw new Error("No subjects found for this class. Add subjects first.");
  const subjectsWithTeachers = subjects.filter((s) => s.teachers.some((ts) => !ts.teacher.isDeleted));
  if (!subjectsWithTeachers.length) throw new Error("No subjects have teachers assigned. Assign teachers first.");

  let totalDemanded = 0;
  const rawAllocations = subjectsWithTeachers.map((subject) => {
    const activeTeacher = subject.teachers.find((ts) => !ts.teacher.isDeleted)!;
    const periodsPerWeek = (subject as any).periodsPerWeek || 0;
    totalDemanded += periodsPerWeek;
    return { subjectId: subject.id, subjectName: subject.name, teacherId: activeTeacher.teacher.id, periodsPerWeek };
  });

  let allocations: any[];
  if (totalDemanded === 0) {
    const perSubject = Math.floor(TOTAL_SLOTS / rawAllocations.length);
    const extra = TOTAL_SLOTS % rawAllocations.length;
    allocations = rawAllocations.map((a, i) => ({ ...a, totalPeriods: perSubject + (i < extra ? 1 : 0), assigned: 0 }));
  } else if (totalDemanded > TOTAL_SLOTS) {
    allocations = rawAllocations.map((a) => ({ ...a, totalPeriods: Math.round((a.periodsPerWeek / totalDemanded) * TOTAL_SLOTS), assigned: 0 }));
  } else {
    allocations = rawAllocations.map((a) => ({ ...a, totalPeriods: a.periodsPerWeek, assigned: 0 }));
  }

  const globalTeacherBusy = await prisma.timetable.findMany({
    where: { tenantId, isDeleted: false, class: { academicYearId } },
    select: { teacherId: true, day: true, period: true },
  });
  const teacherBusySet = new Set(globalTeacherBusy.map((t) => `${t.teacherId}-${t.day}-${t.period}`));
  const entries: { day: DayOfWeek; period: number; subjectId: string; teacherId: string }[] = [];
  const lastSubjectByDay: Record<string, string> = {};

  for (const day of DAYS) {
    lastSubjectByDay[day] = "";
    for (let period = 1; period <= PERIODS_PER_DAY; period++) {
      const sorted = [...allocations].filter((a) => a.assigned < a.totalPeriods).sort((a, b) => {
        const aRepeat = a.subjectId === lastSubjectByDay[day] ? 1 : 0;
        const bRepeat = b.subjectId === lastSubjectByDay[day] ? 1 : 0;
        if (aRepeat !== bRepeat) return aRepeat - bRepeat;
        return (b.totalPeriods - b.assigned) - (a.totalPeriods - a.assigned);
      });
      let assigned = false;
      for (const alloc of sorted) {
        const busyKey = `${alloc.teacherId}-${day}-${period}`;
        if (!teacherBusySet.has(busyKey)) {
          entries.push({ day, period, subjectId: alloc.subjectId, teacherId: alloc.teacherId });
          teacherBusySet.add(busyKey); alloc.assigned++; lastSubjectByDay[day] = alloc.subjectId; assigned = true; break;
        }
      }
      if (!assigned) {
        for (const alloc of allocations.filter((a) => a.assigned < a.totalPeriods)) {
          const busyKey = `${alloc.teacherId}-${day}-${period}`;
          if (!teacherBusySet.has(busyKey)) {
            entries.push({ day, period, subjectId: alloc.subjectId, teacherId: alloc.teacherId });
            teacherBusySet.add(busyKey); alloc.assigned++; lastSubjectByDay[day] = alloc.subjectId; break;
          }
        }
      }
    }
  }

  const created = [];
  for (const entry of entries) {
    const result = await prisma.timetable.create({
      data: { day: entry.day, period: entry.period, class: { connect: { id: classId } }, section: { connect: { id: sectionId } }, subject: { connect: { id: entry.subjectId } }, teacher: { connect: { id: entry.teacherId } }, tenant: { connect: { id: tenantId } } },
      include: { subject: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } } },
    });
    created.push(result);
  }
  return { message: `Timetable generated! ${created.length} entries created.`, totalSlots: TOTAL_SLOTS, filledSlots: created.length, emptySlots: TOTAL_SLOTS - created.length, entries: created };
};

export const bulkGenerateTimetableService = async (classIds: string[], tenantId: string, academicYearId: string) => {
  const validClasses = await prisma.class.findMany({ where: { id: { in: classIds }, tenantId, academicYearId, isDeleted: false }, select: { id: true } });
  if (validClasses.length !== classIds.length) throw new Error("One or more selected classes do not belong to the selected academic year");
  const validClassIds = new Set(validClasses.map((c) => c.id));
  const sections = await prisma.section.findMany({ where: { classId: { in: [...validClassIds] }, tenantId, academicYearId, isDeleted: false }, include: { class: true } });
  if (!sections.length) throw new Error("No sections found for selected classes.");

  const results: any[] = [];
  for (const section of sections) {
    try {
      const existing = await prisma.timetable.findFirst({ where: { classId: section.classId, sectionId: section.id, tenantId, isDeleted: false } });
      if (existing) {
        results.push({ classId: section.classId, className: section.class?.name || "", sectionId: section.id, sectionName: section.name, status: "skipped", message: "Timetable already exists" });
        continue;
      }
      const result = await autoGenerateTimetableService(section.classId, section.id, tenantId, academicYearId);
      results.push({ classId: section.classId, className: section.class?.name || "", sectionId: section.id, sectionName: section.name, status: "success", message: result.message, filledSlots: result.filledSlots });
    } catch (error: any) {
      results.push({ classId: section.classId, className: section.class?.name || "", sectionId: section.id, sectionName: section.name, status: "error", message: error.message });
    }
  }
  const successCount = results.filter((r) => r.status === "success").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  return { message: `Bulk complete! ${successCount} generated, ${skippedCount} skipped, ${errorCount} errors.`, results, summary: { success: successCount, skipped: skippedCount, errors: errorCount } };
};

export const clearTimetableService = async (classId: string, sectionId: string, tenantId: string, academicYearId: string) => {
  const valid = await sectionInYear(sectionId, classId, tenantId, academicYearId);
  if (!valid) throw new Error("Invalid class/section for selected academic year");
  const result = await prisma.timetable.updateMany({ where: { classId, sectionId, tenantId, isDeleted: false }, data: { isDeleted: true, deletedAt: new Date() } });
  return { message: `${result.count} entries deleted`, count: result.count };
};

export const bulkClearTimetableService = async (classIds: string[], tenantId: string, academicYearId: string) => {
  const validClasses = await prisma.class.findMany({ where: { id: { in: classIds }, tenantId, academicYearId, isDeleted: false }, select: { id: true } });
  if (validClasses.length !== classIds.length) throw new Error("One or more selected classes do not belong to the selected academic year");
  const result = await prisma.timetable.updateMany({ where: { classId: { in: classIds }, tenantId, isDeleted: false }, data: { isDeleted: true, deletedAt: new Date() } });
  return { message: `${result.count} entries deleted`, count: result.count };
};
