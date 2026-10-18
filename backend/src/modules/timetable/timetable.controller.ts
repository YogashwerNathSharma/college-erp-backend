

import { Response } from "express";
import {
  createTimetableService,
  getTimetableService,
  getTimetableByTeacherService,
  deleteTimetableService,
  getTeachersBySubjectService,
  autoGenerateTimetableService,
  clearTimetableService,
  bulkGenerateTimetableService,
  bulkClearTimetableService,
  bulkSaveTimetableService,
} from "./timetable.service";
import { CreateTimetableInput } from "./timetable.types";

// ✅ CREATE SINGLE ENTRY
export const createTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return; }

    const data = req.body as CreateTimetableInput;
    if (!data.classId || !data.sectionId || !data.day || !data.period || !data.teacherId || !data.subjectId) {
      res.status(400).json({ message: "All fields are required" }); return;
    }

    const result = await createTimetableService(data, tenantId);
    res.json(result);
  } catch (error: any) {
    console.error("CREATE TIMETABLE ERROR:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// ✅ GET TIMETABLE (supports classId+sectionId OR teacherId)
export const getTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return; }

    const { classId, sectionId, teacherId } = req.query;

    // If teacherId is provided, get teacher's timetable
    if (teacherId) {
      const data = await getTimetableByTeacherService(teacherId as string, tenantId);
      res.json({ success: true, data });
      return;
    }

    // Otherwise, require classId + sectionId
    if (!classId || !sectionId) {
      res.status(400).json({ message: "classId and sectionId (or teacherId) are required" }); return;
    }

    const data = await getTimetableService(classId as string, sectionId as string, tenantId);
    res.json(data);
  } catch (error: any) {
    console.error("GET TIMETABLE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE SINGLE ENTRY
export const deleteTimetableEntry = async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return; }

    const id = req.params.id;
    if (!id) { res.status(400).json({ message: "Entry ID is required" }); return; }

    await deleteTimetableService(id, tenantId);
    res.json({ message: "Timetable entry deleted" });
  } catch (error: any) {
    console.error("DELETE TIMETABLE ERROR:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// ✅ GET TEACHERS BY SUBJECT
export const getTeachersBySubject = async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return; }

    const { subjectId } = req.params;
    if (!subjectId) { res.status(400).json({ message: "subjectId is required" }); return; }

    const teachers = await getTeachersBySubjectService(subjectId, tenantId);
    res.json({ success: true, data: teachers });
  } catch (error: any) {
    console.error("GET TEACHERS BY SUBJECT ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ AUTO GENERATE TIMETABLE
export const autoGenerateTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return; }

    const { classId, sectionId } = req.body;
    if (!classId || !sectionId) {
      res.status(400).json({ message: "classId and sectionId are required" }); return;
    }

    const result = await autoGenerateTimetableService(classId, sectionId, tenantId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("AUTO GENERATE ERROR:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// ✅ BULK GENERATE TIMETABLE
export const bulkGenerateTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return; }

    const { classIds } = req.body;
    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      res.status(400).json({ message: "classIds array is required" }); return;
    }

    const result = await bulkGenerateTimetableService(classIds, tenantId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("BULK GENERATE ERROR:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// ✅ CLEAR TIMETABLE
export const clearTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return; }

    const { classId, sectionId } = req.body;
    if (!classId || !sectionId) {
      res.status(400).json({ message: "classId and sectionId are required" }); return;
    }

    const result = await clearTimetableService(classId, sectionId, tenantId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("CLEAR TIMETABLE ERROR:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// ✅ BULK CLEAR TIMETABLE
export const bulkClearTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return; }

    const { classIds } = req.body;
    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      res.status(400).json({ message: "classIds array is required" }); return;
    }

    const result = await bulkClearTimetableService(classIds, tenantId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("BULK CLEAR ERROR:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// ✅ BULK SAVE TIMETABLE (Teacher Timetable Inline Editing)
export const bulkSaveTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ success: false, message: "Unauthorized" }); return; }

    const { teacherId, entries, clearedEntries } = req.body;
    if (!teacherId) {
      res.status(400).json({ success: false, message: "Teacher ID is required" }); return;
    }

    const result = await bulkSaveTimetableService(teacherId, entries, clearedEntries, tenantId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("BULK SAVE TIMETABLE ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

