import { Request, Response } from "express";
import {
  createTimetableService,
  getTimetableService,
} from "./timetable.service";
import { CreateTimetableInput } from "./timetable.types";

export const createTimetable = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const data = req.body as CreateTimetableInput;

    const result = await createTimetableService(data, tenantId);

    res.json(result);
  } catch (error: any) {
    console.error("CREATE TIMETABLE ERROR:", error);

    res.status(400).json({ message: error.message });
  }
};

export const getTimetable = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { classId, sectionId } = req.query;

    if (!classId || !sectionId) {
      res.status(400).json({
        message: "classId and sectionId are required",
      });
      return;
    }

    const data = await getTimetableService(
      classId as string,
      sectionId as string,
      tenantId
    );

    res.json(data);
  } catch (error: any) {
    console.error("GET TIMETABLE ERROR:", error);

    res.status(500).json({
      message: error.message || "Error fetching timetable",
    });
  }
};