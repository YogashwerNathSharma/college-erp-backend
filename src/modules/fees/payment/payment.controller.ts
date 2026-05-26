import { Request, Response } from "express";
import * as service from "./payment.service";

//////////////////////////////
// MAKE PAYMENT
//////////////////////////////
export const makePayment = async (req: Request, res: Response) => {
  try {
    // 🔒 AUTH CHECK
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data = await service.createPaymentService({
      ...req.body,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Payment failed",
      error: error instanceof Error ? error.message : error,
    });
  }
};

//////////////////////////////
// GET PAYMENTS
//////////////////////////////
export const getPayments = async (req: Request, res: Response) => {
  try {
    // 🔒 AUTH CHECK
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const studentFeeId = req.params.studentFeeId as string;

    if (!studentFeeId) {
      return res.status(400).json({
        message: "studentFeeId is required",
      });
    }

    const data = await service.getPaymentsService(
      studentFeeId,
      req.user
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching payments",
      error: error instanceof Error ? error.message : error,
    });
  }
};