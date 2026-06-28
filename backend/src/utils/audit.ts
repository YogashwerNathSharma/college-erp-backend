import prisma from "./prisma";

export const createAuditLog = async ({
  action,
  entity,
  entityId,
  userId,
  tenantId,
  data
}: {
  action: string;
  entity: string;
  entityId: string;
  userId?: string;
  tenantId?: string;
  data?: any;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        tenantId: tenantId || "system",
        data
      }
    });
  } catch (err) {
    console.error("Audit log failed", err);
  }
};