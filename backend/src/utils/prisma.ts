import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//////////////////////////
// SOFT DELETE FILTER
//////////////////////////
prisma.$use(async (params, next) => {
  const modelsWithSoftDelete = ["Student", "Teacher", "FeeStructure"];

  if (
    (params.action === "findMany" || params.action === "findFirst") &&
    modelsWithSoftDelete.includes(params.model || "")
  ) {
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};

    if (!("isDeleted" in params.args.where)) {
      params.args.where.isDeleted = false;
    }
  }

  return next(params);
});

//////////////////////////
// AUTO AUDIT LOG
//////////////////////////
prisma.$use(async (params, next) => {
  const result = await next(params);

  // ❌ prevent infinite loop
  if (params.model === "AuditLog") return result;

  const actions = ["create", "update", "delete"];

  if (actions.includes(params.action)) {
    try {
      let actionType = params.action.toUpperCase();

      // 🔥 detect soft delete
      if (
        params.action === "update" &&
        params.args?.data?.isDeleted === true
      ) {
        actionType = "DELETE";
      }

      await prisma.auditLog.create({
        data: {
          action: actionType,
          entity: params.model || "UNKNOWN",
          entityId: result?.id || "",
          data: params.args?.data || {},
        },
      });
    } catch (err) {
      console.error("Auto audit failed", err);
    }
  }

  return result;
});

export default prisma;