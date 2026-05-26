import { Request, Response } from "express";
import * as service from "./fees.service";

export const getDefaulters = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await service.getDefaulters(
      req.query,
      tenantId // 🔥 FIX
    );

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("DEFAULTERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching defaulters",
    });
  }
};