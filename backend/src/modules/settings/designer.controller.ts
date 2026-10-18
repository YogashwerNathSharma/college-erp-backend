
// Designer Settings Controller
// Handles custom design settings for Certificate, Report, Report Card, and ID Card

import { Response } from "express";
import prisma from "../../utils/prisma";

// ============================================================
// GET /api/settings/designer?type=certificate
// ============================================================
export const getDesignerSettings = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({ success: false, message: "Type parameter is required" });
    }

    const settings = await prisma.designerSettings.findFirst({
      where: { tenantId, type: type as string },
    });

    res.json({ success: true, data: settings?.settings || getDefaultSettings(type as string) });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// PUT /api/settings/designer
// ============================================================
export const updateDesignerSettings = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { type, settings } = req.body;

    if (!type || !settings) {
      return res.status(400).json({ success: false, message: "Type and settings are required" });
    }

    const validTypes = ["certificate", "report", "report-card", "id-card"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${validTypes.join(", ")}` });
    }

    const existing = await prisma.designerSettings.findFirst({
      where: { tenantId, type },
    });

    let result;
    if (existing) {
      result = await prisma.designerSettings.update({
        where: { id: existing.id },
        data: { settings },
      });
    } else {
      result = await prisma.designerSettings.create({
        data: { tenantId, type, settings },
      });
    }

    res.json({ success: true, data: result, message: "Designer settings saved successfully!" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// DEFAULT SETTINGS PER TYPE
// ============================================================
function getDefaultSettings(type: string) {
  const defaults: Record<string, any> = {
    certificate: {
      primaryColor: "#1e40af",
      secondaryColor: "#f59e0b",
      fontFamily: "serif",
      showLogo: true,
      showName: true,
      borderColor: "#d4af37",
      footerText: "",
    },
    report: {
      primaryColor: "#4f46e5",
      secondaryColor: "#6366f1",
      fontFamily: "sans-serif",
      showLogo: true,
      showName: true,
      headerColor: "#4f46e5",
      tableHeaderColor: "#f3f4f6",
      footerText: "",
    },
    "report-card": {
      primaryColor: "#4f46e5",
      secondaryColor: "#10b981",
      fontFamily: "sans-serif",
      showLogo: true,
      showName: true,
      headerBgColor: "#1e3a5f",
      gradeColorScheme: "green",
      borderStyle: "solid",
      showWatermark: false,
      footerText: "",
    },
    "id-card": {
      primaryColor: "#1e3a5f",
      secondaryColor: "#ffffff",
      fontFamily: "sans-serif",
      showLogo: true,
      showName: true,
      bgColor: "#1e3a5f",
      textColor: "#ffffff",
      borderRadius: "12px",
      showPhotoBorder: true,
      orientation: "portrait",
      footerText: "",
    },
  };
  return defaults[type] || defaults.certificate;
}
