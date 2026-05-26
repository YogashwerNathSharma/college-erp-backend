import { Request, Response } from "express";
import { getReceiptService } from "./receipt.service";

export const getReceiptController = async (
  req: Request,
  res: Response
) => {
  try {
    const tenantId = (req as any).tenantId;
    const paymentId = req.params.paymentId as string;

    // 🔒 validation
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await getReceiptService({
      paymentId,
      tenantId, // 🔥 FIX
    });

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("RECEIPT ERROR:", error);

    if (error.message === "Receipt not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Receipt error",
    });
  }
};