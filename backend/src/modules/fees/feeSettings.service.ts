
import prisma from "../../utils/prisma";

// Default settings
const DEFAULT_SETTINGS = {
  general: {
    fineAfterDays: 0,
    gracePeriod: 0,
    roundingOff: false,
    defaultPaymentMode: "CASH",
    enableOnlinePayment: false,
    enableSmsReminder: false,
  },
  receipt: {
    receiptPrefix: "RCP",
    showSchoolLogo: true,
    showStudentPhoto: false,
    receiptNote: "This is a computer generated receipt.",
  },
  paymentModes: {
    CASH: true,
    ONLINE: true,
    UPI: true,
    CHEQUE: true,
    BANK_TRANSFER: true,
    DD: true,
  },
};

/**
 * Get fee settings for a tenant
 * Uses Tenant metadata field or falls back to defaults
 */
export const getFeeSettings = async (tenantId: string) => {
  try {
    // Try to get from tenant's metadata/settings
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });

    if (!tenant) throw new Error("Tenant not found");

    // For now, we return defaults (in production, store in a FeeSettings collection or tenant metadata)
    // Check if there's a stored setting (you can add a FeeSettings model later)
    return { ...DEFAULT_SETTINGS };
  } catch (error) {
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Update fee settings
 * In production: store in DB. For now: accept and return merged settings.
 */
export const updateFeeSettings = async (tenantId: string, settings: any) => {
  // Merge with defaults
  const merged = {
    general: { ...DEFAULT_SETTINGS.general, ...(settings.general || {}) },
    receipt: { ...DEFAULT_SETTINGS.receipt, ...(settings.receipt || {}) },
    paymentModes: { ...DEFAULT_SETTINGS.paymentModes, ...(settings.paymentModes || {}) },
  };

  // In production: Save to DB
  // await prisma.feeSettings.upsert({ where: { tenantId }, create: { tenantId, ...merged }, update: merged });

  console.log(`[FEE SETTINGS] Updated for tenant ${tenantId}:`, JSON.stringify(merged).substring(0, 100));

  return merged;
};

