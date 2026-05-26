import { Request, Response } from "express";
import { getStudentTimelineService } from "./student.service";
import {
  createStudentService,
  getStudentsService,
  getStudentByIdService,
  updateStudentService,
  deleteStudentService,
  restoreStudentService,
  getDeletedStudentsService,
  restoreManyStudentsService,
} from "./student.service";

/////////////////////////
// CREATE STUDENT
/////////////////////////
export const createStudent = async (req: any, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = req.user?.userId;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const student = await createStudentService(
      req.body,
      tenantId,
      userId
    );

    res.json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error: any) {
    console.error("CREATE STUDENT ERROR:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/////////////////////////
// GET ALL STUDENTS
/////////////////////////
export const getStudents = async (req: any, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const classId = req.query.classId as string | undefined;

    const data = await getStudentsService(
      tenantId,
      page,
      limit,
      classId
    );

    res.json({
      success: true,
      message: "Students fetched successfully",
      ...data,
    });
  } catch (error: any) {
    console.error("GET STUDENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching students",
    });
  }
};

/////////////////////////
// GET SINGLE STUDENT
/////////////////////////
export const getStudentById = async (req: any, res: Response) => {
  try {
    const id = req.params.id;
    const tenantId = (req as any).tenantId;

    const student = await getStudentByIdService(id, tenantId);

    res.json({
      success: true,
      data: student,
    });
  } catch (error: any) {
    console.error("GET STUDENT ERROR:", error);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/////////////////////////
// UPDATE STUDENT
/////////////////////////
export const updateStudent = async (req: any, res: Response) => {
  try {
    const id = req.params.id;
    const tenantId = (req as any).tenantId;
    const userId = req.user?.userId;

    const updated = await updateStudentService(
      id,
      req.body,
      tenantId,
      userId
    );

    res.json({
      success: true,
      message: "Student updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("UPDATE STUDENT ERROR:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/////////////////////////
// DELETE STUDENT
/////////////////////////
export const deleteStudent = async (req: any, res: Response) => {
  try {
    const id = req.params.id;
    const tenantId = (req as any).tenantId;
    const userId = req.user?.userId;

    const data = await deleteStudentService(id, tenantId, userId);

    res.json({
      success: true,
      message: "Student deleted successfully",
      data,
    });
  } catch (error: any) {
    console.error("DELETE STUDENT ERROR:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/////////////////////////
// RESTORE STUDENT
/////////////////////////
export const restoreStudent = async (req: any, res: Response) => {
  try {
    const id = req.params.id;
    const tenantId = (req as any).tenantId;
    const userId = req.user?.userId;

    const data = await restoreStudentService(id, tenantId, userId);

    res.json({
      success: true,
      message: "Student restored successfully",
      data,
    });
  } catch (error: any) {
    console.error("RESTORE STUDENT ERROR:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/////////////////////////
// GET DELETED STUDENTS
/////////////////////////
export const getDeletedStudents = async (req: any, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const data = await getDeletedStudentsService(
      tenantId,
      page,
      limit
    );

    res.json({
      success: true,
      message: "Deleted students fetched successfully",
      ...data,
    });
  } catch (error: any) {
    console.error("DELETED STUDENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching deleted students",
    });
  }
};

/////////////////////////
// BULK RESTORE
/////////////////////////
export const restoreManyStudents = async (req: any, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = req.user?.userId;

    const { ids } = req.body;

    if (!ids || !ids.length) {
      throw new Error("Student IDs required");
    }

    const data = await restoreManyStudentsService(
      ids,
      tenantId,
      userId
    );

    res.json({
      success: true,
      message: "Students restored successfully",
      data,
    });
  } catch (error: any) {
    console.error("BULK RESTORE ERROR:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/////////////////////////
// STUDENT TIMELINE
/////////////////////////
export const getStudentTimeline = async (req: any, res: Response) => {
  try {
    const studentId = req.params.id;
    const tenantId = (req as any).tenantId;

    const data = await getStudentTimelineService(
      studentId,
      tenantId
    );

    res.json({
      success: true,
      message: "Student timeline fetched successfully",
      data,
    });
  } catch (error: any) {
    console.error("TIMELINE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};