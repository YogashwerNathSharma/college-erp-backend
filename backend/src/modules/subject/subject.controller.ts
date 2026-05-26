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
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

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

    return res.status(201).json({
      success: true,
      data: subject,
    });

  } catch (error: any) {
    console.error("CREATE SUBJECT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create subject",
    });
  }
};

/////////////////////////
// GET SUBJECTS
/////////////////////////
export const getSubjects = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const subjects = await getSubjectsService(tenantId);

    return res.json({
      success: true,
      data: subjects,
    });

  } catch (error: any) {
    console.error("GET SUBJECTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch subjects",
    });
  }
};