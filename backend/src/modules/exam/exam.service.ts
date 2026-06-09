
// ═══════════════════════════════════════════════════════
// exam.service.ts — Full Professional Exam Service (FINAL FIXED)
// ═══════════════════════════════════════════════════════

import prisma from "../../utils/prisma";
import {
  CreateExamInput,
  UpdateExamInput,
  AddExamSubjectInput,
  EnterMarksInput,
} from "./exam.types";

// ─────────────────────────────────────────────────────
// HELPER: Calculate grade from percentage
// ─────────────────────────────────────────────────────
function calculateGrade(
  percentage: number,
  gradeSettings: { grade: string; minPercent: number; maxPercent: number }[]
): string | null {
  if (!gradeSettings || gradeSettings.length === 0) return null;
  for (const gs of gradeSettings) {
    if (percentage >= gs.minPercent && percentage <= gs.maxPercent) {
      return gs.grade;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────
// 1. CREATE EXAM
// ─────────────────────────────────────────────────────
export const createExamService = async (
  data: CreateExamInput,
  tenantId: string
) => {
  return prisma.exam.create({
    data: {
      name: data.name,
      type: data.type || null,
      classId: data.classId,
      sectionId: data.sectionId || null,
      academicYearId: data.academicYearId,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      resultType: data.resultType || "BOTH",
      tenantId,
    },
  });
};

// ─────────────────────────────────────────────────────
// 2. UPDATE EXAM
// ─────────────────────────────────────────────────────
export const updateExamService = async (
  examId: string,
  data: UpdateExamInput,
  tenantId: string
) => {
  return prisma.exam.update({
    where: { id: examId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.type && { type: data.type }),
      ...(data.resultType && { resultType: data.resultType }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
    },
  });
};

// ─────────────────────────────────────────────────────
// 3. GET ALL EXAMS (with filters)
// ─────────────────────────────────────────────────────
export const getExamsService = async (
  tenantId: string,
  classId?: string,
  academicYearId?: string
) => {
  const exams = await prisma.exam.findMany({
    where: {
      tenantId,
      isDeleted: false,
      ...(classId && { classId }),
      ...(academicYearId && { academicYearId }),
    },
    orderBy: { createdAt: "desc" },
  });

  // Resolve class names
  const classIds = [...new Set(exams.map((e) => e.classId))];
  const classes = await prisma.class.findMany({
    where: { id: { in: classIds } },
  });

  return exams.map((exam) => {
    const cls = classes.find((c) => c.id === exam.classId);
    return {
      ...exam,
      className: cls?.name || "N/A",
    };
  });
};

// ─────────────────────────────────────────────────────
// 4. GET SINGLE EXAM (with subjects)
// ─────────────────────────────────────────────────────
export const getExamByIdService = async (
  examId: string,
  tenantId: string
) => {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId, isDeleted: false },
  });

  if (!exam) throw new Error("Exam not found");

  const examSubjects = await prisma.examSubject.findMany({
    where: { examId, isDeleted: false },
  });

  const subjectIds = examSubjects.map((es) => es.subjectId);
  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
  });

  const subjectsWithDetails = examSubjects.map((es) => {
    const subject = subjects.find((s) => s.id === es.subjectId);
    return {
      ...es,
      subjectName: subject?.name || "Unknown",
    };
  });

  return { ...exam, subjects: subjectsWithDetails };
};

