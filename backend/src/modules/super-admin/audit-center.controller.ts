// ═══════════════════════════════════════════════════════════
// AUDIT CENTER CONTROLLER
// ═══════════════════════════════════════════════════════════

import { Request, Response } from "express";
import * as auditService from "./audit-center.service";

// GET /api/super-admin/audit-center/logs
export async function getLogs(req: Request, res: Response) {
  try {
    const result = await auditService.getAuditLogs({
      type: req.query.type as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      userId: req.query.userId as string,
      action: req.query.action as string,
      severity: req.query.severity as any,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 25,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as any,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/super-admin/audit-center/logs/:id
export async function getLogById(req: Request, res: Response) {
  try {
    const log = await auditService.getAuditLogById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: "Log not found" });
    }
    res.json({ success: true, log });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/super-admin/audit-center/stats
export async function getStats(req: Request, res: Response) {
  try {
    const stats = await auditService.getAuditStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/super-admin/audit-center/timeline
export async function getTimeline(req: Request, res: Response) {
  try {
    const timeline = await auditService.getActivityTimeline({
      days: parseInt(req.query.days as string) || 7,
      userId: req.query.userId as string,
    });
    res.json({ success: true, timeline });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/super-admin/audit-center/bulk-delete
export async function bulkDelete(req: Request, res: Response) {
  try {
    const result = await auditService.bulkDeleteLogs(req.body);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/super-admin/audit-center/export
export async function exportLogs(req: Request, res: Response) {
  try {
    const { format, ...filter } = req.body;
    const result = await auditService.exportAuditLogs(filter, format || "csv");

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

// GET /api/super-admin/audit-center/users
export async function getUsers(req: Request, res: Response) {
  try {
    const users = await auditService.getAuditUsers();
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/super-admin/audit-center/actions
export async function getActions(req: Request, res: Response) {
  try {
    const actions = await auditService.getAuditActions();
    res.json({ success: true, actions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
