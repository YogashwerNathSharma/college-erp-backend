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
} from "./timetable.academicYear.service";
import { CreateTimetableInput } from "./timetable.types";

const context = (req: any) => ({ tenantId: req.user?.tenantId, academicYearId: req.academicYearId });

const requireContext = (req: any, res: Response) => {
  const { tenantId, academicYearId } = context(req);
  if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return null; }
  if (!academicYearId) { res.status(400).json({ message: "Academic year is required" }); return null; }
  return { tenantId, academicYearId };
};

export const createTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const ctx = requireContext(req, res); if (!ctx) return;
    const data = req.body as CreateTimetableInput;
    if (!data.classId || !data.sectionId || !data.day || !data.period || !data.teacherId || !data.subjectId) { res.status(400).json({ message: "All fields are required" }); return; }
    res.json(await createTimetableService(data, ctx.tenantId, ctx.academicYearId));
  } catch (error: any) { console.error("CREATE TIMETABLE ERROR:", error.message); res.status(400).json({ message: error.message }); }
};

export const getTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const ctx = requireContext(req, res); if (!ctx) return;
    const { classId, sectionId, teacherId } = req.query;
    if (teacherId) { res.json({ success: true, data: await getTimetableByTeacherService(teacherId as string, ctx.tenantId, ctx.academicYearId) }); return; }
    if (!classId || !sectionId) { res.status(400).json({ message: "classId and sectionId (or teacherId) are required" }); return; }
    res.json(await getTimetableService(classId as string, sectionId as string, ctx.tenantId, ctx.academicYearId));
  } catch (error: any) { console.error("GET TIMETABLE ERROR:", error.message); res.status(500).json({ message: error.message }); }
};

export const deleteTimetableEntry = async (req: any, res: Response): Promise<void> => {
  try {
    const ctx = requireContext(req, res); if (!ctx) return;
    const id = req.params.id; if (!id) { res.status(400).json({ message: "Entry ID is required" }); return; }
    await deleteTimetableService(id, ctx.tenantId, ctx.academicYearId); res.json({ message: "Timetable entry deleted" });
  } catch (error: any) { console.error("DELETE TIMETABLE ERROR:", error.message); res.status(400).json({ message: error.message }); }
};

export const getTeachersBySubject = async (req: any, res: Response): Promise<void> => {
  try {
    const ctx = requireContext(req, res); if (!ctx) return;
    const { subjectId } = req.params; if (!subjectId) { res.status(400).json({ message: "subjectId is required" }); return; }
    res.json({ success: true, data: await getTeachersBySubjectService(subjectId, ctx.tenantId, ctx.academicYearId) });
  } catch (error: any) { console.error("GET TEACHERS BY SUBJECT ERROR:", error.message); res.status(500).json({ message: error.message }); }
};

export const autoGenerateTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const ctx = requireContext(req, res); if (!ctx) return;
    const { classId, sectionId } = req.body;
    if (!classId || !sectionId) { res.status(400).json({ message: "classId and sectionId are required" }); return; }
    res.json({ success: true, ...(await autoGenerateTimetableService(classId, sectionId, ctx.tenantId, ctx.academicYearId)) });
  } catch (error: any) { console.error("AUTO GENERATE ERROR:", error.message); res.status(400).json({ message: error.message }); }
};

export const bulkGenerateTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const ctx = requireContext(req, res); if (!ctx) return;
    const { classIds } = req.body;
    if (!Array.isArray(classIds) || !classIds.length) { res.status(400).json({ message: "classIds array is required" }); return; }
    res.json({ success: true, ...(await bulkGenerateTimetableService(classIds, ctx.tenantId, ctx.academicYearId)) });
  } catch (error: any) { console.error("BULK GENERATE ERROR:", error.message); res.status(400).json({ message: error.message }); }
};

export const clearTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const ctx = requireContext(req, res); if (!ctx) return;
    const { classId, sectionId } = req.body;
    if (!classId || !sectionId) { res.status(400).json({ message: "classId and sectionId are required" }); return; }
    res.json({ success: true, ...(await clearTimetableService(classId, sectionId, ctx.tenantId, ctx.academicYearId)) });
  } catch (error: any) { console.error("CLEAR TIMETABLE ERROR:", error.message); res.status(400).json({ message: error.message }); }
};

export const bulkClearTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const ctx = requireContext(req, res); if (!ctx) return;
    const { classIds } = req.body;
    if (!Array.isArray(classIds) || !classIds.length) { res.status(400).json({ message: "classIds array is required" }); return; }
    res.json({ success: true, ...(await bulkClearTimetableService(classIds, ctx.tenantId, ctx.academicYearId)) });
  } catch (error: any) { console.error("BULK CLEAR ERROR:", error.message); res.status(400).json({ message: error.message }); }
};

export const bulkSaveTimetable = async (req: any, res: Response): Promise<void> => {
  try {
    const ctx = requireContext(req, res); if (!ctx) return;
    const { teacherId, entries, clearedEntries } = req.body;
    if (!teacherId) { res.status(400).json({ success: false, message: "Teacher ID is required" }); return; }
    res.json({ success: true, ...(await bulkSaveTimetableService(teacherId, entries, clearedEntries, ctx.tenantId, ctx.academicYearId)) });
  } catch (error: any) { console.error("BULK SAVE TIMETABLE ERROR:", error.message); res.status(500).json({ success: false, message: error.message }); }
};
