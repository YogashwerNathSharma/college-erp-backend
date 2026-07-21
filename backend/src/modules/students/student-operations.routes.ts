// ══════════════════════════════════════════════════════════════════════════════
// STUDENT OPERATIONS ROUTES — Status, Transfer, Login, Clone, Merge, PDF, Excel
// Mount at: app.use("/api/students/operations", studentOperationsRoutes)
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Response } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { uploadDocument } from "../../utils/upload";

import {
  changeStudentStatus,
  transferStudent,
  generateStudentLogin,
  resetStudentPassword,
  bulkStatusChange,
  getStatusHistory,
  getAuditLog,
} from "./student-status.service";

import { cloneStudent, mergeStudents } from "./student-duplicate.service";
import { generateStudentProfilePDF, generateStudentListPDF } from "./student-pdf.service";
import { importFromExcel, exportToExcel, getImportTemplate, exportMultiSheet } from "./student-excel.service";

const router = Router();
router.use(authMiddleware, resolveTenant);

// ══════════════════════════════════════════════════════════════════════════════
// STATUS OPERATIONS
// ══════════════════════════════════════════════════════════════════════════════

// Change student status
router.patch("/:id/status", allowRoles("ADMIN"), async (req: any, res: Response) => {
  try {
    const { status, reason, effectiveDate } = req.body;
    if (!status || !reason) {
      return res.status(400).json({ success: false, message: "Status and reason are required" });
    }
    const result = await changeStudentStatus(req.tenantId, req.params.id, { status, reason, effectiveDate }, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Transfer student
router.post("/:id/transfer", allowRoles("ADMIN"), async (req: any, res: Response) => {
  try {
    const { reason, destinationSchool, effectiveDate, generateTC, remarks } = req.body;
    if (!reason || !destinationSchool || !effectiveDate) {
      return res.status(400).json({ success: false, message: "Reason, destination school, and effective date are required" });
    }
    const result = await transferStudent(req.tenantId, req.params.id, { reason, destinationSchool, effectiveDate, generateTC: generateTC !== false, remarks }, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Generate login credentials
router.post("/:id/generate-login", allowRoles("ADMIN"), async (req: any, res: Response) => {
  try {
    const result = await generateStudentLogin(req.tenantId, req.params.id, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Reset password
router.post("/:id/reset-password", allowRoles("ADMIN"), async (req: any, res: Response) => {
  try {
    const result = await resetStudentPassword(req.tenantId, req.params.id, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Clone student
router.post("/:id/clone", allowRoles("ADMIN"), async (req: any, res: Response) => {
  try {
    const result = await cloneStudent(req.tenantId, req.params.id, req.body, req.user.userId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Merge duplicates
router.post("/merge", allowRoles("ADMIN"), async (req: any, res: Response) => {
  try {
    const { primaryId, duplicateId, fieldsFromDuplicate } = req.body;
    if (!primaryId || !duplicateId) {
      return res.status(400).json({ success: false, message: "primaryId and duplicateId are required" });
    }
    const result = await mergeStudents(req.tenantId, primaryId, duplicateId, { fieldsFromDuplicate: fieldsFromDuplicate || [] }, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Bulk status change
router.post("/bulk-status", allowRoles("ADMIN"), async (req: any, res: Response) => {
  try {
    const { studentIds, status, reason } = req.body;
    if (!studentIds?.length || !status || !reason) {
      return res.status(400).json({ success: false, message: "studentIds, status, and reason are required" });
    }
    const result = await bulkStatusChange(req.tenantId, studentIds, status, reason, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Status history
router.get("/:id/status-history", async (req: any, res: Response) => {
  try {
    const data = await getStatusHistory(req.tenantId, req.params.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Audit log
router.get("/:id/audit-log", async (req: any, res: Response) => {
  try {
    const { action, fromDate, toDate } = req.query;
    const data = await getAuditLog(req.tenantId, req.params.id, {
      action: action as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PDF GENERATION
// ══════════════════════════════════════════════════════════════════════════════

// Student profile PDF
router.get("/:id/pdf/profile", async (req: any, res: Response) => {
  try {
    const buffer = await generateStudentProfilePDF(req.tenantId, req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="student-profile-${req.params.id}.pdf"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Student list PDF
router.post("/pdf/list", async (req: any, res: Response) => {
  try {
    const { filters, columns } = req.body;
    const buffer = await generateStudentListPDF(req.tenantId, filters || {}, columns);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="student-list.pdf"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// EXCEL OPERATIONS
// ══════════════════════════════════════════════════════════════════════════════

// Import from Excel
router.post("/excel/import", allowRoles("ADMIN"), (req: any, res: any) => {
  uploadDocument(req, res, async (err: any) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    try {
      const { academicYearId, classId, sectionId } = req.body;
      if (!academicYearId || !classId || !sectionId) {
        return res.status(400).json({ success: false, message: "academicYearId, classId, and sectionId are required" });
      }

      const result = await importFromExcel(
        req.tenantId,
        req.file.path,
        academicYearId,
        classId,
        sectionId,
        req.user.userId
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
});

// Export to Excel
router.post("/excel/export", async (req: any, res: Response) => {
  try {
    const { filters, columns } = req.body;
    const buffer = await exportToExcel(req.tenantId, filters || {}, columns);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="students-export.xlsx"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export multi-sheet (class-wise)
router.get("/excel/multi-sheet", async (req: any, res: Response) => {
  try {
    const { academicYearId } = req.query;
    if (!academicYearId) {
      return res.status(400).json({ success: false, message: "academicYearId is required" });
    }
    const buffer = await exportMultiSheet(req.tenantId, academicYearId as string);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="students-classwise.xlsx"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Download import template
router.get("/excel/template", async (req: any, res: Response) => {
  try {
    const buffer = await getImportTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="student-import-template.xlsx"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// SIBLINGS
// ══════════════════════════════════════════════════════════════════════════════

import prisma from "../../utils/prisma";

router.get("/:id/siblings", async (req: any, res: Response) => {
  try {
    const siblings = await prisma.studentSibling.findMany({
      where: { studentId: req.params.id, tenantId: req.tenantId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: siblings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/:id/siblings", async (req: any, res: Response) => {
  try {
    const { name, relation, className, school, dob, gender, siblingStudentId, admissionNo } = req.body;
    if (!name || !relation) {
      return res.status(400).json({ success: false, message: "Name and relation are required" });
    }
    const sibling = await prisma.studentSibling.create({
      data: {
        studentId: req.params.id,
        tenantId: req.tenantId,
        name, relation, className, school, gender,
        siblingStudentId: siblingStudentId || null,
        admissionNo: admissionNo || null,
        dob: dob ? new Date(dob) : null,
      },
    });
    res.status(201).json({ success: true, data: sibling });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete("/:id/siblings/:sid", async (req: any, res: Response) => {
  try {
    await prisma.studentSibling.delete({ where: { id: req.params.sid } });
    res.json({ success: true, message: "Sibling removed" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// VACCINATIONS
// ══════════════════════════════════════════════════════════════════════════════

router.get("/:id/vaccinations", async (req: any, res: Response) => {
  try {
    const vaccinations = await prisma.studentVaccination.findMany({
      where: { studentId: req.params.id, tenantId: req.tenantId },
      orderBy: { dateGiven: "desc" },
    });
    res.json({ success: true, data: vaccinations });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/:id/vaccinations", async (req: any, res: Response) => {
  try {
    const { vaccineName, doseNumber, dateGiven, nextDueDate, hospital, doctorName, batchNo, remarks, documentUrl } = req.body;
    if (!vaccineName || !doseNumber || !dateGiven) {
      return res.status(400).json({ success: false, message: "vaccineName, doseNumber, and dateGiven are required" });
    }
    const vaccination = await prisma.studentVaccination.create({
      data: {
        studentId: req.params.id,
        tenantId: req.tenantId,
        vaccineName, doseNumber,
        dateGiven: new Date(dateGiven),
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        hospital, doctorName, batchNo, remarks, documentUrl,
      },
    });
    res.status(201).json({ success: true, data: vaccination });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put("/:id/vaccinations/:vid", async (req: any, res: Response) => {
  try {
    const data: any = { ...req.body };
    if (data.dateGiven) data.dateGiven = new Date(data.dateGiven);
    if (data.nextDueDate) data.nextDueDate = new Date(data.nextDueDate);
    const vaccination = await prisma.studentVaccination.update({
      where: { id: req.params.vid },
      data,
    });
    res.json({ success: true, data: vaccination });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete("/:id/vaccinations/:vid", async (req: any, res: Response) => {
  try {
    await prisma.studentVaccination.delete({ where: { id: req.params.vid } });
    res.json({ success: true, message: "Vaccination record deleted" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