// ─────────────────────────────────────────────────────
// 5. DELETE EXAM (soft delete)
// ─────────────────────────────────────────────────────
export const deleteExamService = async (
  examId: string,
  tenantId: string
) => {
  return prisma.exam.update({
    where: { id: examId },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

// ─────────────────────────────────────────────────────
// 6. ADD SUBJECTS TO EXAM (Bulk)
// ─────────────────────────────────────────────────────
export const addExamSubjectsService = async (
  data: AddExamSubjectInput,
  tenantId: string
) => {
  const { examId, subjects } = data;

  // Soft delete old subjects
  await prisma.examSubject.updateMany({
    where: { examId, tenantId },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  // Create new
  const subjectData = subjects.map((s) => ({
    examId,
    subjectId: s.subjectId,
    maxMarks: s.maxMarks,
    passingMarks: s.passingMarks,
    tenantId,
  }));

  await prisma.examSubject.createMany({ data: subjectData });

  return { message: "Subjects added successfully", count: subjects.length };
};

// ─────────────────────────────────────────────────────
// 7. GET EXAM SUBJECTS
// ─────────────────────────────────────────────────────
export const getExamSubjectsService = async (
  examId: string,
  tenantId: string
) => {
  const examSubjects = await prisma.examSubject.findMany({
    where: { examId, tenantId, isDeleted: false },
  });

  const subjectIds = examSubjects.map((es) => es.subjectId);
  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
  });

  return examSubjects.map((es) => {
    const subject = subjects.find((s) => s.id === es.subjectId);
    return {
      ...es,
      subjectName: subject?.name || "Unknown",
    };
  });
};

// ─────────────────────────────────────────────────────
// 8. ENTER / UPDATE MARKS (Bulk — Upsert logic)
// ─────────────────────────────────────────────────────
export const enterMarksService = async (
  data: EnterMarksInput,
  tenantId: string
) => {
  const { examId, marks } = data;

  let created = 0;
  let updated = 0;

  for (const m of marks) {
    if (!m.subjectId || !m.studentId) continue;

    const existing = await prisma.marksEntry.findFirst({
      where: {
        examId,
        studentId: m.studentId,
        subjectId: m.subjectId,
        tenantId,
        isDeleted: false,
      },
    });

    if (existing) {
      await prisma.marksEntry.update({
        where: { id: existing.id },
        data: {
          marksObtained: m.isAbsent ? 0 : (m.marksObtained ?? 0),
          isAbsent: m.isAbsent || false,
        },
      });
      updated++;
    } else {
      await prisma.marksEntry.create({
        data: {
          examId,
          studentId: m.studentId,
          subjectId: m.subjectId,
          marksObtained: m.isAbsent ? 0 : (m.marksObtained ?? 0),
          isAbsent: m.isAbsent || false,
          tenantId,
        },
      });
      created++;
    }
  }

  return {
    message: "Marks saved successfully",
    created,
    updated,
    total: marks.length,
  };
};

// ─────────────────────────────────────────────────────
// 9. GET MARKS FOR AN EXAM (for marks entry page)
// ─────────────────────────────────────────────────────
export const getMarksService = async (
  examId: string,
  tenantId: string
) => {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId, isDeleted: false },
  });

  if (!exam) throw new Error("Exam not found");

  const examSubjects = await prisma.examSubject.findMany({
    where: { examId, tenantId, isDeleted: false },
  });

  const subjectIds = examSubjects.map((es) => es.subjectId);
  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
  });

  // Get enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: exam.classId,
      ...(exam.sectionId && { sectionId: exam.sectionId }),
      academicYearId: exam.academicYearId,
      tenantId,
      isDeleted: false,
    },
  });

  const studentIds = enrollments.map((e) => e.studentId);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, isDeleted: false },
    orderBy: { firstName: "asc" },
  });

  // Get existing marks
  const existingMarks = await prisma.marksEntry.findMany({
    where: { examId, tenantId, isDeleted: false },
  });

  // Build subject list
  const subjectList = examSubjects.map((es) => {
    const subject = subjects.find((s) => s.id === es.subjectId);
    return {
      subjectId: es.subjectId,
      subjectName: subject?.name || "Unknown",
      maxMarks: es.maxMarks,
      passingMarks: es.passingMarks,
    };
  });

  // Build student marks matrix
  const studentMarks = students.map((student) => {
    const marks: any = {};
    subjectList.forEach((sub) => {
      const entry = existingMarks.find(
        (m) => m.studentId === student.id && m.subjectId === sub.subjectId
      );
      marks[sub.subjectId] = {
        marksObtained: entry?.marksObtained ?? null,
        isAbsent: entry?.isAbsent ?? false,
      };
    });

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo || "",
      marks,
    };
  });

  return {
    exam,
    subjects: subjectList,
    students: studentMarks,
  };
};

