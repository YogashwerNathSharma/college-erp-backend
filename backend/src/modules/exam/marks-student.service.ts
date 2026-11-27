// marks-student.service.ts
// Save marks for ONE student of an exam. Only that student's rows are replaced;
// every other student's marks are left untouched.

import prisma from "../../utils/prisma";

const VALID_STATUSES = ["PRESENT", "ABSENT", "LEAVE", "MEDICAL"];

export const saveStudentMarksService = async (
  examId: string,
  studentId: string,
  marks: any[],
  tenantId: string
) => {
  // Make sure the exam belongs to this tenant
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId, isDeleted: false },
  });
  if (!exam) throw new Error("Exam not found");

  // Make sure the student is enrolled in this exam's class and academic year
  const enrolled = await prisma.enrollment.findFirst({
    where: {
      studentId,
      classId: exam.classId,
      academicYearId: exam.academicYearId,
      tenantId,
      isDeleted: false,
    },
    select: { id: true },
  });
  if (!enrolled) throw new Error("Student is not enrolled in this exam's class");

  const rows = (marks || [])
    .filter((m: any) => m && m.subjectId)
    .map((m: any) => {
      const raw = (m.status || "").toString().toUpperCase();
      const status = VALID_STATUSES.includes(raw) ? raw : m.isAbsent ? "ABSENT" : "PRESENT";
      const didNotAppear = status !== "PRESENT";
      return {
        examId,
        studentId,
        subjectId: m.subjectId,
        marksObtained: didNotAppear ? 0 : (Number(m.marksObtained) || 0),
        isAbsent: didNotAppear,
        status,
        tenantId,
      };
    });

  // Replace only this student's marks for this exam
  await prisma.marksEntry.deleteMany({ where: { examId, studentId, tenantId } });
  if (rows.length > 0) {
    await prisma.marksEntry.createMany({ data: rows });
  }

  return { saved: rows.length, studentId };
};
