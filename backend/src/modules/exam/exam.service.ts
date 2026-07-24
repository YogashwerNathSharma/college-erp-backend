

// ═══════════════════════════════════════════════════════
// exam.service.ts — Full Professional Exam Service (FINAL FIXED)
// ═══════════════════════════════════════════════════════

import prisma from "../../utils/prisma";
import {
  CreateExamInput,
  UpdateExamInput,
  AddExamSubjectInput,
  EnterMarksInput,
  CustomSeatingInput,
} from "./exam.types";

// ─────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────
const SEATS_PER_BENCH = 3; // Left, Middle, Right

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
      status: "active",
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
    where: { classId, academicYearId, tenantId, status: "active", isDeleted: false },
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



// ═══════════════════════════════════════════════════════════════
// ========= NEW FEATURES (ADDED — original code above) =========
// ═══════════════════════════════════════════════════════════════

import {
  ExamScheduleInput,
  UpdateExamScheduleInput,
  SeatingInput,
  AdmitCardInput,
  QuestionPaperInput,
  InvigilatorInput,
} from "./exam.types";

// ─────────────────────────────────────────────────────
// 14. CREATE EXAM SCHEDULE
// ─────────────────────────────────────────────────────
export const createExamScheduleService = async (
  data: ExamScheduleInput,
  tenantId: string
) => {
  return prisma.examSchedule.create({
    data: {
      examId: data.examId,
      subjectId: data.subjectId,
      tenantId,
      examDate: new Date(data.examDate),
      startTime: data.startTime,
      endTime: data.endTime,
      roomId: data.roomId,
      isDeleted: false,
    },
  });
};

// ─────────────────────────────────────────────────────
// 15. GET EXAM SCHEDULE
// ─────────────────────────────────────────────────────
export const getExamScheduleService = async (
  examId: string,
  tenantId: string
) => {
  const schedules = await prisma.examSchedule.findMany({
    where: { examId, tenantId, isDeleted: false },
    orderBy: { examDate: "asc" },
  });

  const subjectIds = [...new Set(schedules.map((s) => s.subjectId))];
  const roomIds = [...new Set(schedules.map((s) => s.roomId))];

  const [subjects, rooms] = await Promise.all([
    subjectIds.length > 0 ? prisma.subject.findMany({ where: { id: { in: subjectIds } } }) : [],
    roomIds.length > 0 ? prisma.room.findMany({ where: { id: { in: roomIds } } }) : [],
  ]);

  return schedules.map((sch) => {
    const sub = subjects.find((s: any) => s.id === sch.subjectId);
    const room = rooms.find((r: any) => r.id === sch.roomId);
    return {
      ...sch,
      subjectName: (sub as any)?.name || "Unknown",
      roomName: (room as any)?.name || "Unknown",
      roomCapacity: (room as any)?.capacity || 0,
    };
  });
};

// ─────────────────────────────────────────────────────
// 16. UPDATE EXAM SCHEDULE
// ─────────────────────────────────────────────────────
export const updateExamScheduleService = async (
  scheduleId: string,
  data: UpdateExamScheduleInput,
  tenantId: string
) => {
  return prisma.examSchedule.update({
    where: { id: scheduleId },
    data: {
      ...(data.examDate && { examDate: new Date(data.examDate) }),
      ...(data.startTime && { startTime: data.startTime }),
      ...(data.endTime && { endTime: data.endTime }),
      ...(data.roomId && { roomId: data.roomId }),
    },
  });
};