// ─────────────────────────────────────────────────────
// 10. GENERATE RESULTS
// ─────────────────────────────────────────────────────
export const generateResultService = async (
  examId: string,
  tenantId: string
) => {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId, isDeleted: false },
  });
  if (!exam) throw new Error("Exam not found");

  const examSubjects = await prisma.examSubject.findMany({
    where: { examId, tenantId, isDeleted: false },
  });

  const totalMaxMarks = examSubjects.reduce((sum, es) => sum + es.maxMarks, 0);

  const allMarks = await prisma.marksEntry.findMany({
    where: { examId, tenantId, isDeleted: false },
  });

  // Group marks by student
  const studentMarksMap: Record<string, typeof allMarks> = {};
  allMarks.forEach((m) => {
    if (!studentMarksMap[m.studentId]) {
      studentMarksMap[m.studentId] = [];
    }
    studentMarksMap[m.studentId].push(m);
  });

  // Get grade settings
  const gradeSettings = await prisma.gradeSetting.findMany({
    where: { tenantId, isDeleted: false },
    orderBy: { minPercent: "desc" },
  });

  const results: any[] = [];

  for (const [studentId, marks] of Object.entries(studentMarksMap)) {
    const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
    const percentage = totalMaxMarks > 0 ? (totalObtained / totalMaxMarks) * 100 : 0;

    let passedSubjects = 0;
    let failedSubjects = 0;

    marks.forEach((m) => {
      const examSubject = examSubjects.find((es) => es.subjectId === m.subjectId);
      if (examSubject) {
        if (m.marksObtained >= examSubject.passingMarks && !m.isAbsent) {
          passedSubjects++;
        } else if (!m.isAbsent) {
          failedSubjects++;
        }
      }
    });

    const status = failedSubjects === 0 ? "PASS" : "FAIL";

    const grade = calculateGrade(percentage, gradeSettings);

    let division = null;
    if (status === "PASS") {
      if (percentage >= 60) division = "First";
      else if (percentage >= 45) division = "Second";
      else division = "Third";
    }

    results.push({
      studentId,
      totalMarks: Math.round(totalObtained * 100) / 100,
      totalMaxMarks,
      percentage: Math.round(percentage * 100) / 100,
      grade,
      division,
      status,
      totalSubjects: examSubjects.length,
      passedSubjects,
      failedSubjects,
    });
  }

  // Sort by percentage for ranking
  results.sort((a, b) => b.percentage - a.percentage);
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  // Delete old results
  await prisma.resultSummary.updateMany({
    where: { examId, tenantId },
    data: { isDeleted: true },
  });

  // Save new results
  for (const r of results) {
    await prisma.resultSummary.create({
      data: {
        examId,
        studentId: r.studentId,
        tenantId,
        totalMarks: r.totalMarks,
        totalMaxMarks: r.totalMaxMarks,
        percentage: r.percentage,
        grade: r.grade,
        rank: r.rank,
        division: r.division,
        status: r.status,
        totalSubjects: r.totalSubjects,
        passedSubjects: r.passedSubjects,
        failedSubjects: r.failedSubjects,
      },
    });
  }

  // Mark exam as published
  await prisma.exam.update({
    where: { id: examId },
    data: { isPublished: true },
  });

  return {
    message: "Results generated successfully",
    totalStudents: results.length,
    passed: results.filter((r) => r.status === "PASS").length,
    failed: results.filter((r) => r.status === "FAIL").length,
  };
};

