import { Request, Response } from "express";
import * as commService from "./communication.service";

// ============================================
// NOTICE HANDLERS
// ============================================

export const createNoticeHandler = async (req: any, res: Response) => {
  try {
    const result = await commService.createNotice(req.body, req.tenantId, req.user?.userId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllNoticesHandler = async (req: any, res: Response) => {
  try {
    const { type, targetAudience, search, page, limit } = req.query;
    const result = await commService.getAllNotices(req.tenantId, {
      type,
      targetAudience,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getNoticeByIdHandler = async (req: any, res: Response) => {
  try {
    const notice = await commService.getNoticeById(req.params.id, req.tenantId);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    res.json({ success: true, data: notice });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateNoticeHandler = async (req: any, res: Response) => {
  try {
    const result = await commService.updateNotice(req.params.id, req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteNoticeHandler = async (req: any, res: Response) => {
  try {
    await commService.deleteNotice(req.params.id, req.tenantId);
    res.json({ success: true, message: "Notice deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// SMS HANDLERS
// ============================================

export const sendSmsHandler = async (req: any, res: Response) => {
  try {
    const result = await commService.sendBulkSms(req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// WHATSAPP HANDLERS
// ============================================

export const sendWhatsAppHandler = async (req: any, res: Response) => {
  try {
    const result = await commService.sendBulkWhatsApp(req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// EMAIL HANDLERS
// ============================================

export const sendEmailHandler = async (req: any, res: Response) => {
  try {
    const result = await commService.sendBulkEmail(req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// COMMUNICATION LOGS
// ============================================

export const getCommunicationLogsHandler = async (req: any, res: Response) => {
  try {
    const { channel, page, limit } = req.query;
    const result = await commService.getCommunicationLogs(req.tenantId, {
      channel,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
