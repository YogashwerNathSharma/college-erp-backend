
import { Router } from "express";
import prisma from "../../utils/prisma";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

import { checkLimit } from "../../middleware/subscriptionLimit.middleware";

import { allowRoles } from "../../middleware/role.middleware";
import { validateStudentAge } from "./age-validation.service";
import { uploadPhoto, uploadDocument } from "../../utils/upload";
import {
  uploadStudentPhoto,
  uploadStudentDocument,
  getStudentDocuments,
  deleteStudentDocument,
  deleteStudentPhoto,
} from "./upload.service";
import {
  createStudentHandler,
  getAllStudentsHandler,
  getStudentByIdHandler,
  updateStudentHandler,
  softDeleteStudentHandler,
  restoreStudentHandler,
  getDeletedStudentsHandler,
  getStudentStatsHandler,
  getEligibleStudentsHandler,
  promoteStudentHandler,
  bulkPromoteHandler,
  undoPromotionHandler,
  changeSectionHandler,
  createEnrollmentHandler,
  bulkCreateEnrollmentsHandler,
  getAgeConfigHandler,
  seedAgeConfigHandler,
  updateAgeConfigHandler,
  toggleAgeConfigHandler,
  printStudentsHandler,
} from "./student.controller";

const router = Router();

// ============================================
// ALL ROUTES USE AUTH + TENANT
// ============================================
router.use(authMiddleware, resolveTenant);

// ============================================
// STATIC ROUTES FIRST (before /:id)
// ============================================
// ============================================
// UPLOAD ROUTES (before /:id)
// ============================================

