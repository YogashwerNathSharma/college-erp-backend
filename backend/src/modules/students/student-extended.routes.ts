import { Router, Response } from "express";
import prisma from "../../utils/prisma";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();
router.use(authMiddleware, resolveTenant);

// ══════════════════════════════════════════════════════
// MEDICAL HISTORY
// ══════════════════════════════════════════════════════

router.get("/:id/medical", async (req: any, res: Response) => {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      select: {
        medicalConditions: true, allergies: true, medications: true,
        emergencyContact: true, emergencyPhone: true, insuranceId: true,
        lastMedicalCheckup: true,
      },
    });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/:id/medical", async (req: any, res: Response) => {
  try {
    const { medicalConditions, allergies, medications, emergencyContact, emergencyPhone, insuranceId, lastMedicalCheckup } = req.body;
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: {
        ...(medicalConditions !== undefined && { medicalConditions }),
        ...(allergies !== undefined && { allergies }),
        ...(medications !== undefined && { medications }),
        ...(emergencyContact !== undefined && { emergencyContact }),
        ...(emergencyPhone !== undefined && { emergencyPhone }),
        ...(insuranceId !== undefined && { insuranceId }),
        ...(lastMedicalCheckup !== undefined && { lastMedicalCheckup: new Date(lastMedicalCheckup) }),
      },
    });
    res.json({ success: true, data: student });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════
// ACHIEVEMENTS
// ══════════════════════════════════════════════════════

