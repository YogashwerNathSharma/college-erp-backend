import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { createCanvas } from "canvas";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════
// QR CODE & BARCODE CONTROLLER
// ══════════════════════════════════════════════════

/**
 * Generate QR Code for an entity
 * POST /api/qr/generate
 */
export const generateQR = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { entityType, entityId, data, format = "QR", size = 200 } = req.body;

    if (!entityType || !entityId || !data) {
      return res.status(400).json({
        success: false,
        message: "entityType, entityId, and data are required",
      });
    }

    // Check if QR already exists for this entity
    const existing = await prisma.qRCode.findFirst({
      where: { tenantId, entityType, entityId, isActive: true },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "QR code already exists",
        data: existing,
      });
    }

    // Generate QR image
    const uploadsDir = path.join(__dirname, "../../../uploads/qr");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let qrImageUrl: string | null = null;
    let barcodeImageUrl: string | null = null;

    if (format === "QR" || format === "BOTH") {
      const qrFileName = `qr_${tenantId}_${entityType}_${entityId}_${Date.now()}.png`;
      const qrPath = path.join(uploadsDir, qrFileName);
      await QRCode.toFile(qrPath, data, {
        width: size,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      qrImageUrl = `/uploads/qr/${qrFileName}`;
    }

    if (format === "BARCODE" || format === "BOTH") {
      const canvas = createCanvas(300, 100);
      JsBarcode(canvas, data, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
      });
      const barcodeFileName = `barcode_${tenantId}_${entityType}_${entityId}_${Date.now()}.png`;
      const barcodePath = path.join(uploadsDir, barcodeFileName);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(barcodePath, buffer);
      barcodeImageUrl = `/uploads/qr/${barcodeFileName}`;
    }

    const qrCode = await prisma.qRCode.create({
      data: {
        tenantId,
        entityType,
        entityId,
        data,
        format,
        size,
        qrImageUrl,
        barcodeImageUrl,
      },
    });

    return res.status(201).json({
      success: true,
      message: "QR/Barcode generated successfully",
      data: qrCode,
    });
  } catch (error: any) {
    console.error("Generate QR error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Scan & decode QR/barcode
 * POST /api/qr/scan
 */
export const scanQR = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name || "Unknown";
    const { data, purpose, location, deviceInfo } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Scanned data is required",
      });
    }

    // Find the QR code record
    const qrCode = await prisma.qRCode.findFirst({
      where: { tenantId, data, isActive: true },
    });

    // Log the scan
    const scanLog = await prisma.qRScanLog.create({
      data: {
        tenantId,
        qrCodeId: qrCode?.id,
        data,
        scannedBy: userId,
        scannedByName: userName,
        purpose,
        location,
        deviceInfo,
      },
    });

    // Update scan count
    if (qrCode) {
      await prisma.qRCode.update({
        where: { id: qrCode.id },
        data: {
          scannedCount: { increment: 1 },
          lastScannedAt: new Date(),
          lastScannedBy: userId,
        },
      });
    }

    // Resolve entity details
    let entityDetails: any = null;
    if (qrCode) {
      entityDetails = await resolveEntity(
        tenantId,
        qrCode.entityType,
        qrCode.entityId
      );
    }

    return res.status(200).json({
      success: true,
      message: qrCode ? "QR code recognized" : "Unknown QR code",
      data: {
        scanLog,
        qrCode,
        entity: entityDetails,
        recognized: !!qrCode,
      },
    });
  } catch (error: any) {
    console.error("Scan QR error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get QR for specific entity
 * GET /api/qr/entity/:type/:id
 */
export const getEntityQR = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const entityType = req.params.type as string;
    const entityId = req.params.id as string;

    const qrCode = await prisma.qRCode.findFirst({
      where: { tenantId, entityType, entityId, isActive: true },
    });

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR code not found for this entity",
      });
    }

    return res.status(200).json({ success: true, data: qrCode });
  } catch (error: any) {
    console.error("Get entity QR error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Bulk generate QR codes
 * POST /api/qr/bulk-generate
 */
export const bulkGenerateQR = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { entityType, entityIds, dataTemplate, format = "QR", size = 200 } = req.body;

    if (!entityType || !entityIds?.length) {
      return res.status(400).json({
        success: false,
        message: "entityType and entityIds[] are required",
      });
    }

    const uploadsDir = path.join(__dirname, "../../../uploads/qr");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const results: any[] = [];
    let successCount = 0;
    let skipCount = 0;

    for (const entityId of entityIds) {
      // Check if already exists
      const existing = await prisma.qRCode.findFirst({
        where: { tenantId, entityType, entityId, isActive: true },
      });

      if (existing) {
        results.push({ entityId, status: "skipped", qrCode: existing });
        skipCount++;
        continue;
      }

      // Build data string
      const data = dataTemplate
        ? dataTemplate.replace("{entityId}", entityId).replace("{tenantId}", tenantId)
        : `${tenantId}:${entityType}:${entityId}`;

      let qrImageUrl: string | null = null;
      let barcodeImageUrl: string | null = null;

      // Generate QR
      if (format === "QR" || format === "BOTH") {
        const qrFileName = `qr_${tenantId}_${entityType}_${entityId}_${Date.now()}.png`;
        const qrPath = path.join(uploadsDir, qrFileName);
        await QRCode.toFile(qrPath, data, { width: size, margin: 2 });
        qrImageUrl = `/uploads/qr/${qrFileName}`;
      }

      // Generate Barcode
      if (format === "BARCODE" || format === "BOTH") {
        const canvas = createCanvas(300, 100);
        JsBarcode(canvas, data.substring(0, 40), {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
        });
        const barcodeFileName = `barcode_${tenantId}_${entityType}_${entityId}_${Date.now()}.png`;
        const barcodePath = path.join(uploadsDir, barcodeFileName);
        fs.writeFileSync(barcodePath, canvas.toBuffer("image/png"));
        barcodeImageUrl = `/uploads/qr/${barcodeFileName}`;
      }

      const qrCode = await prisma.qRCode.create({
        data: { tenantId, entityType, entityId, data, format, size, qrImageUrl, barcodeImageUrl },
      });

      results.push({ entityId, status: "generated", qrCode });
      successCount++;
    }

    return res.status(201).json({
      success: true,
      message: `Generated: ${successCount}, Skipped: ${skipCount}`,
      data: { results, successCount, skipCount, total: entityIds.length },
    });
  } catch (error: any) {
    console.error("Bulk generate QR error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get scan history
 * GET /api/qr/scan-logs
 */
export const getScanLogs = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const purpose = req.query.purpose as string;

    const where: any = { tenantId };
    if (purpose) where.purpose = purpose;

    const [logs, total] = await Promise.all([
      prisma.qRScanLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.qRScanLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { logs, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("Get scan logs error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete QR code (soft delete)
 * DELETE /api/qr/:id
 */
export const deleteQR = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const id = req.params.id as string;

    await prisma.qRCode.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });

    return res.status(200).json({ success: true, message: "QR code deactivated" });
  } catch (error: any) {
    console.error("Delete QR error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get QR stats dashboard
 * GET /api/qr/stats
 */
export const getQRStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalQR, activeQR, scansToday, scansByType] = await Promise.all([
      prisma.qRCode.count({ where: { tenantId } }),
      prisma.qRCode.count({ where: { tenantId, isActive: true } }),
      prisma.qRScanLog.count({ where: { tenantId, createdAt: { gte: today } } }),
      prisma.qRCode.groupBy({
        by: ["entityType"],
        where: { tenantId, isActive: true },
        _count: true,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalQR,
        activeQR,
        scansToday,
        scansByType: scansByType.map((s) => ({ type: s.entityType, count: s._count })),
      },
    });
  } catch (error: any) {
    console.error("QR stats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Helper: Resolve entity details ──
async function resolveEntity(tenantId: string, entityType: string, entityId: string) {
  try {
    switch (entityType) {
      case "STUDENT_ID":
        return await prisma.student.findFirst({ where: { id: entityId, tenantId } });
      case "STAFF_ID":
        return await prisma.teacher.findFirst({ where: { id: entityId, tenantId } });
      case "BOOK":
        return await prisma.book.findFirst({ where: { id: entityId, tenantId } });
      case "ASSET":
        return await prisma.asset.findFirst({ where: { id: entityId, tenantId } });
      default:
        return null;
    }
  } catch {
    return null;
  }
}
