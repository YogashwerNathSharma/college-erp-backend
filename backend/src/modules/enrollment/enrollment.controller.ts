import { Request, Response } from "express";
import * as service from "./enrollment.service";

/////////////////////////
// CREATE ENROLLMENT
/////////////////////////
export const createEnrollment = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await service.createEnrollment(req.body, { tenantId });

    return res.status(201).json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("CREATE ENROLLMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error creating enrollment",
    });
  }
};

/////////////////////////
// GET ENROLLMENTS
/////////////////////////
export const getEnrollments = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await service.getEnrollments({ tenantId });

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("GET ENROLLMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch enrollments",
    });
  }
};