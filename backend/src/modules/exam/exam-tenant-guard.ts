import prisma from "../../utils/prisma";

export async function assertExamTenant(examId: string, tenantId: string) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId, isDeleted: false },
    select: { id: true },
  });
  if (!exam) throw new Error("Exam not found");
  return exam;
}

export async function assertExamSubjectTenant(examSubjectId: string, tenantId: string) {
  const row = await prisma.examSubject.findFirst({
    where: { id: examSubjectId, tenantId, isDeleted: false },
    select: { id: true },
  });
  if (!row) throw new Error("Exam subject not found");
  return row;
}

export async function assertStudentTenant(studentId: string, tenantId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
    select: { id: true },
  });
  if (!student) throw new Error("Student not found");
  return student;
}
