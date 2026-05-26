import { Request, Response } from "express";
import { createAdmission } from "./admission.service";

export const admissionController = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const result = await createAdmission(req.body, { tenantId });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("🔥 ADMISSION ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};