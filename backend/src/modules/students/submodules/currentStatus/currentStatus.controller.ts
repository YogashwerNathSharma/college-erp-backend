import { Request, Response } from "express";
import { getStudentCurrent } from "./currentStatus.service";

export const getCurrent = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const studentId = req.params.studentId as string;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "studentId is required",
      });
    }

    const data = await getStudentCurrent(studentId, tenantId);

    return res.json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("CURRENT STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching student status",
    });
  }
};