// ─────────────────────────────────────────────────────
// 11. GET RESULTS (Published)
// ─────────────────────────────────────────────────────
export const getResultsService = async (
  examId: string,
  tenantId: string
) => {
  const results = await prisma.resultSummary.findMany({
    where: { examId, tenantId, isDeleted: false },
    orderBy: { rank: "asc" },
  });

  const studentIds = results.map((r) => r.studentId);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
  });

  return results.map((r) => {
    const student = students.find((s) => s.id === r.studentId);
    return {
      ...r,
      studentName: student
        ? `${student.firstName} ${student.lastName}`
        : "Unknown",
      admissionNo: student?.admissionNo || "",
    };
  });
};

// ─────────────────────────────────────────────────────
// 12. GET REPORT CARD (Single student — single exam)
//     ✅ FIXED: Added motherName, dob, rollNo, section,
//              photoUrl, academicYear
// ─────────────────────────────────────────────────────
export const getReportCardService = async (
  examId: string,
  studentId: string,
  tenantId: string
) => {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId, isDeleted: false },
  });
  if (!exam) throw new Error("Exam not found");

  const student = await prisma.student.findFirst({
    where: { id: studentId, isDeleted: false },
  });
  if (!student) throw new Error("Student not found");

  const examSubjects = await prisma.examSubject.findMany({
    where: { examId, tenantId, isDeleted: false },
  });

  const subjectIds = examSubjects.map((es) => es.subjectId);
  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
  });

  const marks = await prisma.marksEntry.findMany({
    where: { examId, studentId, tenantId, isDeleted: false },
  });

  const resultSummary = await prisma.resultSummary.findFirst({
    where: { examId, studentId, tenantId, isDeleted: false },
  });

  const gradeSettings = await prisma.gradeSetting.findMany({
    where: { tenantId, isDeleted: false },
    orderBy: { minPercent: "desc" },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, logoUrl: true, address: true, phone: true },
  });

  const classInfo = await prisma.class.findFirst({
    where: { id: exam.classId },
  });

  // ✅ Get academic year name
  const academicYear = await prisma.academicYear.findFirst({
    where: { id: exam.academicYearId, tenantId, isDeleted: false },
  });

  // ✅ Get enrollment for rollNo & section
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      classId: exam.classId,
      academicYearId: exam.academicYearId,
      tenantId,
      isDeleted: false,
    },
  });

  // ✅ Get section name
  let sectionName = "";
  const sectionId = enrollment?.sectionId || exam.sectionId;
  if (sectionId) {
    const section = await prisma.section.findFirst({
      where: { id: sectionId },
    });
    sectionName = section?.name || "";
  }

  // Build subject-wise marks
  const subjectMarks = examSubjects.map((es) => {
    const subject = subjects.find((s) => s.id === es.subjectId);
    const mark = marks.find((m) => m.subjectId === es.subjectId);

    const obtained = mark?.marksObtained ?? 0;
    const percent = es.maxMarks > 0 ? (obtained / es.maxMarks) * 100 : 0;
    const subjectGrade = calculateGrade(percent, gradeSettings);

    return {
      subjectName: subject?.name || "Unknown",
      maxMarks: es.maxMarks,
      passingMarks: es.passingMarks,
      marksObtained: obtained,
      isAbsent: mark?.isAbsent || false,
      percentage: Math.round(percent * 100) / 100,
      grade: subjectGrade,
      status: obtained >= es.passingMarks ? "PASS" : "FAIL",
    };
  });

  return {
    tenant,
    exam: {
      name: exam.name,
      type: exam.type,
      resultType: exam.resultType,
      startDate: exam.startDate,
      endDate: exam.endDate,
      academicYear: academicYear?.name || "", // ✅ NEW
    },
    student: {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
      fatherName: student.fatherName,
      className: classInfo?.name || "",
      motherName: student.motherName || "",         // ✅ NEW
      dob: student.dob                              // ✅ NEW
        ? new Date(student.dob).toLocaleDateString("en-IN")
        : "",
      rollNo: student.rollNumber || "",             // ✅ NEW
      section: sectionName,                         // ✅ NEW
      photoUrl: student.photoUrl || "",             // ✅ NEW
    },
    subjectMarks,
    summary: resultSummary
      ? {
          totalMarks: resultSummary.totalMarks,
          totalMaxMarks: resultSummary.totalMaxMarks,
          percentage: resultSummary.percentage,
          grade: resultSummary.grade,
          rank: resultSummary.rank,
          division: resultSummary.division,
          status: resultSummary.status,
          totalSubjects: resultSummary.totalSubjects,
          passedSubjects: resultSummary.passedSubjects,
          failedSubjects: resultSummary.failedSubjects,
        }
      : null,
  };
};

