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

// ============================================
// STUDENT CRUD
// ============================================

export const createStudentHandler = async (req: any, res: any) => {
  try {
    const result = await createStudent(req.body, req.tenantId, req.user?.userId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    console.error("Create student error:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllStudentsHandler = async (req: any, res: any) => {
  try {
    const { classId, sectionId, academicYearId, status, search, page, limit } = req.query;
    const result = await getAllStudents(req.tenantId, {
      classId,
      sectionId,
      academicYearId,
      status,
      search,
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
    const student = await getStudentById(req.params.id, req.tenantId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStudentHandler = async (req: any, res: any) => {
  try {
    const result = await updateStudent(req.params.id, req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const softDeleteStudentHandler = async (req: any, res: any) => {
  try {
    await softDeleteStudent(req.params.id, req.tenantId);
    res.json({ success: true, message: "Student moved to recycle bin" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const restoreStudentHandler = async (req: any, res: any) => {
  try {
    await restoreStudent(req.params.id, req.tenantId);
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

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const undoPromotionHandler = async (req: any, res: any) => {
  try {
    const result = await undoPromotion(req.params.promotionId, req.tenantId, req.user?.userId);
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
    const { board, classMapping } = req.body;
    const result = await seedAgeConfigForTenant(req.tenantId, board, classMapping);
    res.json({ success: true, data: result });
  } catch (err: any) {
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
      limit: 9999,
    });

    res.json({ success: true, data: result.students, total: result.total, columns });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};