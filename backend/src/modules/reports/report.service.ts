import prisma from "../../config/prisma";
import { generateExcel } from "./helpers/excel.helper";
import { generatePDF } from "./helpers/pdf.helper";
import { computeAnalytics } from "./helpers/analytics.helper";

// ============================================
// STUDENT REPORT
// ============================================

export const generateStudentReport = async (tenantId: string, filters: any) => {
  const { classId, sectionId, academicYearId, format } = filters;

  const where: any = { tenantId, isDeleted: false };
  if (classId || sectionId || academicYearId) {
    where.enrollments = {
      some: {
        isDeleted: false,
        ...(classId && { classId }),
        ...(sectionId && { sectionId }),
        ...(academicYearId && { academicYearId }),
      },
    };
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      enrollments: {
        where: { isDeleted: false },
        include: { class: true, section: true, academicYear: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { firstName: "asc" },
  });

  const reportData = students.map((s) => ({
    admissionNo: s.admissionNo,
    name: `${s.firstName} ${s.lastName}`,
    class: s.enrollments[0]?.class?.name || "N/A",
    section: s.enrollments[0]?.section?.name || "N/A",
    gender: s.gender,
    dob: s.dob,
    fatherName: s.fatherName,
    phone: s.phone || s.fatherPhone,
    status: s.status,
  }));

  if (format === "excel") {
    const buffer = await generateExcel("Student Report", reportData, [
      { header: "Adm No", key: "admissionNo" },
      { header: "Name", key: "name" },
      { header: "Class", key: "class" },
      { header: "Section", key: "section" },
      { header: "Gender", key: "gender" },
      { header: "DOB", key: "dob" },
      { header: "Father Name", key: "fatherName" },
      { header: "Phone", key: "phone" },
      { header: "Status", key: "status" },
    ]);
    return { buffer, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename: "student-report.xlsx" };
  }

  if (format === "pdf") {
    const buffer = await generatePDF("Student Report", reportData);
    return { buffer, contentType: "application/pdf", filename: "student-report.pdf" };
  }

  return { data: reportData, total: reportData.length };
};

// ============================================
// FEE REPORT
// ============================================

export const generateFeeReport = async (tenantId: string, filters: any) => {
  const { academicYearId, classId, status, format, startDate, endDate } = filters;

  const where: any = { tenantId, isDeleted: false };
  if (academicYearId) where.enrollment = { academicYearId };
  if (classId) where.enrollment = { ...where.enrollment, classId };
  if (status === "paid") where.balanceAmount = 0;
  if (status === "pending") where.balanceAmount = { gt: 0 };

  const fees = await prisma.studentFee.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
          class: { select: { name: true } },
        },
      },
      feeHead: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const reportData = fees.map((f) => ({
    admissionNo: f.enrollment?.student?.admissionNo || "N/A",
    studentName: `${f.enrollment?.student?.firstName} ${f.enrollment?.student?.lastName}`,
    class: f.enrollment?.class?.name || "N/A",
    feeHead: f.feeHead?.name || "N/A",
    totalAmount: f.totalAmount,
    paidAmount: f.paidAmount,
    balanceAmount: f.balanceAmount,
    dueDate: f.dueDate,
    status: f.balanceAmount === 0 ? "Paid" : "Pending",
  }));

  // Summary
  const summary = {
    totalFees: reportData.reduce((sum, r) => sum + r.totalAmount, 0),
    totalCollected: reportData.reduce((sum, r) => sum + r.paidAmount, 0),
    totalPending: reportData.reduce((sum, r) => sum + r.balanceAmount, 0),
    totalStudents: new Set(reportData.map((r) => r.admissionNo)).size,
  };

  if (format === "excel") {
    const buffer = await generateExcel("Fee Report", reportData, [
      { header: "Adm No", key: "admissionNo" },
      { header: "Student", key: "studentName" },
      { header: "Class", key: "class" },
      { header: "Fee Head", key: "feeHead" },
      { header: "Total", key: "totalAmount" },
      { header: "Paid", key: "paidAmount" },
      { header: "Balance", key: "balanceAmount" },
      { header: "Status", key: "status" },
    ]);
    return { buffer, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename: "fee-report.xlsx" };
  }

  if (format === "pdf") {
    const buffer = await generatePDF("Fee Report", reportData);
    return { buffer, contentType: "application/pdf", filename: "fee-report.pdf" };
  }

  return { data: reportData, summary, total: reportData.length };
};

// ============================================
// ATTENDANCE REPORT
// ============================================

