

// ═══════════════════════════════════════════════════════
// exam.controller.ts — Full Exam Controller
// ═══════════════════════════════════════════════════════

import { Response } from "express";
import {
  createExamService,
  generateCustomSeatingService,
  aiArrangeSeatingService,
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



// ═══════════════════════════════════════════════════════════════
// ========= NEW CONTROLLERS (original code above) =========
// ═══════════════════════════════════════════════════════════════

import {
  createExamScheduleService,
  getExamScheduleService,
  updateExamScheduleService,
  deleteExamScheduleService,
  generateSeatingService,
  getSeatingByScheduleService,
  generateAdmitCardsService,
  getAdmitCardService,
  getAdmitCardsService,
  uploadQuestionPaperService,
  getQuestionPapersService,
  deleteQuestionPaperService,
  assignInvigilatorService,
  getInvigilatorsService,
  removeInvigilatorService,
  getExamDashboardService,
  getExamReportsService,
} from "./exam.service";

/////////////////////////
// CREATE EXAM SCHEDULE
/////////////////////////
export const createExamSchedule = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await createExamScheduleService(req.body, tenantId);
    return res.status(201).json({ success: true, data: result, message: "Schedule created successfully" });
  } catch (error: any) {
    console.error("CREATE SCHEDULE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error creating schedule" });
  }
};

/////////////////////////
// GET EXAM SCHEDULE
/////////////////////////
export const getExamSchedule = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const examId = req.params.id || req.params.examId;
    const result = await getExamScheduleService(examId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET SCHEDULE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching schedule" });
  }
};

/////////////////////////
// UPDATE EXAM SCHEDULE
/////////////////////////
export const updateExamSchedule = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const scheduleId = req.params.scheduleId;
    const result = await updateExamScheduleService(scheduleId, req.body, tenantId);
    return res.json({ success: true, data: result, message: "Schedule updated" });
  } catch (error: any) {
    console.error("UPDATE SCHEDULE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error updating schedule" });
  }
};

/////////////////////////
// DELETE EXAM SCHEDULE
/////////////////////////
export const deleteExamSchedule = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const scheduleId = req.params.scheduleId;
    const result = await deleteExamScheduleService(scheduleId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("DELETE SCHEDULE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error deleting schedule" });
  }
};

/////////////////////////
// GENERATE SEATING
/////////////////////////
export const generateSeating = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await generateSeatingService(req.body, tenantId);
    return res.json({ success: true, data: result, message: "Seating generated successfully" });
  } catch (error: any) {
    console.error("GENERATE SEATING ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error generating seating" });
  }
};

/////////////////////////
// GET SEATING BY SCHEDULE
/////////////////////////
export const getSeatingBySchedule = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const scheduleId = req.params.scheduleId;
    const result = await getSeatingByScheduleService(scheduleId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET SEATING ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching seating" });
  }
};

/////////////////////////
// GENERATE ADMIT CARDS
/////////////////////////
export const generateAdmitCards = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await generateAdmitCardsService(req.body, tenantId);
    return res.json({ success: true, data: result, message: "Admit cards generated" });
  } catch (error: any) {
    console.error("GENERATE ADMIT CARDS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error generating admit cards" });
  }
};

/////////////////////////
// GET ADMIT CARD (Single)
/////////////////////////
export const getAdmitCard = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { examId, studentId } = req.params;
    const result = await getAdmitCardService(examId, studentId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET ADMIT CARD ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching admit card" });
  }
};

/////////////////////////
// GET ALL ADMIT CARDS
/////////////////////////
export const getAdmitCards = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const examId = req.params.examId || req.params.id;
    const result = await getAdmitCardsService(examId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET ADMIT CARDS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching admit cards" });
  }
};

/////////////////////////
// UPLOAD QUESTION PAPER
/////////////////////////
export const uploadQuestionPaper = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const result = await uploadQuestionPaperService(req.body, tenantId, userId);
    return res.status(201).json({ success: true, data: result, message: "Question paper uploaded" });
  } catch (error: any) {
    console.error("UPLOAD QP ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error uploading question paper" });
  }
};

/////////////////////////
// GET QUESTION PAPERS
/////////////////////////
export const getQuestionPapers = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const examId = req.params.examId || req.params.id;
    const result = await getQuestionPapersService(examId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET QP ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching question papers" });
  }
};

/////////////////////////
// DELETE QUESTION PAPER
/////////////////////////
export const deleteQuestionPaper = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const paperId = req.params.paperId;
    const result = await deleteQuestionPaperService(paperId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("DELETE QP ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error deleting question paper" });
  }
};

/////////////////////////
// ASSIGN INVIGILATOR
/////////////////////////
export const assignInvigilator = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await assignInvigilatorService(req.body, tenantId);
    return res.status(201).json({ success: true, data: result, message: "Invigilator assigned" });
  } catch (error: any) {
    console.error("ASSIGN INVIGILATOR ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error assigning invigilator" });
  }
};

/////////////////////////
// GET INVIGILATORS
/////////////////////////
export const getInvigilators = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const scheduleId = req.params.scheduleId;
    const result = await getInvigilatorsService(scheduleId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET INVIGILATORS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching invigilators" });
  }
};

/////////////////////////
// REMOVE INVIGILATOR
/////////////////////////
export const removeInvigilator = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const assignmentId = req.params.assignmentId;
    const result = await removeInvigilatorService(assignmentId, tenantId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("REMOVE INVIGILATOR ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error removing invigilator" });
  }
};

/////////////////////////
// EXAM DASHBOARD
/////////////////////////
export const getExamDashboard = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { academicYearId, classId } = req.query;
    const result = await getExamDashboardService(tenantId, academicYearId as string, classId as string);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("DASHBOARD ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching dashboard" });
  }
};

/////////////////////////
// EXAM REPORTS
/////////////////////////
export const getExamReports = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { examId, reportType, subjectId } = req.query;
    if (!examId || !reportType) {
      return res.status(400).json({ success: false, message: "examId and reportType are required" });
    }
    const result = await getExamReportsService(tenantId, examId as string, reportType as string, { subjectId: subjectId as string });
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("REPORTS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error fetching reports" });
  }
};

/////////////////////////
// GENERATE CUSTOM SEATING (Multi-class, configurable capacity)
/////////////////////////
export const generateCustomSeating = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await generateCustomSeatingService(req.body, tenantId);
    return res.json({ success: true, data: result, message: "Custom seating generated successfully" });
  } catch (error: any) {
    console.error("GENERATE CUSTOM SEATING ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error generating custom seating" });
  }
};

/////////////////////////
// AI AUTO-ARRANGE SEATING
/////////////////////////
export const aiArrangeSeating = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await aiArrangeSeatingService(req.body, tenantId);
    return res.json({ success: true, data: result, message: "AI seating arrangement generated successfully" });
  } catch (error: any) {
    console.error("AI ARRANGE SEATING ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Error in AI seating arrangement" });
  }
};

