import { Request, Response, NextFunction } from "express";

const CURRENT_TENANT_AGREEMENT_VERSION = "1.0";

/**
 * Registration must never be allowed unless the institution explicitly accepted
 * the current SaaS agreement in the registration UI.
 *
 * The actual agreement record is written by /tenant-agreement/accept after the
 * tenant/admin are created, where the new tenant ID and verified admin user exist.
 */
export const requireTenantAgreementAcceptance = (req: Request, res: Response, next: NextFunction) => {
  const accepted = String(req.body?.agreementAccepted || "").toLowerCase() === "true";
  const version = String(req.body?.agreementVersion || "").trim();

  if (!accepted) {
    return res.status(400).json({
      success: false,
      code: "TENANT_AGREEMENT_REQUIRED",
      message: "You must read and accept the current YN Software School ERP SaaS Subscription & License Agreement before registration.",
    });
  }

  if (version !== CURRENT_TENANT_AGREEMENT_VERSION) {
    return res.status(400).json({
      success: false,
      code: "TENANT_AGREEMENT_VERSION_MISMATCH",
      message: "The SaaS agreement version is outdated. Please refresh the registration page and accept the current agreement.",
      currentAgreementVersion: CURRENT_TENANT_AGREEMENT_VERSION,
    });
  }

  return next();
};
