// ══════════════════════════════════════════════════════════════════════════════
// STUDENT CERTIFICATE SERVICE — All Certificate Generation
// ══════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";
import { CertificateOptions, CertificateResult, CertificateType } from "./student.types";

const prisma = new PrismaClient();

// ============================================
// GENERATE BONAFIDE CERTIFICATE
// ============================================
export const generateBonafide = async (
  tenantId: string,
  studentId: string,
  options: CertificateOptions,
  userId: string
): Promise<CertificateResult> => {
  const { student, tenant, enrollment } = await getStudentForCertificate(tenantId, studentId);
  const certNo = await generateCertificateNumber(tenantId, "BON");

  const pdfBuffer = await createCertificatePDF({
    title: "BONAFIDE CERTIFICATE",
    certNo,
    tenant,
    content: `This is to certify that ${student.gender === "Male" ? "Mr." : "Ms."} **${student.fullName || `${student.firstName} ${student.lastName}`}**, ${student.gender === "Male" ? "Son" : "Daughter"} of **${student.fatherName}**, is a bonafide student of this institution. ${student.gender === "Male" ? "He" : "She"} is studying in Class **${enrollment?.class?.name || "N/A"}**, Section **${enrollment?.section?.name || "N/A"}** during the academic session **${enrollment?.academicYear?.name || ""}**.

${student.gender === "Male" ? "His" : "Her"} date of birth as per our records is **${formatDateLong(student.dob)}** (${dobInWords(student.dob)}).

This certificate is issued for the purpose of **${options.purpose || "official use"}**.`,
    studentName: student.fullName || `${student.firstName} ${student.lastName}`,
    admissionNo: student.admissionNo,
    date: options.issuedDate || new Date().toISOString(),
  });

  // Save certificate record
  await prisma.certificate.create({
    data: {
      tenantId,
      studentId,
      type: "BONAFIDE",
      certificateNo: certNo,
      issuedDate: new Date(options.issuedDate || Date.now()),
      purpose: options.purpose || "Official use",
      issuedBy: userId,
      status: "ISSUED",
    },
  });

  // Timeline entry
  await prisma.studentTimelineEntry.create({
    data: {
      studentId,
      tenantId,
      type: "certificate",
      title: "Bonafide Certificate Generated",
      description: `Certificate No: ${certNo}`,
      createdBy: userId,
    },
  });

  return {
    pdfBuffer,
    certificateNo: certNo,
    metadata: {
      studentId,
      studentName: student.fullName || `${student.firstName} ${student.lastName}`,
      type: CertificateType.BONAFIDE,
      issuedDate: new Date().toISOString(),
      issuedBy: userId,
    },
  };
};

// ============================================
// GENERATE CHARACTER CERTIFICATE
// ============================================
export const generateCharacter = async (
  tenantId: string,
  studentId: string,
  options: CertificateOptions,
  userId: string
): Promise<CertificateResult> => {
  const { student, tenant, enrollment } = await getStudentForCertificate(tenantId, studentId);
  const certNo = await generateCertificateNumber(tenantId, "CHR");
  const pronoun = student.gender === "Male" ? "He" : "She";
  const possessive = student.gender === "Male" ? "His" : "Her";

  const pdfBuffer = await createCertificatePDF({
    title: "CHARACTER CERTIFICATE",
    certNo,
    tenant,
    content: `This is to certify that ${student.gender === "Male" ? "Mr." : "Ms."} **${student.fullName || `${student.firstName} ${student.lastName}`}**, ${student.gender === "Male" ? "Son" : "Daughter"} of **${student.fatherName}**, was a student of this institution bearing Admission No. **${student.admissionNo}**.

${pronoun} was enrolled in Class **${enrollment?.class?.name || "N/A"}**, Section **${enrollment?.section?.name || "N/A"}** during the academic session **${enrollment?.academicYear?.name || ""}**.

${possessive} character and conduct during the period of study was found to be **GOOD**. ${pronoun} bears a good moral character and has not been involved in any anti-social or disciplinary activity.

We wish ${student.gender === "Male" ? "him" : "her"} success in all future endeavors.`,
    studentName: student.fullName || `${student.firstName} ${student.lastName}`,
    admissionNo: student.admissionNo,
    date: options.issuedDate || new Date().toISOString(),
  });

  await prisma.certificate.create({
    data: {
      tenantId, studentId, type: "CHARACTER", certificateNo: certNo,
      issuedDate: new Date(), purpose: options.purpose || "Character reference",
      issuedBy: userId, status: "ISSUED",
    },
  });

  return {
    pdfBuffer, certificateNo: certNo,
    metadata: { studentId, studentName: student.fullName || `${student.firstName} ${student.lastName}`, type: CertificateType.CHARACTER, issuedDate: new Date().toISOString(), issuedBy: userId },
  };
};

