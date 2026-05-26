import prisma from "../../config/prisma";
import { CreateTimetableInput } from "./timetable.types";

export const createTimetableService = async (
  data: CreateTimetableInput,
  tenantId: string
) => {
  const { classId, sectionId, day, period, teacherId, subjectId } = data;

  //////////////////////////
  // 🔒 VALIDATE CLASS
  //////////////////////////
  const classExists = await prisma.class.findFirst({
    where: { id: classId, tenantId },
  });

  if (!classExists) {
    throw new Error("Invalid class");
  }

  //////////////////////////
  // 🔒 VALIDATE SECTION
  //////////////////////////
  const sectionExists = await prisma.section.findFirst({
    where: { id: sectionId, tenantId },
  });

  if (!sectionExists) {
    throw new Error("Invalid section");
  }

  //////////////////////////
  // 🔒 VALIDATE TEACHER
  //////////////////////////
  const teacherExists = await prisma.teacher.findFirst({
    where: { id: teacherId, tenantId },
  });

  if (!teacherExists) {
    throw new Error("Invalid teacher");
  }

  //////////////////////////
  // 🔒 VALIDATE SUBJECT (if present)
  //////////////////////////
  if (subjectId) {
    const subjectExists = await prisma.subject.findFirst({
      where: { id: subjectId, tenantId },
    });

    if (!subjectExists) {
      throw new Error("Invalid subject");
    }
  }

  //////////////////////////
  // ❌ CLASS CONFLICT
  //////////////////////////
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

  //////////////////////////
  // ❌ TEACHER CONFLICT
  //////////////////////////
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

  //////////////////////////
  // ✅ CREATE
  //////////////////////////
  return prisma.timetable.create({
    data: {
      ...data,
      tenantId,
    },
  });
};

//////////////////////////////////////////////////////
// GET TIMETABLE
//////////////////////////////////////////////////////
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
    include: {
      teacher: true,
      subject: true,
    }, // 🔥 better UI support
  });
};