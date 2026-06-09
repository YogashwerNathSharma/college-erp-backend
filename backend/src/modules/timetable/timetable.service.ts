
import prisma from "../../utils/prisma";
import { DayOfWeek } from "@prisma/client";
import { CreateTimetableInput } from "./timetable.types";

//////////////////////////////////////////////////////
// CREATE TIMETABLE ENTRY
//////////////////////////////////////////////////////
export const createTimetableService = async (
  data: CreateTimetableInput,
  tenantId: string
) => {
  const { classId, sectionId, day, period, teacherId, subjectId } = data;

  const classExists = await prisma.class.findFirst({
    where: { id: classId, tenantId },
  });
  if (!classExists) throw new Error("Invalid class");

  const sectionExists = await prisma.section.findFirst({
    where: { id: sectionId, tenantId },
  });
  if (!sectionExists) throw new Error("Invalid section");

  const teacherExists = await prisma.teacher.findFirst({
    where: { id: teacherId, tenantId, isDeleted: false },
  });
  if (!teacherExists) throw new Error("Invalid teacher");

  const subjectExists = await prisma.subject.findFirst({
    where: { id: subjectId, tenantId },
  });
  if (!subjectExists) throw new Error("Invalid subject");

  // ❌ CLASS SLOT CONFLICT
  const classConflict = await prisma.timetable.findFirst({
    where: { classId, sectionId, day, period, tenantId, isDeleted: false },
  });
  if (classConflict) {
    throw new Error("This slot already has a subject assigned");
  }

  // ❌ TEACHER CONFLICT — ek teacher ek time ek class only
  const teacherConflict = await prisma.timetable.findFirst({
    where: { teacherId, day, period, tenantId, isDeleted: false },
    include: { class: true, section: true },
  });
  if (teacherConflict) {
    throw new Error(
      `Teacher already assigned to ${teacherConflict.class?.name || ""} (${teacherConflict.section?.name || ""}) at this time`
    );
  }

  return prisma.timetable.create({
    data: {
      day,
      period,
      class: { connect: { id: classId } },
      section: { connect: { id: sectionId } },
      subject: { connect: { id: subjectId } },
      teacher: { connect: { id: teacherId } },
      tenant: { connect: { id: tenantId } },
    },
    include: { subject: true, teacher: true },
  });
};

