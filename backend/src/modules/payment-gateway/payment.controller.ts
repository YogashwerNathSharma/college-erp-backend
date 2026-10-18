import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import crypto from "crypto";

// ══════════════════════════════════════════════════
// PAYMENT GATEWAY CONTROLLER
// Supports: Razorpay (primary), Paytm, PhonePe, CCAvenue
// ══════════════════════════════════════════════════

function generateOrderId(): string {
  const date = new Date();
  const prefix = "ORD";
  const year = date.getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

/**
 * P0-07: Atomically finalize a successful online payment.
 * Verify and webhook callbacks both use this path so concurrent/repeated
 * callbacks can produce only one SUCCESS transition and one fee Payment.
 */
async function finalizeSuccessfulPayment(
  paymentId: string,
  tenantId: string,
  data: {
    gatewayPaymentId?: string;
    gatewaySignature?: string;
    gatewayResponse?: any;
    paymentMethod?: string;
  }
) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    const transitioned = await tx.onlinePayment.updateMany({
      where: {
        id: paymentId,
        tenantId,
        status: { not: "SUCCESS" },
      },
      data: {
        status: "SUCCESS",
        gatewayPaymentId: data.gatewayPaymentId,
        gatewaySignature: data.gatewaySignature,
        gatewayResponse: data.gatewayResponse,
        paymentMethod: data.paymentMethod,
        paidAt: now,
      },
    });

    const payment = await tx.onlinePayment.findFirst({
      where: { id: paymentId, tenantId },
    });

    if (!payment) {
      throw new Error("Payment order not found");
    }

    // Another request already finalized this payment. Do not create another fee Payment.
    if (transitioned.count === 0) {
      return payment;
    }

    if (payment.feeId) {
      const reference = data.gatewayPaymentId || payment.gatewayOrderId || payment.orderId;

      // Legacy-safe duplicate check plus the atomic SUCCESS transition above prevents
      // repeated verify/webhook callbacks from inserting duplicate fee payments.
      const existingFeePayment = await tx.payment.findFirst({
        where: {
          tenantId,
          studentFeeId: payment.feeId,
          reference,
        },
      });

      if (!existingFeePayment) {
        await tx.payment.create({
          data: {
            tenantId,
            studentFeeId: payment.feeId,
            amount: payment.amount,
            method: "ONLINE" as any,
            paymentMode: "ONLINE",
            paymentDate: now,
            receiptNo: payment.orderId || `RCP-${Date.now()}`,
            reference,
            remarks: "Online payment via Razorpay",
          },
        });
      }
    }

    await tx.paymentLink.updateMany({
      where: { tenantId, paymentId: payment.id },
      data: { status: "PAID", paidAt: now },
    });

    return tx.onlinePayment.findFirst({
      where: { id: payment.id, tenantId },
    });
  });
}

