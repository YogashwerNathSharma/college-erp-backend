import { Response } from "express";
import prisma from "../../utils/prisma";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import bcrypt from "bcrypt";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { createCanvas } from "canvas";

// ══════════════════════════════════════════════════════════════════
// STUDENT OPERATIONS CONTROLLER
// ══════════════════════════════════════════════════════════════════

/**
 * PATCH /api/students/operations/:id/status
 * Body: { status: string, reason?: string }
 * Valid statuses: active, inactive, transferred, passed, dropped, suspended, alumni
 */
export const changeStatusHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { status, reason } = req.body;

    const validStatuses = ["active", "inactive", "transferred", "passed", "dropped", "suspended", "alumni"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId, isDeleted: false },
    });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const previousStatus = student.status;

    await prisma.student.update({
      where: { id: studentId },
      data: {
        status,
        statusChangedAt: new Date(),
        statusChangedBy: req.user?.userId || req.user?.name,
        statusReason: reason || null,
      },
    });

    // Update enrollment status
    if (status !== "active") {
      await prisma.enrollment.updateMany({
        where: { studentId, tenantId, isDeleted: false, status: "active" },
        data: { status: status === "alumni" ? "completed" : "inactive" },
      });
    } else {
      await prisma.enrollment.updateMany({
        where: { studentId, tenantId, isDeleted: false },
        data: { status: "active" },
      });
    }

    // Log to history
    await prisma.studentHistory.create({
      data: {
        studentId, tenantId,
        action: "STATUS_CHANGE",
        details: JSON.stringify({ previousStatus, newStatus: status, reason }),
        performedBy: req.user?.userId || "system",
        academicYearId: student.academicYearId,
      },
    });

    // Log to timeline
    await prisma.studentTimelineEntry.create({
      data: {
        studentId, tenantId, type: "status_change",
        title: `Status changed: ${previousStatus} → ${status}`,
        description: reason || `Status updated to ${status}`,
        createdBy: req.user?.name || "Admin",
      },
    }).catch(() => null);

    // Log to audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        module: "STUDENT",
        action: "STATUS_CHANGE",
        entity: "Student",
        entityId: studentId,
        entityType: "Student",
        previousData: JSON.stringify({ status: previousStatus }),
        newData: JSON.stringify({ status, reason }),
        performedBy: req.user?.userId || "system",
        ipAddress: req.ip,
        userAgent: req.headers?.["user-agent"],
      },
    }).catch(() => null);

    res.json({
      success: true,
      data: { previousStatus, newStatus: status },
      message: `Student status changed from ${previousStatus} to ${status}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/:id/transfer
 * Body: { reason: string, destinationSchool?: string, effectiveDate?: string, generateTC?: boolean }
 */
export const transferStudentHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { reason, destinationSchool, effectiveDate, generateTC } = req.body;

    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId, isDeleted: false },
      include: {
        enrollments: {
          where: { isDeleted: false, status: "active" },
          include: { class: { select: { name: true } }, section: { select: { name: true } } },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // Update student status
    await prisma.student.update({
      where: { id: studentId },
      data: {
        status: "transferred",
        statusChangedAt: effectiveDate ? new Date(effectiveDate) : new Date(),
        statusChangedBy: req.user?.userId,
        statusReason: reason || "Transfer",
      },
    });

    // Deactivate enrollments
    await prisma.enrollment.updateMany({
      where: { studentId, tenantId, isDeleted: false, status: "active" },
      data: { status: "transferred" },
    });

    // Log to history
    await prisma.studentHistory.create({
      data: {
        studentId, tenantId,
        action: "TRANSFER",
        details: JSON.stringify({ reason, destinationSchool, effectiveDate }),
        performedBy: req.user?.userId || "system",
        academicYearId: student.academicYearId,
      },
    });

    // Timeline
    await prisma.studentTimelineEntry.create({
      data: {
        studentId, tenantId, type: "transfer",
        title: `Student Transferred`,
        description: `Transferred to ${destinationSchool || "another school"}. Reason: ${reason}`,
        createdBy: req.user?.name || "Admin",
      },
    }).catch(() => null);

    let tcData = null;
    if (generateTC) {
      // Generate Transfer Certificate number
      const tcCount = await prisma.certificate.count({ where: { tenantId, type: "TC" } }).catch(() => 0);
      const tcNo = `TC/${new Date().getFullYear().toString().slice(-2)}/${(tcCount + 1).toString().padStart(5, "0")}`;
      
      await prisma.certificate.create({
        data: {
          tenantId, studentId, type: "TC",
          certificateNo: tcNo,
          generatedBy: req.user?.id || null,
          issuedBy: req.user?.name || "Admin",
          generatedAt: new Date(),
          status: "ISSUED",
          metadata: { reason, destinationSchool },
        },
      }).catch(() => null);

      tcData = { certificateNo: tcNo, type: "TC" };
    }

    res.json({
      success: true,
      data: { status: "transferred", tc: tcData },
      message: `Student transferred successfully${generateTC ? `. TC No: ${tcData?.certificateNo}` : ""}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/:id/generate-login
 */
export const generateLoginHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;

    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId, isDeleted: false },
      select: { id: true, admissionNo: true, firstName: true, lastName: true, email: true, phone: true },
    });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // Check if already has credentials
    const existing = await prisma.studentCredential.findUnique({
      where: { studentId },
    }).catch(() => null);

    if (existing) {
      return res.status(409).json({ success: false, message: "Student already has login credentials", data: { username: existing.username } });
    }

    // Generate credentials
    const username = student.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, "");
    const tempPassword = `${student.firstName.substring(0, 3)}${student.admissionNo.slice(-4)}@${new Date().getFullYear()}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const credential = await prisma.studentCredential.create({
      data: {
        studentId,
        tenantId,
        username,
        passwordHash,
        isActive: true,
      },
    });

    // Timeline
    await prisma.studentTimelineEntry.create({
      data: {
        studentId, tenantId, type: "system",
        title: "Portal Login Created",
        description: `Username: ${username}`,
        createdBy: req.user?.name || "Admin",
      },
    }).catch(() => null);

    res.json({
      success: true,
      data: { username, temporaryPassword: tempPassword, credentialId: credential.id },
      message: "Login credentials generated. Please share the temporary password with the student.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/:id/reset-password
 */
export const resetPasswordHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;

    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId, isDeleted: false },
      select: { id: true, admissionNo: true, firstName: true },
    });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const credential = await prisma.studentCredential.findUnique({
      where: { studentId },
    }).catch(() => null);

    if (!credential) {
      return res.status(404).json({ success: false, message: "No login credentials found. Generate login first." });
    }

    const newPassword = `Reset${student.admissionNo.slice(-4)}@${Date.now().toString().slice(-4)}`;
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.studentCredential.update({
      where: { studentId },
      data: { passwordHash },
    });

    res.json({
      success: true,
      data: { username: credential.username, newPassword },
      message: "Password reset successfully. Share the new password with the student.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/:id/clone
 * Body: { overrides?: { firstName?, lastName?, classId?, sectionId? } }
 */
export const cloneStudentHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { overrides } = req.body;

    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId, isDeleted: false },
      include: {
        enrollments: {
          where: { isDeleted: false, status: "active" },
          take: 1, orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // Remove non-clonable fields
    const { id, admissionNo, srNo, createdAt, updatedAt, isDeleted, deletedAt, enrollments, documents, ...cloneData } = student as any;

    // Generate new admission number
    const { generateAdmissionNumber, generateSrNumber } = require("./admission-number.service");
    const newAdmissionNo = await generateAdmissionNumber(tenantId, student.academicYearId);
    const newSrNo = await generateSrNumber(tenantId, newAdmissionNo);

    // Apply overrides
    const finalData = {
      ...cloneData,
      ...(overrides || {}),
      admissionNo: newAdmissionNo,
      srNo: newSrNo,
      admissionDate: new Date(),
      status: "active",
      fullName: overrides?.firstName || overrides?.lastName
        ? `${overrides.firstName || cloneData.firstName} ${overrides.lastName || cloneData.lastName}`
        : cloneData.fullName,
    };

    const newStudent = await prisma.student.create({
      data: finalData,
    });

    // Clone enrollment if exists
    const enrollment = enrollments?.[0];
    if (enrollment) {
      await prisma.enrollment.create({
        data: {
          studentId: newStudent.id,
          classId: overrides?.classId || enrollment.classId,
          sectionId: overrides?.sectionId || enrollment.sectionId,
          academicYearId: enrollment.academicYearId,
          tenantId,
          status: "active",
          rollNumber: null,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: { id: newStudent.id, admissionNo: newAdmissionNo },
      message: `Student cloned. New Admission No: ${newAdmissionNo}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/merge
 * Body: { primaryId: string, duplicateId: string, mergeConfig?: object }
 */
