// ══════════════════════════════════════════════════════════════════════════════
// STUDENT PDF SERVICE — Professional PDF Generation with PDFKit
// ══════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";

const prisma = new PrismaClient();

// ============================================
// GENERATE STUDENT PROFILE PDF
// ============================================
export const generateStudentProfilePDF = async (
  tenantId: string,
  studentId: string
): Promise<Buffer> => {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
    include: {
      enrollments: {
        where: { status: "active", isDeleted: false },
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
          academicYear: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!student) throw new Error("Student not found");

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, address: true, phone: true, email: true, logoUrl: true },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const enrollment = student.enrollments?.[0];
    const pageWidth = doc.page.width - 80;

    // ── HEADER ──
    doc.fontSize(16).font("Helvetica-Bold").text(tenant?.name || "School ERP", { align: "center" });
    doc.fontSize(9).font("Helvetica").text(tenant?.address || "", { align: "center" });
    doc.fontSize(9).text(`Phone: ${tenant?.phone || ""} | Email: ${tenant?.email || ""}`, { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke("#4f46e5");
    doc.moveDown(0.5);

    // ── TITLE ──
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#4f46e5").text("STUDENT PROFILE", { align: "center" });
    doc.moveDown(0.5);
    doc.fillColor("#000000");

    // ── BASIC INFO SECTION ──
    addSectionTitle(doc, "Personal Information");
    const personalInfo = [
      ["Full Name", student.fullName || `${student.firstName} ${student.lastName}`],
      ["Admission No", student.admissionNo],
      ["SR No", student.srNo || "N/A"],
      ["Roll Number", student.rollNumber || "N/A"],
      ["Gender", student.gender],
      ["Date of Birth", formatDate(student.dob)],
      ["Blood Group", student.bloodGroup || "N/A"],
      ["Category", student.category || "N/A"],
      ["Religion", student.religion || "N/A"],
      ["Nationality", student.nationality],
      ["Aadhaar No", student.aadharNo || "N/A"],
      ["Phone", student.phone || "N/A"],
      ["Email", student.email || "N/A"],
      ["Address", student.address || "N/A"],
    ];
    addKeyValueTable(doc, personalInfo, pageWidth);

    // ── ACADEMIC INFO ──
    doc.moveDown(0.5);
    addSectionTitle(doc, "Academic Information");
    const academicInfo = [
      ["Class", enrollment?.class?.name || "N/A"],
      ["Section", enrollment?.section?.name || "N/A"],
      ["Academic Year", enrollment?.academicYear?.name || "N/A"],
      ["Admission Date", formatDate(student.admissionDate)],
      ["Status", student.status.toUpperCase()],
      ["Previous School", student.previousSchool || "N/A"],
    ];
    addKeyValueTable(doc, academicInfo, pageWidth);

    // ── PARENT INFO ──
    doc.moveDown(0.5);
    addSectionTitle(doc, "Parent/Guardian Information");
    const parentInfo = [
      ["Father Name", student.fatherName],
      ["Father Phone", student.fatherPhone],
      ["Father Occupation", student.fatherOccupation || "N/A"],
      ["Mother Name", student.motherName],
      ["Mother Phone", student.motherPhone || "N/A"],
      ["Mother Occupation", student.motherOccupation || "N/A"],
      ["Guardian Name", student.guardianName || "N/A"],
      ["Guardian Phone", student.guardianPhone || "N/A"],
      ["Guardian Relation", student.guardianRelation || "N/A"],
    ];
    addKeyValueTable(doc, parentInfo, pageWidth);

    // ── MEDICAL INFO ──
    if (student.medicalConditions?.length || student.allergies?.length) {
      doc.moveDown(0.5);
      addSectionTitle(doc, "Medical Information");
      const medicalInfo = [
        ["Medical Conditions", student.medicalConditions?.join(", ") || "None"],
        ["Allergies", student.allergies?.join(", ") || "None"],
        ["Medications", student.medications?.join(", ") || "None"],
        ["Emergency Contact", student.emergencyContact || "N/A"],
        ["Emergency Phone", student.emergencyPhone || "N/A"],
      ];
      addKeyValueTable(doc, medicalInfo, pageWidth);
    }

    // ── FOOTER ──
    doc.moveDown(2);
    doc.fontSize(8).fillColor("#666666")
      .text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 40, doc.page.height - 60)
      .text("This is a computer-generated document.", 40, doc.page.height - 48);

    doc.end();
  });
};

