import { Request, Response } from "express";
import * as feeService from "./feeStructure.service";

export const createFeeStructure = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const data = await feeService.createFeeStructure(
      req.body,
      tenantId
    );

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("CREATE FEE STRUCTURE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error creating fee structure",
    });
  }
};

export const getFeeStructures = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const data = await feeService.getFeeStructures(
      req.query,
      tenantId
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("GET FEE STRUCTURE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching fee structures",
    });
  }
};