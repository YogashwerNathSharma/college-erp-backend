import { Request, Response } from "express";
import { createSectionService } from "./section.service";

/////////////////////////
// CREATE SECTION
/////////////////////////
export const createSection = async (req: Request, res: Response) => {
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

    const section = await createSectionService(
      { name, classId, academicYearId },
      tenantId
    );

    return res.status(201).json({
      success: true,
      data: section,
    });

  } catch (error: any) {
    console.error("SECTION ERROR 👉", error); // 🔥 FIXED

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create section",
    });
  }
};