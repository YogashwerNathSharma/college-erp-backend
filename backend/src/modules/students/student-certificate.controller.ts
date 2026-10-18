import { Response } from "express";
import prisma from "../../utils/prisma";
import PDFDocument from "pdfkit";

// ══════════════════════════════════════════════════════════════════
// STUDENT CERTIFICATE CONTROLLER
// ══════════════════════════════════════════════════════════════════

// Helper: Get student data for certificate generation
async function getStudentForCertificate(studentId: string, tenantId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
    include: {
      enrollments: {
        where: { isDeleted: false, status: "active" },
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
          academicYear: { select: { name: true } },
        },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) throw new Error("Student not found");

  const enrollment = student.enrollments?.[0];
  return {
    ...student,
    className: enrollment?.class?.name || "",
    sectionName: enrollment?.section?.name || "",
    academicYearName: enrollment?.academicYear?.name || "",
  };
}

// Helper: Get tenant info for certificate header
async function getTenantInfo(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, address: true, phone: true, email: true, logoUrl: true },
  });
  return tenant;
}

// Helper: Generate certificate number
async function generateCertificateNo(tenantId: string, type: string): Promise<string> {
  const count = await (prisma.certificate as any).count({
    where: { tenantId, type },
  }).catch(() => 0);

  const prefix = type.substring(0, 3).toUpperCase();
  const num = (count + 1).toString().padStart(5, "0");
  const year = new Date().getFullYear().toString().slice(-2);
  return `${prefix}/${year}/${num}`;
}

// Helper: Save certificate record
async function saveCertificateRecord(
  tenantId: string, studentId: string, type: string,
  certificateNo: string, generatedBy: string, metadata?: any
) {
  return (prisma.certificate as any).create({
    data: {
      tenantId,
      studentId,
      type,
      certificateNo,
      generatedBy,
      generatedAt: new Date(),
      status: "ISSUED",
      metadata: metadata || {},
    },
  }).catch(() => null);
}

/**
 * POST /api/students/certificates/:id/certificate/bonafide
 * Body: { purpose?: string, date?: string }
 */
