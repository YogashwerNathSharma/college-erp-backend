import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════════
// THEME BUILDER CONTROLLER
// ══════════════════════════════════════════════════════════════

// Default theme presets
const THEME_PRESETS = [
  {
    id: "default-indigo",
    name: "Default Indigo",
    primaryColor: "#4f46e5",
    secondaryColor: "#7c3aed",
    accentColor: "#06b6d4",
    sidebarBg: "#1e2a4a",
    sidebarText: "#e2e8f0",
    topbarBg: "#ffffff",
    topbarText: "#1e293b",
    bodyBg: "#f8fafc",
    cardBg: "#ffffff",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "14px",
    borderRadius: "12px",
    isDark: false,
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    primaryColor: "#0ea5e9",
    secondaryColor: "#0284c7",
    accentColor: "#14b8a6",
    sidebarBg: "#0c1929",
    sidebarText: "#e0f2fe",
    topbarBg: "#ffffff",
    topbarText: "#0f172a",
    bodyBg: "#f0f9ff",
    cardBg: "#ffffff",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "14px",
    borderRadius: "10px",
    isDark: false,
  },
  {
    id: "emerald-green",
    name: "Emerald Green",
    primaryColor: "#10b981",
    secondaryColor: "#059669",
    accentColor: "#f59e0b",
    sidebarBg: "#022c22",
    sidebarText: "#d1fae5",
    topbarBg: "#ffffff",
    topbarText: "#1e293b",
    bodyBg: "#f0fdf4",
    cardBg: "#ffffff",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "14px",
    borderRadius: "8px",
    isDark: false,
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    primaryColor: "#f97316",
    secondaryColor: "#ea580c",
    accentColor: "#8b5cf6",
    sidebarBg: "#1c1917",
    sidebarText: "#fed7aa",
    topbarBg: "#ffffff",
    topbarText: "#1e293b",
    bodyBg: "#fffbeb",
    cardBg: "#ffffff",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "14px",
    borderRadius: "12px",
    isDark: false,
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    primaryColor: "#8b5cf6",
    secondaryColor: "#7c3aed",
    accentColor: "#ec4899",
    sidebarBg: "#1e1033",
    sidebarText: "#ede9fe",
    topbarBg: "#ffffff",
    topbarText: "#1e293b",
    bodyBg: "#faf5ff",
    cardBg: "#ffffff",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "14px",
    borderRadius: "16px",
    isDark: false,
  },
  {
    id: "dark-mode",
    name: "Dark Mode",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    accentColor: "#22d3ee",
    sidebarBg: "#0f172a",
    sidebarText: "#e2e8f0",
    topbarBg: "#1e293b",
    topbarText: "#f1f5f9",
    bodyBg: "#0f172a",
    cardBg: "#1e293b",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "14px",
    borderRadius: "12px",
    isDark: true,
  },
  {
    id: "minimal-gray",
    name: "Minimal Gray",
    primaryColor: "#475569",
    secondaryColor: "#334155",
    accentColor: "#3b82f6",
    sidebarBg: "#f8fafc",
    sidebarText: "#334155",
    topbarBg: "#ffffff",
    topbarText: "#1e293b",
    bodyBg: "#ffffff",
    cardBg: "#f8fafc",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "14px",
    borderRadius: "8px",
    isDark: false,
  },
  {
    id: "school-classic",
    name: "School Classic",
    primaryColor: "#b91c1c",
    secondaryColor: "#991b1b",
    accentColor: "#ca8a04",
    sidebarBg: "#1a1a2e",
    sidebarText: "#fecaca",
    topbarBg: "#ffffff",
    topbarText: "#1e293b",
    bodyBg: "#fef2f2",
    cardBg: "#ffffff",
    fontFamily: "Georgia, serif",
    fontSize: "14px",
    borderRadius: "6px",
    isDark: false,
  },
];

/**
 * GET /api/theme
 * Get current active theme for tenant
 */
