import prisma from "../../utils/prisma";

// ══════════════════════════════════════════════════════
// THEME MANAGEMENT SERVICE
// Adapts to the existing ThemeConfig Prisma model
// ══════════════════════════════════════════════════════

export interface ThemeInput {
  name?: string;
  mode?: "light" | "dark" | "auto";
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    surface?: string;
    text?: string;
    sidebarBg?: string;
    sidebarText?: string;
    topbarBg?: string;
    topbarText?: string;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: string;
    borderRadius?: string;
  };
  layout?: {
    sidebarStyle?: string;
    headerStyle?: string;
    contentWidth?: string;
    borderRadius?: string;
    density?: string;
  };
  branding?: {
    logoUrl?: string;
    faviconUrl?: string;
    appName?: string;
  };
  tenantId?: string;
}

// ─── TRANSFORM DB → API ────────────────────────────────
function transformToApi(dbTheme: any) {
  return {
    id: dbTheme.id,
    name: dbTheme.name,
    mode: dbTheme.isDark ? "dark" : "light",
    colors: {
      primary: dbTheme.primaryColor,
      secondary: dbTheme.secondaryColor,
      accent: dbTheme.accentColor,
      background: dbTheme.bodyBg,
      surface: dbTheme.cardBg,
      text: dbTheme.topbarText,
      sidebarBg: dbTheme.sidebarBg,
      sidebarText: dbTheme.sidebarText,
      topbarBg: dbTheme.topbarBg,
      topbarText: dbTheme.topbarText,
    },
    typography: {
      fontFamily: dbTheme.fontFamily,
      headingFont: dbTheme.fontFamily,
      fontSize: dbTheme.fontSize,
      lineHeight: "1.6",
    },
    layout: {
      sidebarStyle: "full",
      headerStyle: "fixed",
      contentWidth: "full",
      borderRadius: dbTheme.borderRadius,
      density: "comfortable",
    },
    branding: {
      logoUrl: dbTheme.logoUrl || "",
      faviconUrl: dbTheme.faviconUrl || "",
      appName: dbTheme.name || "College ERP",
      tagline: "",
    },
    custom: { css: "", js: "" },
    isActive: dbTheme.isActive,
    tenantId: dbTheme.tenantId,
    createdAt: dbTheme.createdAt,
    updatedAt: dbTheme.updatedAt,
  };
}

// ─── GET CURRENT THEME ─────────────────────────────────
export const getCurrentThemeService = async (tenantId?: string) => {
  const where: any = { isActive: true };
  if (tenantId) {
    where.tenantId = tenantId;
  }

  const theme = await prisma.themeConfig.findFirst({
    where,
    orderBy: { updatedAt: "desc" },
  });

  if (!theme) {
    return getDefaultTheme();
  }

  return transformToApi(theme);
};

// ─── GET ALL THEMES ────────────────────────────────────
export const getAllThemesService = async () => {
  const dbThemes = await prisma.themeConfig.findMany({
    orderBy: { createdAt: "desc" },
  });

  const themes = dbThemes.map(transformToApi);
  const presets = getThemePresets();

  return { themes, presets };
};

// ─── CREATE THEME ──────────────────────────────────────
export const createThemeService = async (data: ThemeInput) => {
  if (!data.tenantId) {
    // Get first tenant as default
    const firstTenant = await prisma.tenant.findFirst({ where: { isDeleted: false } });
    if (!firstTenant) throw new Error("No tenant found to assign theme");
    data.tenantId = firstTenant.id;
  }

  const theme = await prisma.themeConfig.create({
    data: {
      tenantId: data.tenantId,
      name: data.name || "Custom Theme",
      primaryColor: data.colors?.primary || "#4f46e5",
      secondaryColor: data.colors?.secondary || "#7c3aed",
      accentColor: data.colors?.accent || "#06b6d4",
      sidebarBg: data.colors?.sidebarBg || "#1e2a4a",
      sidebarText: data.colors?.sidebarText || "#e2e8f0",
      topbarBg: data.colors?.topbarBg || "#ffffff",
      topbarText: data.colors?.topbarText || "#1e293b",
      bodyBg: data.colors?.background || "#f8fafc",
      cardBg: data.colors?.surface || "#ffffff",
      fontFamily: data.typography?.fontFamily || "Inter, system-ui, sans-serif",
      fontSize: data.typography?.fontSize || "14px",
      borderRadius: data.layout?.borderRadius || "12px",
      logoUrl: data.branding?.logoUrl || null,
      faviconUrl: data.branding?.faviconUrl || null,
      isDark: data.mode === "dark",
      isActive: true,
    },
  });

  return transformToApi(theme);
};

