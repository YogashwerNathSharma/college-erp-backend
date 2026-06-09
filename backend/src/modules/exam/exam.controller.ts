
// ═══════════════════════════════════════════════════════
// exam.controller.ts — Full Exam Controller
// ═══════════════════════════════════════════════════════

import { Response } from "express";
import {
  createExamService,
  updateExamService,
  getExamsService,
  getExamByIdService,
  deleteExamService,
  addExamSubjectsService,
  getExamSubjectsService,
  enterMarksService,
  getMarksService,
  generateResultService,
  getResultsService,
  getReportCardService,
  getConsolidatedReportService,
} from "./exam.service";

/////////////////////////
// CREATE EXAM
/////////////////////////
export const createExam = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await createExamService(req.body, tenantId);
    return res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error("CREATE EXAM ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error creating exam" });
  }
};

/////////////////////////
// UPDATE EXAM
/////////////////////////
export const updateExam = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const examId = req.params.id;
    const result = await updateExamService(examId, req.body, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("UPDATE EXAM ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error updating exam" });
  }
};

/////////////////////////
// GET ALL EXAMS
/////////////////////////
export const getExams = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { classId, academicYearId } = req.query;
    const result = await getExamsService(tenantId, classId as string, academicYearId as string);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET EXAMS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching exams" });
  }
};

/////////////////////////
// GET SINGLE EXAM
/////////////////////////
export const getExamById = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const examId = req.params.id;
    const result = await getExamByIdService(examId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET EXAM ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching exam" });
  }
};

/////////////////////////
// DELETE EXAM
/////////////////////////
export const deleteExam = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const examId = req.params.id;
    await deleteExamService(examId, tenantId);
    return res.json({ success: true, message: "Exam deleted successfully" });
  } catch (error: any) {
    console.error("DELETE EXAM ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error deleting exam" });
  }
};

/////////////////////////
// ADD SUBJECTS TO EXAM
/////////////////////////
export const addExamSubjects = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await addExamSubjectsService(req.body, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("ADD EXAM SUBJECTS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error adding subjects" });
  }
};

/////////////////////////
// GET EXAM SUBJECTS
/////////////////////////
export const getExamSubjects = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const examId = req.params.id;
    const result = await getExamSubjectsService(examId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET EXAM SUBJECTS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching subjects" });
  }
};

/////////////////////////
// ENTER MARKS (Bulk)
/////////////////////////
export const enterMarks = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await enterMarksService(req.body, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("ENTER MARKS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error saving marks" });
  }
};

/////////////////////////
// GET MARKS
/////////////////////////
export const getMarks = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const examId = req.params.id;
    const result = await getMarksService(examId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET MARKS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching marks" });
  }
};

/////////////////////////
// GENERATE RESULTS
/////////////////////////
export const generateResults = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const examId = req.params.id;
    const result = await generateResultService(examId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GENERATE RESULTS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error generating results" });
  }
};

/////////////////////////
// GET RESULTS
/////////////////////////
export const getResults = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const examId = req.params.id;
    const result = await getResultsService(examId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET RESULTS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching results" });
  }
};

/////////////////////////
// GET REPORT CARD (Single Student — Single Exam)
/////////////////////////
export const getReportCard = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { examId, studentId } = req.params;

    // Validate ObjectID format
    if (!examId || !studentId || examId.length !== 24 || studentId.length !== 24) {
      return res.status(400).json({ success: false, message: "Invalid exam or student ID" });
    }

    const result = await getReportCardService(examId, studentId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET REPORT CARD ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching report card" });
  }
};

/////////////////////////
// GET CONSOLIDATED REPORT CARD (All Terms)
/////////////////////////
export const getConsolidatedReport = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId } = req.params;
    const { academicYearId, classId } = req.query;

    if (!studentId || !academicYearId || !classId) {
      return res.status(400).json({
        success: false,
        message: "studentId, academicYearId, and classId are required",
      });
    }

    const result = await getConsolidatedReportService(
      studentId,
      academicYearId as string,
      classId as string,
      tenantId
    );

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("CONSOLIDATED REPORT ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching consolidated report" });
  }
};

