import { Request, Response } from "express";
import { promoteStudents } from "./promotion.service";

export const promote = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const data = await promoteStudents(req.body, user);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};