import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// GET /api/templates?tenantId=xxx&type=yyy
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { tenantId, type } = req.query;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: "tenantId is required" });
    }

    const where: any = {
      tenantId: tenantId as string,
      isDeleted: false,
    };

    if (type && type !== "all") {
      where.type = type as string;
    }

    const templates = await prisma.designTemplate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        category: true,
        pageWidth: true,
        pageHeight: true,
        orientation: true,
        thumbnail: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: templates, count: templates.length });
  } catch (error: any) {
    console.error("getTemplates error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/templates/:id
export const getTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.designTemplate.findFirst({
      where: { id, isDeleted: false },
    });

    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    res.json({ success: true, data: template });
  } catch (error: any) {
    console.error("getTemplate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/templates
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, type, category, canvasJSON, pageWidth, pageHeight, orientation, tenantId, thumbnail } = req.body;

    if (!name || !type || !tenantId) {
      return res.status(400).json({ success: false, message: "name, type, and tenantId are required" });
    }

    const template = await prisma.designTemplate.create({
      data: {
        name,
        type,
        category: category || null,
        canvasJSON: canvasJSON || {},
        pageWidth: pageWidth || 794,
        pageHeight: pageHeight || 1123,
        orientation: orientation || "portrait",
        tenantId,
        thumbnail: thumbnail || null,
      },
    });

    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    console.error("createTemplate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/templates/:id
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, category, canvasJSON, pageWidth, pageHeight, orientation, thumbnail } = req.body;

    const existing = await prisma.designTemplate.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    const template = await prisma.designTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(category !== undefined && { category }),
        ...(canvasJSON && { canvasJSON }),
        ...(pageWidth && { pageWidth }),
        ...(pageHeight && { pageHeight }),
        ...(orientation && { orientation }),
        ...(thumbnail !== undefined && { thumbnail }),
      },
    });

    res.json({ success: true, data: template });
  } catch (error: any) {
    console.error("updateTemplate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/templates/:id
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.designTemplate.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    await prisma.designTemplate.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json({ success: true, message: "Template deleted" });
  } catch (error: any) {
    console.error("deleteTemplate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/templates/:id/duplicate
export const duplicateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.designTemplate.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    const duplicate = await prisma.designTemplate.create({
      data: {
        name: `${existing.name} (Copy)`,
        type: existing.type,
        category: existing.category,
        canvasJSON: existing.canvasJSON as any,
        pageWidth: existing.pageWidth,
        pageHeight: existing.pageHeight,
        orientation: existing.orientation,
        tenantId: existing.tenantId,
        thumbnail: existing.thumbnail,
      },
    });

    res.status(201).json({ success: true, data: duplicate });
  } catch (error: any) {
    console.error("duplicateTemplate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/templates/:id/render
export const renderTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = req.body; // Student/Exam/Fee data object

    const template = await prisma.designTemplate.findFirst({
      where: { id, isDeleted: false },
    });

    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    // Replace placeholders in canvas JSON
    let canvasStr = JSON.stringify(template.canvasJSON);
    
    if (data) {
      Object.keys(data).forEach((key) => {
        const placeholder = `{{${key}}}`;
        const value = data[key] || "";
        canvasStr = canvasStr.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
      });
    }

    const renderedCanvas = JSON.parse(canvasStr);

    res.json({ success: true, data: { ...template, canvasJSON: renderedCanvas } });
  } catch (error: any) {
    console.error("renderTemplate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