export const getTheme = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;

    const theme = await prisma.themeConfig.findFirst({
      where: { tenantId, isActive: true },
    });

    if (!theme) {
      // Return default theme
      return res.json({ success: true, data: THEME_PRESETS[0] });
    }

    res.json({ success: true, data: theme });
  } catch (error: any) {
    console.error("Error fetching theme:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/theme
 * Update/create theme for tenant
 */
export const updateTheme = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const {
      name,
      primaryColor,
      secondaryColor,
      accentColor,
      sidebarBg,
      sidebarText,
      topbarBg,
      topbarText,
      bodyBg,
      cardBg,
      fontFamily,
      fontSize,
      borderRadius,
      logoUrl,
      faviconUrl,
      loginBg,
      isDark,
    } = req.body;

    // Deactivate existing themes
    await prisma.themeConfig.updateMany({
      where: { tenantId, isActive: true },
      data: { isActive: false },
    });

    // Create/update active theme
    const existing = await prisma.themeConfig.findFirst({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
    });

    let theme;
    if (existing) {
      theme = await prisma.themeConfig.update({
        where: { id: existing.id },
        data: {
          name: name || "Custom",
          primaryColor,
          secondaryColor,
          accentColor,
          sidebarBg,
          sidebarText,
          topbarBg,
          topbarText,
          bodyBg,
          cardBg,
          fontFamily,
          fontSize,
          borderRadius,
          logoUrl,
          faviconUrl,
          loginBg,
          isDark: isDark || false,
          isActive: true,
        },
      });
    } else {
      theme = await prisma.themeConfig.create({
        data: {
          tenantId,
          name: name || "Custom",
          primaryColor: primaryColor || "#4f46e5",
          secondaryColor: secondaryColor || "#7c3aed",
          accentColor: accentColor || "#06b6d4",
          sidebarBg: sidebarBg || "#1e2a4a",
          sidebarText: sidebarText || "#e2e8f0",
          topbarBg: topbarBg || "#ffffff",
          topbarText: topbarText || "#1e293b",
          bodyBg: bodyBg || "#f8fafc",
          cardBg: cardBg || "#ffffff",
          fontFamily: fontFamily || "Inter, system-ui, sans-serif",
          fontSize: fontSize || "14px",
          borderRadius: borderRadius || "12px",
          logoUrl,
          faviconUrl,
          loginBg,
          isDark: isDark || false,
          isActive: true,
        },
      });
    }

    // Also update tenant's primaryColor for backward compatibility
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { primaryColor },
    });

    res.json({ success: true, data: theme });
  } catch (error: any) {
    console.error("Error updating theme:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/theme/preview
 * Temporarily preview a theme (returns CSS variables, doesn't save)
 */
export const previewTheme = async (req: Request, res: Response) => {
  try {
    const themeData = req.body;

    // Generate CSS variables
    const cssVariables = {
      "--color-primary": themeData.primaryColor || "#4f46e5",
      "--color-secondary": themeData.secondaryColor || "#7c3aed",
      "--color-accent": themeData.accentColor || "#06b6d4",
      "--sidebar-bg": themeData.sidebarBg || "#1e2a4a",
      "--sidebar-text": themeData.sidebarText || "#e2e8f0",
      "--topbar-bg": themeData.topbarBg || "#ffffff",
      "--topbar-text": themeData.topbarText || "#1e293b",
      "--body-bg": themeData.bodyBg || "#f8fafc",
      "--card-bg": themeData.cardBg || "#ffffff",
      "--font-family": themeData.fontFamily || "Inter, system-ui, sans-serif",
      "--font-size": themeData.fontSize || "14px",
      "--border-radius": themeData.borderRadius || "12px",
    };

    res.json({ success: true, data: { cssVariables, theme: themeData } });
  } catch (error: any) {
    console.error("Error previewing theme:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/theme/reset
 * Reset to default theme
 */
export const resetTheme = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;

    // Deactivate all themes
    await prisma.themeConfig.updateMany({
      where: { tenantId },
      data: { isActive: false },
    });

    // Reset tenant primary color
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { primaryColor: "#4f46e5" },
    });

    res.json({ success: true, data: THEME_PRESETS[0], message: "Theme reset to default" });
  } catch (error: any) {
    console.error("Error resetting theme:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/theme/presets
 * List all available preset themes
 */
export const getPresets = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: THEME_PRESETS });
  } catch (error: any) {
    console.error("Error fetching presets:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/theme/history
 * Get theme change history
 */
export const getThemeHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;

    const themes = await prisma.themeConfig.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    res.json({ success: true, data: themes });
  } catch (error: any) {
    console.error("Error fetching theme history:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
