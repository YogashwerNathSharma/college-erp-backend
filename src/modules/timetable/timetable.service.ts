import prisma from "../../config/prisma";
import { CreateTimetableInput } from "./timetable.types";

export const createTimetableService = async (
  data: CreateTimetableInput,
  tenantId: string
) => {
  const { classId, sectionId, day, period, teacherId } = data;

  // ❌ Check class conflict
  const classConflict = await prisma.timetable.findFirst({
    where: {
      classId,
      sectionId,
      day,
      period,
      tenantId,
    },
  });

  if (classConflict) {
    throw new Error("Class already has a subject in this period");
  }

  // ❌ Check teacher conflict
  const teacherConflict = await prisma.timetable.findFirst({
    where: {
      teacherId,
      day,
      period,
      tenantId,
    },
  });

  if (teacherConflict) {
    throw new Error("Teacher already assigned in this period");
  }

  return prisma.timetable.create({
    data: {
      ...data,
      tenantId,
    },
  });
};

// 👉 Get timetable (class-wise)
export const getTimetableService = async (
  classId: string,
  sectionId: string,
  tenantId: string
) => {
  return prisma.timetable.findMany({
    where: {
      classId,
      sectionId,
      tenantId,
    },
    orderBy: [
      { day: "asc" },
      { period: "asc" },
    ],
  });
};