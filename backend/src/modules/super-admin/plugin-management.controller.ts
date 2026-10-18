import { Request, Response } from "express";
import {
  getAllPluginsService,
  getPluginByIdService,
  createPluginService,
  updatePluginService,
  deletePluginService,
  togglePluginStatusService,
  updatePluginConfigService,
  updatePluginPermissionsService,
  getPluginActivityLogsService,
  checkPluginUpdatesService,
  applyPluginUpdateService,
  getPluginStoreService,
} from "./plugin-management.service";

// ══════════════════════════════════════════════════════
// PLUGIN MANAGEMENT CONTROLLER
// ══════════════════════════════════════════════════════

// ─── GET ALL PLUGINS ───────────────────────────────────
export const getAllPlugins = async (req: Request, res: Response) => {
  try {
    const { category, status, search } = req.query;
    const result = await getAllPluginsService({
      category: category as string,
      status: status as string,
      search: search as string,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET PLUGIN BY ID ──────────────────────────────────
export const getPluginById = async (req: Request, res: Response) => {
  try {
    const plugin = await getPluginByIdService(req.params.id);
    res.json({ success: true, data: plugin });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// ─── CREATE / INSTALL PLUGIN ───────────────────────────
export const createPlugin = async (req: Request, res: Response) => {
  try {
    const plugin = await createPluginService(req.body);
    res.status(201).json({ success: true, data: plugin });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UPDATE PLUGIN ─────────────────────────────────────
export const updatePlugin = async (req: Request, res: Response) => {
  try {
    const plugin = await updatePluginService(req.params.id, req.body);
    res.json({ success: true, data: plugin });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE / UNINSTALL PLUGIN ─────────────────────────
export const deletePlugin = async (req: Request, res: Response) => {
  try {
    const result = await deletePluginService(req.params.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── TOGGLE PLUGIN STATUS ──────────────────────────────
export const togglePluginStatus = async (req: Request, res: Response) => {
  try {
    const plugin = await togglePluginStatusService(req.params.id);
    res.json({ success: true, data: plugin });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UPDATE PLUGIN CONFIG ──────────────────────────────
export const updatePluginConfig = async (req: Request, res: Response) => {
  try {
    const plugin = await updatePluginConfigService(req.params.id, req.body.config);
    res.json({ success: true, data: plugin });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UPDATE PLUGIN PERMISSIONS ─────────────────────────
export const updatePluginPermissions = async (req: Request, res: Response) => {
  try {
    const plugin = await updatePluginPermissionsService(req.params.id, req.body.permissions);
    res.json({ success: true, data: plugin });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── GET PLUGIN ACTIVITY LOGS ──────────────────────────
export const getPluginActivityLogs = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await getPluginActivityLogsService(req.params.id, limit);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CHECK FOR UPDATES ─────────────────────────────────
export const checkPluginUpdates = async (req: Request, res: Response) => {
  try {
    const updates = await checkPluginUpdatesService();
    res.json({ success: true, data: updates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── APPLY UPDATE ──────────────────────────────────────
export const applyPluginUpdate = async (req: Request, res: Response) => {
  try {
    const plugin = await applyPluginUpdateService(req.params.id);
    res.json({ success: true, data: plugin });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── GET PLUGIN STORE ──────────────────────────────────
export const getPluginStore = async (req: Request, res: Response) => {
  try {
    const store = await getPluginStoreService();
    res.json({ success: true, data: store });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
