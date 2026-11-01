/**
 * 📊 Report Card PDF Service
 *
 * Generates a professional report card PDF for a student + exam.
 * Uses PDFKit (already in the project) for server-side PDF generation.
 */

import prisma from "../../utils/prisma";
import PDFDocument from "pdfkit";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

interface SubjectResult {
  subjectName: string;
  maxMarks: number;
  marksObtained: number;
  grade: string;
  theoryMax?: number;
  theoryObtained?: number;
  practicalMax?: number;
  practicalObtained?: number;
}

interface ReportCardInfo {
  // Student
  studentName: string;
  admissionNo: string;
  rollNo: string;
  className: string;
  sectionName: string;
  dob: string;
  fatherName: string;
  motherName: string;
  photo?: string;
  // Exam
  examName: string;
  academicYear: string;
  // Results
  subjects: SubjectResult[];
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  overallGrade: string;
  rank?: number;
  result: string;
  attendance?: { present: number; total: number };
  remarks?: string;
  // School
  schoolName: string;
  schoolAddress: string;
  schoolLogo?: string;
}

// ─────────────────────────────────────────────────────
// Fetch data and build PDF
// ─────────────────────────────────────────────────────

export async function fetchReportCardData(
  studentId: string,
  examId: string,
  tenantId: string
): Promise<ReportCardInfo> {
  // 1. Fetch student
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
    include: {
      enrollments: {
        where: { isDeleted: false, status: "active" },
        include: { class: true, section: true, academicYear: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!student) throw new Error("Student not found");

  // 2. Fetch exam
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId, isDeleted: false },
    include: {
      academicYear: true,
      subjects: { include: { subject: true } },
    },
  });
  if (!exam) throw new Error("Exam not found");

  // 3. Fetch marks
  const marks = await prisma.marks.findMany({
    where: { examId, studentId, tenantId },
    include: { subject: true },
  });

  // 4. Fetch tenant (school info)
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  // 5. Build subject results
  const subjects: SubjectResult[] = marks.map((m: any) => {
    const examSubject = exam.subjects?.find(
      (es: any) => es.subjectId === m.subjectId
    );
    const maxMarks = examSubject?.maxMarks || m.maxMarks || 100;
    const obtained = m.marksObtained ?? m.marks ?? 0;
    return {
      subjectName: m.subject?.name || "Unknown",
      maxMarks,
      marksObtained: obtained,
      grade: calculateGrade(obtained, maxMarks),
      theoryMax: examSubject?.theoryMax,
      theoryObtained: m.theoryMarks,
      practicalMax: examSubject?.practicalMax,
      practicalObtained: m.practicalMarks,
    };
  });

  const totalMarks = subjects.reduce((s, sub) => s + sub.marksObtained, 0);
  const maxTotalMarks = subjects.reduce((s, sub) => s + sub.maxMarks, 0);
  const percentage = maxTotalMarks > 0 ? (totalMarks / maxTotalMarks) * 100 : 0;
  const overallGrade = calculateGrade(totalMarks, maxTotalMarks);
  const hasFailed = subjects.some(
    (s) => s.maxMarks > 0 && (s.marksObtained / s.maxMarks) * 100 < 33
  );

  const enrollment = student.enrollments?.[0];

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    admissionNo: student.admissionNo || "",
    rollNo: student.rollNumber || student.admissionNo || "",
    className: enrollment?.class?.name || "N/A",
    sectionName: enrollment?.section?.name || "",
    dob: student.dob
      ? new Date(student.dob).toLocaleDateString("en-IN")
      : "N/A",
    fatherName: student.fatherName || "",
    motherName: student.motherName || "",
    photo: student.photo || undefined,
    examName: exam.name || "",
    academicYear: exam.academicYear?.name || enrollment?.academicYear?.name || "",
    subjects,
    totalMarks,
    maxTotalMarks,
    percentage: Math.round(percentage * 100) / 100,
    overallGrade,
    result: hasFailed ? "FAIL" : "PASS",
    remarks: "",
    schoolName: (tenant as any)?.name || "",
    schoolAddress: (tenant as any)?.address || "",
    schoolLogo: (tenant as any)?.logoUrl || undefined,
  };
}

