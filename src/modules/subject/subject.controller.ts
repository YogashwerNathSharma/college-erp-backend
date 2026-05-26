import { Request, Response } from "express";
import {
  createSubjectService,
  getSubjectsService,
} from "./subject.service";

/////////////////////////
// CREATE SUBJECT
/////////////////////////
export const createSubject = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const { name, classId, academicYearId } = req.body;

    if (!name || !classId || !academicYearId) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const subject = await createSubjectService(
      { name, classId, academicYearId },
      tenantId
    );

    res.status(201).json({
      success: true,
      data: subject,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to create subject",
    });
  }
};

/////////////////////////
// GET SUBJECTS
/////////////////////////
export const getSubjects = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const subjects = await getSubjectsService(tenantId);

    res.json({
      success: true,
      data: subjects,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
    });
  }
};