/**
 * Create payment order
 * POST /api/payment-gateway/create-order
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const {
      amount,
      currency = "INR",
      studentId,
      studentName,
      feeId,
      purpose,
      description,
      provider = "RAZORPAY",
    } = req.body;

    if (!amount || !purpose) {
      return res.status(400).json({ success: false, message: "amount and purpose are required" });
    }

    const gatewayConfig = await prisma.paymentGatewayConfig.findFirst({
      where: { tenantId, provider, isActive: true },
    });

    if (!gatewayConfig) {
      return res.status(400).json({
        success: false,
        message: `Payment gateway ${provider} not configured. Go to Settings → Payment Gateway.`,
      });
    }

    const orderId = generateOrderId();
    let gatewayOrderId: string | null = null;
    let gatewayResponse: any = null;

    if (provider === "RAZORPAY") {
      const Razorpay = require("razorpay");
      const instance = new Razorpay({
        key_id: gatewayConfig.apiKey,
        key_secret: gatewayConfig.apiSecret,
      });

      const razorpayOrder = await instance.orders.create({
        amount: Math.round(amount * 100),
        currency,
        receipt: orderId,
        notes: { tenantId, studentId, purpose },
      });

      gatewayOrderId = razorpayOrder.id;
      gatewayResponse = razorpayOrder;
    }

    const payment = await prisma.onlinePayment.create({
      data: {
        tenantId,
        orderId,
        gatewayOrderId,
        amount,
        currency,
        studentId,
        studentName,
        feeId,
        purpose,
        description,
        status: "CREATED",
        configId: gatewayConfig.id,
        gatewayResponse,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      data: {
        payment,
        gatewayOrderId,
        gatewayKey: gatewayConfig.apiKey,
        amount: amount * 100,
        currency,
      },
    });
  } catch (error: any) {
    console.error("Create order error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify payment (after frontend callback or webhook)
 * POST /api/payment-gateway/verify
 */
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const {
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    const payment = await prisma.onlinePayment.findFirst({
      where: {
        tenantId,
        OR: [
          { orderId },
          { gatewayOrderId: razorpay_order_id },
        ],
      },
      include: { config: true },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment order not found" });
    }

    if (payment.status === "SUCCESS") {
      return res.status(200).json({ success: true, message: "Payment already verified", data: payment });
    }

    if (payment.config?.provider === "RAZORPAY") {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment verification data is incomplete" });
      }

      const expectedSignature = crypto
        .createHmac("sha256", payment.config.apiSecret || "")
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        await prisma.onlinePayment.updateMany({
          where: { id: payment.id, tenantId, status: { not: "SUCCESS" } },
          data: { status: "FAILED", gatewayResponse: req.body },
        });
        return res.status(400).json({ success: false, message: "Payment signature verification failed" });
      }
    }

    const updatedPayment = await finalizeSuccessfulPayment(payment.id, tenantId, {
      gatewayPaymentId: razorpay_payment_id,
      gatewaySignature: razorpay_signature,
      gatewayResponse: req.body,
    });

    return res.status(200).json({
      success: true,
      message: updatedPayment?.status === "SUCCESS" ? "Payment verified successfully" : "Payment processed",
      data: updatedPayment,
    });
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Razorpay Webhook handler
 * POST /api/payment-gateway/webhook
 */
