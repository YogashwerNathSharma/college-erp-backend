import prisma from "./prisma";

export const createAuditLog = async ({
  action,
  entity,
  entityId,
  userId,
  data
}: {
  action: string;
  entity: string;
  entityId: string;
  userId?: string;
  data?: any;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        data
      }
    });
  } catch (err) {
    console.error("Audit log failed", err);
  }
};