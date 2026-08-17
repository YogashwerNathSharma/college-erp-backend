import { Request, Response } from "express";
import {
  createSubjectService,
  getSubjectsService,
  updateSubjectService,
  toggleSubjectService,
  bulkCreateSubjectsService,
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

    console.log(`GET SUBJECTS: tenantId=${tenantId}, found ${subjects.length} subjects`);
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
/////////////////////////
// UPDATE SUBJECT
/////////////////////////
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name required" });
    }

    const updated = await updateSubjectService(id, { name }, tenantId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/////////////////////////
// TOGGLE SUBJECT STATUS
/////////////////////////
export const toggleSubject = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;

    const updated = await toggleSubjectService(id, tenantId);
    return res.status(200).json({
      success: true,
      data: updated,
      message: updated.isActive ? "Subject activated" : "Subject deactivated",
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/////////////////////////
// BULK CREATE SUBJECTS
/////////////////////////
export const bulkCreateSubjects = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { names, classIds, academicYearId } = req.body;
    if (!names || !classIds || !academicYearId) {
      return res.status(400).json({ success: false, message: "names, classIds, academicYearId are required" });
    }

    const result = await bulkCreateSubjectsService({ names, classIds, academicYearId }, tenantId);
    return res.status(201).json({
      success: true,
      data: result,
      message: `${result.created} subjects created, ${result.skipped} duplicates skipped`,
    });
  } catch (error: any) {
    console.error("BULK CREATE SUBJECTS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to bulk create subjects" });
  }
};
