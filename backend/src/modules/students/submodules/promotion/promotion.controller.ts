import { Request, Response } from "express";
import { promoteStudents } from "./promotion.service";

export const promote = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await promoteStudents(req.body, tenantId);

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("PROMOTION ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Promotion failed",
    });
  }
};