export const mergeStudentsHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { primaryId, duplicateId, mergeConfig } = req.body;

    if (!primaryId || !duplicateId) {
      return res.status(400).json({ success: false, message: "primaryId and duplicateId are required" });
    }
    if (primaryId === duplicateId) {
      return res.status(400).json({ success: false, message: "Cannot merge a student with itself" });
    }

    const [primary, duplicate] = await Promise.all([
      prisma.student.findFirst({ where: { id: primaryId, tenantId, isDeleted: false } }),
      prisma.student.findFirst({ where: { id: duplicateId, tenantId, isDeleted: false } }),
    ]);

    if (!primary) return res.status(404).json({ success: false, message: "Primary student not found" });
    if (!duplicate) return res.status(404).json({ success: false, message: "Duplicate student not found" });

    await prisma.$transaction(async (tx: any) => {
      // Merge: Transfer relations from duplicate to primary
      // Enrollments
      await tx.enrollment.updateMany({
        where: { studentId: duplicateId, tenantId },
        data: { studentId: primaryId },
      });

      // Documents
      await tx.studentDocument.updateMany({
        where: { studentId: duplicateId, tenantId },
        data: { studentId: primaryId },
      });

      // Attendance
      await tx.attendance.updateMany({
        where: { studentId: duplicateId, tenantId },
        data: { studentId: primaryId },
      });

      // Timeline
      await tx.studentTimelineEntry.updateMany({
        where: { studentId: duplicateId, tenantId },
        data: { studentId: primaryId },
      }).catch(() => null);

      // Achievements
      await tx.studentAchievement.updateMany({
        where: { studentId: duplicateId, tenantId },
        data: { studentId: primaryId },
      }).catch(() => null);

      // Merge fields from duplicate that are empty in primary (if mergeConfig allows)
      const fieldsToMerge = mergeConfig?.preferDuplicate || [];
      const updateData: any = {};
      for (const field of fieldsToMerge) {
        if ((duplicate as any)[field] && !(primary as any)[field]) {
          updateData[field] = (duplicate as any)[field];
        }
      }
      if (Object.keys(updateData).length > 0) {
        await tx.student.update({ where: { id: primaryId }, data: updateData });
      }

      // Soft-delete the duplicate
      await tx.student.update({
        where: { id: duplicateId },
        data: { isDeleted: true, deletedAt: new Date(), status: "deleted", statusReason: `Merged into ${primary.admissionNo}` },
      });

      // Log merge
      await tx.studentHistory.create({
        data: {
          studentId: primaryId, tenantId,
          action: "MERGE",
          details: JSON.stringify({ mergedFrom: duplicateId, duplicateAdmNo: duplicate.admissionNo }),
          performedBy: req.user?.userId || "system",
          academicYearId: primary.academicYearId,
        },
      });
    });

    res.json({
      success: true,
      data: { primaryId, mergedDuplicateId: duplicateId },
      message: `Students merged. Duplicate (${duplicate.admissionNo}) merged into primary (${primary.admissionNo})`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/bulk-status
 * Body: { studentIds: string[], status: string, reason?: string }
 */
export const bulkStatusHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { studentIds, status, reason } = req.body;

    const validStatuses = ["active", "inactive", "transferred", "passed", "dropped", "suspended", "alumni"];
    if (!studentIds?.length || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Valid studentIds array and status required" });
    }

    const result = await prisma.student.updateMany({
      where: { id: { in: studentIds }, tenantId, isDeleted: false },
      data: {
        status,
        statusChangedAt: new Date(),
        statusChangedBy: req.user?.userId,
        statusReason: reason || null,
      },
    });

    // Update enrollments
    if (status !== "active") {
      await prisma.enrollment.updateMany({
        where: { studentId: { in: studentIds }, tenantId, isDeleted: false, status: "active" },
        data: { status: "inactive" },
      });
    }

    res.json({
      success: true,
      data: { updated: result.count },
      message: `${result.count} students updated to status: ${status}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/bulk-transfer
 * Body: { studentIds: string[], reason: string, destinationSchool?: string }
 */
export const bulkTransferHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { studentIds, reason, destinationSchool } = req.body;

    if (!studentIds?.length) {
      return res.status(400).json({ success: false, message: "studentIds array is required" });
    }

    const result = await prisma.student.updateMany({
      where: { id: { in: studentIds }, tenantId, isDeleted: false },
      data: {
        status: "transferred",
        statusChangedAt: new Date(),
        statusChangedBy: req.user?.userId,
        statusReason: reason || "Bulk transfer",
      },
    });

    await prisma.enrollment.updateMany({
      where: { studentId: { in: studentIds }, tenantId, isDeleted: false, status: "active" },
      data: { status: "transferred" },
    });

    res.json({
      success: true,
      data: { transferred: result.count },
      message: `${result.count} students transferred`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/bulk-id-card
 * Body: { studentIds: string[] }
 */
export const bulkIdCardHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { studentIds } = req.body;

    if (!studentIds?.length) {
      return res.status(400).json({ success: false, message: "studentIds array is required" });
    }

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds }, tenantId, isDeleted: false },
      include: {
        enrollments: {
          where: { isDeleted: false, status: "active" },
          include: {
            class: { select: { name: true } },
            section: { select: { name: true } },
            academicYear: { select: { name: true } },
          },
          take: 1, orderBy: { createdAt: "desc" },
        },
      },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, address: true, phone: true, logoUrl: true },
    });

    const idCards = students.map((s: any) => ({
      id: s.id,
      name: s.fullName || `${s.firstName} ${s.lastName}`,
      admissionNo: s.admissionNo,
      rollNumber: s.rollNumber || "-",
      class: s.enrollments?.[0]?.class?.name || "-",
      section: s.enrollments?.[0]?.section?.name || "-",
      academicYear: s.enrollments?.[0]?.academicYear?.name || "-",
      dob: s.dob,
      bloodGroup: s.bloodGroup || "-",
      fatherName: s.fatherName,
      address: s.address,
      phone: s.phone || s.fatherPhone,
      photoUrl: s.photoUrl,
      schoolName: tenant?.name || "",
      schoolAddress: tenant?.address || "",
      schoolPhone: tenant?.phone || "",
      schoolLogo: tenant?.logoUrl || "",
    }));

    res.json({ success: true, data: { idCards, total: idCards.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/operations/:id/audit-log
 * Query: ?page=1&limit=20&action=
 */
export const getAuditLogHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { page = "1", limit = "20", action } = req.query;

    const where: any = { tenantId, entityId: studentId, entityType: "Student" };
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }).catch(() => []),
      prisma.auditLog.count({ where }).catch(() => 0),
    ]);

    // Also get student history as fallback/supplement
    const history = await prisma.studentHistory.findMany({
      where: { studentId, tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({
      success: true,
      data: {
        auditLogs: logs,
        history,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/operations/:id/id-card
 */
export const getIdCardHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;

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
          take: 1, orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, address: true, phone: true, logoUrl: true },
    });

    // Generate QR code
    const qrData = JSON.stringify({
      id: student.id, name: student.fullName || `${student.firstName} ${student.lastName}`,
      admNo: student.admissionNo, phone: student.phone || student.fatherPhone,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 150 });

    // Generate barcode
    const canvas = createCanvas(200, 80);
    JsBarcode(canvas, student.admissionNo, { format: "CODE128", height: 50, displayValue: true, fontSize: 12 });
    const barcodeDataUrl = canvas.toDataURL();

    const enrollment = student.enrollments?.[0];
    res.json({
      success: true,
      data: {
        front: {
          schoolName: tenant?.name || "",
          schoolLogo: tenant?.logoUrl || "",
          schoolAddress: tenant?.address || "",
          studentName: student.fullName || `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo,
          rollNumber: student.rollNumber || "-",
          class: enrollment?.class?.name || "-",
          section: enrollment?.section?.name || "-",
          academicYear: enrollment?.academicYear?.name || "-",
          dob: student.dob,
          bloodGroup: student.bloodGroup || "-",
          photoUrl: student.photoUrl,
          qrCode: qrCodeDataUrl,
        },
        back: {
          fatherName: student.fatherName,
          motherName: student.motherName,
          address: student.address,
          phone: student.phone || student.fatherPhone,
          emergencyContact: student.emergencyContact || student.fatherPhone,
          barcode: barcodeDataUrl,
          schoolPhone: tenant?.phone || "",
          validUntil: enrollment?.academicYear?.name || new Date().getFullYear().toString(),
          instructions: [
            "This card must be carried at all times within the premises.",
            "If found, please return to the school office.",
            "This card is non-transferable.",
          ],
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/operations/:id/pdf/profile
 */
export const getProfilePdfHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;

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
        },
      },
    });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, address: true, phone: true },
    });

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    // Header
    doc.fontSize(16).font("Helvetica-Bold").text(tenant?.name || "School", { align: "center" });
    doc.fontSize(9).font("Helvetica").text(tenant?.address || "", { align: "center" });
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(14).font("Helvetica-Bold").text("STUDENT PROFILE", { align: "center" });
    doc.moveDown(1);

    // Personal Info
    const enrollment = student.enrollments?.[0];
    const name = student.fullName || `${student.firstName} ${student.lastName}`;

    doc.fontSize(11).font("Helvetica-Bold").text("PERSONAL INFORMATION");
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica");

    const personalFields = [
      ["Name", name], ["Admission No", student.admissionNo],
      ["Roll No", student.rollNumber || "-"], ["Gender", student.gender],
      ["Date of Birth", new Date(student.dob).toLocaleDateString("en-IN")],
      ["Blood Group", student.bloodGroup || "-"], ["Religion", student.religion || "-"],
      ["Category", student.category || "-"], ["Nationality", student.nationality],
      ["Aadhaar No", student.aadharNo || "-"], ["Email", student.email || "-"],
      ["Phone", student.phone || "-"],
      ["Class", enrollment?.class?.name || "-"], ["Section", enrollment?.section?.name || "-"],
      ["Academic Year", enrollment?.academicYear?.name || "-"],
    ];

    let y = doc.y;
    for (let i = 0; i < personalFields.length; i += 2) {
      const [l1, v1] = personalFields[i];
      doc.font("Helvetica-Bold").text(`${l1}:`, 40, y, { width: 120 });
      doc.font("Helvetica").text(String(v1), 160, y, { width: 130 });
      if (i + 1 < personalFields.length) {
        const [l2, v2] = personalFields[i + 1];
        doc.font("Helvetica-Bold").text(`${l2}:`, 310, y, { width: 120 });
        doc.font("Helvetica").text(String(v2), 430, y, { width: 130 });
      }
      y += 18;
    }

    doc.y = y + 10;
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica-Bold").text("PARENT/GUARDIAN INFORMATION");
    doc.moveDown(0.3);

    const parentFields = [
      ["Father's Name", student.fatherName], ["Father's Phone", student.fatherPhone],
      ["Father's Occupation", student.fatherOccupation || "-"],
      ["Mother's Name", student.motherName], ["Mother's Phone", student.motherPhone || "-"],
      ["Mother's Occupation", student.motherOccupation || "-"],
      ["Guardian", student.guardianName || "-"], ["Guardian Phone", student.guardianPhone || "-"],
    ];

    y = doc.y;
    doc.fontSize(10);
    for (let i = 0; i < parentFields.length; i += 2) {
      const [l1, v1] = parentFields[i];
      doc.font("Helvetica-Bold").text(`${l1}:`, 40, y, { width: 130 });
      doc.font("Helvetica").text(String(v1), 170, y, { width: 130 });
      if (i + 1 < parentFields.length) {
        const [l2, v2] = parentFields[i + 1];
        doc.font("Helvetica-Bold").text(`${l2}:`, 310, y, { width: 130 });
        doc.font("Helvetica").text(String(v2), 440, y, { width: 130 });
      }
      y += 18;
    }

    doc.y = y + 10;
    doc.fontSize(11).font("Helvetica-Bold").text("ADDRESS");
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").text(student.address || "-");

    doc.moveDown(1);
    doc.fontSize(8).fillColor("gray").text(`Generated on: ${new Date().toLocaleDateString("en-IN")} | ${tenant?.name}`, { align: "center" });

    doc.end();
    const pdfBuffer = await pdfPromise;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="profile_${student.admissionNo}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/pdf/list
 * Body: { filters?: object, columns?: string[], title?: string }
 */
