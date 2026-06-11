
import {
  getStudentsWithAssignmentStatus,
  assignFeesToSelectedStudents,
} from "./feeAssign.service";

// GET /api/fees/assign/students?classId=xxx&academicYearId=xxx
export const getAssignStudentsController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { classId, academicYearId } = req.query;

    if (!classId || !academicYearId) {
      return res.status(400).json({ error: "classId and academicYearId are required" });
    }

    const result = await getStudentsWithAssignmentStatus(
      classId as string,
      academicYearId as string,
      tenantId
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// POST /api/fees/assign/students — Assign fees to selected students
export const assignFeesToStudentsController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { enrollmentIds } = req.body;

    if (!enrollmentIds || !Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      return res.status(400).json({ error: "enrollmentIds array is required" });
    }

    const result = await assignFeesToSelectedStudents(enrollmentIds, tenantId);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

