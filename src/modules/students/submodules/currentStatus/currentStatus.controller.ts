import { Request, Response } from "express";
import { getStudentCurrent } from "./currentStatus.service";

export const getCurrent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const studentId = req.params.studentId as string;

    const data = await getStudentCurrent(studentId, user);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("🔥 ERROR:", error); // 👈 ADD THIS
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};