//////////////////////////////////////////////////////
// GET TIMETABLE BY CLASS + SECTION
//////////////////////////////////////////////////////
export const getTimetableService = async (
  classId: string,
  sectionId: string,
  tenantId: string
) => {
  return prisma.timetable.findMany({
    where: { classId, sectionId, tenantId, isDeleted: false },
    orderBy: [{ day: "asc" }, { period: "asc" }],
    include: {
      teacher: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
  });
};

//////////////////////////////////////////////////////
// DELETE (SOFT DELETE)
//////////////////////////////////////////////////////
export const deleteTimetableService = async (id: string, tenantId: string) => {
  const entry = await prisma.timetable.findFirst({
    where: { id, tenantId, isDeleted: false },
  });
  if (!entry) throw new Error("Timetable entry not found");

  return prisma.timetable.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

//////////////////////////////////////////////////////
// GET TEACHERS BY SUBJECT ID (2-step query)
//////////////////////////////////////////////////////
export const getTeachersBySubjectService = async (
  subjectId: string,
  tenantId: string
) => {
  const teacherSubjectEntries = await prisma.teacherSubject.findMany({
    where: { subjectId, isDeleted: false },
    select: { teacherId: true },
  });

  const teacherIds = teacherSubjectEntries.map((ts) => ts.teacherId);
  if (teacherIds.length === 0) return [];

  const teachers = await prisma.teacher.findMany({
    where: { id: { in: teacherIds }, tenantId, isDeleted: false },
    select: { id: true, name: true, email: true },
  });

  return teachers;
};

//////////////////////////////////////////////////////
// AUTO GENERATE TIMETABLE (Single Class + Section)
//////////////////////////////////////////////////////
export const autoGenerateTimetableService = async (
  classId: string,
  sectionId: string,
  tenantId: string
) => {
  const DAYS: DayOfWeek[] = [
    DayOfWeek.MON,
    DayOfWeek.TUE,
    DayOfWeek.WED,
    DayOfWeek.THU,
    DayOfWeek.FRI,
    DayOfWeek.SAT,
  ];
  const PERIODS_PER_DAY = 8;
  const TOTAL_SLOTS = DAYS.length * PERIODS_PER_DAY;

  // Validate
  const classExists = await prisma.class.findFirst({ where: { id: classId, tenantId } });
  if (!classExists) throw new Error("Invalid class");

  const sectionExists = await prisma.section.findFirst({ where: { id: sectionId, tenantId } });
  if (!sectionExists) throw new Error("Invalid section");

  // Check existing
  const existing = await prisma.timetable.findFirst({
    where: { classId, sectionId, tenantId, isDeleted: false },
  });
  if (existing) {
    throw new Error("Timetable already exists. Clear it first or use custom mode.");
  }

  // Get subjects for this class
  const subjects = await prisma.subject.findMany({
    where: { classId, tenantId, isActive: true },
    include: {
      teachers: {
        where: { isDeleted: false },
        include: { teacher: { select: { id: true, name: true, isDeleted: true } } },
      },
    },
  });

  if (subjects.length === 0) {
    throw new Error("No subjects found for this class. Add subjects first.");
  }

  // Filter subjects with active teachers
  const subjectsWithTeachers = subjects.filter(
    (s) => s.teachers.some((ts) => !ts.teacher.isDeleted)
  );

  if (subjectsWithTeachers.length === 0) {
    throw new Error("No subjects have teachers assigned. Assign teachers first.");
  }

  // Build allocations
  let totalDemanded = 0;
  const rawAllocations = subjectsWithTeachers.map((subject) => {
    const activeTeacher = subject.teachers.find((ts) => !ts.teacher.isDeleted);
    const periodsPerWeek = (subject as any).periodsPerWeek || 0;
    totalDemanded += periodsPerWeek;
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      teacherId: activeTeacher!.teacher.id,
      periodsPerWeek,
    };
  });

  let allocations: {
    subjectId: string;
    subjectName: string;
    teacherId: string;
    periodsPerWeek: number;
    totalPeriods: number;
    assigned: number;
  }[];

  if (totalDemanded === 0) {
    const count = subjectsWithTeachers.length;
    const perSubject = Math.floor(TOTAL_SLOTS / count);
    const extra = TOTAL_SLOTS % count;
    allocations = rawAllocations.map((a, i) => ({
      ...a,
      totalPeriods: perSubject + (i < extra ? 1 : 0),
      assigned: 0,
    }));
  } else {
    if (totalDemanded > TOTAL_SLOTS) {
      allocations = rawAllocations.map((a) => ({
        ...a,
        totalPeriods: Math.round((a.periodsPerWeek / totalDemanded) * TOTAL_SLOTS),
        assigned: 0,
      }));
    } else {
      allocations = rawAllocations.map((a) => ({
        ...a,
        totalPeriods: a.periodsPerWeek,
        assigned: 0,
      }));
    }
  }

  // Global teacher busy slots (prevents double booking across ALL classes)
  const globalTeacherBusy = await prisma.timetable.findMany({
    where: { tenantId, isDeleted: false },
    select: { teacherId: true, day: true, period: true },
  });

  const teacherBusySet = new Set(
    globalTeacherBusy.map((t) => `${t.teacherId}-${t.day}-${t.period}`)
  );

  const entries: { day: DayOfWeek; period: number; subjectId: string; teacherId: string }[] = [];
  const lastSubjectByDay: Record<string, string> = {};

  for (const day of DAYS) {
    lastSubjectByDay[day] = "";

    for (let period = 1; period <= PERIODS_PER_DAY; period++) {
      let assigned = false;

      const sorted = [...allocations]
        .filter((a) => a.assigned < a.totalPeriods)
        .sort((a, b) => {
          const aRepeat = a.subjectId === lastSubjectByDay[day] ? 1 : 0;
          const bRepeat = b.subjectId === lastSubjectByDay[day] ? 1 : 0;
          if (aRepeat !== bRepeat) return aRepeat - bRepeat;
          return (b.totalPeriods - b.assigned) - (a.totalPeriods - a.assigned);
        });

      for (const alloc of sorted) {
        const busyKey = `${alloc.teacherId}-${day}-${period}`;
        if (!teacherBusySet.has(busyKey)) {
          entries.push({ day, period, subjectId: alloc.subjectId, teacherId: alloc.teacherId });
          teacherBusySet.add(busyKey);
          alloc.assigned++;
          lastSubjectByDay[day] = alloc.subjectId;
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        const remaining = allocations.filter((a) => a.assigned < a.totalPeriods);
        for (const alloc of remaining) {
          const busyKey = `${alloc.teacherId}-${day}-${period}`;
          if (!teacherBusySet.has(busyKey)) {
            entries.push({ day, period, subjectId: alloc.subjectId, teacherId: alloc.teacherId });
            teacherBusySet.add(busyKey);
            alloc.assigned++;
            lastSubjectByDay[day] = alloc.subjectId;
            break;
          }
        }
      }
    }
  }

  // Save to DB
  const created = [];
  for (const entry of entries) {
    const result = await prisma.timetable.create({
      data: {
        day: entry.day,
        period: entry.period,
        class: { connect: { id: classId } },
        section: { connect: { id: sectionId } },
        subject: { connect: { id: entry.subjectId } },
        teacher: { connect: { id: entry.teacherId } },
        tenant: { connect: { id: tenantId } },
      },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
    created.push(result);
  }

  return {
    message: `Timetable generated! ${created.length} entries created.`,
    totalSlots: TOTAL_SLOTS,
    filledSlots: created.length,
    emptySlots: TOTAL_SLOTS - created.length,
    entries: created,
  };
};

//////////////////////////////////////////////////////
// BULK GENERATE TIMETABLE (Multiple Classes)
//////////////////////////////////////////////////////
export const bulkGenerateTimetableService = async (
  classIds: string[],
  tenantId: string
) => {
  const results: {
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    status: "success" | "skipped" | "error";
    message: string;
    filledSlots?: number;
  }[] = [];

  const sections = await prisma.section.findMany({
    where: { classId: { in: classIds }, tenantId },
    include: { class: true },
  });

  if (sections.length === 0) {
    throw new Error("No sections found for selected classes.");
  }

  for (const section of sections) {
    try {
      const existing = await prisma.timetable.findFirst({
        where: { classId: section.classId, sectionId: section.id, tenantId, isDeleted: false },
      });

      if (existing) {
        results.push({
          classId: section.classId,
          className: section.class?.name || "",
          sectionId: section.id,
          sectionName: section.name,
          status: "skipped",
          message: "Timetable already exists",
        });
        continue;
      }

      const result = await autoGenerateTimetableService(section.classId, section.id, tenantId);

      results.push({
        classId: section.classId,
        className: section.class?.name || "",
        sectionId: section.id,
        sectionName: section.name,
        status: "success",
        message: result.message,
        filledSlots: result.filledSlots,
      });
    } catch (error: any) {
      results.push({
        classId: section.classId,
        className: section.class?.name || "",
        sectionId: section.id,
        sectionName: section.name,
        status: "error",
        message: error.message,
      });
    }
  }

  const successCount = results.filter((r) => r.status === "success").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return {
    message: `Bulk complete! ${successCount} generated, ${skippedCount} skipped, ${errorCount} errors.`,
    results,
    summary: { success: successCount, skipped: skippedCount, errors: errorCount },
  };
};

//////////////////////////////////////////////////////
// CLEAR TIMETABLE
//////////////////////////////////////////////////////
export const clearTimetableService = async (
  classId: string,
  sectionId: string,
  tenantId: string
) => {
  const result = await prisma.timetable.updateMany({
    where: { classId, sectionId, tenantId, isDeleted: false },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return { message: `${result.count} entries deleted`, count: result.count };
};

//////////////////////////////////////////////////////
// BULK CLEAR TIMETABLE
//////////////////////////////////////////////////////
export const bulkClearTimetableService = async (
  classIds: string[],
  tenantId: string
) => {
  const result = await prisma.timetable.updateMany({
    where: { classId: { in: classIds }, tenantId, isDeleted: false },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return { message: `${result.count} entries deleted`, count: result.count };
};

