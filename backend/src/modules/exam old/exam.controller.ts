import { Request, Response } from "express";
import {
  createExamService,
  addExamSubjectService,
  enterMarksService,
  getResultService,
} from "./exam.service";
import {
  CreateExamInput,
  AddExamSubjectInput,
  EnterMarksInput,
} from "./exam.types";

/////////////////////////
// CREATE EXAM
/////////////////////////
export const createExam = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const data = req.body as CreateExamInput;

    const result = await createExamService(data, tenantId);

    return res.status(201).json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error("CREATE EXAM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error creating exam",
    });
  }
};

/////////////////////////
// ADD EXAM SUBJECT
/////////////////////////
export const addExamSubject = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const data = req.body as AddExamSubjectInput;

    const result = await addExamSubjectService(data, tenantId); // 🔥 FIX

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error("ADD SUBJECT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error adding subject",
    });
  }
};

/////////////////////////
// ENTER MARKS
/////////////////////////
export const enterMarks = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const data = req.body as EnterMarksInput;

    const result = await enterMarksService(data, tenantId);

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error("ENTER MARKS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error saving marks",
    });
  }
};

/////////////////////////
// GET RESULT
/////////////////////////
export const getResult = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const { studentId, examId } = req.query;

    const result = await getResultService(
      studentId as string,
      examId as string,
      tenantId
    );

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error("GET RESULT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching result",
    });
  }
};