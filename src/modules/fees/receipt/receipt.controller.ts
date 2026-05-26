import { Request, Response } from "express";
import { getReceiptService } from "./receipt.service";

export const getReceiptController = async (
  req: Request,
  res: Response
) => {
  try {
    const paymentId = req.params.paymentId as string;

    // 🔒 validation
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const data = await getReceiptService({
      paymentId,
      user: req.user as any,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Receipt Error:", error.message);

    // 🔥 smart error handling
    if (error.message === "Receipt not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  console.error("RECEIPT ERROR:", error); // 👈 ADD THIS
    return res.status(500).json({
    success: false,
    message: error.message, // 👈 actual error भेजो
    stack: error.stack,     // 👈 TEMP DEBUG
    });
  }
};