router.get("/:id/achievements", async (req: any, res: Response) => {
  try {
    const achievements = await prisma.studentAchievement.findMany({
      where: { studentId: req.params.id, tenantId: req.tenantId },
      orderBy: { date: "desc" },
    });
    res.json({ success: true, data: achievements });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/:id/achievements", async (req: any, res: Response) => {
  try {
    const { title, category, description, date, awardedBy, certificate } = req.body;
    const achievement = await prisma.studentAchievement.create({
      data: { studentId: req.params.id, tenantId: req.tenantId, title, category, description, date: new Date(date), awardedBy, certificate },
    });
    // Add to timeline
    await prisma.studentTimelineEntry.create({
      data: { studentId: req.params.id, tenantId: req.tenantId, type: "achievement", title: `Achievement: ${title}`, description, createdBy: req.user?.name || "Admin" },
    });
    res.status(201).json({ success: true, data: achievement });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

router.put("/:id/achievements/:aid", async (req: any, res: Response) => {
  try {
    const achievement = await prisma.studentAchievement.update({
      where: { id: req.params.aid },
      data: { ...req.body, ...(req.body.date && { date: new Date(req.body.date) }) },
    });
    res.json({ success: true, data: achievement });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

router.delete("/:id/achievements/:aid", async (req: any, res: Response) => {
  try {
    await prisma.studentAchievement.delete({ where: { id: req.params.aid } });
    res.json({ success: true, message: "Achievement deleted" });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════
// DISCIPLINARY RECORDS
// ══════════════════════════════════════════════════════

router.get("/:id/disciplinary", async (req: any, res: Response) => {
  try {
    const records = await prisma.studentDisciplinaryRecord.findMany({
      where: { studentId: req.params.id, tenantId: req.tenantId },
      orderBy: { date: "desc" },
    });
    res.json({ success: true, data: records });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/:id/disciplinary", async (req: any, res: Response) => {
  try {
    const { type, reason, description, date, actionTaken, issuedBy } = req.body;
    const record = await prisma.studentDisciplinaryRecord.create({
      data: { studentId: req.params.id, tenantId: req.tenantId, type, reason, description, date: new Date(date), actionTaken, issuedBy },
    });
    await prisma.studentTimelineEntry.create({
      data: { studentId: req.params.id, tenantId: req.tenantId, type: "disciplinary", title: `${type}: ${reason}`, description: actionTaken, createdBy: issuedBy || "Admin" },
    });
    res.status(201).json({ success: true, data: record });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

router.put("/:id/disciplinary/:did", async (req: any, res: Response) => {
  try {
    const record = await prisma.studentDisciplinaryRecord.update({
      where: { id: req.params.did },
      data: { ...req.body, ...(req.body.date && { date: new Date(req.body.date) }), ...(req.body.resolvedAt && { resolvedAt: new Date(req.body.resolvedAt) }) },
    });
    res.json({ success: true, data: record });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

router.delete("/:id/disciplinary/:did", async (req: any, res: Response) => {
  try {
    await prisma.studentDisciplinaryRecord.delete({ where: { id: req.params.did } });
    res.json({ success: true, message: "Record deleted" });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════
// TIMELINE
// ══════════════════════════════════════════════════════

router.get("/:id/timeline", async (req: any, res: Response) => {
  try {
    const timeline = await prisma.studentTimelineEntry.findMany({
      where: { studentId: req.params.id, tenantId: req.tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ success: true, data: timeline });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════
// CUSTOM FIELDS
// ══════════════════════════════════════════════════════

router.get("/:id/custom-fields", async (req: any, res: Response) => {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      select: { customFields: true },
    });
    res.json({ success: true, data: student?.customFields || {} });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/:id/custom-fields", async (req: any, res: Response) => {
  try {
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: { customFields: req.body },
    });
    res.json({ success: true, data: student.customFields });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════
// IDENTIFICATION (RFID / QR / Biometric)
// ══════════════════════════════════════════════════════

router.put("/:id/identification", async (req: any, res: Response) => {
  try {
    const { rfidCardNo, qrCode, biometricId, previousSchool, previousClass } = req.body;
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: { rfidCardNo, qrCode, biometricId, previousSchool, previousClass },
    });
    res.json({ success: true, data: student });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════
// ACADEMIC RECORD (aggregated)
// ══════════════════════════════════════════════════════

router.get("/:id/academic-record", async (req: any, res: Response) => {
  try {
    const studentId = req.params.id;
    const tenantId = req.tenantId;

    // Get enrollments for this student
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId, tenantId, isDeleted: false },
      include: { class: true, section: true, academicYear: true },
      orderBy: { createdAt: "desc" },
    });

    // Attendance summary
    const attendance = await prisma.attendance.findMany({
      where: { studentId, tenantId },
      select: { status: true, date: true },
    });
    const totalDays = attendance.length;
    const presentDays = attendance.filter((a: any) => a.status === "PRESENT" || a.status === "present").length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Fee summary
    const fees = await prisma.studentFee.findMany({
      where: { tenantId, enrollment: { studentId } },
      select: { totalAmount: true, paidAmount: true, balanceAmount: true, status: true },
    }).catch(() => []);

    const totalFee = fees.reduce((sum: number, f: any) => sum + (f.totalAmount || 0), 0);
    const paidFee = fees.reduce((sum: number, f: any) => sum + (f.paidAmount || 0), 0);
    const pendingFee = fees.reduce((sum: number, f: any) => sum + (f.balanceAmount || 0), 0);

    res.json({
      success: true,
      data: {
        enrollments,
        attendance: { totalDays, presentDays, absentDays: totalDays - presentDays, percentage: attendancePercentage },
        fees: { total: totalFee, paid: paidFee, pending: pendingFee, records: fees },
      },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════
// BULK IMPORT
// ══════════════════════════════════════════════════════

router.post("/bulk-import", async (req: any, res: Response) => {
  try {
    const { students } = req.body; // Array of student objects
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: "No students data provided" });
    }

    const tenantId = req.tenantId;
    const academicYearId = req.body.academicYearId;
    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (let i = 0; i < students.length; i++) {
      try {
        const s = students[i];
        await prisma.student.create({
          data: {
            firstName: s.firstName,
            lastName: s.lastName,
            fullName: `${s.firstName} ${s.lastName}`,
            gender: s.gender || "Male",
            dob: new Date(s.dob),
            admissionNo: s.admissionNo || `ADM-${Date.now()}-${i}`,
            admissionDate: s.admissionDate ? new Date(s.admissionDate) : new Date(),
            fatherName: s.fatherName || "",
            motherName: s.motherName || "",
            fatherPhone: s.fatherPhone || "",
            address: s.address || "",
            phone: s.phone,
            email: s.email,
            bloodGroup: s.bloodGroup,
            religion: s.religion,
            caste: s.caste,
            category: s.category,
            nationality: s.nationality || "Indian",
            tenantId,
            academicYearId: academicYearId || s.academicYearId,
          },
        });
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ row: i + 1, error: err.message });
      }
    }

    res.json({ success: true, data: results });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════
// BULK EXPORT
// ══════════════════════════════════════════════════════

router.post("/bulk-export", async (req: any, res: Response) => {
  try {
    const { fields, filters } = req.body;
    const where: any = { tenantId: req.tenantId, isDeleted: false };
    if (filters?.status) where.status = filters.status;
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;

    const select: any = {};
    const allFields = fields || ["firstName", "lastName", "gender", "dob", "admissionNo", "fatherName", "phone", "address"];
    allFields.forEach((f: string) => { select[f] = true; });

    const students = await prisma.student.findMany({ where, select, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: students, count: students.length });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
