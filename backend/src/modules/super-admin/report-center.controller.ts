// ═══════════════════════════════════════════════════════════
// REPORT CENTER CONTROLLER
// ═══════════════════════════════════════════════════════════

import { Request, Response } from "express";
import * as reportService from "./report-center.service";

// GET /api/super-admin/report-center/revenue
export async function getRevenueReport(req: Request, res: Response) {
  try {
    const report = await reportService.getRevenueReport({
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      granularity: req.query.granularity as any,
    });
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/super-admin/report-center/tenants
export async function getTenantReport(req: Request, res: Response) {
  try {
    const report = await reportService.getTenantReport({
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/super-admin/report-center/usage
export async function getUsageReport(req: Request, res: Response) {
  try {
    const report = await reportService.getUsageReport({
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/super-admin/report-center/login
export async function getLoginReport(req: Request, res: Response) {
  try {
    const report = await reportService.getLoginReport({
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/super-admin/report-center/subscription
export async function getSubscriptionReport(req: Request, res: Response) {
  try {
    const report = await reportService.getSubscriptionReport({
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/super-admin/report-center/system
export async function getSystemReport(req: Request, res: Response) {
  try {
    const report = await reportService.getSystemReport();
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/super-admin/report-center/export
export async function exportReport(req: Request, res: Response) {
  try {
    const { reportType, format, ...filter } = req.body;
    const result = await reportService.exportReport(reportType, filter, format || "csv");

    if (format === "csv") {
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.send(result.data);
    }

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
