import { invalidateCache } from "../../utils/cache";

import prisma from "../../utils/prisma";

import {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  softDeleteStudent,
  restoreStudent,
  getDeletedStudents,
  getStudentStats,
  createEnrollmentForStudent,
  bulkCreateEnrollments,
} from "./student.service";

import {
  getEligibleStudents,
  promoteStudent,
  bulkPromoteClass,
  undoPromotion,
  changeSectionService,
} from "./promotion.service";

import {
  getAgeConfigs,
  seedAgeConfigForTenant,
  updateAgeConfig,
  toggleAgeConfigStatus,
} from "./age-validation.service";

import { validateStudentTenantReferences } from "./tenant-reference-validation";

// ============================================
// STUDENT CRUD
// ============================================

export const createStudentHandler = async (req: any, res: any) => {
  try {
    console.log("[Admission] Received payload keys:", Object.keys(req.body));
    console.log("[Admission] tenantId:", req.tenantId, "| userId:", req.user?.userId);

    const { academicYearId, classId, sectionId, religionId, casteId, categoryId, nationalityId } = req.body;
    await validateStudentTenantReferences(req.tenantId, {
      academicYearId,
      classId,
      sectionId,
      religionId,
      casteId,
      categoryId,
      nationalityId,
    });

    const result = await createStudent(req.body, req.tenantId, req.user?.userId);
    // Invalidate dashboard + stats caches so they refresh with new student
    invalidateCache(`dashboard:${req.tenantId}`);
    invalidateCache(`student-dash:${req.tenantId}`);
    invalidateCache(`student-stats:${req.tenantId}`);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    console.error("Create student error:", err.message, "\nStack:", err.stack?.split("\n").slice(0, 5).join("\n"));
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllStudentsHandler = async (req: any, res: any) => {
  try {
    const { classId, sectionId, academicYearId, status, admissionStatus, search, gender, page, limit, dateFrom, dateTo } = req.query;
    const result = await getAllStudents(req.tenantId, {
      classId,
      sectionId,
      academicYearId,
      status,
      admissionStatus,
      dateFrom,
      dateTo,
      search,
      gender,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getStudentByIdHandler = async (req: any, res: any) => {
  try {
    console.log(`[Student Profile] Fetching student: ${req.params.id}, tenant: ${req.tenantId}`);
    const student = await getStudentById(req.params.id, req.tenantId);

    if (!student) {
      console.warn(`[Student Profile] Student not found: ${req.params.id}`);
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, data: student });
  } catch (err: any) {
    console.error(`[Student Profile] Error fetching ${req.params.id}:`, err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStudentHandler = async (req: any, res: any) => {
  try {
    const result = await updateStudent(req.params.id, req.body, req.tenantId);
    // Invalidate dashboard + stats caches so status/gender changes reflect immediately
    invalidateCache(`dashboard:${req.tenantId}`);
    invalidateCache(`student-dash:${req.tenantId}`);
    invalidateCache(`student-stats:${req.tenantId}`);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const softDeleteStudentHandler = async (req: any, res: any) => {
  try {
    await softDeleteStudent(req.params.id, req.tenantId);
    invalidateCache(`dashboard:${req.tenantId}`);
    invalidateCache(`student-dash:${req.tenantId}`);
    invalidateCache(`student-stats:${req.tenantId}`);
    res.json({ success: true, message: "Student moved to recycle bin" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const restoreStudentHandler = async (req: any, res: any) => {
  try {
    await restoreStudent(req.params.id, req.tenantId);
    invalidateCache(`dashboard:${req.tenantId}`);
    invalidateCache(`student-dash:${req.tenantId}`);
    invalidateCache(`student-stats:${req.tenantId}`);
    res.json({ success: true, message: "Student restored" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDeletedStudentsHandler = async (req: any, res: any) => {
  try {
    const students = await getDeletedStudents(req.tenantId);
    res.json({ success: true, data: students });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getStudentStatsHandler = async (req: any, res: any) => {
  try {
    const stats = await getStudentStats(req.tenantId, req.query.academicYearId);
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// ENROLLMENT
// ============================================

export const createEnrollmentHandler = async (req: any, res: any) => {
  try {
    const { studentId, classId, sectionId, academicYearId, rollNumber } = req.body;
    const enrollment = await createEnrollmentForStudent(
      studentId,
      { classId, sectionId, academicYearId, rollNumber },
      req.tenantId
    );
    invalidateCache(`dashboard:${req.tenantId}`);
    invalidateCache(`student-dash:${req.tenantId}`);
    invalidateCache(`student-stats:${req.tenantId}`);
    res.status(201).json({ success: true, data: enrollment });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const bulkCreateEnrollmentsHandler = async (req: any, res: any) => {
  try {
    const { students, classId, sectionId, academicYearId } = req.body;
    const results = await bulkCreateEnrollments(
      students,
      classId,
      sectionId,
      academicYearId,
      req.tenantId
    );
    invalidateCache(`dashboard:${req.tenantId}`);
    invalidateCache(`student-dash:${req.tenantId}`);
    invalidateCache(`student-stats:${req.tenantId}`);
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// PROMOTION
// ============================================

export const getEligibleStudentsHandler = async (req: any, res: any) => {
  try {
    const { classId, sectionId, academicYearId } = req.query;
    if (!classId || !sectionId || !academicYearId) {
      return res.status(400).json({
        success: false,
        message: "classId, sectionId, and academicYearId are required",
      });
    }
    const students = await getEligibleStudents(req.tenantId, classId, sectionId, academicYearId);
    res.json({ success: true, data: students, count: students.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const promoteStudentHandler = async (req: any, res: any) => {
  try {
    const {
      studentId,
      fromClassId,
      fromSectionId,
      fromYearId,
      toClassId,
      toSectionId,
      toYearId,
      rollNumber,
      promotionType,
    } = req.body;

    const result = await promoteStudent(
      studentId,
      fromClassId,
      fromSectionId,
      fromYearId,
      toClassId,
      toSectionId,
      toYearId,
      req.tenantId,
      req.user?.userId,
      rollNumber,
      promotionType || "promotion"
    );
    invalidateCache(`dashboard:${req.tenantId}`);
    invalidateCache(`student-dash:${req.tenantId}`);
    invalidateCache(`student-stats:${req.tenantId}`);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const bulkPromoteHandler = async (req: any, res: any) => {
  try {
    const {
      fromClassId,
      fromSectionId,
      fromYearId,
      toClassId,
      toSectionId,
      toYearId,
      studentIds,
      promotionType,
    } = req.body;

    if (!fromClassId || !fromSectionId || !fromYearId || !toClassId || !toSectionId || !toYearId) {
      return res.status(400).json({
        success: false,
        message: "All from/to fields (classId, sectionId, yearId) are required",
      });
    }

    const result = await bulkPromoteClass(
      fromClassId,
      fromSectionId,
      fromYearId,
      toClassId,
      toSectionId,
      toYearId,
      req.tenantId,
      req.user?.userId,
      studentIds,
      promotionType || "promotion"
    );

    invalidateCache(`dashboard:${req.tenantId}`);
    invalidateCache(`student-dash:${req.tenantId}`);
    invalidateCache(`student-stats:${req.tenantId}`);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const undoPromotionHandler = async (req: any, res: any) => {
  try {
    const result = await undoPromotion(req.params.promotionId, req.tenantId, req.user?.userId);
    invalidateCache(`dashboard:${req.tenantId}`);
    invalidateCache(`student-dash:${req.tenantId}`);
    invalidateCache(`student-stats:${req.tenantId}`);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const changeSectionHandler = async (req: any, res: any) => {
  try {
    const { studentId, fromSectionId, toSectionId, classId, academicYearId } = req.body;
    const result = await changeSectionService(
      studentId,
      fromSectionId,
      toSectionId,
      classId,
      academicYearId,
      req.tenantId,
      req.user?.userId
    );
    invalidateCache(`student-dash:${req.tenantId}`);
    invalidateCache(`student-stats:${req.tenantId}`);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// AGE CONFIG
// ============================================

export const getAgeConfigHandler = async (req: any, res: any) => {
  try {
    const configs = await getAgeConfigs(req.tenantId, req.query.board);
    res.json({ success: true, data: configs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const seedAgeConfigHandler = async (req: any, res: any) => {
  try {
    console.log(">>> req.tenantId:", req.tenantId);
    console.log(">>> req.body:", JSON.stringify(req.body));

    if (!req.tenantId) {
      return res.status(400).json({ success: false, message: "tenantId is missing from request" });
    }

    // Verify tenant exists in DB
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    console.log(">>> Tenant found in DB:", tenant);

    if (!tenant) {
      return res.status(404).json({ 
        success: false, 
        message: `Tenant '${req.tenantId}' does NOT exist in database` 
      });
    }

    const { board, classMapping } = req.body;
    const result = await seedAgeConfigForTenant(req.tenantId, board, classMapping);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error("SEED ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAgeConfigHandler = async (req: any, res: any) => {
  try {
    const result = await updateAgeConfig(req.params.configId, req.tenantId, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const toggleAgeConfigHandler = async (req: any, res: any) => {
  try {
    const result = await toggleAgeConfigStatus(req.params.configId, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// PRINT / EXPORT STUDENTS
// ============================================

export const printStudentsHandler = async (req: any, res: any) => {
  try {
    const { classId, sectionId, academicYearId, status, search, columns } = req.body;
    const result = await getAllStudents(req.tenantId, {
      classId,
      sectionId,
      academicYearId,
      status,
      search,
      page: 1,
      limit: 2000,
    });

    res.json({ success: true, data: result.students, total: result.total, columns });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
