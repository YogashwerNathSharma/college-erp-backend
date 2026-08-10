import { Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";

export const validateExamMarkWrite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { examId, marks } = req.body || {};
    if (!tenantId || !examId || !Array.isArray(marks)) {
      return res.status(400).json({ success: false, message: "examId and marks are required" });
    }

    const exam = await prisma.exam.findFirst({
      where: { id: examId, tenantId, isDeleted: false },
      select: { id: true, classId: true, sectionId: true, academicYearId: true },
    });
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    const subjectIds = [...new Set(marks.map((m: any) => m.subjectId).filter(Boolean))];
    const studentIds = [...new Set(marks.map((m: any) => m.studentId).filter(Boolean))];

    const examSubjects = await prisma.examSubject.findMany({
      where: { examId, tenantId, isDeleted: false, subjectId: { in: subjectIds } },
      select: { subjectId: true },
    });
    const validSubjects = new Set(examSubjects.map((s) => s.subjectId));

    const enrollments = await prisma.enrollment.findMany({
      where: {
        tenantId,
        classId: exam.classId,
        ...(exam.sectionId ? { sectionId: exam.sectionId } : {}),
        academicYearId: exam.academicYearId,
        studentId: { in: studentIds },
        status: "active",
        isDeleted: false,
      },
      select: { studentId: true },
    });
    const validStudents = new Set(enrollments.map((e) => e.studentId));

    const invalid = marks.some((m: any) => !validSubjects.has(m.subjectId) || !validStudents.has(m.studentId));
    if (invalid) {
      return res.status(403).json({ success: false, message: "Marks contain a student or subject outside this exam" });
    }

    return next();
  } catch (error) {
    console.error("EXAM WRITE GUARD ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to validate exam write" });
  }
};
