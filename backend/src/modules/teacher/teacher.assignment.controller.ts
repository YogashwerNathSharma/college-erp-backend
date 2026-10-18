import { Response } from "express";
import { saveTeacherAssignments } from "./teacher.assignment.service";

export const saveAssignments = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const teacherId = String(req.params.id || "");
    const academicYearId = String(
      req.headers["x-academic-year-id"] || req.body?.academicYearId || req.query?.academicYearId || ""
    );

    let assignments = req.body?.assignments;
    if (typeof assignments === "string") {
      try { assignments = JSON.parse(assignments); } catch { assignments = []; }
    }
    if (!Array.isArray(assignments)) assignments = [];

    const normalized = assignments
      .filter((a: any) => a?.classId && a?.subjectId)
      .map((a: any) => ({ classId: String(a.classId), subjectId: String(a.subjectId) }));

    const result = await saveTeacherAssignments(teacherId, tenantId, academicYearId, normalized);
    return res.json({ success: true, data: result, message: "Subject assignments saved successfully" });
  } catch (e: any) {
    console.error("Teacher subject assignment save failed:", e);
    return res.status(400).json({ success: false, message: e?.message || "Failed to save subject assignments" });
  }
};