// ─────────────────────────────────────────────────────
// 13. CONSOLIDATED REPORT CARD (All terms combined)
//     ✅ FIXED: Added motherName, dob, rollNo, section, photoUrl
// ─────────────────────────────────────────────────────
export const getConsolidatedReportService = async (
  studentId: string,
  academicYearId: string,
  classId: string,
  tenantId: string
) => {
  // 1. Get tenant info
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, address: true, logoUrl: true, phone: true },
  });
  if (!tenant) throw new Error("Tenant not found");

  // 2. Get student
  const student = await prisma.student.findFirst({
    where: { id: studentId, isDeleted: false },
  });
  if (!student) throw new Error("Student not found");

  // 3. Get academic year
  const academicYear = await prisma.academicYear.findFirst({
    where: { id: academicYearId, tenantId, isDeleted: false },
  });
  if (!academicYear) throw new Error("Academic year not found");

  // 4. Get class name
  const classInfo = await prisma.class.findFirst({
    where: { id: classId },
  });

  // ✅ 4.5 Get enrollment for rollNo & section
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      classId,
      academicYearId,
      tenantId,
      isDeleted: false,
    },
  });

  // ✅ Get section name
  let sectionName = "";
  if (enrollment?.sectionId) {
    const section = await prisma.section.findFirst({
      where: { id: enrollment.sectionId },
    });
    sectionName = section?.name || "";
  }

  // 5. Get all exams for this class + academic year
  const exams = await prisma.exam.findMany({
    where: {
      classId,
      academicYearId,
      tenantId,
      isDeleted: false,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!exams || exams.length === 0) {
    throw new Error("No exams found for this class and academic year");
  }

  // 6. Get grade settings
  const gradeSettings = await prisma.gradeSetting.findMany({
    where: { tenantId, isDeleted: false },
    orderBy: { minPercent: "desc" },
  });

  // 7. Get exam subjects for each exam + all marks for this student
  const examIds = exams.map((e) => e.id);

  const allExamSubjects = await prisma.examSubject.findMany({
    where: { examId: { in: examIds }, tenantId, isDeleted: false },
  });

  const allMarks = await prisma.marksEntry.findMany({
    where: {
      studentId,
      examId: { in: examIds },
      tenantId,
      isDeleted: false,
    },
  });

  // 8. Get all subject names
  const allSubjectIds = [...new Set(allExamSubjects.map((es) => es.subjectId))];
  const allSubjects = await prisma.subject.findMany({
    where: { id: { in: allSubjectIds } },
  });

  // 9. Build exam info with maxMarks per exam (sum of all subjects)
  const examInfo = exams.map((exam) => {
    const subjects = allExamSubjects.filter((es) => es.examId === exam.id);
    const totalMax = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    return {
      id: exam.id,
      name: exam.name,
      type: exam.type,
      totalMaxMarks: totalMax,
    };
  });

  // 10. Build subjects array — each subject × each exam
  const subjectsReport = allSubjectIds.map((subjectId) => {
    const subjectInfo = allSubjects.find((s) => s.id === subjectId);
    const subjectName = subjectInfo?.name || "Unknown";

    // For each exam, get marks + grade
    const examMarks = exams.map((exam) => {
      const examSubject = allExamSubjects.find(
        (es) => es.examId === exam.id && es.subjectId === subjectId
      );
      const markEntry = allMarks.find(
        (m) => m.examId === exam.id && m.subjectId === subjectId
      );

      const maxMarks = examSubject?.maxMarks || 0;
      const marksObtained = markEntry?.marksObtained ?? null;
      const isAbsent = markEntry?.isAbsent || false;

      // Calculate grade for this subject in this exam
      let grade: string | null = null;
      if (marksObtained !== null && maxMarks > 0 && !isAbsent) {
        const percent = (marksObtained / maxMarks) * 100;
        grade = calculateGrade(percent, gradeSettings);
      }

      return {
        examId: exam.id,
        marks: marksObtained,
        maxMarks,
        grade,
        isAbsent,
      };
    });

    // Calculate total for this subject across all exams
    let totalMarks = 0;
    let totalMaxMarks = 0;
    examMarks.forEach((em) => {
      if (em.marks !== null && !em.isAbsent) {
        totalMarks += em.marks;
      }
      totalMaxMarks += em.maxMarks;
    });

    const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    const finalGrade = calculateGrade(percentage, gradeSettings);

    return {
      subjectName,
      examMarks,
      totalMarks,
      totalMaxMarks,
      percentage: Math.round(percentage * 100) / 100,
      finalGrade,
    };
  });

  // 11. Grand total
  const grandTotalMarks = subjectsReport.reduce((sum, s) => sum + s.totalMarks, 0);
  const grandTotalMaxMarks = subjectsReport.reduce((sum, s) => sum + s.totalMaxMarks, 0);
  const overallPercentage = grandTotalMaxMarks > 0
    ? Math.round((grandTotalMarks / grandTotalMaxMarks) * 100 * 100) / 100
    : 0;
  const overallGrade = calculateGrade(overallPercentage, gradeSettings);

  // 12. Calculate rank (compare with all students in the class)
  const enrollments = await prisma.enrollment.findMany({
    where: { classId, academicYearId, tenantId, isDeleted: false },
  });
  const classStudentIds = enrollments.map((e) => e.studentId);

  const allStudentMarks = await prisma.marksEntry.findMany({
    where: {
      studentId: { in: classStudentIds },
      examId: { in: examIds },
      tenantId,
      isDeleted: false,
    },
  });

  // Calculate percentage for each student
  const studentPercentages: { studentId: string; percentage: number }[] = [];
  for (const sId of classStudentIds) {
    const studentMarks = allStudentMarks.filter((m) => m.studentId === sId);
    const sTotalObtained = studentMarks.reduce((sum, m) => sum + m.marksObtained, 0);

    let sTotalMax = 0;
    for (const exam of exams) {
      const examSubs = allExamSubjects.filter((es) => es.examId === exam.id);
      sTotalMax += examSubs.reduce((sum, es) => sum + es.maxMarks, 0);
    }

    const sPercent = sTotalMax > 0 ? (sTotalObtained / sTotalMax) * 100 : 0;
    studentPercentages.push({ studentId: sId, percentage: sPercent });
  }

  studentPercentages.sort((a, b) => b.percentage - a.percentage);
  const rank = studentPercentages.findIndex((sp) => sp.studentId === studentId) + 1;

  // 13. Return response
  return {
    tenant: {
      name: tenant.name,
      address: tenant.address,
      logoUrl: tenant.logoUrl,
      phone: tenant.phone,
    },
    student: {
      name: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
      className: classInfo?.name || "",
      fatherName: student.fatherName,
      motherName: student.motherName || "",         // ✅ NEW
      dob: student.dob                              // ✅ NEW
        ? new Date(student.dob).toLocaleDateString("en-IN")
        : "",
      rollNo: student.rollNumber || "",             // ✅ NEW
      section: sectionName,                         // ✅ NEW
      photoUrl: student.photoUrl || "",             // ✅ NEW
    },
    academicYear: academicYear.name,
    exams: examInfo,
    subjects: subjectsReport,
    grandTotal: {
      totalMarks: grandTotalMarks,
      totalMaxMarks: grandTotalMaxMarks,
      percentage: overallPercentage,
      grade: overallGrade,
      rank,
    },
  };
};

