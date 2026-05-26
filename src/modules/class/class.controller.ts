import { Request, Response } from "express";
import {
  createClassService,
  getClassesService,
} from "./class.service";

/////////////////////////
// CREATE CLASS
/////////////////////////
export const createClass = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const { name, academicYearId } = req.body;

    if (!name || !academicYearId) {
      return res.status(400).json({
        success: false,
        message: "Name and academicYearId required",
      });
    }

    const newClass = await createClassService(
      { name, academicYearId },
      tenantId
    );

    res.status(201).json({
      success: true,
      data: newClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create class",
    });
  }
};

/////////////////////////
// GET CLASSES
/////////////////////////
export const getClasses = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const classes = await getClassesService(tenantId);

    res.json({
      success: true,
      data: classes,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch classes",
    });
  }
};