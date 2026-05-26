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
    const tenantId = (req as any).tenantId;

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

    return res.status(201).json({
      success: true,
      data: newClass,
    });

  } catch (error: any) {
    console.error("CREATE CLASS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create class",
    });
  }
};

/////////////////////////
// GET CLASSES
/////////////////////////
export const getClasses = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const classes = await getClassesService(tenantId);

    return res.status(200).json({
      success: true,
      data: classes,
    });

  } catch (error: any) {
    console.error("GET CLASSES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch classes",
    });
  }
};