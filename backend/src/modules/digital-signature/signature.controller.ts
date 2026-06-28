import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════
// DIGITAL SIGNATURE CONTROLLER
// ══════════════════════════════════════════════════

/**
 * Generate a unique 8-character verification code
 */
function generateVerificationCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Generate SHA-256 hash
 */
function generateHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Upload/Create signature
 * POST /api/signatures/upload
 */
export const uploadSignature = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const {
      name,
      designation,
      department,
      signatureImage,
      stampImage,
      initialsImage,
      signatureType = "DRAWN",
      isDefault = false,
    } = req.body;

    if (!name || !designation || !signatureImage) {
      return res.status(400).json({
        success: false,
        message: "name, designation, and signatureImage are required",
      });
    }

    // If setting as default, unset other defaults for this user
    if (isDefault) {
      await prisma.digitalSignature.updateMany({
        where: { tenantId, userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Save signature image if base64
    let savedSignatureUrl = signatureImage;
    if (signatureImage.startsWith("data:image")) {
      const uploadsDir = path.join(__dirname, "../../../uploads/signatures");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const base64Data = signatureImage.replace(/^data:image\/\w+;base64,/, "");
      const fileName = `sig_${tenantId}_${userId}_${Date.now()}.png`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, base64Data, "base64");
      savedSignatureUrl = `/uploads/signatures/${fileName}`;
    }

    let savedStampUrl = stampImage;
    if (stampImage?.startsWith("data:image")) {
      const uploadsDir = path.join(__dirname, "../../../uploads/signatures");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const base64Data = stampImage.replace(/^data:image\/\w+;base64,/, "");
      const fileName = `stamp_${tenantId}_${userId}_${Date.now()}.png`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, base64Data, "base64");
      savedStampUrl = `/uploads/signatures/${fileName}`;
    }

    const signature = await prisma.digitalSignature.create({
      data: {
        tenantId,
        userId,
        name,
        designation,
        department,
        signatureImage: savedSignatureUrl,
        stampImage: savedStampUrl,
        initialsImage,
        signatureType,
        isDefault,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Signature uploaded successfully",
      data: signature,
    });
  } catch (error: any) {
    console.error("Upload signature error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List all signatures
 * GET /api/signatures
 */
export const listSignatures = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.query.userId as string;

    const where: any = { tenantId, isActive: true };
    if (userId) where.userId = userId;

    const signatures = await prisma.digitalSignature.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return res.status(200).json({ success: true, data: signatures });
  } catch (error: any) {
    console.error("List signatures error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a specific signature
 * GET /api/signatures/:id
 */
export const getSignature = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const id = req.params.id as string;

    const signature = await prisma.digitalSignature.findFirst({
      where: { id, tenantId },
    });

    if (!signature) {
      return res.status(404).json({ success: false, message: "Signature not found" });
    }

    return res.status(200).json({ success: true, data: signature });
  } catch (error: any) {
    console.error("Get signature error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Sign a document
 * POST /api/signatures/sign/:documentId
 */
export const signDocument = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name;
    const documentId = req.params.documentId as string;
    const { documentType, documentTitle, signatureId, documentContent } = req.body;

    if (!documentType || !signatureId) {
      return res.status(400).json({
        success: false,
        message: "documentType and signatureId are required",
      });
    }

    // Get the signature
    const signature = await prisma.digitalSignature.findFirst({
      where: { id: signatureId, tenantId, isActive: true },
    });

    if (!signature) {
      return res.status(404).json({ success: false, message: "Signature not found or inactive" });
    }

    // Generate hash from document content
    const hash = generateHash(documentContent || `${documentId}:${documentType}:${Date.now()}`);
    const verificationCode = generateVerificationCode();

    // Generate QR data for verification
    const qrData = `${process.env.FRONTEND_URL || "https://erp.example.com"}/verify/${verificationCode}`;

    const signedDoc = await prisma.signedDocument.create({
      data: {
        tenantId,
        documentId,
        documentType,
        documentTitle,
        signatureId,
        signedBy: userId,
        signerName: signature.name,
        signerDesignation: signature.designation,
        hash,
        verificationCode,
        qrData,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Document signed successfully",
      data: {
        signedDocument: signedDoc,
        verificationCode,
        verificationUrl: qrData,
        signature: {
          name: signature.name,
          designation: signature.designation,
          image: signature.signatureImage,
          stamp: signature.stampImage,
        },
      },
    });
  } catch (error: any) {
    console.error("Sign document error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify a signed document
 * GET /api/signatures/verify/:code
 * (Public endpoint - no auth required)
 */
export const verifySignature = async (req: Request, res: Response) => {
  try {
    const code = req.params.code as string;

    const signedDoc = await prisma.signedDocument.findFirst({
      where: { verificationCode: code },
      include: {
        signature: {
          select: { name: true, designation: true, department: true },
        },
      },
    });

    if (!signedDoc) {
      return res.status(404).json({
        success: false,
        message: "Invalid verification code. Document not found.",
        verified: false,
      });
    }

    if (!signedDoc.isValid) {
      return res.status(200).json({
        success: true,
        verified: false,
        message: "This signature has been revoked.",
        data: {
          revokedAt: signedDoc.revokedAt,
          revokeReason: signedDoc.revokeReason,
        },
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      message: "Document signature is valid ✓",
      data: {
        documentType: signedDoc.documentType,
        documentTitle: signedDoc.documentTitle,
        signedBy: signedDoc.signerName,
        designation: signedDoc.signerDesignation,
        signedAt: signedDoc.signedAt,
        verificationCode: signedDoc.verificationCode,
        hash: signedDoc.hash,
      },
    });
  } catch (error: any) {
    console.error("Verify signature error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Revoke a signature
 * POST /api/signatures/revoke/:signedDocId
 */
export const revokeSignature = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const signedDocId = req.params.signedDocId as string;
    const { reason } = req.body;

    const updated = await prisma.signedDocument.updateMany({
      where: { id: signedDocId, tenantId },
      data: { isValid: false, revokedAt: new Date(), revokeReason: reason || "Admin revoked" },
    });

    if (updated.count === 0) {
      return res.status(404).json({ success: false, message: "Signed document not found" });
    }

    return res.status(200).json({ success: true, message: "Signature revoked" });
  } catch (error: any) {
    console.error("Revoke signature error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a signature
 * DELETE /api/signatures/:id
 */
export const deleteSignature = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const id = req.params.id as string;

    await prisma.digitalSignature.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });

    return res.status(200).json({ success: true, message: "Signature deactivated" });
  } catch (error: any) {
    console.error("Delete signature error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get signed documents list
 * GET /api/signatures/documents
 */
export const getSignedDocuments = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const documentType = req.query.type as string;

    const where: any = { tenantId };
    if (documentType) where.documentType = documentType;

    const [documents, total] = await Promise.all([
      prisma.signedDocument.findMany({
        where,
        orderBy: { signedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          signature: { select: { name: true, designation: true } },
        },
      }),
      prisma.signedDocument.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { documents, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("Get signed documents error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
