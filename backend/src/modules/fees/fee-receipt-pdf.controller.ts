/**
 * 🧾 Fee Receipt PDF Controller
 *
 * GET /api/fees/receipt/:paymentId/pdf — Generate and return fee receipt PDF
 */

import { Response } from "express";
import { generateFeeReceiptPDF } from "./fee-receipt-pdf.service";

export const getFeeReceiptPDF = async (req: any, res: Response) => {
  try {
    const { paymentId } = req.params;
    const tenantId = req.user?.tenantId || req.tenantId;
    if (!tenantId) return res.status(400).json({ success: false, message: "Tenant ID required" });

    const buffer = await generateFeeReceiptPDF(paymentId, tenantId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="fee-receipt-${paymentId}.pdf"`
    );
    return res.send(buffer);
  } catch (err: any) {
    console.error("Fee receipt PDF error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
