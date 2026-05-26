import { Request, Response } from "express";
import {
  createTimetableService,
  getTimetableService,
} from "./timetable.service";
import { CreateTimetableInput } from "./timetable.types";

interface AuthRequest extends Request {
  user?: {
    tenantId: string;
  };
}

export const createTimetable = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId!;
    const data = req.body as CreateTimetableInput;

    const result = await createTimetableService(data, tenantId);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTimetable = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { classId, sectionId } = req.query;
    const tenantId = req.user?.tenantId!;

    const data = await getTimetableService(
      classId as string,
      sectionId as string,
      tenantId
    );

    res.json(data);
  } catch {
    res.status(500).json({ message: "Error fetching timetable" });
  }
};