import prisma from "../utils/prisma";

// ═══════════════════════════════════════════════════════════════════
// RECORD-LEVEL ACCESS CONTROL MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════
//
// These middleware functions set `req.allowedClassIds` or
// `req.allowedStudentIds` on the request object. Downstream
// services/controllers can optionally use these arrays to filter
// query results, ensuring role-based data visibility.
//
// IMPORTANT: These do NOT block requests — they augment the request
// with filter info. The actual filtering is done in the service layer.
// ═══════════════════════════════════════════════════════════════════

/**
 * teacherClassFilter
 *
 * If the user is a TEACHER, fetches their assigned class IDs from
 * the TeacherClass join table and sets req.allowedClassIds.
 *
 * This lets student listing endpoints filter to show only students
 * in the teacher's assigned classes.
 */
export const teacherClassFilter = async (req: any, res: any, next: any) => {
  try {
    if (req.user?.role === "TEACHER") {
      const teacherClasses = await prisma.teacherClass.findMany({
        where: {
          teacherId: req.user.userId,
          tenantId: req.user.tenantId,
        },
        select: { classId: true },
      });
      req.allowedClassIds = teacherClasses.map((tc: any) => tc.classId);
    }
    next();
  } catch (error) {
    console.error("teacherClassFilter error:", error);
    // Fail-open: don't block the request on middleware error
    next();
  }
};

/**
 * parentChildFilter
 *
 * If the user is a PARENT, fetches their linked student IDs from
 * the ParentStudent table and sets req.allowedStudentIds.
 *
 * This ensures parent can only access data for their linked children.
 */
export const parentChildFilter = async (req: any, res: any, next: any) => {
  try {
    if (req.user?.role === "PARENT") {
      const links = await prisma.parentStudent.findMany({
        where: {
          parentId: req.user.userId,
          tenantId: req.user.tenantId,
          isDeleted: false,
        },
        select: { studentId: true },
      });
      req.allowedStudentIds = links.map((l: any) => l.studentId);

      // If no linked children, block access
      if (req.allowedStudentIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: "No linked students found. Please contact administration.",
        });
      }
    }
    next();
  } catch (error) {
    console.error("parentChildFilter error:", error);
    next();
  }
};

/**
 * studentSelfFilter
 *
 * If the user is a STUDENT, sets req.allowedStudentIds to only
 * contain their own userId, ensuring they can only access own data.
 */
export const studentSelfFilter = (req: any, res: any, next: any) => {
  if (req.user?.role === "STUDENT") {
    req.allowedStudentIds = [req.user.userId];
  }
  next();
};

/**
 * accountantFeeFilter
 *
 * Accountant can see ALL students but ONLY fee-related data.
 * Sets req.accountantMode = true for service-layer filtering.
 */
export const accountantFeeFilter = (req: any, res: any, next: any) => {
  if (req.user?.role === "ACCOUNTANT") {
    req.accountantMode = true;
  }
  next();
};

/**
 * librarianFilter
 *
 * Librarian can see ONLY library data.
 * Sets req.librarianMode = true for service-layer filtering.
 */
export const librarianFilter = (req: any, res: any, next: any) => {
  if (req.user?.role === "LIBRARIAN") {
    req.librarianMode = true;
  }
  next();
};

/**
 * validateStudentAccess
 *
 * Used on endpoints that take a :studentId param.
 * Checks that the current user has access to the specified student.
 *
 * - ADMIN/PRINCIPAL: full access
 * - TEACHER: student must be in their assigned classes
 * - PARENT: student must be a linked child
 * - STUDENT: must be their own ID
 * - ACCOUNTANT: full access (for fee purposes)
 */
export const validateStudentAccess = async (req: any, res: any, next: any) => {
  try {
    const studentId = req.params.studentId || req.params.id;
    if (!studentId) return next();

    const role = req.user?.role;

    // Admin, Principal, and Super Admin have full access
    if (["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER"].includes(role)) {
      return next();
    }

    // Teacher: check class assignment
    if (role === "TEACHER") {
      const student = await prisma.student.findFirst({
        where: { id: studentId, tenantId: req.user.tenantId },
        select: { classId: true },
      });

      if (!student) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }

      const teacherClass = await prisma.teacherClass.findFirst({
        where: {
          teacherId: req.user.userId,
          classId: student.classId,
          tenantId: req.user.tenantId,
        },
      });

      if (!teacherClass) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this student's class",
        });
      }
      return next();
    }

    // Parent: check linked child
    if (role === "PARENT") {
      const link = await prisma.parentStudent.findFirst({
        where: {
          parentId: req.user.userId,
          studentId,
          tenantId: req.user.tenantId,
          isDeleted: false,
        },
      });

      if (!link) {
        return res.status(403).json({
          success: false,
          message: "You can only access your linked children's data",
        });
      }
      return next();
    }

    // Student: only own data
    if (role === "STUDENT") {
      if (studentId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "You can only access your own data",
        });
      }
      return next();
    }

    // Default: deny
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  } catch (error) {
    console.error("validateStudentAccess error:", error);
    next();
  }
};
