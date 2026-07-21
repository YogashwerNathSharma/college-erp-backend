import { Request, Response } from "express";
import {
  getCurrentThemeService,
  getAllThemesService,
  createThemeService,
  updateThemeService,
  deleteThemeService,
  activateThemeService,
  applyPresetService,
  uploadLogoService,
  uploadFaviconService,
  updateCustomCodeService,
  previewThemeService,
} from "./theme-management.service";

// ══════════════════════════════════════════════════════
// THEME MANAGEMENT CONTROLLER
// ══════════════════════════════════════════════════════

// ─── GET CURRENT THEME ─────────────────────────────────
export const getCurrentTheme = async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId as string | undefined;
    const theme = await getCurrentThemeService(tenantId);
    res.json({ success: true, data: theme });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET ALL THEMES ────────────────────────────────────
export const getAllThemes = async (req: Request, res: Response) => {
  try {
    const result = await getAllThemesService();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CREATE THEME ──────────────────────────────────────
export const createTheme = async (req: Request, res: Response) => {
  try {
    const theme = await createThemeService(req.body);
    res.status(201).json({ success: true, data: theme });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UPDATE THEME ──────────────────────────────────────
export const updateTheme = async (req: Request, res: Response) => {
  try {
    const theme = await updateThemeService(req.params.id, req.body);
    res.json({ success: true, data: theme });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE THEME ──────────────────────────────────────
export const deleteTheme = async (req: Request, res: Response) => {
  try {
    const result = await deleteThemeService(req.params.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── ACTIVATE THEME ────────────────────────────────────
export const activateTheme = async (req: Request, res: Response) => {
  try {
    const theme = await activateThemeService(req.params.id);
    res.json({ success: true, data: theme });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── APPLY PRESET ──────────────────────────────────────
export const applyPreset = async (req: Request, res: Response) => {
  try {
    const { presetId, tenantId } = req.body;
    const theme = await applyPresetService(presetId, tenantId);
    res.json({ success: true, data: theme });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UPLOAD LOGO ───────────────────────────────────────
export const uploadLogo = async (req: Request, res: Response) => {
  try {
    const { logoUrl } = req.body;
    const theme = await uploadLogoService(req.params.id, logoUrl);
    res.json({ success: true, data: theme });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UPLOAD FAVICON ────────────────────────────────────
export const uploadFavicon = async (req: Request, res: Response) => {
  try {
    const { faviconUrl } = req.body;
    const theme = await uploadFaviconService(req.params.id, faviconUrl);
    res.json({ success: true, data: theme });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UPDATE CUSTOM CODE ────────────────────────────────
export const updateCustomCode = async (req: Request, res: Response) => {
  try {
    const { css, js } = req.body;
    const theme = await updateCustomCodeService(req.params.id, { css, js });
    res.json({ success: true, data: theme });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── PREVIEW THEME ─────────────────────────────────────
export const previewTheme = async (req: Request, res: Response) => {
  try {
    const result = await previewThemeService(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
