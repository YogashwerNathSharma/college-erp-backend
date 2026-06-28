import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════
// MULTI-LANGUAGE (i18n) CONTROLLER
// Supports: English, Hindi, Marathi, Tamil, Telugu,
// Bengali, Gujarati, Kannada, Malayalam, Punjabi, Urdu
// ══════════════════════════════════════════════════

const SUPPORTED_LOCALES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", rtl: true },
];

/**
 * Get all translations for a locale
 * GET /api/i18n/:locale
 */
export const getTranslations = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const locale = req.params.locale as string;

    const translations = await prisma.translation.findMany({
      where: { tenantId, locale, isActive: true },
      select: { module: true, key: true, value: true },
    });

    // Group by module
    const grouped: Record<string, Record<string, string>> = {};
    for (const t of translations) {
      if (!grouped[t.module]) grouped[t.module] = {};
      grouped[t.module][t.key] = t.value;
    }

    // Also return as flat object for simple usage
    const flat: Record<string, string> = {};
    for (const t of translations) {
      flat[`${t.module}.${t.key}`] = t.value;
    }

    return res.status(200).json({
      success: true,
      data: { locale, grouped, flat, count: translations.length },
    });
  } catch (error: any) {
    console.error("Get translations error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get translations for a specific module
 * GET /api/i18n/:locale/:module
 */
export const getModuleTranslations = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const locale = req.params.locale as string;
    const module = req.params.module as string;

    const translations = await prisma.translation.findMany({
      where: { tenantId, locale, module, isActive: true },
      select: { key: true, value: true },
    });

    const result: Record<string, string> = {};
    for (const t of translations) {
      result[t.key] = t.value;
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error("Get module translations error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update/create translations (bulk)
 * PUT /api/i18n/:locale
 */
export const updateTranslations = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const locale = req.params.locale as string;
    const { translations } = req.body;
    // translations: [{ module, key, value }]

    if (!Array.isArray(translations) || translations.length === 0) {
      return res.status(400).json({ success: false, message: "translations array required" });
    }

    let created = 0;
    let updated = 0;

    for (const t of translations) {
      if (!t.module || !t.key || t.value === undefined) continue;

      const existing = await prisma.translation.findUnique({
        where: { tenantId_locale_module_key: { tenantId, locale, module: t.module, key: t.key } },
      });

      if (existing) {
        await prisma.translation.update({
          where: { id: existing.id },
          data: { value: t.value },
        });
        updated++;
      } else {
        await prisma.translation.create({
          data: { tenantId, locale, module: t.module, key: t.key, value: t.value },
        });
        created++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Created: ${created}, Updated: ${updated}`,
      data: { created, updated },
    });
  } catch (error: any) {
    console.error("Update translations error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Import translations from JSON file
 * POST /api/i18n/import
 */
export const importTranslations = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { locale, data } = req.body;
    // data: { module: { key: value } } format

    if (!locale || !data || typeof data !== "object") {
      return res.status(400).json({ success: false, message: "locale and data (object) required" });
    }

    let count = 0;
    for (const [module, keys] of Object.entries(data)) {
      if (typeof keys !== "object" || !keys) continue;
      for (const [key, value] of Object.entries(keys as Record<string, string>)) {
        await prisma.translation.upsert({
          where: { tenantId_locale_module_key: { tenantId, locale, module, key } },
          create: { tenantId, locale, module, key, value },
          update: { value },
        });
        count++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Imported ${count} translations for locale: ${locale}`,
      data: { count },
    });
  } catch (error: any) {
    console.error("Import translations error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Export translations as JSON
 * GET /api/i18n/export/:locale
 */
export const exportTranslations = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const locale = req.params.locale as string;

    const translations = await prisma.translation.findMany({
      where: { tenantId, locale, isActive: true },
    });

    const grouped: Record<string, Record<string, string>> = {};
    for (const t of translations) {
      if (!grouped[t.module]) grouped[t.module] = {};
      grouped[t.module][t.key] = t.value;
    }

    return res.status(200).json({
      success: true,
      data: grouped,
      meta: { locale, totalKeys: translations.length, exportedAt: new Date() },
    });
  } catch (error: any) {
    console.error("Export translations error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get language config
 * GET /api/i18n/config
 */
export const getConfig = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;

    let config = await prisma.languageConfig.findUnique({
      where: { tenantId },
    });

    // Return default if not configured
    if (!config) {
      config = {
        id: "",
        tenantId,
        defaultLocale: "en",
        enabledLocales: ["en", "hi"],
        rtlLocales: ["ur", "ar"],
        autoTranslate: false,
        showLanguageSelector: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        ...config,
        supportedLocales: SUPPORTED_LOCALES,
      },
    });
  } catch (error: any) {
    console.error("Get config error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update language config
 * PUT /api/i18n/config
 */
export const updateConfig = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { defaultLocale, enabledLocales, rtlLocales, showLanguageSelector, fallbackLocale } = req.body;

    const config = await prisma.languageConfig.upsert({
      where: { tenantId },
      create: { tenantId, defaultLocale, enabledLocales, rtlLocales, showLanguageSelector, fallbackLocale },
      update: { defaultLocale, enabledLocales, rtlLocales, showLanguageSelector, fallbackLocale },
    });

    return res.status(200).json({ success: true, message: "Config updated", data: config });
  } catch (error: any) {
    console.error("Update config error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get translation stats
 * GET /api/i18n/stats
 */
export const getTranslationStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;

    const stats = await prisma.translation.groupBy({
      by: ["locale"],
      where: { tenantId, isActive: true },
      _count: true,
    });

    const modules = await prisma.translation.groupBy({
      by: ["module"],
      where: { tenantId, locale: "en", isActive: true },
      _count: true,
    });

    // Get total English keys as baseline
    const totalEnKeys = stats.find((s: any) => s.locale === "en")?._count || 0;

    const localeStats = stats.map((s: any) => ({
      locale: s.locale,
      name: SUPPORTED_LOCALES.find((l: any) => l.code === s.locale)?.name || s.locale,
      nativeName: SUPPORTED_LOCALES.find((l: any) => l.code === s.locale)?.nativeName || s.locale,
      flag: SUPPORTED_LOCALES.find((l: any) => l.code === s.locale)?.flag || "🏳️",
      keys: s._count,
      completionPercent: totalEnKeys > 0 ? Math.round((s._count / totalEnKeys) * 100) : 0,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalKeys: totalEnKeys,
        locales: localeStats,
        modules: modules.map((m: any) => ({ module: m.module, keys: m._count })),
      },
    });
  } catch (error: any) {
    console.error("Translation stats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete translations for a key
 * DELETE /api/i18n/:locale/:module/:key
 */
export const deleteTranslation = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { locale, module, key } = req.params;

    await prisma.translation.updateMany({
      where: { tenantId, locale: locale as string, module: module as string, key: key as string },
      data: { isActive: false },
    });

    return res.status(200).json({ success: true, message: "Translation deleted" });
  } catch (error: any) {
    console.error("Delete translation error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
