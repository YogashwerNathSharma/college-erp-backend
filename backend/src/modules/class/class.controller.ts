import { Request, Response } from "express";
import {
  createClassService,
  getClassesService,
  updateClassService,
  deleteClassService,
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
// UPDATE CLASS
/////////////////////////
export const updateClass = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;  // ← ADD `as string`
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name required" });
    }

    const updated = await updateClassService(id, { name }, tenantId);

    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/////////////////////////
// DELETE CLASS
/////////////////////////
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;  // ← ADD `as string`

    await deleteClassService(id, tenantId);

    return res.status(200).json({ success: true, message: "Class deleted" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
/////////////////////////
// GET CLASSES
/////////////////////////
export const getClasses = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const academicYearId = req.query.academicYearId as string | undefined;

    const classes = await getClassesService(tenantId, academicYearId);

    return res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};