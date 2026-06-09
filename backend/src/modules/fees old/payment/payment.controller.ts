import { Request, Response } from "express";
import * as service from "./payment.service";

//////////////////////////////
// MAKE PAYMENT
//////////////////////////////
export const makePayment = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await service.createPaymentService({
      ...req.body,
      tenantId, // 🔥 FIX
    });

    return res.status(201).json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Payment failed",
    });
  }
};

//////////////////////////////
// GET PAYMENTS
//////////////////////////////
export const getPayments = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const studentFeeId = req.params.studentFeeId as string;

    if (!studentFeeId) {
      return res.status(400).json({
        success: false,
        message: "studentFeeId is required",
      });
    }

    const data = await service.getPaymentsService(
      studentFeeId,
      tenantId // 🔥 FIX
    );

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("GET PAYMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching payments",
    });
  }
};