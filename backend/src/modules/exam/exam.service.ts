import prisma from "../../config/prisma";
import {
  CreateExamInput,
  AddExamSubjectInput,
  EnterMarksInput,
} from "./exam.types";

// ✅ Create Exam
export const createExamService = async (
  data: CreateExamInput,
  tenantId: string
) => {
  return prisma.exam.create({
    data: {
      ...data,
      tenantId,
    },
  });
};

// ✅ Add subjects to exam (🔥 FIXED)
export const addExamSubjectService = async (
  data: AddExamSubjectInput,
  tenantId: string
) => {
  return prisma.examSubject.create({
    data: {
      ...data,
      tenantId, // 🔥 IMPORTANT
    },
  });
};

// ✅ Enter Marks
export const enterMarksService = async (
  data: EnterMarksInput,
  tenantId: string
) => {
  const { examId, marks } = data;

  const resultData = marks.map((m) => ({
    examId,
    studentId: m.studentId,
    subjectId: m.subjectId,
    marksObtained: m.marksObtained,
    tenantId,
  }));

  await prisma.result.createMany({
    data: resultData,
  });

  return { message: "Marks saved successfully" };
};

// ✅ Get Result
export const getResultService = async (
  studentId: string,
  examId: string,
  tenantId: string
) => {
  const records = await prisma.result.findMany({
    where: {
      studentId,
      examId,
      tenantId,
    },
  });

  const total = records.reduce((sum, r) => sum + r.marksObtained, 0);
  const subjects = records.length;
  const percentage = subjects === 0 ? 0 : total / subjects;

  return {
    totalMarks: total,
    subjects,
    percentage: percentage.toFixed(2),
  };
};