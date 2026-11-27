// marks-student.controller.ts
import { Response } from "express";
import { saveStudentMarksService } from "./marks-student.service";

export const saveStudentMarks = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id: examId } = req.params;
    const { studentId, marks } = req.body || {};
    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required" });
    }
    const data = await saveStudentMarksService(examId, studentId, marks || [], tenantId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("SAVE STUDENT MARKS ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "Error saving marks" });
  }
};