// Upload student photo
router.post("/:id/photo", (req: any, res: any) => {
  uploadPhoto(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No photo file provided" });
    }
    try {
      const result = await uploadStudentPhoto(req.params.id, req.tenantId, req.file);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
});

// Delete student photo
router.delete("/:id/photo", allowRoles("ADMIN"), async (req: any, res: any) => {
  try {
    const result = await deleteStudentPhoto(req.params.id, req.tenantId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Upload student document
router.post("/:id/documents", (req: any, res: any) => {
  uploadDocument(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No document file provided" });
    }
    try {
      const { type, name } = req.body;
      const result = await uploadStudentDocument(
        req.params.id,
        req.tenantId,
        req.file,
        type || "other",
        name
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
});

// Get student documents
router.get("/:id/documents", async (req: any, res: any) => {
  try {
    const documents = await getStudentDocuments(req.params.id, req.tenantId);
    res.json({ success: true, data: documents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete student document
router.delete("/documents/:documentId", allowRoles("ADMIN"), async (req: any, res: any) => {
  try {
    const result = await deleteStudentDocument(req.params.documentId, req.tenantId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});
// --- Stats ---
router.get("/stats", getStudentStatsHandler);

// --- Class Strength ---
router.get("/class-strength", async (req: any, res: any) => {
  try {
    const tenantId = req.tenantId;
    const { academicYearId } = req.query;

    const classes = await prisma.class.findMany({
      where: { tenantId, ...(academicYearId && { academicYearId }), isDeleted: false },
      select: { id: true, name: true, enrollments: { where: { isDeleted: false, status: "active", ...(academicYearId && { academicYearId }) }, select: { id: true } } },
    });

    const data = classes.map((c: any) => ({
      class: c.name,
      count: c.enrollments?.length || 0,
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Recent Admissions ---
router.get("/recent-admissions", async (req: any, res: any) => {
  try {
    const tenantId = req.tenantId;
    const limit = parseInt(req.query.limit) || 5;

    const students = await prisma.student.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, firstName: true, lastName: true, admissionNo: true, createdAt: true },
    });

    const data = students.map((s: any) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      admNo: s.admissionNo,
      class: "",
      date: s.createdAt,
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Category Distribution ---
router.get("/category-distribution", async (req: any, res: any) => {
  try {
    const tenantId = req.tenantId;
    const { academicYearId } = req.query;

    const students = await prisma.student.findMany({
      where: { tenantId, ...(academicYearId && { academicYearId }) },
      select: { category: true },
    });

    const categoryCount: Record<string, number> = {};
    students.forEach((s: any) => {
      const cat = s.category || "General";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const total = students.length;
    const data = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Fee Pending Students (Top 5) ---
router.get("/fee-pending", async (req: any, res: any) => {
  try {
    const tenantId = req.tenantId;
    const { academicYearId } = req.query;

    const studentFees = await prisma.studentFee.findMany({
      where: {
        tenantId,
        isDeleted: false,
        balanceAmount: { gt: 0 },
        ...(academicYearId && { enrollment: { academicYearId, isDeleted: false } }),
      },
      include: {
        enrollment: {
          include: {
            student: { select: { firstName: true, lastName: true } },
            class: { select: { name: true } },
          },
        },
      },
    });

    // Group by enrollment to get total pending per student
    const studentMap: Record<string, { name: string; class: string; pendingAmount: number; id: string }> = {};
    for (const fee of studentFees) {
      const enrollId = fee.enrollmentId;
      if (!studentMap[enrollId]) {
        studentMap[enrollId] = {
          id: enrollId,
          name: `${fee.enrollment.student.firstName} ${fee.enrollment.student.lastName}`,
          class: fee.enrollment.class.name,
          pendingAmount: 0,
        };
      }
      studentMap[enrollId].pendingAmount += fee.balanceAmount;
    }

    const data = Object.values(studentMap)
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .slice(0, 5);

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Attendance Overview (Today) ---
router.get("/attendance-overview", async (req: any, res: any) => {
  try {
    const tenantId = req.tenantId;
    const { academicYearId } = req.query;

    // Total students
    const totalStudents = await prisma.enrollment.count({
      where: { tenantId, status: "active", isDeleted: false, ...(academicYearId && { academicYearId }) },
    });

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        tenantId,
        date: { gte: today, lt: tomorrow },
      },
      select: { status: true },
    });

    const totalPresent = todayAttendance.filter((a: any) => a.status === "PRESENT" || a.status === "present").length;
    const absentCount = todayAttendance.filter((a: any) => a.status === "ABSENT" || a.status === "absent").length;
    const presentPercentage = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

    res.json({
      success: true,
      data: { totalStudents, totalPresent, absentCount, presentPercentage },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Recycle Bin ---
router.get("/recycle-bin", getDeletedStudentsHandler);

// --- Age Config ---
router.get("/age-config", getAgeConfigHandler);
router.get("/age-config/validate", async (req: any, res: any) => {
  try {
    const { classId, dob, academicYearStart } = req.query;

    if (!classId || !dob || !academicYearStart) {
      return res.status(400).json({
        success: false,
        message: "classId, dob, and academicYearStart are required",
      });
    }

    const result = await validateStudentAge(
      req.tenantId,
      classId as string,
      new Date(dob as string),
      parseInt(academicYearStart as string)
    );

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post("/age-config/seed", allowRoles("ADMIN"), seedAgeConfigHandler);
router.put("/age-config/:configId", allowRoles("ADMIN"), updateAgeConfigHandler);
router.patch("/age-config/:configId/toggle", allowRoles("ADMIN"), toggleAgeConfigHandler);

router.post("/", authMiddleware, checkLimit("students"), createStudentHandler);

// --- Promotion ---
router.get("/promotion/eligible", getEligibleStudentsHandler);
router.post("/promote", allowRoles("ADMIN"), promoteStudentHandler);
router.post("/promote/bulk", allowRoles("ADMIN"), bulkPromoteHandler);
router.post("/promote/undo/:promotionId", allowRoles("ADMIN"), undoPromotionHandler);
router.post("/promote/section-change", allowRoles("ADMIN"), changeSectionHandler);

// --- Enrollment (for existing students without enrollment) ---
router.post("/enrollment", allowRoles("ADMIN"), createEnrollmentHandler);
router.post("/enrollment/bulk", allowRoles("ADMIN"), bulkCreateEnrollmentsHandler);

// --- Print / Export ---
router.post("/print", printStudentsHandler);

// ============================================
// CRUD ROUTES
// ============================================
router.get("/", getAllStudentsHandler);
router.post("/", allowRoles("ADMIN"), createStudentHandler);

// ============================================
// DYNAMIC /:id ROUTES LAST
// ============================================
router.get("/:id", getStudentByIdHandler);
router.put("/:id", allowRoles("ADMIN"), updateStudentHandler);
router.delete("/:id", allowRoles("ADMIN"), softDeleteStudentHandler);
router.patch("/:id/restore", allowRoles("ADMIN"), restoreStudentHandler);

export default router;