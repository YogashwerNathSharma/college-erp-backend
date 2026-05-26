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

interface AuthRequest extends Request {
  user?: {
    tenantId: string;
  };
}

export const createExam = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const data = req.body as CreateExamInput;

    const result = await createExamService(data, tenantId);
    res.json(result);
  } catch {
    res.status(500).json({ message: "Error creating exam" });
  }
};

export const addExamSubject = async (req: Request, res: Response) => {
  try {
    const data = req.body as AddExamSubjectInput;

    const result = await addExamSubjectService(data);
    res.json(result);
  } catch {
    res.status(500).json({ message: "Error adding subject" });
  }
};

export const enterMarks = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const data = req.body as EnterMarksInput;

    const result = await enterMarksService(data, tenantId);
    res.json(result);
  } catch {
    res.status(500).json({ message: "Error saving marks" });
  }
};

export const getResult = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, examId } = req.query;
    const tenantId = req.user?.tenantId!;

    const result = await getResultService(
      studentId as string,
      examId as string,
      tenantId
    );

    res.json(result);
  } catch {
    res.status(500).json({ message: "Error fetching result" });
  }
};