
// ═══════════════════════════════════════════════════════
// grade.controller.ts — Grade Settings Controller
// ═══════════════════════════════════════════════════════

import { Response } from "express";
import {
  createGradeService,
  bulkSetGradesService,
  getGradesService,
  deleteGradeService,
} from "./grade.service";

/////////////////////////
// CREATE SINGLE GRADE
/////////////////////////
export const createGrade = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await createGradeService(req.body, tenantId);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("CREATE GRADE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating grade",
    });
  }
};

/////////////////////////
// BULK SET GRADES
/////////////////////////
export const bulkSetGrades = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { grades } = req.body;

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Grades array is required",
      });
    }

    const result = await bulkSetGradesService(grades, tenantId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("BULK SET GRADES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error saving grades",
    });
  }
};

/////////////////////////
// GET ALL GRADES
/////////////////////////
export const getGrades = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await getGradesService(tenantId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("GET GRADES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching grades",
    });
  }
};

/////////////////////////
// DELETE GRADE
/////////////////////////
export const deleteGrade = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const gradeId = req.params.id;

    await deleteGradeService(gradeId, tenantId);

    return res.json({
      success: true,
      message: "Grade deleted",
    });
  } catch (error: any) {
    console.error("DELETE GRADE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error deleting grade",
    });
  }
};