export const generateListPdfHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { filters, columns, title } = req.body;

    const where: any = { tenantId, isDeleted: false };
    if (filters?.status) where.status = filters.status;
    if (filters?.gender) where.gender = { in: [filters.gender, filters.gender.toLowerCase()] };
    if (filters?.classId) where.enrollments = { some: { classId: filters.classId, isDeleted: false, status: "active" } };
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;

    const students = await prisma.student.findMany({
      where,
      include: {
        enrollments: {
          where: { isDeleted: false, status: "active" },
          include: { class: { select: { name: true } }, section: { select: { name: true } } },
          take: 1, orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { firstName: "asc" },
      take: 1000,
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, address: true },
    });

    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    // Header
    doc.fontSize(14).font("Helvetica-Bold").text(tenant?.name || "School", { align: "center" });
    doc.fontSize(12).text(title || "Student List", { align: "center" });
    doc.fontSize(8).font("Helvetica").text(`Generated: ${new Date().toLocaleDateString("en-IN")} | Total: ${students.length}`, { align: "center" });
    doc.moveDown(0.5);

    // Table headers
    const cols = columns || ["#", "Adm.No", "Name", "Class", "Section", "Gender", "Father", "Phone", "Status"];
    const colWidths = [25, 70, 130, 60, 50, 50, 110, 90, 60];
    let startX = 30;
    let y = doc.y;

    // Header row
    doc.fontSize(8).font("Helvetica-Bold");
    cols.forEach((col: string, i: number) => {
      doc.text(col, startX, y, { width: colWidths[i], align: "left" });
      startX += colWidths[i] + 5;
    });
    y += 15;
    doc.moveTo(30, y).lineTo(782, y).stroke();
    y += 5;

    // Data rows
    doc.font("Helvetica").fontSize(7);
    students.forEach((s: any, idx: number) => {
      if (y > 540) {
        doc.addPage();
        y = 30;
      }
      startX = 30;
      const rowData = [
        (idx + 1).toString(),
        s.admissionNo,
        s.fullName || `${s.firstName} ${s.lastName}`,
        s.enrollments?.[0]?.class?.name || "-",
        s.enrollments?.[0]?.section?.name || "-",
        s.gender,
        s.fatherName,
        s.fatherPhone || s.phone || "-",
        s.status,
      ];
      rowData.forEach((val: string, i: number) => {
        doc.text(val, startX, y, { width: colWidths[i], align: "left" });
        startX += colWidths[i] + 5;
      });
      y += 14;
    });

    doc.end();
    const pdfBuffer = await pdfPromise;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="student_list.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/excel/import
 * File upload handler (req.file available from multer)
 */
export const importExcelHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { classId, sectionId, academicYearId } = req.body;

    if (!classId || !sectionId || !academicYearId) {
      return res.status(400).json({ success: false, message: "classId, sectionId, and academicYearId required" });
    }

    const filePath = req.file.path;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheet = workbook.worksheets[0];
    if (!sheet) return res.status(400).json({ success: false, message: "No worksheet found in file" });

    const headers = sheet.getRow(1).values as string[];
    const rows: any[] = [];

    sheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) return; // Skip header
      const data: any = {};
      (row.values as any[]).forEach((val: any, idx: number) => {
        const header = headers[idx];
        if (header) data[header.toString().trim().toLowerCase().replace(/\s+/g, "_")] = val;
      });
      rows.push(data);
    });

    const { generateAdmissionNumber, generateSrNumber } = require("./admission-number.service");
    let imported = 0;
    let failed = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const admissionNo = row.admission_no || await generateAdmissionNumber(tenantId, academicYearId);
        const srNo = await generateSrNumber(tenantId, admissionNo);

        await prisma.$transaction(async (tx: any) => {
          const student = await tx.student.create({
            data: {
              firstName: row.first_name || row.firstname || "N/A",
              lastName: row.last_name || row.lastname || "N/A",
              fullName: `${row.first_name || row.firstname || ""} ${row.last_name || row.lastname || ""}`.trim(),
              gender: row.gender || "Male",
              dob: row.dob ? new Date(row.dob) : new Date("2010-01-01"),
              admissionNo,
              srNo,
              address: row.address || "N/A",
              fatherName: row.father_name || row.fathername || "N/A",
              fatherPhone: row.father_phone || row.fatherphone || "N/A",
              motherName: row.mother_name || row.mothername || "N/A",
              phone: row.phone || row.mobile || null,
              email: row.email || null,
              category: row.category || null,
              religion: row.religion || null,
              bloodGroup: row.blood_group || row.bloodgroup || null,
              nationality: row.nationality || "Indian",
              aadharNo: row.aadhaar || row.aadhar_no || null,
              tenantId,
              academicYearId,
              status: "active",
            },
          });

          await tx.enrollment.create({
            data: {
              studentId: student.id, classId, sectionId, academicYearId, tenantId,
              rollNumber: row.roll_number || row.rollnumber || null,
              status: "active",
            },
          });
        });

        imported++;
      } catch (e: any) {
        failed++;
        errors.push({ row: i + 2, error: e.message });
      }
    }

    res.json({
      success: true,
      data: { totalRows: rows.length, imported, failed, errors: errors.slice(0, 20) },
      message: `Import complete: ${imported} imported, ${failed} failed`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/excel/export
 * Body: { filters?: object, columns?: string[], studentIds?: string[] }
 */
export const exportExcelHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { filters, columns, studentIds } = req.body;

    const where: any = { tenantId, isDeleted: false };
    if (studentIds?.length) where.id = { in: studentIds };
    if (filters?.status) where.status = filters.status;
    if (filters?.gender) where.gender = { in: [filters.gender, filters.gender.toLowerCase()] };
    if (filters?.classId) where.enrollments = { some: { classId: filters.classId, isDeleted: false, status: "active" } };
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;

    const students = await prisma.student.findMany({
      where,
      include: {
        enrollments: {
          where: { isDeleted: false, status: "active" },
          include: { class: { select: { name: true } }, section: { select: { name: true } }, academicYear: { select: { name: true } } },
          take: 1, orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { firstName: "asc" },
      take: 5000,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ERP System";
    const sheet = workbook.addWorksheet("Students");

    // Define columns
    const defaultCols = [
      { header: "Admission No", key: "admissionNo", width: 15 },
      { header: "SR No", key: "srNo", width: 12 },
      { header: "Name", key: "name", width: 25 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "DOB", key: "dob", width: 14 },
      { header: "Class", key: "class", width: 12 },
      { header: "Section", key: "section", width: 10 },
      { header: "Father Name", key: "fatherName", width: 20 },
      { header: "Father Phone", key: "fatherPhone", width: 14 },
      { header: "Mother Name", key: "motherName", width: 20 },
      { header: "Phone", key: "phone", width: 14 },
      { header: "Email", key: "email", width: 22 },
      { header: "Category", key: "category", width: 12 },
      { header: "Religion", key: "religion", width: 12 },
      { header: "Blood Group", key: "bloodGroup", width: 12 },
      { header: "Address", key: "address", width: 30 },
      { header: "Status", key: "status", width: 12 },
      { header: "Admission Date", key: "admissionDate", width: 14 },
    ];

    sheet.columns = defaultCols;

    // Style header
    sheet.getRow(1).font = { bold: true, size: 11 };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Add data
    students.forEach((s: any) => {
      sheet.addRow({
        admissionNo: s.admissionNo,
        srNo: s.srNo || "",
        name: s.fullName || `${s.firstName} ${s.lastName}`,
        gender: s.gender,
        dob: new Date(s.dob).toLocaleDateString("en-IN"),
        class: s.enrollments?.[0]?.class?.name || "",
        section: s.enrollments?.[0]?.section?.name || "",
        fatherName: s.fatherName,
        fatherPhone: s.fatherPhone,
        motherName: s.motherName,
        phone: s.phone || "",
        email: s.email || "",
        category: s.category || "",
        religion: s.religion || "",
        bloodGroup: s.bloodGroup || "",
        address: s.address,
        status: s.status,
        admissionDate: new Date(s.admissionDate).toLocaleDateString("en-IN"),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="students_export_${Date.now()}.xlsx"`);
    res.send(Buffer.from(buffer as ArrayBuffer));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/operations/excel/template
 */
export const getExcelTemplateHandler = async (req: any, res: Response) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Student Import Template");

    sheet.columns = [
      { header: "First Name*", key: "first_name", width: 18 },
      { header: "Last Name*", key: "last_name", width: 18 },
      { header: "Gender*", key: "gender", width: 10 },
      { header: "DOB* (DD/MM/YYYY)", key: "dob", width: 18 },
      { header: "Father Name*", key: "father_name", width: 20 },
      { header: "Father Phone*", key: "father_phone", width: 15 },
      { header: "Mother Name", key: "mother_name", width: 20 },
      { header: "Mother Phone", key: "mother_phone", width: 15 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Email", key: "email", width: 22 },
      { header: "Address*", key: "address", width: 30 },
      { header: "Roll Number", key: "roll_number", width: 12 },
      { header: "Category", key: "category", width: 12 },
      { header: "Religion", key: "religion", width: 12 },
      { header: "Blood Group", key: "blood_group", width: 12 },
      { header: "Nationality", key: "nationality", width: 14 },
      { header: "Aadhaar No", key: "aadhaar", width: 15 },
    ];

    // Style header
    sheet.getRow(1).font = { bold: true, size: 11 };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Add sample row
    sheet.addRow({
      first_name: "Rahul", last_name: "Sharma", gender: "Male", dob: "15/03/2012",
      father_name: "Rajesh Sharma", father_phone: "9876543210",
      mother_name: "Priya Sharma", mother_phone: "9876543211",
      phone: "", email: "", address: "123, Main Street, City",
      roll_number: "1", category: "General", religion: "Hindu",
      blood_group: "B+", nationality: "Indian", aadhaar: "",
    });

    // Add validation notes
    const notesSheet = workbook.addWorksheet("Instructions");
    notesSheet.getColumn(1).width = 50;
    notesSheet.addRow(["IMPORT INSTRUCTIONS"]);
    notesSheet.addRow([""]);
    notesSheet.addRow(["1. Fields marked with * are mandatory"]);
    notesSheet.addRow(["2. Gender: Male, Female, Other"]);
    notesSheet.addRow(["3. DOB format: DD/MM/YYYY"]);
    notesSheet.addRow(["4. Phone: 10-digit Indian mobile number"]);
    notesSheet.addRow(["5. Category: General, OBC, SC, ST, EWS"]);
    notesSheet.addRow(["6. Blood Group: A+, A-, B+, B-, O+, O-, AB+, AB-"]);
    notesSheet.addRow(["7. Remove the sample row before importing"]);
    notesSheet.addRow(["8. Maximum 500 rows per import"]);
    notesSheet.getRow(1).font = { bold: true, size: 14 };

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=\"student_import_template.xlsx\"");
    res.send(Buffer.from(buffer as ArrayBuffer));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// SIBLINGS
// ══════════════════════════════════════════════════════════════════

/**
 * GET /api/students/operations/:id/siblings
 */
export const getSiblingsHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;

    const siblings = await prisma.studentSibling.findMany({
      where: { studentId, tenantId },
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    // Enrich with student data if sibling is in the system
    const enriched = await Promise.all(
      (siblings as any[]).map(async (sib: any) => {
        if (sib.siblingStudentId) {
          const siblingStudent = await prisma.student.findFirst({
            where: { id: sib.siblingStudentId, tenantId, isDeleted: false },
            select: {
              id: true, fullName: true, firstName: true, lastName: true, admissionNo: true, photoUrl: true,
              enrollments: {
                where: { isDeleted: false, status: "active" },
                select: { class: { select: { name: true } }, section: { select: { name: true } } },
                take: 1, orderBy: { createdAt: "desc" },
              },
            },
          });
          return {
            ...sib,
            siblingDetails: siblingStudent ? {
              name: siblingStudent.fullName || `${siblingStudent.firstName} ${siblingStudent.lastName}`,
              admissionNo: siblingStudent.admissionNo,
              class: siblingStudent.enrollments?.[0]?.class?.name || "-",
              section: siblingStudent.enrollments?.[0]?.section?.name || "-",
              photoUrl: siblingStudent.photoUrl,
            } : null,
          };
        }
        return sib;
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/:id/siblings
 * Body: { name: string, relation: string, siblingStudentId?: string, class?: string, school?: string, dob?: string }
 */
export const addSiblingHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { name, relation, siblingStudentId, class: sibClass, school, dob } = req.body;

    if (!name || !relation) {
      return res.status(400).json({ success: false, message: "Name and relation are required" });
    }

    const sibling = await prisma.studentSibling.create({
      data: {
        studentId,
        tenantId,
        name,
        relation,
        siblingStudentId: siblingStudentId || null,
        className: sibClass || null,
        school: school || null,
        dob: dob ? new Date(dob) : null,
      },
    });

    // If linking to existing student, create reverse relationship too
    if (siblingStudentId) {
      const reverseRelation = relation === "brother" ? "brother" : relation === "sister" ? "sister" : "sibling";
      const student = await prisma.student.findFirst({
        where: { id: studentId, tenantId },
        select: { firstName: true, lastName: true, fullName: true },
      });

      await prisma.studentSibling.create({
        data: {
          studentId: siblingStudentId, tenantId,
          name: student?.fullName || `${student?.firstName} ${student?.lastName}`,
          relation: reverseRelation,
          siblingStudentId: studentId,
        },
      }).catch(() => null);
    }

    res.status(201).json({ success: true, data: sibling });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/students/operations/:id/siblings/:sid
 */
export const removeSiblingHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const siblingId = req.params.sid;

    await prisma.studentSibling.deleteMany({
      where: { id: siblingId, tenantId },
    });

    res.json({ success: true, message: "Sibling removed" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// VACCINATIONS
// ══════════════════════════════════════════════════════════════════

/**
 * GET /api/students/operations/:id/vaccinations
 */
export const getVaccinationsHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;

    const vaccinations = await prisma.studentVaccination.findMany({
      where: { studentId, tenantId },
      orderBy: { dateGiven: "desc" },
    }).catch(() => []);

    res.json({ success: true, data: vaccinations });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/operations/:id/vaccinations
 * Body: { vaccineName, doseNumber, dateGiven, nextDueDate?, hospital?, doctorName?, batchNo?, remarks? }
 */
export const addVaccinationHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { vaccineName, doseNumber, dateGiven, nextDueDate, hospital, doctorName, batchNo, remarks, documentUrl } = req.body;

    if (!vaccineName || !doseNumber || !dateGiven) {
      return res.status(400).json({ success: false, message: "vaccineName, doseNumber, and dateGiven are required" });
    }

    const vaccination = await prisma.studentVaccination.create({
      data: {
        studentId, tenantId, vaccineName, doseNumber: parseInt(doseNumber),
        dateGiven: new Date(dateGiven),
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        hospital: hospital || null, doctorName: doctorName || null,
        batchNo: batchNo || null, remarks: remarks || null,
        documentUrl: documentUrl || null,
      },
    });

    // Timeline
    await prisma.studentTimelineEntry.create({
      data: {
        studentId, tenantId, type: "medical",
        title: `Vaccination: ${vaccineName} (Dose ${doseNumber})`,
        description: `Given on ${new Date(dateGiven).toLocaleDateString("en-IN")}${hospital ? ` at ${hospital}` : ""}`,
        createdBy: req.user?.name || "Admin",
      },
    }).catch(() => null);

    res.status(201).json({ success: true, data: vaccination });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/students/operations/:id/vaccinations/:vid
 */
export const updateVaccinationHandler = async (req: any, res: Response) => {
  try {
    const vaccinationId = req.params.vid;
    const { vaccineName, doseNumber, dateGiven, nextDueDate, hospital, doctorName, batchNo, remarks, documentUrl } = req.body;

    const vaccination = await prisma.studentVaccination.update({
      where: { id: vaccinationId },
      data: {
        ...(vaccineName && { vaccineName }),
        ...(doseNumber && { doseNumber: parseInt(doseNumber) }),
        ...(dateGiven && { dateGiven: new Date(dateGiven) }),
        ...(nextDueDate !== undefined && { nextDueDate: nextDueDate ? new Date(nextDueDate) : null }),
        ...(hospital !== undefined && { hospital }),
        ...(doctorName !== undefined && { doctorName }),
        ...(batchNo !== undefined && { batchNo }),
        ...(remarks !== undefined && { remarks }),
        ...(documentUrl !== undefined && { documentUrl }),
      },
    });

    res.json({ success: true, data: vaccination });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/students/operations/:id/vaccinations/:vid
 */
export const deleteVaccinationHandler = async (req: any, res: Response) => {
  try {
    const vaccinationId = req.params.vid;
    await prisma.studentVaccination.delete({ where: { id: vaccinationId } });
    res.json({ success: true, message: "Vaccination record deleted" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
