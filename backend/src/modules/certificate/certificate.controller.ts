import { Request, Response } from "express";
import * as certService from "./certificate.service";

// ============================================
// TRANSFER CERTIFICATE
// ============================================

export const generateTCHandler = async (req: any, res: Response) => {
  try {
    const result = await certService.generateTC(req.body, req.tenantId, req.user?.userId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getTCByIdHandler = async (req: any, res: Response) => {
  try {
    const tc = await certService.getTCById(req.params.id, req.tenantId);
    if (!tc) return res.status(404).json({ success: false, message: "TC not found" });
    res.json({ success: true, data: tc });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllTCsHandler = async (req: any, res: Response) => {
  try {
    const { search, status, page, limit } = req.query;
    const result = await certService.getAllTCs(req.tenantId, {
      search, status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approveTCHandler = async (req: any, res: Response) => {
  try {
    const result = await certService.approveTC(req.params.id, req.tenantId, req.user?.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// CHARACTER CERTIFICATE
// ============================================

export const generateCharacterCertHandler = async (req: any, res: Response) => {
  try {
    const result = await certService.generateCharacterCert(req.body, req.tenantId, req.user?.userId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getCharacterCertsHandler = async (req: any, res: Response) => {
  try {
    const { studentId, page, limit } = req.query;
    const result = await certService.getCharacterCerts(req.tenantId, {
      studentId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// MIGRATION CERTIFICATE
// ============================================

export const generateMigrationCertHandler = async (req: any, res: Response) => {
  try {
    const result = await certService.generateMigrationCert(req.body, req.tenantId, req.user?.userId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getMigrationCertsHandler = async (req: any, res: Response) => {
  try {
    const { studentId, page, limit } = req.query;
    const result = await certService.getMigrationCerts(req.tenantId, {
      studentId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// CERTIFICATE STATS
// ============================================

export const getCertificateStatsHandler = async (req: any, res: Response) => {
  try {
    const result = await certService.getCertificateStats(req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
