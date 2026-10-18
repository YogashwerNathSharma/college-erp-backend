
// Backup Controller
// Handles HTTP request/response for backup operations

import { Response } from "express";
import {
  listBackupsService,
  createBackupService,
  downloadBackupService,
  deleteBackupService,
  getBackupSettingsService,
  updateBackupSettingsService,
} from "./backup.service";

// ============================================================
// 📋 LIST ALL BACKUPS
// ============================================================
export const listBackups = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { type, page = 1, limit = 20 } = req.query;

    const data = await listBackupsService(tenantId, {
      type: type as string,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🔄 CREATE BACKUP (Manual trigger)
// ============================================================
export const createBackup = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { notes } = req.body;

    const data = await createBackupService(tenantId, "MANUAL", notes);

    res.json({ success: true, data, message: "Backup created successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// 📥 DOWNLOAD BACKUP
// ============================================================
export const downloadBackup = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    const { filePath, filename } = await downloadBackupService(tenantId, id);

    res.download(filePath, filename);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🗑️ DELETE BACKUP
// ============================================================
export const deleteBackup = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    await deleteBackupService(tenantId, id);

    res.json({ success: true, message: "Backup deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// ⚙️ GET BACKUP SETTINGS
// ============================================================
export const getBackupSettings = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;

    const data = await getBackupSettingsService(tenantId);

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// ⚙️ UPDATE BACKUP SETTINGS
// ============================================================
export const updateBackupSettings = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const settings = req.body;

    const data = await updateBackupSettingsService(tenantId, settings);

    res.json({ success: true, data, message: "Backup settings updated successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
