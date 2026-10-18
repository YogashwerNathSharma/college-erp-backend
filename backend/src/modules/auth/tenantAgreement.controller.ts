import { Request, Response } from "express";
import prisma from "../../utils/prisma";

export const TENANT_AGREEMENT_VERSION = "1.0";
export const TENANT_AGREEMENT_TITLE = "YN Software School ERP SaaS Subscription & License Agreement";

export const acceptTenantAgreement = async (req: Request, res: Response) => {
  try {
    const { tenantId, name, email, agreementVersion } = req.body || {};

    if (!tenantId || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "Tenant ID, name and email are required to accept the agreement.",
      });
    }

    if (agreementVersion && agreementVersion !== TENANT_AGREEMENT_VERSION) {
      return res.status(400).json({
        success: false,
        message: "This agreement version is no longer current. Please refresh and try again.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, tenantId: String(tenantId) },
      select: { id: true, name: true, email: true, tenantId: true, role: true },
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "The registered administrator could not be verified for this tenant.",
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: String(tenantId) },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return res.status(404).json({ success: false, message: "Tenant not found." });
    }

    const forwarded = req.headers["x-forwarded-for"];
    const ipAddress = typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.ip || req.socket.remoteAddress || null;

    const existing = await prisma.tenantAgreement.findFirst({
      where: { tenantId: String(tenantId), agreementVersion: TENANT_AGREEMENT_VERSION },
    });

    const agreementData = {
      tenantId: String(tenantId),
      agreementVersion: TENANT_AGREEMENT_VERSION,
      agreementTitle: TENANT_AGREEMENT_TITLE,
      acceptedAt: new Date(),
      acceptedByName: String(name).trim(),
      acceptedByEmail: normalizedEmail,
      acceptedByUserId: user.id,
      acceptedIp: ipAddress,
      userAgent: req.get("user-agent") || null,
    };

    const agreement = existing
      ? await prisma.tenantAgreement.update({ where: { id: existing.id }, data: agreementData })
      : await prisma.tenantAgreement.create({ data: agreementData });

    return res.status(200).json({
      success: true,
      message: "Tenant agreement accepted and recorded successfully.",
      agreement: {
        id: agreement.id,
        version: agreement.agreementVersion,
        acceptedAt: agreement.acceptedAt,
        tenantId: tenant.id,
        tenantName: tenant.name,
      },
    });
  } catch (error: any) {
    console.error("Tenant agreement acceptance failed:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to record tenant agreement acceptance.",
    });
  }
};

export const getTenantAgreementStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = String(req.query.tenantId || "").trim();
    if (!tenantId) return res.status(400).json({ success: false, message: "Tenant ID is required." });

    const agreement = await prisma.tenantAgreement.findFirst({
      where: { tenantId, agreementVersion: TENANT_AGREEMENT_VERSION },
      select: {
        id: true,
        agreementVersion: true,
        agreementTitle: true,
        acceptedAt: true,
        acceptedByName: true,
        acceptedByEmail: true,
      },
    });

    return res.json({ success: true, version: TENANT_AGREEMENT_VERSION, agreement: agreement || null });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || "Unable to fetch agreement status." });
  }
};