// ============================================
// GENERATE LEAVING CERTIFICATE (LC/TC)
// ============================================
export const generateLeaving = async (
  tenantId: string,
  studentId: string,
  options: CertificateOptions,
  userId: string
): Promise<CertificateResult> => {
  const { student, tenant, enrollment } = await getStudentForCertificate(tenantId, studentId);
  const certNo = await generateCertificateNumber(tenantId, "LC");

  const pdfBuffer = await createCertificatePDF({
    title: "LEAVING CERTIFICATE / TRANSFER CERTIFICATE",
    certNo,
    tenant,
    content: `
1. Name of Student: **${student.fullName || `${student.firstName} ${student.lastName}`}**
2. Father's Name: **${student.fatherName}**
3. Mother's Name: **${student.motherName}**
4. Date of Birth: **${formatDateLong(student.dob)}**
5. Nationality: **${student.nationality}**
6. Category: **${student.category || "General"}**
7. Admission No: **${student.admissionNo}**
8. Date of Admission: **${formatDateLong(student.admissionDate)}**
9. Class at the time of leaving: **${enrollment?.class?.name || "N/A"}**
10. Date of Leaving: **${formatDateLong(new Date())}**
11. Reason for Leaving: **${options.purpose || "On parent's request"}**
12. Whether qualified for promotion: **Yes**
13. Fees paid up to: **Current Date**
14. Character & Conduct: **Good**
15. Remarks: **${options.remarks || "None"}**`,
    studentName: student.fullName || `${student.firstName} ${student.lastName}`,
    admissionNo: student.admissionNo,
    date: options.issuedDate || new Date().toISOString(),
  });

  await prisma.certificate.create({
    data: {
      tenantId, studentId, type: "LEAVING", certificateNo: certNo,
      issuedDate: new Date(), purpose: options.purpose || "Transfer/Leaving",
      issuedBy: userId, status: "ISSUED",
    },
  });

  return {
    pdfBuffer, certificateNo: certNo,
    metadata: { studentId, studentName: student.fullName || `${student.firstName} ${student.lastName}`, type: CertificateType.LEAVING, issuedDate: new Date().toISOString(), issuedBy: userId },
  };
};

// ============================================
// GENERATE MIGRATION CERTIFICATE
// ============================================
export const generateMigration = async (
  tenantId: string, studentId: string, options: CertificateOptions, userId: string
): Promise<CertificateResult> => {
  const { student, tenant, enrollment } = await getStudentForCertificate(tenantId, studentId);
  const certNo = await generateCertificateNumber(tenantId, "MIG");

  const pdfBuffer = await createCertificatePDF({
    title: "MIGRATION CERTIFICATE",
    certNo, tenant,
    content: `This is to certify that **${student.fullName || `${student.firstName} ${student.lastName}`}**, Admission No. **${student.admissionNo}**, was a student of this institution and has completed ${student.gender === "Male" ? "his" : "her"} studies in Class **${enrollment?.class?.name || "N/A"}** during the session **${enrollment?.academicYear?.name || ""}**.

${student.gender === "Male" ? "He" : "She"} is hereby granted this Migration Certificate for the purpose of seeking admission in another institution/board.

The student has no dues pending against ${student.gender === "Male" ? "him" : "her"} in this institution.`,
    studentName: student.fullName || `${student.firstName} ${student.lastName}`,
    admissionNo: student.admissionNo,
    date: options.issuedDate || new Date().toISOString(),
  });

  await prisma.certificate.create({
    data: { tenantId, studentId, type: "MIGRATION", certificateNo: certNo, issuedDate: new Date(), purpose: options.purpose || "Migration", issuedBy: userId, status: "ISSUED" },
  });

  return { pdfBuffer, certificateNo: certNo, metadata: { studentId, studentName: student.fullName || `${student.firstName} ${student.lastName}`, type: CertificateType.MIGRATION, issuedDate: new Date().toISOString(), issuedBy: userId } };
};

