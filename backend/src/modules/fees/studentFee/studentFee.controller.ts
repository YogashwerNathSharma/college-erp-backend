import { Request, Response } from "express";
import * as service from "./studentFee.service";

export const assignStudentFee = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await service.assignStudentFee(
      req.body,
      tenantId
    );

    return res.status(201).json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("ASSIGN FEE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error assigning fee",
    });
  }
};

export const getStudentFees = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const studentId = req.params.studentId as string;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await service.getStudentFees(
      studentId,
      tenantId
    );

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("GET STUDENT FEES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching student fees",
    });
  }
};