export const generateBonafideHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { purpose, date } = req.body;

    const student = await getStudentForCertificate(studentId, tenantId);
    const tenant = await getTenantInfo(tenantId);
    const certificateNo = await generateCertificateNo(tenantId, "bonafide");
    const issueDate = date ? new Date(date) : new Date();

    // Generate PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    // Header
    doc.fontSize(18).font("Helvetica-Bold").text(tenant?.name || "School Name", { align: "center" });
    doc.fontSize(10).font("Helvetica").text(tenant?.address || "", { align: "center" });
    doc.text(`Phone: ${tenant?.phone || ""} | Email: ${tenant?.email || ""}`, { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Title
    doc.fontSize(16).font("Helvetica-Bold").text("BONAFIDE CERTIFICATE", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").text(`Certificate No: ${certificateNo}`, { align: "right" });
    doc.text(`Date: ${issueDate.toLocaleDateString("en-IN")}`, { align: "right" });
    doc.moveDown(1.5);

    // Body
    const studentName = student.fullName || `${student.firstName} ${student.lastName}`;
    const fatherName = student.fatherName || "N/A";
    const dob = new Date(student.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

    doc.fontSize(12).font("Helvetica");
    doc.text(
      `This is to certify that ${studentName}, Son/Daughter of ${fatherName}, ` +
      `Date of Birth: ${dob}, is a bonafide student of this institution. ` +
      `He/She is presently studying in Class ${student.className} Section ${student.sectionName} ` +
      `for the Academic Session ${student.academicYearName}.`,
      { align: "justify", lineGap: 5 }
    );

    doc.moveDown(1);
    doc.text(`Admission No: ${student.admissionNo}`);
    if (student.rollNumber) doc.text(`Roll No: ${student.rollNumber}`);
    doc.moveDown(1);

    if (purpose) {
      doc.text(`This certificate is issued for the purpose of: ${purpose}`, { align: "justify" });
      doc.moveDown(1);
    }

    doc.text("We wish him/her all the best in future endeavors.", { align: "justify" });
    doc.moveDown(3);

    // Signature
    doc.text("Principal/Head of Institution", { align: "right" });
    doc.text("(Seal & Signature)", { align: "right" });

    doc.end();
    const pdfBuffer = await pdfPromise;

    // Save record
    await saveCertificateRecord(tenantId, studentId, "bonafide", certificateNo, req.user?.name || "Admin", { purpose });

    // Add to timeline
    await prisma.studentTimelineEntry.create({
      data: {
        studentId, tenantId, type: "certificate",
        title: "Bonafide Certificate Generated",
        description: `Certificate No: ${certificateNo}`,
        createdBy: req.user?.name || "Admin",
      },
    }).catch(() => null);

    // Send PDF response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="bonafide_${student.admissionNo}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/certificates/:id/certificate/character
 * Body: { conductRating?: string, date?: string }
 */
export const generateCharacterHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { conductRating, date } = req.body;

    const student = await getStudentForCertificate(studentId, tenantId);
    const tenant = await getTenantInfo(tenantId);
    const certificateNo = await generateCertificateNo(tenantId, "character");
    const issueDate = date ? new Date(date) : new Date();

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    // Header
    doc.fontSize(18).font("Helvetica-Bold").text(tenant?.name || "School Name", { align: "center" });
    doc.fontSize(10).font("Helvetica").text(tenant?.address || "", { align: "center" });
    doc.text(`Phone: ${tenant?.phone || ""} | Email: ${tenant?.email || ""}`, { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Title
    doc.fontSize(16).font("Helvetica-Bold").text("CHARACTER CERTIFICATE", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").text(`Certificate No: ${certificateNo}`, { align: "right" });
    doc.text(`Date: ${issueDate.toLocaleDateString("en-IN")}`, { align: "right" });
    doc.moveDown(1.5);

    // Body
    const studentName = student.fullName || `${student.firstName} ${student.lastName}`;
    const gender = ["Male", "male", "M"].includes(student.gender) ? "He" : "She";
    const rating = conductRating || "Good";

    doc.fontSize(12).font("Helvetica");
    doc.text(
      `This is to certify that ${studentName}, Son/Daughter of ${student.fatherName}, ` +
      `has been a student of this institution. During ${gender.toLowerCase() === "he" ? "his" : "her"} stay in the institution, ` +
      `${gender.toLowerCase()} bore a ${rating} moral character. ${gender} was regular and punctual in attendance. ` +
      `${gender} has not been involved in any kind of ragging or anti-social activities.`,
      { align: "justify", lineGap: 5 }
    );

    doc.moveDown(1);
    doc.text(`Class: ${student.className} | Section: ${student.sectionName}`);
    doc.text(`Admission No: ${student.admissionNo}`);
    doc.text(`Academic Year: ${student.academicYearName}`);
    doc.text(`Character & Conduct: ${rating}`);
    doc.moveDown(1);

    doc.text("We wish the student all the best in future endeavors.", { align: "justify" });
    doc.moveDown(3);

    doc.text("Principal/Head of Institution", { align: "right" });
    doc.text("(Seal & Signature)", { align: "right" });

    doc.end();
    const pdfBuffer = await pdfPromise;

    await saveCertificateRecord(tenantId, studentId, "character", certificateNo, req.user?.name || "Admin", { conductRating: rating });

    await prisma.studentTimelineEntry.create({
      data: {
        studentId, tenantId, type: "certificate",
        title: "Character Certificate Generated",
        description: `Certificate No: ${certificateNo}`,
        createdBy: req.user?.name || "Admin",
      },
    }).catch(() => null);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="character_${student.admissionNo}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/certificates/:id/certificate/leaving
 * Body: { reason?: string, date?: string, conductRating?: string }
 */
export const generateLeavingHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { reason, date, conductRating } = req.body;

    const student = await getStudentForCertificate(studentId, tenantId);
    const tenant = await getTenantInfo(tenantId);
    const certificateNo = await generateCertificateNo(tenantId, "leaving");
    const issueDate = date ? new Date(date) : new Date();

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    doc.fontSize(18).font("Helvetica-Bold").text(tenant?.name || "School Name", { align: "center" });
    doc.fontSize(10).font("Helvetica").text(tenant?.address || "", { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    doc.fontSize(16).font("Helvetica-Bold").text("LEAVING CERTIFICATE / TRANSFER CERTIFICATE", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").text(`Certificate No: ${certificateNo}`, { align: "right" });
    doc.text(`Date: ${issueDate.toLocaleDateString("en-IN")}`, { align: "right" });
    doc.moveDown(1);

    const studentName = student.fullName || `${student.firstName} ${student.lastName}`;
    const dob = new Date(student.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const admDate = new Date(student.admissionDate).toLocaleDateString("en-IN");

    // Table format
    doc.fontSize(11).font("Helvetica");
    const fields = [
      ["Student Name", studentName],
      ["Father's Name", student.fatherName],
      ["Mother's Name", student.motherName],
      ["Date of Birth", dob],
      ["Admission No", student.admissionNo],
      ["Date of Admission", admDate],
      ["Class at Admission", student.previousClass || student.className],
      ["Class at Leaving", student.className],
      ["Academic Year", student.academicYearName],
      ["Nationality", student.nationality || "Indian"],
      ["Category", student.category || "General"],
      ["Reason for Leaving", reason || "As per parents' request"],
      ["Character & Conduct", conductRating || "Good"],
      ["Date of Leaving", issueDate.toLocaleDateString("en-IN")],
      ["Fees Paid Up To", issueDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })],
    ];

    let y = doc.y;
    for (const [label, value] of fields) {
      doc.font("Helvetica-Bold").text(`${label}:`, 50, y, { width: 200, continued: false });
      doc.font("Helvetica").text(String(value), 260, y);
      y += 20;
    }

    doc.y = y + 20;
    doc.font("Helvetica").text(
      "This certificate is issued on the request of the parent/guardian. No fee dues are pending.",
      { align: "justify" }
    );
    doc.moveDown(3);

    doc.text("Principal/Head of Institution", { align: "right" });
    doc.text("(Seal & Signature)", { align: "right" });

    doc.end();
    const pdfBuffer = await pdfPromise;

    await saveCertificateRecord(tenantId, studentId, "leaving", certificateNo, req.user?.name || "Admin", { reason, conductRating });

    await prisma.studentTimelineEntry.create({
      data: {
        studentId, tenantId, type: "certificate",
        title: "Leaving Certificate Generated",
        description: `Certificate No: ${certificateNo}. Reason: ${reason || "Parent request"}`,
        createdBy: req.user?.name || "Admin",
      },
    }).catch(() => null);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="leaving_certificate_${student.admissionNo}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/certificates/:id/certificate/migration
 * Body: { destinationBoard?: string, date?: string }
 */
export const generateMigrationHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { destinationBoard, date } = req.body;

    const student = await getStudentForCertificate(studentId, tenantId);
    const tenant = await getTenantInfo(tenantId);
    const certificateNo = await generateCertificateNo(tenantId, "migration");
    const issueDate = date ? new Date(date) : new Date();

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    doc.fontSize(18).font("Helvetica-Bold").text(tenant?.name || "School Name", { align: "center" });
    doc.fontSize(10).font("Helvetica").text(tenant?.address || "", { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    doc.fontSize(16).font("Helvetica-Bold").text("MIGRATION CERTIFICATE", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Certificate No: ${certificateNo}`, { align: "right" });
    doc.text(`Date: ${issueDate.toLocaleDateString("en-IN")}`, { align: "right" });
    doc.moveDown(1.5);

    const studentName = student.fullName || `${student.firstName} ${student.lastName}`;
    doc.fontSize(12).font("Helvetica");
    doc.text(
      `This is to certify that ${studentName}, Son/Daughter of ${student.fatherName}, ` +
      `bearing Admission No. ${student.admissionNo}, was a student of Class ${student.className} ` +
      `Section ${student.sectionName} of this institution during the Academic Year ${student.academicYearName}.`,
      { align: "justify", lineGap: 5 }
    );
    doc.moveDown(1);

    doc.text(
      `The student is hereby granted this Migration Certificate for the purpose of seeking admission ` +
      `${destinationBoard ? `to an institution affiliated with ${destinationBoard} Board` : "in another institution"}.`,
      { align: "justify", lineGap: 5 }
    );
    doc.moveDown(1);

    doc.text(`Board Registration No: ${(student as any).boardRegNo || "N/A"}`);
    doc.text(`Character & Conduct: Good`);
    doc.moveDown(1);

    doc.text("This certificate is issued on the request of the student/parent/guardian.", { align: "justify" });
    doc.moveDown(3);

    doc.text("Principal/Head of Institution", { align: "right" });
    doc.text("(Seal & Signature)", { align: "right" });

    doc.end();
    const pdfBuffer = await pdfPromise;

    await saveCertificateRecord(tenantId, studentId, "migration", certificateNo, req.user?.name || "Admin", { destinationBoard });

    await prisma.studentTimelineEntry.create({
      data: {
        studentId, tenantId, type: "certificate",
        title: "Migration Certificate Generated",
        description: `Certificate No: ${certificateNo}`,
        createdBy: req.user?.name || "Admin",
      },
    }).catch(() => null);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="migration_${student.admissionNo}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/certificates/:id/certificate/study
 * Body: { purpose?: string, fromDate?: string, toDate?: string }
 */
export const generateStudyHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { purpose, fromDate, toDate } = req.body;

    const student = await getStudentForCertificate(studentId, tenantId);
    const tenant = await getTenantInfo(tenantId);
    const certificateNo = await generateCertificateNo(tenantId, "study");
    const issueDate = new Date();

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    doc.fontSize(18).font("Helvetica-Bold").text(tenant?.name || "School Name", { align: "center" });
    doc.fontSize(10).font("Helvetica").text(tenant?.address || "", { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    doc.fontSize(16).font("Helvetica-Bold").text("STUDY CERTIFICATE", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Certificate No: ${certificateNo}`, { align: "right" });
    doc.text(`Date: ${issueDate.toLocaleDateString("en-IN")}`, { align: "right" });
    doc.moveDown(1.5);

    const studentName = student.fullName || `${student.firstName} ${student.lastName}`;
    const from = fromDate ? new Date(fromDate).toLocaleDateString("en-IN") : new Date(student.admissionDate).toLocaleDateString("en-IN");
    const to = toDate ? new Date(toDate).toLocaleDateString("en-IN") : issueDate.toLocaleDateString("en-IN");

    doc.fontSize(12).font("Helvetica");
    doc.text(
      `This is to certify that ${studentName}, Son/Daughter of ${student.fatherName}, ` +
      `has been studying in this institution from ${from} to ${to}. ` +
      `The student is currently enrolled in Class ${student.className}, Section ${student.sectionName} ` +
      `for the Academic Year ${student.academicYearName}.`,
      { align: "justify", lineGap: 5 }
    );
    doc.moveDown(1);

    doc.text(`Admission No: ${student.admissionNo}`);
    if (student.rollNumber) doc.text(`Roll No: ${student.rollNumber}`);
    doc.moveDown(1);

    if (purpose) {
      doc.text(`This certificate is issued for the purpose of: ${purpose}`);
      doc.moveDown(1);
    }

    doc.moveDown(3);
    doc.text("Principal/Head of Institution", { align: "right" });
    doc.text("(Seal & Signature)", { align: "right" });

    doc.end();
    const pdfBuffer = await pdfPromise;

    await saveCertificateRecord(tenantId, studentId, "study", certificateNo, req.user?.name || "Admin", { purpose });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="study_cert_${student.admissionNo}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/certificates/:id/certificate/custom
 * Body: { templateId?: string, title: string, body: string, variables?: object }
 */
export const generateCustomCertificateHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { title, body: certBody, variables } = req.body;

    if (!title || !certBody) {
      return res.status(400).json({ success: false, message: "Title and body are required" });
    }

    const student = await getStudentForCertificate(studentId, tenantId);
    const tenant = await getTenantInfo(tenantId);
    const certificateNo = await generateCertificateNo(tenantId, "custom");

    // Replace variables in body
    let processedBody = certBody
      .replace(/{{student_name}}/g, student.fullName || `${student.firstName} ${student.lastName}`)
      .replace(/{{father_name}}/g, student.fatherName)
      .replace(/{{mother_name}}/g, student.motherName)
      .replace(/{{class}}/g, student.className)
      .replace(/{{section}}/g, student.sectionName)
      .replace(/{{admission_no}}/g, student.admissionNo)
      .replace(/{{academic_year}}/g, student.academicYearName)
      .replace(/{{dob}}/g, new Date(student.dob).toLocaleDateString("en-IN"))
      .replace(/{{date}}/g, new Date().toLocaleDateString("en-IN"));

    // Apply custom variables
    if (variables && typeof variables === "object") {
      for (const [key, value] of Object.entries(variables)) {
        processedBody = processedBody.replace(new RegExp(`{{${key}}}`, "g"), String(value));
      }
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    doc.fontSize(18).font("Helvetica-Bold").text(tenant?.name || "School Name", { align: "center" });
    doc.fontSize(10).font("Helvetica").text(tenant?.address || "", { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    doc.fontSize(16).font("Helvetica-Bold").text(title.toUpperCase(), { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Certificate No: ${certificateNo}`, { align: "right" });
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, { align: "right" });
    doc.moveDown(1.5);

    doc.fontSize(12).font("Helvetica").text(processedBody, { align: "justify", lineGap: 5 });
    doc.moveDown(3);

    doc.text("Authorized Signatory", { align: "right" });
    doc.text("(Seal & Signature)", { align: "right" });

    doc.end();
    const pdfBuffer = await pdfPromise;

    await saveCertificateRecord(tenantId, studentId, "custom", certificateNo, req.user?.name || "Admin", { title, variables });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="certificate_${student.admissionNo}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/certificates/:id/certificate-history
 */
export const getCertificateHistoryHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;

    const certificates = await (prisma.certificate as any).findMany({
      where: { tenantId, studentId },
      orderBy: { generatedAt: "desc" },
      select: {
        id: true, type: true, certificateNo: true,
        generatedBy: true, generatedAt: true, status: true, metadata: true,
      },
    }).catch(() => []);

    res.json({ success: true, data: certificates });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/certificates/bulk-certificate
 * Body: { studentIds: string[], type: "bonafide"|"character"|"study", options?: object }
 */
export const bulkCertificateHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { studentIds, type, options } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "studentIds array is required" });
    }
    if (!type) {
      return res.status(400).json({ success: false, message: "Certificate type is required" });
    }

    const results: { studentId: string; name: string; certificateNo: string; status: string }[] = [];
    const errors: { studentId: string; error: string }[] = [];

    for (const studentId of studentIds) {
      try {
        const student = await getStudentForCertificate(studentId, tenantId);
        const certificateNo = await generateCertificateNo(tenantId, type);

        await saveCertificateRecord(tenantId, studentId, type, certificateNo, req.user?.name || "Admin", options);

        await prisma.studentTimelineEntry.create({
          data: {
            studentId, tenantId, type: "certificate",
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} Certificate Generated (Bulk)`,
            description: `Certificate No: ${certificateNo}`,
            createdBy: req.user?.name || "Admin",
          },
        }).catch(() => null);

        results.push({
          studentId,
          name: student.fullName || `${student.firstName} ${student.lastName}`,
          certificateNo,
          status: "ISSUED",
        });
      } catch (e: any) {
        errors.push({ studentId, error: e.message });
      }
    }

    res.json({
      success: true,
      data: { generated: results.length, failed: errors.length, results, errors },
      message: `Bulk certificates: ${results.length} generated, ${errors.length} failed`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