// ============================================
// GENERATE STUDY CERTIFICATE
// ============================================
export const generateStudy = async (
  tenantId: string, studentId: string, options: CertificateOptions, userId: string
): Promise<CertificateResult> => {
  const { student, tenant, enrollment } = await getStudentForCertificate(tenantId, studentId);
  const certNo = await generateCertificateNumber(tenantId, "STD");

  const pdfBuffer = await createCertificatePDF({
    title: "STUDY CERTIFICATE",
    certNo, tenant,
    content: `This is to certify that **${student.fullName || `${student.firstName} ${student.lastName}`}**, ${student.gender === "Male" ? "Son" : "Daughter"} of **${student.fatherName}**, is presently studying in Class **${enrollment?.class?.name || "N/A"}**, Section **${enrollment?.section?.name || "N/A"}** of this institution during the academic session **${enrollment?.academicYear?.name || ""}**.

${student.gender === "Male" ? "His" : "Her"} Admission No. is **${student.admissionNo}** and Roll No. is **${student.rollNumber || "N/A"}**.

This certificate is issued on ${student.gender === "Male" ? "his" : "her"} request for **${options.purpose || "official purpose"}**.`,
    studentName: student.fullName || `${student.firstName} ${student.lastName}`,
    admissionNo: student.admissionNo,
    date: options.issuedDate || new Date().toISOString(),
  });

  await prisma.certificate.create({
    data: { tenantId, studentId, type: "STUDY", certificateNo: certNo, issuedDate: new Date(), purpose: options.purpose || "Study confirmation", issuedBy: userId, status: "ISSUED" },
  });

  return { pdfBuffer, certificateNo: certNo, metadata: { studentId, studentName: student.fullName || `${student.firstName} ${student.lastName}`, type: CertificateType.STUDY, issuedDate: new Date().toISOString(), issuedBy: userId } };
};

// ============================================
// GET CERTIFICATE HISTORY
// ============================================
export const getCertificateHistory = async (tenantId: string, studentId: string) => {
  return prisma.certificate.findMany({
    where: { tenantId, studentId },
    orderBy: { issuedDate: "desc" },
  });
};

// ============================================
// HELPERS
// ============================================

async function getStudentForCertificate(tenantId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
    include: {
      enrollments: {
        where: { isDeleted: false },
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
    select: { name: true, address: true, phone: true, email: true },
  });

  return { student, tenant, enrollment: student.enrollments?.[0] };
}

async function generateCertificateNumber(tenantId: string, prefix: string): Promise<string> {
  const count = await prisma.certificate.count({ where: { tenantId } });
  const year = new Date().getFullYear().toString().slice(2);
  return `${prefix}/${year}/${(count + 1).toString().padStart(5, "0")}`;
}

interface CertPDFOptions {
  title: string;
  certNo: string;
  tenant: any;
  content: string;
  studentName: string;
  admissionNo: string;
  date: string;
}

async function createCertificatePDF(options: CertPDFOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke("#4f46e5");
    doc.rect(35, 35, doc.page.width - 70, doc.page.height - 70).stroke("#e5e7eb");

    // School header
    doc.moveDown(2);
    doc.fontSize(18).font("Helvetica-Bold").text(options.tenant?.name || "School", { align: "center" });
    doc.fontSize(10).font("Helvetica").text(options.tenant?.address || "", { align: "center" });
    doc.moveDown(1);

    // Certificate title
    doc.fontSize(16).font("Helvetica-Bold").fillColor("#4f46e5").text(options.title, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#666666").text(`Certificate No: ${options.certNo}`, { align: "center" });
    doc.moveDown(1.5);

    // Content
    doc.fillColor("#000000").fontSize(11).font("Helvetica");
    const lines = options.content.split("\n");
    for (const line of lines) {
      if (line.trim() === "") {
        doc.moveDown(0.5);
        continue;
      }
      // Handle bold text (wrapped in **)
      const parts = line.split(/\*\*(.*?)\*\*/g);
      let x = 50;
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
          doc.font("Helvetica").text(parts[i], { continued: i < parts.length - 1 });
        } else {
          doc.font("Helvetica-Bold").text(parts[i], { continued: i < parts.length - 1 });
        }
      }
      doc.moveDown(0.3);
    }

    // Signature area
    doc.moveDown(3);
    const sigY = doc.y;
    doc.fontSize(10).font("Helvetica");
    doc.text(`Date: ${formatDateLong(new Date(options.date))}`, 50, sigY);
    doc.text("Principal / Authorized Signatory", doc.page.width - 250, sigY, { width: 200, align: "right" });
    doc.moveDown(0.5);
    doc.text("Place: _______________", 50);
    doc.text("(Seal & Signature)", doc.page.width - 250, doc.y, { width: 200, align: "right" });

    doc.end();
  });
}

function formatDateLong(date: Date | string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function dobInWords(dob: Date): string {
  const d = new Date(dob);
  const day = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "long" });
  const year = d.getFullYear();
  return `${numberToWords(day)} ${month}, ${numberToWords(year)}`;
}

function numberToWords(num: number): string {
  // Simplified for common use
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num < 20) return ones[num];
  if (num < 100) return `${tens[Math.floor(num / 10)]} ${ones[num % 10]}`.trim();
  if (num < 1000) return `${ones[Math.floor(num / 100)]} Hundred ${numberToWords(num % 100)}`.trim();
  if (num < 10000) return `${numberToWords(Math.floor(num / 1000))} Thousand ${numberToWords(num % 1000)}`.trim();
  return num.toString();
}