export const generateAttendanceReport = async (tenantId: string, filters: any) => {
  const { classId, sectionId, month, year, format } = filters;

  const targetMonth = month || new Date().getMonth() + 1;
  const targetYear = year || new Date().getFullYear();

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0);

  const where: any = { tenantId, date: { gte: startDate, lte: endDate } };
  if (classId) where.classId = classId;
  if (sectionId) where.sectionId = sectionId;

  const attendance = await prisma.attendance.findMany({
    where,
    include: {
      student: { select: { firstName: true, lastName: true, admissionNo: true } },
    },
  });

  // Group by student
  const studentMap: Record<string, any> = {};
  for (const record of attendance) {
    const key = record.studentId;
    if (!studentMap[key]) {
      studentMap[key] = {
        admissionNo: record.student?.admissionNo || "N/A",
        name: `${record.student?.firstName} ${record.student?.lastName}`,
        totalDays: 0,
        present: 0,
        absent: 0,
        late: 0,
      };
    }
    studentMap[key].totalDays++;
    if (record.status === "PRESENT" || record.status === "present") studentMap[key].present++;
    else if (record.status === "ABSENT" || record.status === "absent") studentMap[key].absent++;
    else if (record.status === "LATE" || record.status === "late") studentMap[key].late++;
  }

  const reportData = Object.values(studentMap).map((s: any) => ({
    ...s,
    percentage: s.totalDays > 0 ? Math.round((s.present / s.totalDays) * 100) : 0,
  }));

  if (format === "excel") {
    const buffer = await generateExcel("Attendance Report", reportData, [
      { header: "Adm No", key: "admissionNo" },
      { header: "Name", key: "name" },
      { header: "Total Days", key: "totalDays" },
      { header: "Present", key: "present" },
      { header: "Absent", key: "absent" },
      { header: "Late", key: "late" },
      { header: "Percentage", key: "percentage" },
    ]);
    return { buffer, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename: "attendance-report.xlsx" };
  }

  if (format === "pdf") {
    const buffer = await generatePDF("Attendance Report", reportData);
    return { buffer, contentType: "application/pdf", filename: "attendance-report.pdf" };
  }

  return { data: reportData, month: targetMonth, year: targetYear, total: reportData.length };
};

// ============================================
// EXAM ANALYTICS
// ============================================

export const generateExamAnalytics = async (tenantId: string, filters: any) => {
  const { examId, classId, sectionId, format } = filters;

  if (!examId) throw new Error("Exam ID is required");

  const results = await prisma.examResult.findMany({
    where: {
      examId,
      tenantId,
      ...(classId && { enrollment: { classId } }),
      ...(sectionId && { enrollment: { sectionId } }),
    },
    include: {
      enrollment: {
        include: {
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      },
      subject: { select: { name: true } },
    },
  });

  const analytics = computeAnalytics(results);

  if (format === "excel") {
    const buffer = await generateExcel("Exam Analytics", analytics.studentResults, [
      { header: "Adm No", key: "admissionNo" },
      { header: "Name", key: "name" },
      { header: "Total Marks", key: "totalMarks" },
      { header: "Obtained", key: "obtainedMarks" },
      { header: "Percentage", key: "percentage" },
      { header: "Grade", key: "grade" },
      { header: "Rank", key: "rank" },
    ]);
    return { buffer, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename: "exam-analytics.xlsx" };
  }

  if (format === "pdf") {
    const buffer = await generatePDF("Exam Analytics", analytics.studentResults);
    return { buffer, contentType: "application/pdf", filename: "exam-analytics.pdf" };
  }

  return analytics;
};

// ============================================
// CUSTOM REPORT
// ============================================

export const generateCustomReport = async (config: any, tenantId: string) => {
  const { reportType, filters, columns } = config;
  // Extensible custom report builder
  switch (reportType) {
    case "student":
      return generateStudentReport(tenantId, { ...filters, format: "json" });
    case "fee":
      return generateFeeReport(tenantId, { ...filters, format: "json" });
    case "attendance":
      return generateAttendanceReport(tenantId, { ...filters, format: "json" });
    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
};

// ============================================
// REPORT TEMPLATES
// ============================================

export const getReportTemplates = async (tenantId: string) => {
  return [
    { id: "student-list", name: "Student List", type: "student", description: "List of all students with class and section" },
    { id: "fee-collection", name: "Fee Collection Report", type: "fee", description: "Fee collection summary and details" },
    { id: "fee-defaulters", name: "Fee Defaulters", type: "fee", description: "Students with pending fee balance" },
    { id: "attendance-monthly", name: "Monthly Attendance", type: "attendance", description: "Monthly attendance percentage by student" },
    { id: "exam-results", name: "Exam Results", type: "exam", description: "Exam results with analytics" },
    { id: "class-topper", name: "Class Toppers", type: "exam", description: "Top performers by class" },
  ];
};
