import { Request, Response } from "express";
import { createAdmission } from "./admission.service";

export const admissionController = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const result = await createAdmission(req.body, { tenantId });

    res.json({
      success: true,
      data: result,
      message: `Student Created Successfully! Admission No: ${result.admissionNo}`,
    });
  } catch (err: any) {
    console.error("🔥 ADMISSION ERROR:", err);

    // Validation errors → 400, others → 500
    const isValidation = err.message?.includes("Required") || 
                         err.message?.includes("not found") || 
                         err.message?.includes("already exists");

    res.status(isValidation ? 400 : 500).json({
      success: false,
      message: err.message || "Admission creation failed",
    });
  }
};
