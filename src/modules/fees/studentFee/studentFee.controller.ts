import { Request, Response } from "express";
import * as service from "./studentFee.service";

export const assignStudentFee = async (req: Request, res: Response) => {
  try {
    const data = await service.assignStudentFee(req.body, req.user);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({
      message: "Error assigning fee",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getStudentFees = async (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId as string; // ✅ fix

    const data = await service.getStudentFees(studentId, req.user);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching student fees",
      error: error instanceof Error ? error.message : error,
    });
  }
};