// ─────────────────────────────────────────────────────
// 17. DELETE EXAM SCHEDULE (soft)
// ─────────────────────────────────────────────────────
export const deleteExamScheduleService = async (
  scheduleId: string,
  tenantId: string
) => {
  await prisma.examSchedule.update({
    where: { id: scheduleId },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return { message: "Schedule deleted successfully" };
};

// ─────────────────────────────────────────────────────
// 18. GENERATE SEATING ARRANGEMENT (Auto by room capacity)
// ─────────────────────────────────────────────────────
export const generateSeatingService = async (
  data: SeatingInput,
  tenantId: string
) => {
  const { examScheduleId, roomId } = data;

  const schedule = await prisma.examSchedule.findFirst({
    where: { id: examScheduleId, tenantId, isDeleted: false },
  });
  if (!schedule) throw new Error("Schedule not found");

  const room = await prisma.room.findFirst({
    where: { id: roomId, tenantId, isDeleted: false },
  });
  if (!room) throw new Error("Room not found");

  const exam = await prisma.exam.findFirst({
    where: { id: schedule.examId, tenantId, isDeleted: false },
  });
  if (!exam) throw new Error("Exam not found");

  // Get students via enrollment
  const enrollmentWhere: any = {
    classId: exam.classId,
    academicYearId: exam.academicYearId,
    tenantId,
    status: "active",
    isDeleted: false,
  };
  if (exam.sectionId) enrollmentWhere.sectionId = exam.sectionId;

  const enrollments = await prisma.enrollment.findMany({ where: enrollmentWhere });
  const studentIds = enrollments.map((e: any) => e.studentId);

  const students = studentIds.length > 0
    ? await prisma.student.findMany({ where: { id: { in: studentIds }, isDeleted: false }, orderBy: { firstName: "asc" } })
    : [];

  if (students.length === 0) throw new Error("No students found");
  if (students.length > (room as any).capacity) {
    throw new Error(`Room capacity (${(room as any).capacity}) is less than students (${students.length})`);
  }

  // Soft delete old seating
  await prisma.seatingArrangement.updateMany({
    where: { examScheduleId, roomId, tenantId },
    data: { isDeleted: true },
  });

  // Auto assign: A1, A2, A3... B1, B2...
  const seatingData = students.map((student: any, index: number) => {
    const benchNum = Math.floor(index / SEATS_PER_BENCH) + 1;
    const seatPositions = ["L", "M", "R"];
    const seatPos = seatPositions[index % SEATS_PER_BENCH];
    return {
      examScheduleId,
      studentId: student.id,
      tenantId,
      seatNo: `B${benchNum}-${seatPos}`,
      roomId,
      isDeleted: false,
    };
  });

  await prisma.seatingArrangement.createMany({ data: seatingData });

  return {
    message: "Seating generated successfully",
    totalSeats: (room as any).capacity,
    assignedSeats: students.length,
    availableSeats: (room as any).capacity - students.length,
  };
};

// ─────────────────────────────────────────────────────
// 19. GET SEATING BY SCHEDULE
// ─────────────────────────────────────────────────────
export const getSeatingByScheduleService = async (
  scheduleId: string,
  tenantId: string
) => {
  const seatings = await prisma.seatingArrangement.findMany({
    where: { examScheduleId: scheduleId, tenantId, isDeleted: false },
    orderBy: { seatNo: "asc" },
  });

  const studentIds = [...new Set(seatings.map((s: any) => s.studentId))];
  const students = studentIds.length > 0
    ? await prisma.student.findMany({ where: { id: { in: studentIds } } })
    : [];

  // Get enrollments (filter by academicYear to avoid duplicates from old years)
  const enrollments = studentIds.length > 0
    ? await prisma.enrollment.findMany({
        where: { studentId: { in: studentIds }, tenantId, isDeleted: false, status: "active" },
      })
    : [];

  // Class names
  const classIds = [...new Set(enrollments.map((e: any) => e.classId))];
  const classesData = classIds.length > 0
    ? await prisma.class.findMany({ where: { id: { in: classIds } } })
    : [];
  const classNameMap: Record<string, string> = {};
  for (const c of classesData as any[]) {
    classNameMap[c.id] = c.name;
  }

  // Map studentId -> classId (first active enrollment wins)
  const studentClassMap: Record<string, string> = {};
  for (const e of enrollments as any[]) {
    if (!studentClassMap[e.studentId]) {
      studentClassMap[e.studentId] = e.classId;
    }
  }

  // Sections
  const sectionIds = [...new Set(enrollments.map((e: any) => e.sectionId).filter(Boolean))];
  const sectionsData = sectionIds.length > 0
    ? await prisma.section.findMany({ where: { id: { in: sectionIds } } })
    : [];
  const sectionNameMap: Record<string, string> = {};
  for (const s of sectionsData as any[]) {
    sectionNameMap[s.id] = s.name;
  }
  const studentSectionMap: Record<string, string> = {};
  for (const e of enrollments as any[]) {
    if (e.sectionId && !studentSectionMap[e.studentId]) {
      studentSectionMap[e.studentId] = e.sectionId;
    }
  }

  // Get all rooms used
  const roomIds = [...new Set(seatings.map((s: any) => s.roomId))];
  const rooms = roomIds.length > 0
    ? await prisma.room.findMany({ where: { id: { in: roomIds } } })
    : [];
  const roomNameMap: Record<string, string> = {};
  for (const r of rooms as any[]) {
    roomNameMap[r.id] = r.name;
  }

  // Build seats array with room info
  const seats = seatings.map((seat: any) => {
    const student = students.find((s: any) => s.id === seat.studentId);
    const classId = studentClassMap[seat.studentId] || "";
    const sectionId = studentSectionMap[seat.studentId] || "";
    return {
      seatNumber: seat.seatNo,
      studentId: seat.studentId,
      studentName: student ? `${(student as any).firstName} ${(student as any).lastName}` : "",
      fatherName: (student as any)?.fatherName || "",
      roomId: seat.roomId,
      roomName: roomNameMap[seat.roomId] || "",
      rollNo: (student as any)?.rollNumber || (student as any)?.admissionNo || "",
      className: classNameMap[classId] || "",
      sectionName: sectionNameMap[sectionId] || "",
      assigned: true,
    };
  });

  return {
    rooms: rooms.map((r: any) => ({ id: r.id, name: r.name })),
    totalAssigned: seatings.length,
    roomCount: roomIds.length,
    seats,
  };
};

// ─────────────────────────────────────────────────────
// 20. GENERATE ADMIT CARDS (Bulk)
// ─────────────────────────────────────────────────────
export const generateAdmitCardsService = async (
  data: AdmitCardInput,
  tenantId: string
) => {
  const exam = await prisma.exam.findFirst({
    where: { id: data.examId, tenantId, isDeleted: false },
  });
  if (!exam) throw new Error("Exam not found");

  // Get students via enrollment
  const enrollmentWhere: any = {
    classId: exam.classId,
    academicYearId: exam.academicYearId,
    tenantId,
    status: "active",
    isDeleted: false,
  };
  if (exam.sectionId) enrollmentWhere.sectionId = exam.sectionId;

  const enrollments = await prisma.enrollment.findMany({ where: enrollmentWhere });
  let studentIds = enrollments.map((e: any) => e.studentId);

  if (data.studentIds && data.studentIds.length > 0) {
    studentIds = studentIds.filter((id: string) => data.studentIds!.includes(id));
  }

  const students = studentIds.length > 0
    ? await prisma.student.findMany({ where: { id: { in: studentIds }, isDeleted: false }, orderBy: { firstName: "asc" } })
    : [];

  if (students.length === 0) throw new Error("No students found");

  // Soft delete old admit cards
  await prisma.admitCard.updateMany({
    where: { examId: data.examId, tenantId },
    data: { isDeleted: true },
  });

  // Generate new
  const admitCards = await Promise.all(
    students.map((student: any, index: number) =>
      prisma.admitCard.create({
        data: {
          examId: data.examId,
          studentId: student.id,
          tenantId,
          rollNo: student.rollNumber || `${index + 1}`,
          isGenerated: true,
          generatedAt: new Date(),
          isDeleted: false,
        },
      })
    )
  );

  return { message: "Admit cards generated successfully", count: admitCards.length };
};

// ─────────────────────────────────────────────────────
// 21. GET ADMIT CARD (Single Student with full details)
// ─────────────────────────────────────────────────────
export const getAdmitCardService = async (
  examId: string,
  studentId: string,
  tenantId: string
) => {
  const admitCard = await prisma.admitCard.findFirst({
    where: { examId, studentId, tenantId, isDeleted: false },
  });
  if (!admitCard) throw new Error("Admit card not found. Please generate first.");

  const exam = await prisma.exam.findFirst({ where: { id: examId, tenantId, isDeleted: false } });
  const student = await prisma.student.findFirst({ where: { id: studentId, isDeleted: false } });
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  if (!exam || !student) throw new Error("Exam or Student not found");

  const cls = await prisma.class.findFirst({ where: { id: exam.classId } });
  const sec = exam.sectionId ? await prisma.section.findFirst({ where: { id: exam.sectionId } }) : null;

  // Get schedule
  const schedules = await prisma.examSchedule.findMany({
    where: { examId, tenantId, isDeleted: false },
    orderBy: { examDate: "asc" },
  });

  const subjectIds = schedules.map((s: any) => s.subjectId);
  const roomIds = schedules.map((s: any) => s.roomId);
  const [subjects, rooms] = await Promise.all([
    subjectIds.length > 0 ? prisma.subject.findMany({ where: { id: { in: subjectIds } } }) : [],
    roomIds.length > 0 ? prisma.room.findMany({ where: { id: { in: roomIds } } }) : [],
  ]);

  const schedule = schedules.map((sch: any) => {
    const sub = subjects.find((s: any) => s.id === sch.subjectId);
    const room = rooms.find((r: any) => r.id === sch.roomId);
    return {
      examDate: sch.examDate,
      startTime: sch.startTime,
      endTime: sch.endTime,
      subject: { name: (sub as any)?.name || "Unknown" },
      room: { name: (room as any)?.name || "Unknown" },
    };
  });

  return {
    admitCard,
    exam: {
      name: exam.name,
      type: exam.type,
      class: { name: cls?.name || "" },
      section: sec ? { name: sec.name } : null,
    },
    student: {
      name: `${student.firstName} ${student.lastName}`,
      rollNo: admitCard.rollNo,
      admissionNo: student.admissionNo || "",
      fatherName: student.fatherName || "",
      motherName: student.motherName || "",
      dob: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "",
      photoUrl: student.photoUrl || "",
      class: { name: cls?.name || "" },
      section: sec ? { name: sec.name } : null,
    },
    schedule,
    tenant: {
      name: (tenant as any)?.name || "",
      address: (tenant as any)?.address || "",
      phone: (tenant as any)?.phone || "",
      email: (tenant as any)?.email || "",
      logoUrl: (tenant as any)?.logoUrl || "",
    },
  };
};

// ─────────────────────────────────────────────────────
// 22. GET ALL ADMIT CARDS (for an Exam)
// ─────────────────────────────────────────────────────
export const getAdmitCardsService = async (
  examId: string,
  tenantId: string
) => {
  const admitCards = await prisma.admitCard.findMany({
    where: { examId, tenantId, isDeleted: false },
    orderBy: { rollNo: "asc" },
  });

  const studentIds = admitCards.map((ac: any) => ac.studentId);
  const students = studentIds.length > 0
    ? await prisma.student.findMany({ where: { id: { in: studentIds } } })
    : [];

  return admitCards.map((ac: any) => {
    const student = students.find((s: any) => s.id === ac.studentId);
    return {
      ...ac,
      student: {
        id: (student as any)?.id || "",
        name: student ? `${(student as any).firstName} ${(student as any).lastName}` : "Unknown",
        rollNo: ac.rollNo,
        photoUrl: (student as any)?.photoUrl || "",
        fatherName: (student as any)?.fatherName || "",
      },
    };
  });
};

// ─────────────────────────────────────────────────────
// 23. UPLOAD QUESTION PAPER
// ─────────────────────────────────────────────────────
export const uploadQuestionPaperService = async (
  data: QuestionPaperInput,
  tenantId: string,
  userId: string
) => {
  return prisma.questionPaper.create({
    data: {
      examId: data.examId,
      subjectId: data.subjectId,
      tenantId,
      title: data.title,
      fileUrl: data.fileUrl,
      uploadedBy: userId,
      isDeleted: false,
    },
  });
};

// ─────────────────────────────────────────────────────
// 24. GET QUESTION PAPERS
// ─────────────────────────────────────────────────────
export const getQuestionPapersService = async (
  examId: string,
  tenantId: string
) => {
  const papers = await prisma.questionPaper.findMany({
    where: { examId, tenantId, isDeleted: false },
    orderBy: { uploadedAt: "desc" },
  });

  const subjectIds = papers.map((p: any) => p.subjectId);
  const subjects = subjectIds.length > 0
    ? await prisma.subject.findMany({ where: { id: { in: subjectIds } } })
    : [];

  return papers.map((p: any) => {
    const sub = subjects.find((s: any) => s.id === p.subjectId);
    return { ...p, subjectName: (sub as any)?.name || "Unknown" };
  });
};

// ─────────────────────────────────────────────────────
// 25. DELETE QUESTION PAPER
// ─────────────────────────────────────────────────────
export const deleteQuestionPaperService = async (
  paperId: string,
  tenantId: string
) => {
  await prisma.questionPaper.update({
    where: { id: paperId },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return { message: "Question paper deleted successfully" };
};

// ─────────────────────────────────────────────────────
// 26. ASSIGN INVIGILATOR
// ─────────────────────────────────────────────────────
export const assignInvigilatorService = async (
  data: InvigilatorInput,
  tenantId: string
) => {
  const existing = await prisma.invigilatorAssignment.findFirst({
    where: {
      examScheduleId: data.examScheduleId,
      teacherId: data.teacherId,
      tenantId,
      isDeleted: false,
    },
  });
  if (existing) throw new Error("Teacher already assigned to this schedule");

  return prisma.invigilatorAssignment.create({
    data: {
      examScheduleId: data.examScheduleId,
      teacherId: data.teacherId,
      tenantId,
      role: data.role,
      isDeleted: false,
    },
  });
};

// ─────────────────────────────────────────────────────
// 27. GET INVIGILATORS
// ─────────────────────────────────────────────────────
export const getInvigilatorsService = async (
  scheduleId: string,
  tenantId: string
) => {
  const assignments = await prisma.invigilatorAssignment.findMany({
    where: { examScheduleId: scheduleId, tenantId, isDeleted: false },
  });

  const teacherIds = assignments.map((a: any) => a.teacherId);
  const teachers = teacherIds.length > 0
    ? await prisma.teacher.findMany({ where: { id: { in: teacherIds } } })
    : [];

  return assignments.map((a: any) => {
    const teacher = teachers.find((t: any) => t.id === a.teacherId);
    return { ...a, teacherName: (teacher as any)?.name || "Unknown" };
  });
};

// ─────────────────────────────────────────────────────
// 28. REMOVE INVIGILATOR
// ─────────────────────────────────────────────────────
export const removeInvigilatorService = async (
  assignmentId: string,
  tenantId: string
) => {
  await prisma.invigilatorAssignment.update({
    where: { id: assignmentId },
    data: { isDeleted: true },
  });
  return { message: "Invigilator removed successfully" };
};

// ─────────────────────────────────────────────────────
// 29. EXAM DASHBOARD STATS
// ─────────────────────────────────────────────────────
export const getExamDashboardService = async (
  tenantId: string,
  academicYearId?: string,
  classId?: string
) => {
  const examWhere: any = { tenantId, isDeleted: false };
  if (academicYearId) examWhere.academicYearId = academicYearId;
  if (classId) examWhere.classId = classId;

  const [totalExams, totalStudents, totalSubjects, publishedResults] = await Promise.all([
    prisma.exam.count({ where: examWhere }),
    prisma.student.count({ where: { tenantId, isDeleted: false } }),
    prisma.subject.count({ where: { tenantId, isDeleted: false } }),
    prisma.exam.count({ where: { ...examWhere, isPublished: true } }),
  ]);

  // Upcoming exams
  const upcomingExams = await prisma.exam.findMany({
    where: { ...examWhere, startDate: { gte: new Date() } },
    orderBy: { startDate: "asc" },
    take: 5,
  });

  const classIds = [...new Set(upcomingExams.map((e) => e.classId))];
  const classes = await prisma.class.findMany({ where: { id: { in: classIds } } });

  const enrichedUpcoming = upcomingExams.map((exam) => {
    const cls = classes.find((c: any) => c.id === exam.classId);
    return { ...exam, className: cls?.name || "N/A" };
  });

  return {
    stats: { totalExams, totalStudents, totalSubjects, publishedResults },
    upcomingExams: enrichedUpcoming,
  };
};

// ─────────────────────────────────────────────────────
// 30. EXAM REPORTS
// ─────────────────────────────────────────────────────
export const getExamReportsService = async (
  tenantId: string,
  examId: string,
  reportType: string,
  options?: { subjectId?: string }
) => {
  switch (reportType) {
    case "result_summary": {
      const results = await prisma.resultSummary.findMany({
        where: { examId, tenantId, isDeleted: false },
        orderBy: { rank: "asc" },
      });
      const studentIds = results.map((r) => r.studentId);
      const students = await prisma.student.findMany({ where: { id: { in: studentIds } } });
      return results.map((r) => {
        const s = students.find((st: any) => st.id === r.studentId);
        return { ...r, studentName: s ? `${(s as any).firstName} ${(s as any).lastName}` : "", admissionNo: (s as any)?.admissionNo || "" };
      });
    }

    case "topper_list": {
      const results = await prisma.resultSummary.findMany({
        where: { examId, tenantId, isDeleted: false, status: "PASS" },
        orderBy: { percentage: "desc" },
        take: 10,
      });
      const studentIds = results.map((r) => r.studentId);
      const students = await prisma.student.findMany({ where: { id: { in: studentIds } } });
      return results.map((r, i) => {
        const s = students.find((st: any) => st.id === r.studentId);
        const { rank: _oldRank, ...rest } = r;
        return { ...rest, rank: i + 1, studentName: s ? `${(s as any).firstName} ${(s as any).lastName}` : "", admissionNo: (s as any)?.admissionNo || "" };
      });
    }

    case "pass_fail": {
      const results = await prisma.resultSummary.findMany({
        where: { examId, tenantId, isDeleted: false },
      });
      const total = results.length;
      const passed = results.filter((r) => r.status === "PASS").length;
      return { total, passed, failed: total - passed, passPercentage: total > 0 ? parseFloat(((passed / total) * 100).toFixed(2)) : 0 };
    }

    case "subject_wise": {
      const examSubjects = await prisma.examSubject.findMany({ where: { examId, tenantId, isDeleted: false } });
      const subIds = examSubjects.map((es) => es.subjectId);
      const subjects = await prisma.subject.findMany({ where: { id: { in: subIds } } });
      const marks = await prisma.marksEntry.findMany({ where: { examId, tenantId, isDeleted: false } });

      return examSubjects.map((es) => {
        const sub = subjects.find((s: any) => s.id === es.subjectId);
        const subMarks = marks.filter((m) => m.subjectId === es.subjectId);
        const totalStudents = subMarks.length;
        const passed = subMarks.filter((m) => !m.isAbsent && m.marksObtained >= es.passingMarks).length;
        const highest = subMarks.length > 0 ? Math.max(...subMarks.map((m) => m.marksObtained)) : 0;
        const avg = subMarks.length > 0 ? subMarks.reduce((sum, m) => sum + m.marksObtained, 0) / subMarks.length : 0;
        return {
          subjectName: (sub as any)?.name || "Unknown",
          maxMarks: es.maxMarks,
          totalStudents,
          passed,
          failed: totalStudents - passed,
          passPercentage: totalStudents > 0 ? parseFloat(((passed / totalStudents) * 100).toFixed(2)) : 0,
          highest,
          average: parseFloat(avg.toFixed(2)),
        };
      });
    }

    case "grade_report": {
      const results = await prisma.resultSummary.findMany({ where: { examId, tenantId, isDeleted: false } });
      const gradeMap: Record<string, number> = {};
      results.forEach((r) => { gradeMap[r.grade || "Ungraded"] = (gradeMap[r.grade || "Ungraded"] || 0) + 1; });
      return Object.entries(gradeMap).map(([grade, count]) => ({ grade, count }));
    }

    case "attendance": {
      const marks = await prisma.marksEntry.findMany({ where: { examId, tenantId, isDeleted: false } });
      const studentIds = [...new Set(marks.map((m) => m.studentId))];
      const students = await prisma.student.findMany({ where: { id: { in: studentIds } } });
      const examSubjects = await prisma.examSubject.findMany({ where: { examId, tenantId, isDeleted: false } });

      return studentIds.map((sid) => {
        const student = students.find((s: any) => s.id === sid);
        const studentMarks = marks.filter((m) => m.studentId === sid);
        const absentCount = studentMarks.filter((m) => m.isAbsent).length;
        const presentCount = examSubjects.length - absentCount;
        return {
          studentName: student ? `${(student as any).firstName} ${(student as any).lastName}` : "Unknown",
          admissionNo: (student as any)?.admissionNo || "",
          totalSubjects: examSubjects.length,
          present: presentCount,
          absent: absentCount,
          attendancePercentage: examSubjects.length > 0 ? parseFloat(((presentCount / examSubjects.length) * 100).toFixed(2)) : 0,
        };
      });
    }

    case "marks": {
      const marks = await prisma.marksEntry.findMany({
        where: { examId, tenantId, isDeleted: false, ...(options?.subjectId && { subjectId: options.subjectId }) },
      });
      const studentIds = [...new Set(marks.map((m) => m.studentId))];
      const subIds = [...new Set(marks.map((m) => m.subjectId))];
      const [students, subjects] = await Promise.all([
        prisma.student.findMany({ where: { id: { in: studentIds } } }),
        prisma.subject.findMany({ where: { id: { in: subIds } } }),
      ]);
      return marks.map((m) => {
        const student = students.find((s: any) => s.id === m.studentId);
        const sub = subjects.find((s: any) => s.id === m.subjectId);
        return {
          studentName: student ? `${(student as any).firstName} ${(student as any).lastName}` : "Unknown",
          admissionNo: (student as any)?.admissionNo || "",
          subjectName: (sub as any)?.name || "Unknown",
          marksObtained: m.marksObtained,
          isAbsent: m.isAbsent,
        };
      });
    }

    default:
      throw new Error("Invalid report type");
  }
};

// ═══════════════════════════════════════════════════════════════
// CUSTOM SEATING ARRANGEMENT — Multi-class, Configurable
// ═══════════════════════════════════════════════════════════════

//
// Interleave students from different classes so no two from same class are adjacent

// ═══════════════════════════════════════════════════════════════════════════
// BENCH-AWARE SEATING ENGINE v2
// ═══════════════════════════════════════════════════════════════════════════
// Rules:
//   1. Each bench has 3 seats: Left (col 0), Middle (col 1), Right (col 2)
//   2. No bench may have 2 students from the same class
//   3. Adjacent benches (front/back) must not have the same class in ANY seat
//   4. One student = one seat only (no duplicates)
//   5. Continuous allocation: exhaust current class, then seamlessly move to next
//   6. Sequential room fill: fill rooms one after another
//   7. Backtracking when constraints cannot be satisfied
// ═══════════════════════════════════════════════════════════════════════════

function gridPlaceNoAdjacent(
  students: any[],
  rows: number,
  cols: number
): { placed: any[]; overflow: any[] } {
  const maxBenches = rows;
  const gridSize = maxBenches * SEATS_PER_BENCH;

  if (students.length === 0) return { placed: [], overflow: [] };

  // Build class queues in order of appearance (continuous allocation)
  const classOrder: string[] = [];
  const classQueues: Record<string, any[]> = {};
  for (const s of students) {
    const cid = s._classId || "unknown";
    if (!classQueues[cid]) {
      classQueues[cid] = [];
      classOrder.push(cid);
    }
    classQueues[cid].push(s);
  }

  const totalClasses = classOrder.length;

  // If only 1 class, no mixing possible — fill sequentially
  if (totalClasses === 1) {
    return { placed: students.slice(0, gridSize), overflow: students.slice(gridSize) };
  }

  // Grid: benches[benchIdx][seatIdx]
  const benches: (any | null)[][] = Array.from({ length: maxBenches }, () => Array(SEATS_PER_BENCH).fill(null));
  const benchClasses: (string | null)[][] = Array.from({ length: maxBenches }, () => Array(SEATS_PER_BENCH).fill(null));
  const assignedIds = new Set<string>();

  // Stagger class pointers per column for maximum diversity
  const colClassPointer: number[] = [];
  for (let col = 0; col < SEATS_PER_BENCH; col++) {
    colClassPointer.push(col % totalClasses);
  }

  function pullFromClass(classId: string): any | null {
    const queue = classQueues[classId];
    if (!queue) return null;
    while (queue.length > 0) {
      const student = queue.shift()!;
      if (!assignedIds.has(student.id)) return student;
    }
    return null;
  }

  // Constraint check: no same class on bench + no same class on adjacent benches
  function canPlaceClass(benchIdx: number, seatIdx: number, classId: string): boolean {
    // Same bench check
    for (let s = 0; s < SEATS_PER_BENCH; s++) {
      if (s !== seatIdx && benchClasses[benchIdx][s] === classId) return false;
    }
    // Previous bench (front) — same seat position only (directly in front)
    if (benchIdx > 0) {
      if (benchClasses[benchIdx - 1][seatIdx] === classId) return false;
    }
    // Next bench (back) — same seat position only (directly behind)
    if (benchIdx < maxBenches - 1) {
      if (benchClasses[benchIdx + 1][seatIdx] === classId) return false;
    }
    return true;
  }

  function findNextClass(benchIdx: number, seatIdx: number): string | null {
    const startPointer = colClassPointer[seatIdx];
    for (let attempt = 0; attempt < totalClasses; attempt++) {
      const classIdx = (startPointer + attempt) % totalClasses;
      const classId = classOrder[classIdx];
      if (!classQueues[classId] || classQueues[classId].length === 0) continue;
      if (canPlaceClass(benchIdx, seatIdx, classId)) {
        // Advance pointer to NEXT class for this column (ensures rotation across benches)
        colClassPointer[seatIdx] = (classIdx + 1) % totalClasses;
        return classId;
      }
    }
    return null;
  }

  let totalPlaced = 0;
  let backtrackCount = 0;
  const MAX_BACKTRACKS = 5000;

  for (let bench = 0; bench < maxBenches; bench++) {
    const remainingTotal = Object.values(classQueues).reduce((sum, q) => sum + q.length, 0);
    if (remainingTotal === 0) break;

    let benchDone = false;
    let benchAttempts = 0;

    while (!benchDone && benchAttempts < totalClasses * 3) {
      benchAttempts++;
      let allOk = true;

      for (let seat = 0; seat < SEATS_PER_BENCH; seat++) {
        if (benches[bench][seat] !== null) continue;

        const remaining = Object.values(classQueues).reduce((sum, q) => sum + q.length, 0);
        if (remaining === 0) { allOk = true; break; }

        const classId = findNextClass(bench, seat);
        if (classId) {
          const student = pullFromClass(classId);
          if (student) {
            benches[bench][seat] = student;
            benchClasses[bench][seat] = classId;
            assignedIds.add(student.id);
            totalPlaced++;
          } else {
            allOk = false; break;
          }
        } else {
          // Backtrack or fallback
          allOk = false;
          if (backtrackCount < MAX_BACKTRACKS && seat > 0) {
            backtrackCount++;
            const prev = seat - 1;
            const prevStudent = benches[bench][prev];
            if (prevStudent) {
              const prevCid = benchClasses[bench][prev]!;
              classQueues[prevCid].unshift(prevStudent);
              assignedIds.delete(prevStudent.id);
              benches[bench][prev] = null;
              benchClasses[bench][prev] = null;
              totalPlaced--;
              colClassPointer[prev] = (colClassPointer[prev] + 1) % totalClasses;
            }
          } else {
            // Fallback 1: try same-bench + vertical constraint (full rules)
            let placed = false;
            for (const cid of classOrder) {
              if (!classQueues[cid] || classQueues[cid].length === 0) continue;
              if (canPlaceClass(bench, seat, cid)) {
                const student = pullFromClass(cid);
                if (student) {
                  benches[bench][seat] = student;
                  benchClasses[bench][seat] = cid;
                  assignedIds.add(student.id);
                  totalPlaced++;
                  placed = true; break;
                }
              }
            }
            // Fallback 2: relax vertical, keep same-bench only
            if (!placed) {
             for (const cid of classOrder) {
              if (!classQueues[cid] || classQueues[cid].length === 0) continue;
              let sameBench = false;
              for (let s = 0; s < SEATS_PER_BENCH; s++) {
                if (s !== seat && benchClasses[bench][s] === cid) { sameBench = true; break; }
              }
              if (sameBench) continue;
              const student = pullFromClass(cid);
              if (student) {
                benches[bench][seat] = student;
                benchClasses[bench][seat] = cid;
                assignedIds.add(student.id);
                totalPlaced++;
                placed = true; break;
              }
              }
            }
            // Fallback 3 (ultimate): any student at all
            if (!placed) {
              for (const cid of classOrder) {
                if (!classQueues[cid] || classQueues[cid].length === 0) continue;
                const student = pullFromClass(cid);
                if (student) {
                  benches[bench][seat] = student;
                  benchClasses[bench][seat] = cid;
                  assignedIds.add(student.id);
                  totalPlaced++;
                  placed = true; break;
                }
              }
            }
            if (!placed) { allOk = true; break; }
          }
          break;
        }
      }
      if (allOk) benchDone = true;
    }
  }

  // Collect in bench-row order
  const placed: any[] = [];
  for (let b = 0; b < maxBenches; b++) {
    for (let s = 0; s < SEATS_PER_BENCH; s++) {
      if (benches[b][s] !== null) placed.push(benches[b][s]);
    }
  }

  // Overflow: remaining students
  const overflow: any[] = [];
  for (const cid of classOrder) {
    if (classQueues[cid]) overflow.push(...classQueues[cid]);
  }

  return { placed, overflow };
}


function interleaveByClass(students: any[]): any[] {
  const groups: Record<string, any[]> = {};
  const classOrder: string[] = [];
  for (const s of students) {
    const key = s._classId || "unknown";
    if (!groups[key]) { groups[key] = []; classOrder.push(key); }
    groups[key].push(s);
  }
  if (classOrder.length <= 1) return students;

  const result: any[] = [];
  let hasMore = true;
  let safety = 0;
  while (hasMore) {
    hasMore = false;
    for (const key of classOrder) {
      if (groups[key].length > 0) { result.push(groups[key].shift()!); hasMore = true; }
    }
    safety++;
    if (safety > 500000) break;
  }
  return result;
}


function shuffleArray(arr: any[]): any[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Custom Seating Generation — Admin chooses capacity, classes, mixing rules
 */
export const generateCustomSeatingService = async (
  data: CustomSeatingInput,
  tenantId: string
) => {
  const { examScheduleId, roomId, rows, cols, classIds, mixClasses, aiInstruction, roomIds } = data;

  // Rooms to use
  const allRoomIds = (roomIds && roomIds.length > 0) ? roomIds : [roomId];

  console.log("\n🪑 [SEATING] Rooms:", allRoomIds.length, "| Classes:", classIds.length);

  // Validate schedule
  const schedule = await prisma.examSchedule.findFirst({
    where: { id: examScheduleId, tenantId, isDeleted: false },
  });

  // Validate rooms
  const roomsData = await prisma.room.findMany({
    where: { id: { in: allRoomIds }, tenantId, isDeleted: false },
  });
  if (roomsData.length === 0) throw new Error("No valid rooms found");

  // Get exam — try from schedule, fallback to examScheduleId being an exam ID directly (no schedules case)
  let exam: any = null;
  let actualScheduleId = examScheduleId;

  if (schedule) {
    exam = await prisma.exam.findFirst({
      where: { id: schedule.examId, tenantId, isDeleted: false },
    });
  }
  if (!exam) {
    // Fallback: examScheduleId might be the exam ID itself (when no schedules exist)
    exam = await prisma.exam.findFirst({
      where: { id: examScheduleId, tenantId, isDeleted: false },
    });
    if (exam) {
      // Create a temp schedule so we can store seating (FK constraint requires valid examScheduleId)
      // Get a valid subjectId for this exam's class
      const firstSubject = await prisma.subject.findFirst({
        where: { classId: exam.classId, tenantId },
      });
      if (!firstSubject) throw new Error("No subjects found for this class. Please add subjects first.");

      const tempSchedule = await prisma.examSchedule.create({
        data: {
          examId: exam.id,
          subjectId: firstSubject.id,
          tenantId,
          examDate: new Date(),
          startTime: "09:00",
          endTime: "12:00",
          roomId: allRoomIds[0],
        },
      });
      actualScheduleId = tempSchedule.id;
      console.log("🪑 [SEATING] Created temp schedule:", tempSchedule.id, "for exam:", exam.id);
    }
  }
  if (!exam) throw new Error("Exam not found. Please create an exam schedule first.");

  // Fetch students from selected classes
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: { in: classIds },
      academicYearId: exam.academicYearId,
      tenantId,
      status: "active",
      isDeleted: false,
    },
  });

  // Deduplicate students (one per studentId)
  const studentIds = [...new Set(enrollments.map((e: any) => e.studentId))];
  if (studentIds.length === 0) throw new Error("No students found in selected classes");

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, isDeleted: false },
    orderBy: { firstName: "asc" },
  });

  console.log("🪑 [SEATING] Enrollments:", enrollments.length, "| Unique studentIds:", studentIds.length, "| Students found:", students.length);
  
  // Extra safety: check for duplicate student names (debug)
  const nameCount: Record<string, number> = {};
  students.forEach((s: any) => {
    const name = s.firstName + " " + s.lastName;
    nameCount[name] = (nameCount[name] || 0) + 1;
  });
  const dupes = Object.entries(nameCount).filter(([_, c]) => c > 1);
  if (dupes.length > 0) console.log("⚠️ [SEATING] Duplicate names:", dupes.map(([n, c]) => n + ":" + c).join(", "));

  // Map student → classId
  const enrollmentMap: Record<string, string> = {};
  for (const e of enrollments as any[]) {
    if (!enrollmentMap[e.studentId]) {
      enrollmentMap[e.studentId] = e.classId;
    }
  }

  // Class names
  const classesDataList = await prisma.class.findMany({ where: { id: { in: classIds } } });
  const classNameMap: Record<string, string> = {};
  for (const c of classesDataList as any[]) {
    classNameMap[c.id] = c.name;
  }

  // Augment students
  let augmented = students.map((s: any) => ({
    ...s,
    _classId: enrollmentMap[s.id] || "",
    _className: classNameMap[enrollmentMap[s.id] || ""] || "",
  }));

  // Shuffle if requested
  if (aiInstruction && aiInstruction.toLowerCase().includes("random")) {
    augmented = shuffleArray(augmented);
  }

  // *** HARD DELETE all old seating for this schedule (no soft-delete bloat) ***
  await prisma.seatingArrangement.deleteMany({
    where: { examScheduleId: actualScheduleId, tenantId },
  });

  // Fill rooms one by one with grid-aware placement
  let remainingStudents = [...augmented];
  let totalAssigned = 0;
  const roomAssignments: { roomId: string; roomName: string; count: number }[] = [];

  for (let roomIndex = 0; roomIndex < allRoomIds.length; roomIndex++) {
    if (remainingStudents.length === 0) break;

    const currentRoomId = allRoomIds[roomIndex];
    const roomInfo = roomsData.find((r: any) => r.id === currentRoomId);
    // Use actual room capacity from DB; fallback to frontend-provided rows
    const roomCapacity = (roomInfo as any)?.capacity || (rows * SEATS_PER_BENCH);
    const roomBenches = Math.ceil(roomCapacity / SEATS_PER_BENCH);
    const gridSize = roomBenches * SEATS_PER_BENCH;

    let placed: any[];
    let overflow: any[];

    if (mixClasses && classIds.length > 1) {
      // Grid placement with no-adjacent-same-class rule
      const result = gridPlaceNoAdjacent(remainingStudents, roomBenches, SEATS_PER_BENCH);
      placed = result.placed;
      overflow = result.overflow;
    } else {
      // Sequential fill (no mixing needed for single class)
      placed = remainingStudents.slice(0, gridSize);
      overflow = remainingStudents.slice(gridSize);
    }

    // STRICT: never exceed grid capacity
    if (placed.length > gridSize) {
      overflow = [...placed.slice(gridSize), ...overflow];
      placed = placed.slice(0, gridSize);
    }

    // Create seating records
    const seatingData = placed.map((student: any, index: number) => {
      const benchNum = Math.floor(index / SEATS_PER_BENCH) + 1;
      const seatPositions = ["L", "M", "R"];
      const seatPos = seatPositions[index % SEATS_PER_BENCH];
      return {
        examScheduleId: actualScheduleId,
        studentId: student.id,
        tenantId,
        seatNo: `B${benchNum}-${seatPos}`,
        roomId: currentRoomId,
        isDeleted: false,
      };
    });

    if (seatingData.length > 0) {
      await prisma.seatingArrangement.createMany({ data: seatingData });
    }

    totalAssigned += seatingData.length;
    remainingStudents = overflow;

    roomAssignments.push({
      roomId: currentRoomId,
      roomName: (roomInfo as any)?.name || `Room ${roomIndex + 1}`,
      count: seatingData.length,
    });

    console.log(`🪑 [SEATING] Room ${roomIndex + 1} (${(roomInfo as any)?.name}): ${seatingData.length}/${gridSize} seats filled`);
  }

  const unassigned = remainingStudents.length;
  console.log("🪑 [SEATING] DONE! Assigned:", totalAssigned, "| Unassigned:", unassigned);

  // If copyToScheduleIds provided, duplicate same seating to other schedules
  const { copyToScheduleIds } = data;
  if (copyToScheduleIds && copyToScheduleIds.length > 0) {
    console.log("🪑 [SEATING] Copying to", copyToScheduleIds.length, "other schedules...");

    // Get all seating records just created for the primary schedule
    const primaryRecords = await prisma.seatingArrangement.findMany({
      where: { examScheduleId: actualScheduleId, tenantId, isDeleted: false },
    });

    for (const targetScheduleId of copyToScheduleIds) {
      // Hard delete old records for target schedule
      await prisma.seatingArrangement.deleteMany({
        where: { examScheduleId: targetScheduleId, tenantId },
      });

      // Copy all records with new examScheduleId
      const copyData = primaryRecords.map((r: any) => ({
        examScheduleId: targetScheduleId,
        studentId: r.studentId,
        tenantId: r.tenantId,
        seatNo: r.seatNo,
        roomId: r.roomId,
        isDeleted: false,
      }));

      if (copyData.length > 0) {
        await prisma.seatingArrangement.createMany({ data: copyData });
      }
    }
    console.log("🪑 [SEATING] Copied to all schedules! Total records:", primaryRecords.length, "x", (copyToScheduleIds.length + 1));
  }

  return {
    message: unassigned > 0
      ? `${totalAssigned} students assigned. ${unassigned} students remaining — select more rooms to assign them.`
      : `All ${totalAssigned} students assigned successfully across ${roomAssignments.length} room(s).`,
    total: totalAssigned,
    unassigned,
    rows,
    cols,
    gridSize,
    mixClasses,
    classesUsed: classIds.length,
    totalStudents: augmented.length,
    roomsUsed: roomAssignments.length,
    roomAssignments,
  };
};


function applyAiInstruction(
  students: any[],
  instruction: string,
  classNameMap: Record<string, string>,
  rows: number,
  cols: number
): any[] {
  const lower = instruction.toLowerCase();

  // Pattern: "random" — shuffle students before bench placement
  if (lower.includes("random")) {
    return shuffleArray(students);
  }

  // Pattern: "alternate" — interleave classes for better distribution
  if (lower.includes("alternate") || lower.includes("alternating")) {
    return interleaveByClass(students);
  }

  // Pattern: "reverse" — reverse order
  if (lower.includes("reverse")) {
    return [...students].reverse();
  }

  // Default: interleave for maximum constraint satisfaction
  return interleaveByClass(students);
}

/**
 * AI Auto-Arrange (same logic, separate endpoint for future LLM integration)
 */
export const aiArrangeSeatingService = async (
  data: CustomSeatingInput,
  tenantId: string
) => {
  // For now, same as custom with AI instruction enforced
  if (!data.aiInstruction) {
    data.aiInstruction = "alternate classes randomly ensuring no same-class adjacent";
  }
  return generateCustomSeatingService(data, tenantId);
};

