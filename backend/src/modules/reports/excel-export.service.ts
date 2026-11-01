/**
 * 📊 Excel Export Service
 *
 * Dedicated export endpoints for students, fees, and attendance.
 * Re-uses the existing excel.helper.ts for workbook generation.
 */

import prisma from "../../utils/prisma";
import { generateExcel, generateMultiSheetExcel } from "./helpers/excel.helper";

// ─────────────────────────────────────────────────────
// STUDENT EXPORT
// ─────────────────────────────────────────────────────

export async function exportStudentsExcel(
  tenantId: string,
  filters: { classId?: string; sectionId?: string; academicYearId?: string }
): Promise<{ buffer: Buffer; filename: string }> {
  const where: any = { tenantId, isDeleted: false };

  if (filters.classId || filters.sectionId || filters.academicYearId) {
    where.enrollments = {
      some: {
        isDeleted: false,
        status: "active",
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.sectionId && { sectionId: filters.sectionId }),
        ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
      },
    };
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      enrollments: {
        where: {
          isDeleted: false,
          ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
        },
        include: { class: true, section: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { firstName: "asc" },
  });

  const data = students.map((s: any) => ({
    admissionNo: s.admissionNo || "",
    name: `${s.firstName} ${s.lastName}`,
    class: s.enrollments?.[0]?.class?.name || "N/A",
    section: s.enrollments?.[0]?.section?.name || "",
    gender: s.gender || "",
    dob: s.dob ? new Date(s.dob).toLocaleDateString("en-IN") : "",
    fatherName: s.fatherName || "",
    motherName: s.motherName || "",
    phone: s.phone || s.fatherPhone || "",
    email: s.email || "",
    address: s.address || "",
    status: s.status || "active",
    category: s.category || "",
    religion: s.religion || "",
    bloodGroup: s.bloodGroup || "",
    aadhar: s.aadharNumber || "",
  }));

  const columns = [
    { header: "Adm No", key: "admissionNo", width: 12 },
    { header: "Name", key: "name", width: 25 },
    { header: "Class", key: "class", width: 10 },
    { header: "Section", key: "section", width: 10 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "DOB", key: "dob", width: 12 },
    { header: "Father", key: "fatherName", width: 20 },
    { header: "Mother", key: "motherName", width: 20 },
    { header: "Phone", key: "phone", width: 14 },
    { header: "Email", key: "email", width: 22 },
    { header: "Address", key: "address", width: 30 },
    { header: "Status", key: "status", width: 10 },
    { header: "Category", key: "category", width: 12 },
    { header: "Religion", key: "religion", width: 12 },
    { header: "Blood Group", key: "bloodGroup", width: 12 },
    { header: "Aadhar", key: "aadhar", width: 14 },
  ];

  const buffer = await generateExcel("Student Report", data, columns);
  const date = new Date().toISOString().slice(0, 10);
  return { buffer, filename: `students-export-${date}.xlsx` };
}

// ─────────────────────────────────────────────────────
// FEE EXPORT
// ─────────────────────────────────────────────────────

export async function exportFeesExcel(
  tenantId: string,
  filters: { classId?: string; month?: number; year?: number; status?: string; academicYearId?: string }
): Promise<{ buffer: Buffer; filename: string }> {
  const where: any = { tenantId };

  if (filters.status) where.status = filters.status;

  const payments = await prisma.feePayment.findMany({
    where: {
      tenantId,
      ...(filters.month || filters.year
        ? {
            paymentDate: {
              ...(filters.month && filters.year
                ? {
                    gte: new Date(filters.year, filters.month - 1, 1),
                    lt: new Date(filters.year, filters.month, 1),
                  }
                : {}),
            },
          }
        : {}),
    },
    include: {
      studentFee: {
        include: {
          enrollment: {
            include: {
              student: true,
              class: true,
              section: true,
            },
          },
        },
      },
    },
    orderBy: { paymentDate: "desc" },
  });

  const data = payments.map((p: any) => {
    const student = p.studentFee?.enrollment?.student;
    const enrollment = p.studentFee?.enrollment;
    return {
      receiptNo: p.receiptNumber || p.id?.slice(-8) || "",
      date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "",
      admissionNo: student?.admissionNo || "",
      studentName: student ? `${student.firstName} ${student.lastName}` : "N/A",
      class: enrollment?.class?.name || "",
      section: enrollment?.section?.name || "",
      fatherName: student?.fatherName || "",
      amount: p.amount || 0,
      paymentMode: p.paymentMode || p.method || "",
      transactionId: p.transactionId || p.referenceNumber || "",
      status: p.status || "PAID",
    };
  });

  const columns = [
    { header: "Receipt No", key: "receiptNo", width: 14 },
    { header: "Date", key: "date", width: 12 },
    { header: "Adm No", key: "admissionNo", width: 12 },
    { header: "Student Name", key: "studentName", width: 25 },
    { header: "Class", key: "class", width: 10 },
    { header: "Section", key: "section", width: 10 },
    { header: "Father", key: "fatherName", width: 20 },
    { header: "Amount (₹)", key: "amount", width: 12 },
    { header: "Mode", key: "paymentMode", width: 12 },
    { header: "Transaction ID", key: "transactionId", width: 18 },
    { header: "Status", key: "status", width: 10 },
  ];

  const buffer = await generateExcel("Fee Collection Report", data, columns);
  const date = new Date().toISOString().slice(0, 10);
  return { buffer, filename: `fee-collection-${date}.xlsx` };
}

// ─────────────────────────────────────────────────────
// ATTENDANCE EXPORT
// ─────────────────────────────────────────────────────

export async function exportAttendanceExcel(
  tenantId: string,
  filters: { classId?: string; sectionId?: string; month?: number; year?: number; academicYearId?: string }
): Promise<{ buffer: Buffer; filename: string }> {
  const now = new Date();
  const month = filters.month || now.getMonth() + 1;
  const year = filters.year || now.getFullYear();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // last day of month

  const attendanceWhere: any = {
    tenantId,
    date: { gte: startDate, lte: endDate },
  };

  if (filters.classId) attendanceWhere.classId = filters.classId;
  if (filters.sectionId) attendanceWhere.sectionId = filters.sectionId;

  const records = await prisma.attendance.findMany({
    where: attendanceWhere,
    include: {
      student: true,
      class: true,
      section: true,
    },
    orderBy: [{ date: "asc" }, { student: { firstName: "asc" } }],
  });

  const data = records.map((r: any) => ({
    date: r.date ? new Date(r.date).toLocaleDateString("en-IN") : "",
    admissionNo: r.student?.admissionNo || "",
    studentName: r.student ? `${r.student.firstName} ${r.student.lastName}` : "N/A",
    class: r.class?.name || "",
    section: r.section?.name || "",
    status: r.status || "",
    remarks: r.remarks || "",
  }));

  const columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Adm No", key: "admissionNo", width: 12 },
    { header: "Student Name", key: "studentName", width: 25 },
    { header: "Class", key: "class", width: 10 },
    { header: "Section", key: "section", width: 10 },
    { header: "Status", key: "status", width: 10 },
    { header: "Remarks", key: "remarks", width: 20 },
  ];

  const monthName = startDate.toLocaleString("en-IN", { month: "long" });
  const buffer = await generateExcel(`Attendance Report - ${monthName} ${year}`, data, columns);
  return { buffer, filename: `attendance-${monthName.toLowerCase()}-${year}.xlsx` };
}
