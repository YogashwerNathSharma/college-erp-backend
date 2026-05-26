import { Request, Response } from "express";
import * as service from "./enrollment.service";

/////////////////////////
// CREATE ENROLLMENT
/////////////////////////
export const createEnrollment = async (req: Request, res: Response) => {
  try {
    const data = await service.createEnrollment(req.body, req.user);

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("FULL ERROR:", error);

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
    const data = await service.getEnrollments(req.user);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch enrollments",
    });
  }
};