// ============================================
// GENERATE STUDENT LIST PDF
// ============================================
export const generateStudentListPDF = async (
  tenantId: string,
  filters: Record<string, any>,
  columns?: string[]
): Promise<Buffer> => {
  const where: any = { tenantId, isDeleted: false };
  if (filters.status) where.status = filters.status;
  if (filters.gender) where.gender = filters.gender;
  if (filters.classId || filters.sectionId || filters.academicYearId) {
    where.enrollments = {
      some: {
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.sectionId && { sectionId: filters.sectionId }),
        ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
        status: "active",
        isDeleted: false,
      },
    };
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      enrollments: {
        where: { status: "active", isDeleted: false },
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { admissionNo: "asc" },
    take: 500,
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, address: true },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(14).font("Helvetica-Bold").text(tenant?.name || "School", { align: "center" });
    doc.fontSize(10).font("Helvetica").text("Student List", { align: "center" });
    doc.moveDown(0.5);

    // Table header
    const tableColumns = [
      { label: "S.No", width: 35 },
      { label: "Adm No", width: 70 },
      { label: "Name", width: 130 },
      { label: "Class", width: 60 },
      { label: "Section", width: 50 },
      { label: "Gender", width: 50 },
      { label: "DOB", width: 75 },
      { label: "Father Name", width: 110 },
      { label: "Phone", width: 85 },
      { label: "Status", width: 60 },
    ];

    let x = 30;
    const tableTop = doc.y;

    // Draw header row
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
    doc.rect(30, tableTop, doc.page.width - 60, 18).fill("#4f46e5");
    
    x = 33;
    tableColumns.forEach((col) => {
      doc.text(col.label, x, tableTop + 5, { width: col.width, align: "left" });
      x += col.width;
    });

    doc.fillColor("#000000").font("Helvetica").fontSize(7);

    // Draw data rows
    let y = tableTop + 20;
    students.forEach((student, i) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 30;
      }

      // Alternate row background
      if (i % 2 === 0) {
        doc.rect(30, y - 2, doc.page.width - 60, 16).fill("#f8f9fa");
        doc.fillColor("#000000");
      }

      const enrollment = student.enrollments?.[0];
      x = 33;
      const rowData = [
        (i + 1).toString(),
        student.admissionNo,
        `${student.firstName} ${student.lastName}`,
        enrollment?.class?.name || "",
        enrollment?.section?.name || "",
        student.gender,
        formatDate(student.dob),
        student.fatherName,
        student.fatherPhone || student.phone || "",
        student.status,
      ];

      rowData.forEach((val, ci) => {
        doc.text(val || "", x, y, { width: tableColumns[ci].width, align: "left" });
        x += tableColumns[ci].width;
      });

      y += 16;
    });

    // Footer
    doc.fontSize(8).fillColor("#666666")
      .text(`Total Students: ${students.length} | Generated: ${new Date().toLocaleString("en-IN")}`, 30, doc.page.height - 30);

    doc.end();
  });
};

// ============================================
// GENERATE CLASS-WISE PDF
// ============================================
export const generateClassWisePDF = async (
  tenantId: string,
  classId: string,
  academicYearId: string
): Promise<Buffer> => {
  return generateStudentListPDF(tenantId, { classId, academicYearId });
};

// ============================================
// HELPERS
// ============================================

function addSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(11).font("Helvetica-Bold").fillColor("#4f46e5").text(title);
  doc.moveTo(40, doc.y + 2).lineTo(200, doc.y + 2).stroke("#e5e7eb");
  doc.moveDown(0.3).fillColor("#000000");
}

function addKeyValueTable(doc: PDFKit.PDFDocument, data: string[][], pageWidth: number) {
  doc.font("Helvetica").fontSize(9);
  const colWidth = pageWidth / 2;

  for (let i = 0; i < data.length; i += 2) {
    const y = doc.y;
    
    // Left column
    doc.font("Helvetica-Bold").text(`${data[i][0]}: `, 45, y, { continued: true, width: colWidth - 10 });
    doc.font("Helvetica").text(data[i][1] || "N/A");

    // Right column (if exists)
    if (data[i + 1]) {
      doc.font("Helvetica-Bold").text(`${data[i + 1][0]}: `, 45 + colWidth, y, { continued: true, width: colWidth - 10 });
      doc.font("Helvetica").text(data[i + 1][1] || "N/A");
    }

    doc.moveDown(0.2);
  }
}

function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
