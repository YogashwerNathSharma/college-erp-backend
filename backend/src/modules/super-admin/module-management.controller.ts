import { Request, Response } from "express";
import {
  getAllModulesService,
  getModuleByIdService,
  createModuleService,
  updateModuleService,
  deleteModuleService,
  toggleModuleStatusService,
  installModuleService,
  uninstallModuleService,
  toggleModuleForTenantService,
  moduleHealthCheckService,
  getModuleMarketplaceService,
} from "./module-management.service";

// ══════════════════════════════════════════════════════
// MODULE MANAGEMENT CONTROLLER
// ══════════════════════════════════════════════════════

// ─── GET ALL MODULES ───────────────────────────────────
export const getAllModules = async (req: Request, res: Response) => {
  try {
    const { category, status, search } = req.query;
    const result = await getAllModulesService({
      category: category as string,
      status: status as string,
      search: search as string,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET MODULE BY ID ──────────────────────────────────
export const getModuleById = async (req: Request, res: Response) => {
  try {
    const module = await getModuleByIdService(req.params.id);
    res.json({ success: true, data: module });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// ─── CREATE MODULE ─────────────────────────────────────
export const createModule = async (req: Request, res: Response) => {
  try {
    const module = await createModuleService(req.body);
    res.status(201).json({ success: true, data: module });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UPDATE MODULE ─────────────────────────────────────
export const updateModule = async (req: Request, res: Response) => {
  try {
    const module = await updateModuleService(req.params.id, req.body);
    res.json({ success: true, data: module });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE MODULE ─────────────────────────────────────
export const deleteModule = async (req: Request, res: Response) => {
  try {
    const result = await deleteModuleService(req.params.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── TOGGLE MODULE STATUS ──────────────────────────────
export const toggleModuleStatus = async (req: Request, res: Response) => {
  try {
    const module = await toggleModuleStatusService(req.params.id);
    res.json({ success: true, data: module });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── INSTALL MODULE ────────────────────────────────────
export const installModule = async (req: Request, res: Response) => {
  try {
    const module = await installModuleService(req.params.id);
    res.json({ success: true, data: module });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UNINSTALL MODULE ──────────────────────────────────
export const uninstallModule = async (req: Request, res: Response) => {
  try {
    const module = await uninstallModuleService(req.params.id);
    res.json({ success: true, data: module });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── TOGGLE MODULE FOR TENANT ──────────────────────────
export const toggleModuleForTenant = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.body;
    const result = await toggleModuleForTenantService(req.params.id, tenantId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── HEALTH CHECK ──────────────────────────────────────
export const moduleHealthCheck = async (req: Request, res: Response) => {
  try {
    const result = await moduleHealthCheckService(req.params.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── GET MARKETPLACE ───────────────────────────────────
export const getModuleMarketplace = async (req: Request, res: Response) => {
  try {
    const marketplace = await getModuleMarketplaceService();
    res.json({ success: true, data: marketplace });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