// ─── UPDATE THEME ──────────────────────────────────────
export const updateThemeService = async (id: string, data: ThemeInput) => {
  const theme = await prisma.themeConfig.findUnique({ where: { id } });
  if (!theme) {
    throw new Error("Theme not found");
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.mode !== undefined) updateData.isDark = data.mode === "dark";
  if (data.colors?.primary) updateData.primaryColor = data.colors.primary;
  if (data.colors?.secondary) updateData.secondaryColor = data.colors.secondary;
  if (data.colors?.accent) updateData.accentColor = data.colors.accent;
  if (data.colors?.background) updateData.bodyBg = data.colors.background;
  if (data.colors?.surface) updateData.cardBg = data.colors.surface;
  if (data.colors?.sidebarBg) updateData.sidebarBg = data.colors.sidebarBg;
  if (data.colors?.sidebarText) updateData.sidebarText = data.colors.sidebarText;
  if (data.colors?.topbarBg) updateData.topbarBg = data.colors.topbarBg;
  if (data.colors?.topbarText) updateData.topbarText = data.colors.topbarText;
  if (data.typography?.fontFamily) updateData.fontFamily = data.typography.fontFamily;
  if (data.typography?.fontSize) updateData.fontSize = data.typography.fontSize;
  if (data.layout?.borderRadius) updateData.borderRadius = data.layout.borderRadius;
  if (data.branding?.logoUrl !== undefined) updateData.logoUrl = data.branding.logoUrl;
  if (data.branding?.faviconUrl !== undefined) updateData.faviconUrl = data.branding.faviconUrl;

  const updated = await prisma.themeConfig.update({
    where: { id },
    data: updateData,
  });

  return transformToApi(updated);
};

// ─── DELETE THEME ──────────────────────────────────────
export const deleteThemeService = async (id: string) => {
  const theme = await prisma.themeConfig.findUnique({ where: { id } });
  if (!theme) {
    throw new Error("Theme not found");
  }
  if (theme.isActive) {
    throw new Error("Cannot delete the active theme. Switch to another theme first.");
  }

  await prisma.themeConfig.delete({ where: { id } });

  return { message: "Theme deleted successfully" };
};

// ─── ACTIVATE THEME ────────────────────────────────────
export const activateThemeService = async (id: string) => {
  const theme = await prisma.themeConfig.findUnique({ where: { id } });
  if (!theme) {
    throw new Error("Theme not found");
  }

  // Deactivate all other themes for the same tenant
  await prisma.themeConfig.updateMany({
    where: { tenantId: theme.tenantId },
    data: { isActive: false },
  });

  // Activate the selected theme
  const activated = await prisma.themeConfig.update({
    where: { id },
    data: { isActive: true },
  });

  return transformToApi(activated);
};

// ─── APPLY PRESET ──────────────────────────────────────
export const applyPresetService = async (presetId: string, tenantId?: string) => {
  const presets = getThemePresets();
  const preset = presets.find((p) => p.id === presetId);

  if (!preset) {
    throw new Error("Preset not found");
  }

  if (!tenantId) {
    const firstTenant = await prisma.tenant.findFirst({ where: { isDeleted: false } });
    if (!firstTenant) throw new Error("No tenant found");
    tenantId = firstTenant.id;
  }

  // Deactivate all themes for this tenant
  await prisma.themeConfig.updateMany({
    where: { tenantId },
    data: { isActive: false },
  });

  // Create new theme from preset
  const theme = await prisma.themeConfig.create({
    data: {
      tenantId,
      name: preset.name,
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentColor: preset.colors.accent,
      sidebarBg: "#1e2a4a",
      sidebarText: "#e2e8f0",
      topbarBg: preset.colors.surface,
      topbarText: preset.colors.text,
      bodyBg: preset.colors.background,
      cardBg: preset.colors.surface,
      fontFamily: preset.typography.fontFamily,
      fontSize: preset.typography.fontSize,
      borderRadius: preset.layout.borderRadius,
      isDark: preset.mode === "dark",
      isActive: true,
    },
  });

  return transformToApi(theme);
};

// ─── UPLOAD LOGO ───────────────────────────────────────
export const uploadLogoService = async (id: string, logoUrl: string) => {
  const theme = await prisma.themeConfig.findUnique({ where: { id } });
  if (!theme) throw new Error("Theme not found");

  const updated = await prisma.themeConfig.update({
    where: { id },
    data: { logoUrl },
  });

  return transformToApi(updated);
};

// ─── UPLOAD FAVICON ────────────────────────────────────
export const uploadFaviconService = async (id: string, faviconUrl: string) => {
  const theme = await prisma.themeConfig.findUnique({ where: { id } });
  if (!theme) throw new Error("Theme not found");

  const updated = await prisma.themeConfig.update({
    where: { id },
    data: { faviconUrl },
  });

  return transformToApi(updated);
};

// ─── UPDATE CUSTOM CODE ────────────────────────────────
export const updateCustomCodeService = async (id: string, custom: { css?: string; js?: string }) => {
  // Custom CSS/JS would ideally be stored in a separate field
  // For now, we return success without DB storage
  const theme = await prisma.themeConfig.findUnique({ where: { id } });
  if (!theme) throw new Error("Theme not found");

  return {
    ...transformToApi(theme),
    custom: { css: custom.css || "", js: custom.js || "" },
  };
};