export const webhookHandler = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const body = JSON.stringify(req.body);
    const event = req.body;
    const orderId = event?.payload?.order?.entity?.receipt;

    if (!orderId) {
      return res.status(200).json({ success: true, message: "Event ignored (no receipt)" });
    }

    const payment = await prisma.onlinePayment.findFirst({
      where: { orderId },
      include: { config: true },
    });

    if (!payment || !payment.config?.webhookSecret) {
      return res.status(200).json({ success: true, message: "Payment not found" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", payment.config.webhookSecret)
      .update(body)
      .digest("hex");

    if (!signature || expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    switch (event.event) {
      case "payment.captured": {
        const gatewayPayment = event.payload?.payment?.entity;
        if (!gatewayPayment?.id) {
          return res.status(200).json({ success: true, message: "Payment event missing payment id" });
        }

        await finalizeSuccessfulPayment(payment.id, payment.tenantId, {
          gatewayPaymentId: gatewayPayment.id,
          paymentMethod: gatewayPayment.method,
          gatewayResponse: event.payload,
        });
        break;
      }

      case "payment.failed":
        // Never regress an already successful payment to FAILED when callbacks arrive out of order.
        await prisma.onlinePayment.updateMany({
          where: { id: payment.id, tenantId: payment.tenantId, status: { not: "SUCCESS" } },
          data: { status: "FAILED", gatewayResponse: event.payload },
        });
        break;

      case "refund.processed":
        await prisma.onlinePayment.update({
          where: { id: payment.id },
          data: {
            status: "REFUNDED",
            refundAmount: event.payload.refund.entity.amount / 100,
            refundId: event.payload.refund.entity.id,
            refundedAt: new Date(),
          },
        });
        break;
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return res.status(200).json({ success: true });
  }
};

/**
 * Initiate refund
 * POST /api/payment-gateway/refund/:id
 */
export const initiateRefund = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const paymentId = req.params.id as string;
    const { amount, reason } = req.body;

    const payment = await prisma.onlinePayment.findFirst({
      where: { id: paymentId, tenantId, status: "SUCCESS" },
      include: { config: true },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Successful payment not found" });
    }

    const refundAmount = amount || payment.amount;

    if (payment.config?.provider === "RAZORPAY") {
      const Razorpay = require("razorpay");
      const instance = new Razorpay({
        key_id: payment.config.apiKey,
        key_secret: payment.config.apiSecret,
      });

      const refund = await instance.payments.refund(payment.gatewayPaymentId, {
        amount: Math.round(refundAmount * 100),
        notes: { reason },
      });

      await prisma.onlinePayment.update({
        where: { id: payment.id },
        data: {
          status: refundAmount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED",
          refundAmount,
          refundId: refund.id,
          refundReason: reason,
          refundedAt: new Date(),
        },
      });

      return res.status(200).json({ success: true, message: "Refund initiated", data: refund });
    }

    return res.status(400).json({ success: false, message: "Refund not supported for this provider" });
  } catch (error: any) {
    console.error("Refund error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get transactions list
 * GET /api/payment-gateway/transactions
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const purpose = req.query.purpose as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (purpose) where.purpose = purpose;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.onlinePayment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.onlinePayment.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { transactions, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("Get transactions error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Generate payment link
 * POST /api/payment-gateway/link
 */
export const generatePaymentLink = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const {
      studentId,
      studentName,
      parentPhone,
      parentEmail,
      amount,
      purpose,
      description,
      expiryHours = 72,
      sendSMS = false,
      sendEmail = false,
      sendWhatsApp = false,
    } = req.body;

    if (!studentId || !amount || !purpose) {
      return res.status(400).json({ success: false, message: "studentId, amount, and purpose required" });
    }

    const orderId = generateOrderId();
    const payment = await prisma.onlinePayment.create({
      data: {
        tenantId,
        orderId,
        amount,
        currency: "INR",
        studentId,
        studentName,
        purpose,
        description,
        status: "CREATED",
      },
    });

    const linkUrl = `${process.env.FRONTEND_URL || "https://erp.example.com"}/pay/${orderId}`;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const paymentLink = await prisma.paymentLink.create({
      data: {
        tenantId,
        studentId,
        studentName: studentName || "",
        parentPhone,
        parentEmail,
        amount,
        purpose,
        description,
        linkUrl,
        expiresAt,
        status: "ACTIVE",
        paymentId: payment.id,
        smsSent: sendSMS,
        emailSent: sendEmail,
        whatsappSent: sendWhatsApp,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Payment link generated",
      data: { paymentLink, linkUrl },
    });
  } catch (error: any) {
    console.error("Generate link error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get gateway config
 * GET /api/payment-gateway/config
 */
export const getConfig = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;

    const configs = await prisma.paymentGatewayConfig.findMany({
      where: { tenantId },
      select: {
        id: true,
        provider: true,
        merchantId: true,
        isActive: true,
        isTest: true,
        apiKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ success: true, data: configs });
  } catch (error: any) {
    console.error("Get config error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update gateway config
 * PUT /api/payment-gateway/config
 */
export const updateConfig = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { provider, merchantId, apiKey, apiSecret, webhookSecret, callbackUrl, isActive, isTest } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, message: "provider is required" });
    }

    const config = await prisma.paymentGatewayConfig.upsert({
      where: { tenantId_provider: { tenantId, provider } },
      create: { tenantId, provider, merchantId, apiKey, apiSecret, webhookSecret, callbackUrl, isActive, isTest },
      update: { merchantId, apiKey, apiSecret, webhookSecret, callbackUrl, isActive, isTest },
    });

    return res.status(200).json({ success: true, message: "Config updated", data: config });
  } catch (error: any) {
    console.error("Update config error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Payment gateway stats
 * GET /api/payment-gateway/stats
 */
export const getPaymentStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalPayments, successPayments, todayCollection, monthCollection, failedCount, pendingLinks] = await Promise.all([
      prisma.onlinePayment.count({ where: { tenantId } }),
      prisma.onlinePayment.count({ where: { tenantId, status: "SUCCESS" } }),
      prisma.onlinePayment.aggregate({
        where: { tenantId, status: "SUCCESS", paidAt: { gte: today } },
        _sum: { amount: true },
      }),
      prisma.onlinePayment.aggregate({
        where: { tenantId, status: "SUCCESS", paidAt: { gte: thisMonth } },
        _sum: { amount: true },
      }),
      prisma.onlinePayment.count({ where: { tenantId, status: "FAILED" } }),
      prisma.paymentLink.count({ where: { tenantId, status: "ACTIVE" } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalPayments,
        successPayments,
        todayCollection: todayCollection._sum.amount || 0,
        monthCollection: monthCollection._sum.amount || 0,
        failedCount,
        pendingLinks,
        successRate: totalPayments > 0 ? Math.round((successPayments / totalPayments) * 100) : 0,
      },
    });
  } catch (error: any) {
    console.error("Payment stats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