export async function generateReportCardPDF(
  studentId: string,
  examId: string,
  tenantId: string
): Promise<Buffer> {
  const info = await fetchReportCardData(studentId, examId, tenantId);
  return buildReportCardPDF(info);
}

export async function generateBulkReportCardPDFs(
  classId: string,
  examId: string,
  tenantId: string
): Promise<Array<{ studentId: string; studentName: string; buffer: Buffer }>> {
  // Get all students in the class
  const enrollments = await prisma.enrollment.findMany({
    where: { classId, tenantId, isDeleted: false, status: "active" },
    include: { student: true },
  });

  const results: Array<{ studentId: string; studentName: string; buffer: Buffer }> = [];

  for (const enrollment of enrollments) {
    if (!enrollment.student || enrollment.student.isDeleted) continue;
    try {
      const buffer = await generateReportCardPDF(
        enrollment.studentId,
        examId,
        tenantId
      );
      results.push({
        studentId: enrollment.studentId,
        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        buffer,
      });
    } catch (err) {
      console.error(`Report card failed for student ${enrollment.studentId}:`, err);
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────
// PDF Builder
// ─────────────────────────────────────────────────────

function buildReportCardPDF(info: ReportCardInfo): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const pageWidth = 515; // A4 width - 2×40 margin
    const primaryColor = "#1a365d";

    // ─── School Header ───
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text(info.schoolName.toUpperCase(), { align: "center" });
    if (info.schoolAddress) {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#444")
        .text(info.schoolAddress, { align: "center" });
    }
    doc.moveDown(0.3);

    // Horizontal line
    doc
      .moveTo(40, doc.y)
      .lineTo(40 + pageWidth, doc.y)
      .lineWidth(2)
      .strokeColor(primaryColor)
      .stroke();
    doc.moveDown(0.3);

    // ─── Title ───
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text("PROGRESS REPORT CARD", { align: "center" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`${info.examName} — Academic Year ${info.academicYear}`, {
        align: "center",
      });
    doc.moveDown(0.5);

    // ─── Student Details ───
    const detailY = doc.y;
    const col1X = 40;
    const col2X = 300;

    const detailPairs = [
      ["Student Name", info.studentName],
      ["Father's Name", info.fatherName],
      ["Mother's Name", info.motherName],
      ["Date of Birth", info.dob],
    ];
    const detailPairs2 = [
      ["Admission No", info.admissionNo],
      ["Roll No", info.rollNo],
      ["Class / Section", `${info.className} ${info.sectionName ? "- " + info.sectionName : ""}`],
      ["Result", info.result],
    ];

    let dy = detailY;
    detailPairs.forEach(([label, value]) => {
      doc.fontSize(9).font("Helvetica-Bold").text(`${label}:`, col1X, dy);
      doc.font("Helvetica").text(` ${value}`, col1X + 90, dy);
      dy += 15;
    });

    dy = detailY;
    detailPairs2.forEach(([label, value]) => {
      doc.fontSize(9).font("Helvetica-Bold").text(`${label}:`, col2X, dy);
      doc.font("Helvetica").text(` ${value}`, col2X + 95, dy);
      dy += 15;
    });

    doc.y = dy + 5;
    doc.moveDown(0.5);

    // ─── Marks Table ───
    const tableTop = doc.y;
    const colWidths = [30, 175, 65, 75, 60, 55, 55];
    const headers = [
      "S.No",
      "Subject",
      "Max Marks",
      "Marks Obtained",
      "Percentage",
      "Grade",
      "Result",
    ];

    // Header row
    drawTableRow(doc, tableTop, colWidths, headers, {
      bold: true,
      bgColor: primaryColor,
      textColor: "#FFFFFF",
    });

    let rowY = tableTop + 22;
    info.subjects.forEach((sub, idx) => {
      const pct = sub.maxMarks > 0 ? ((sub.marksObtained / sub.maxMarks) * 100).toFixed(1) : "0";
      const passed = sub.maxMarks > 0 && (sub.marksObtained / sub.maxMarks) * 100 >= 33;
      const row = [
        String(idx + 1),
        sub.subjectName,
        String(sub.maxMarks),
        String(sub.marksObtained),
        `${pct}%`,
        sub.grade,
        passed ? "PASS" : "FAIL",
      ];
      const bg = idx % 2 === 0 ? "#F7F7F7" : "#FFFFFF";
      drawTableRow(doc, rowY, colWidths, row, { bgColor: bg });
      rowY += 20;
    });

    // Total row
    const totalPct = info.percentage.toFixed(1);
    drawTableRow(
      doc,
      rowY,
      colWidths,
      [
        "",
        "TOTAL",
        String(info.maxTotalMarks),
        String(info.totalMarks),
        `${totalPct}%`,
        info.overallGrade,
        info.result,
      ],
      { bold: true, bgColor: "#E8EAF6" }
    );
    rowY += 25;

    doc.y = rowY + 10;

    // ─── Summary ───
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text(
        `Total: ${info.totalMarks}/${info.maxTotalMarks}  |  Percentage: ${totalPct}%  |  Grade: ${info.overallGrade}  |  Result: ${info.result}`,
        { align: "center" }
      );
    doc.moveDown(1.5);

    // ─── Remarks ───
    if (info.remarks) {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Remarks: ", { continued: true })
        .font("Helvetica")
        .text(info.remarks);
      doc.moveDown(1);
    }

    // ─── Signature Section ───
    const sigY = Math.max(doc.y, 680);
    doc
      .fontSize(8)
      .font("Helvetica")
      .text("_______________________", col1X, sigY)
      .text("Class Teacher", col1X, sigY + 12);
    doc
      .text("_______________________", col2X + 60, sigY)
      .text("Principal", col2X + 60, sigY + 12);

    // ─── Footer ───
    doc
      .fontSize(7)
      .fillColor("#999")
      .text(
        `Generated on ${new Date().toLocaleDateString("en-IN")} | Computer generated document`,
        40,
        770,
        { align: "center" }
      );

    doc.end();
  });
}

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

function drawTableRow(
  doc: PDFKit.PDFDocument,
  y: number,
  colWidths: number[],
  values: string[],
  opts: { bold?: boolean; bgColor?: string; textColor?: string } = {}
) {
  const startX = 40;
  let x = startX;
  const rowHeight = 20;

  // Background
  if (opts.bgColor) {
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(opts.bgColor);
  }

  // Text
  const fontName = opts.bold ? "Helvetica-Bold" : "Helvetica";
  const textColor = opts.textColor || "#000000";
  doc.fontSize(8).font(fontName).fillColor(textColor);

  values.forEach((val, i) => {
    doc.text(val, x + 3, y + 5, {
      width: colWidths[i] - 6,
      align: i === 0 ? "center" : i >= 2 ? "center" : "left",
    });
    x += colWidths[i];
  });

  // Borders
  x = startX;
  doc.strokeColor("#ccc").lineWidth(0.5);
  colWidths.forEach((w) => {
    doc.rect(x, y, w, rowHeight).stroke();
    x += w;
  });
}

function calculateGrade(obtained: number, max: number): string {
  if (max <= 0) return "N/A";
  const pct = (obtained / max) * 100;
  if (pct >= 91) return "A1";
  if (pct >= 81) return "A2";
  if (pct >= 71) return "B1";
  if (pct >= 61) return "B2";
  if (pct >= 51) return "C1";
  if (pct >= 41) return "C2";
  if (pct >= 33) return "D";
  return "E";
}