// ─── PREVIEW THEME ─────────────────────────────────────
export const previewThemeService = async (config: ThemeInput) => {
  const cssVars: Record<string, string> = {};

  if (config.colors) {
    if (config.colors.primary) cssVars["--color-primary"] = config.colors.primary;
    if (config.colors.secondary) cssVars["--color-secondary"] = config.colors.secondary;
    if (config.colors.accent) cssVars["--color-accent"] = config.colors.accent;
    if (config.colors.background) cssVars["--color-background"] = config.colors.background;
    if (config.colors.surface) cssVars["--color-surface"] = config.colors.surface;
    if (config.colors.text) cssVars["--color-text"] = config.colors.text;
  }
  if (config.typography?.fontFamily) cssVars["--font-family"] = config.typography.fontFamily;
  if (config.typography?.fontSize) cssVars["--font-size"] = config.typography.fontSize;
  if (config.layout?.borderRadius) cssVars["--border-radius"] = config.layout.borderRadius;

  return { cssVariables: cssVars, config };
};

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════

function getDefaultTheme() {
  return {
    id: "default",
    name: "Default",
    mode: "light",
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#06b6d4",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#1e293b",
      sidebarBg: "#1e2a4a",
      sidebarText: "#e2e8f0",
      topbarBg: "#ffffff",
      topbarText: "#1e293b",
    },
    typography: {
      fontFamily: "Inter, sans-serif",
      headingFont: "Inter, sans-serif",
      fontSize: "14px",
      lineHeight: "1.6",
    },
    layout: {
      sidebarStyle: "full",
      headerStyle: "fixed",
      contentWidth: "full",
      borderRadius: "0.75rem",
      density: "comfortable",
    },
    branding: {
      logoUrl: "",
      faviconUrl: "",
      appName: "College ERP",
      tagline: "Enterprise Resource Planning",
    },
    custom: { css: "", js: "" },
    isActive: true,
  };
}

function getThemePresets() {
  return [
    {
      id: "professional",
      name: "Professional",
      description: "Clean and corporate look with blue tones",
      mode: "light" as const,
      colors: { primary: "#2563eb", secondary: "#1d4ed8", accent: "#0ea5e9", background: "#ffffff", surface: "#f1f5f9", text: "#1e293b" },
      typography: { fontFamily: "Inter, sans-serif", headingFont: "Inter, sans-serif", fontSize: "14px", lineHeight: "1.6" },
      layout: { sidebarStyle: "full" as const, headerStyle: "fixed" as const, contentWidth: "full" as const, borderRadius: "0.5rem", density: "comfortable" as const },
    },
    {
      id: "modern-dark",
      name: "Modern Dark",
      description: "Sleek dark theme with vibrant accents",
      mode: "dark" as const,
      colors: { primary: "#818cf8", secondary: "#a78bfa", accent: "#34d399", background: "#0f172a", surface: "#1e293b", text: "#f1f5f9" },
      typography: { fontFamily: "Plus Jakarta Sans, sans-serif", headingFont: "Plus Jakarta Sans, sans-serif", fontSize: "14px", lineHeight: "1.6" },
      layout: { sidebarStyle: "compact" as const, headerStyle: "fixed" as const, contentWidth: "full" as const, borderRadius: "0.75rem", density: "comfortable" as const },
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Ultra-clean design with minimal distractions",
      mode: "light" as const,
      colors: { primary: "#171717", secondary: "#404040", accent: "#dc2626", background: "#fafafa", surface: "#ffffff", text: "#171717" },
      typography: { fontFamily: "System UI, sans-serif", headingFont: "System UI, sans-serif", fontSize: "15px", lineHeight: "1.7" },
      layout: { sidebarStyle: "mini" as const, headerStyle: "static" as const, contentWidth: "contained" as const, borderRadius: "0.25rem", density: "spacious" as const },
    },
    {
      id: "ocean-breeze",
      name: "Ocean Breeze",
      description: "Calming blue-green palette inspired by the sea",
      mode: "light" as const,
      colors: { primary: "#0d9488", secondary: "#0891b2", accent: "#6366f1", background: "#f0fdfa", surface: "#ffffff", text: "#134e4a" },
      typography: { fontFamily: "Nunito, sans-serif", headingFont: "Nunito, sans-serif", fontSize: "14px", lineHeight: "1.6" },
      layout: { sidebarStyle: "floating" as const, headerStyle: "fixed" as const, contentWidth: "full" as const, borderRadius: "1rem", density: "comfortable" as const },
    },
    {
      id: "sunset-warm",
      name: "Sunset Warm",
      description: "Warm orange and amber tones for a cozy feel",
      mode: "light" as const,
      colors: { primary: "#ea580c", secondary: "#d97706", accent: "#7c3aed", background: "#fffbeb", surface: "#ffffff", text: "#451a03" },
      typography: { fontFamily: "Poppins, sans-serif", headingFont: "Poppins, sans-serif", fontSize: "14px", lineHeight: "1.6" },
      layout: { sidebarStyle: "full" as const, headerStyle: "fixed" as const, contentWidth: "full" as const, borderRadius: "0.75rem", density: "comfortable" as const },
    },
  ];
}
