import { Request, Response } from "express";
import { createSectionService } from "./section.service";
import { error } from "winston";

/////////////////////////
// CREATE SECTION
/////////////////////////
export const createSection = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

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

    res.status(201).json({
      success: true,
      data: section,
    });
  } catch {
     console.log("SECTION ERROR 👉", error); // 🔥 MUST
    res.status(500).json({
      success: false,
      message: "Failed to create section",
    });
  }
};