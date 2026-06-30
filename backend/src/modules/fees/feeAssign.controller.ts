
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

// POST /api/fees/assign/students — Assign fees to selected students with optional fee head selection
export const assignFeesToStudentsController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { enrollmentIds, selectedItems } = req.body;

    if (!enrollmentIds || !Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      return res.status(400).json({ error: "enrollmentIds array is required" });
    }

    // selectedItems is optional — if provided, only those fee heads are assigned to each student
    // Format: [{ feeHeadId: "...", amount: 2500, feeHeadName?: "Tuition Fee", frequency?: "PER_INSTALLMENT" }]
    const result = await assignFeesToSelectedStudents(enrollmentIds, tenantId, selectedItems || undefined);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
