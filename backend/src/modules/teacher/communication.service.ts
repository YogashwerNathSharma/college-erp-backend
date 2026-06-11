

import prisma from "../../utils/prisma";
import { getPagination, buildPaginationMeta } from "../../utils/pagination";

//////////////////////////////////////////////////////
// CREATE COMMUNICATION / NOTICE
//////////////////////////////////////////////////////
export const createCommunication = async (data: any, tenantId: string) => {
  if (!data.title || !data.message) {
    throw new Error("Title and message are required");
  }

  const communication = await prisma.communication.create({
    data: {
      title: data.title,
      message: data.message,
      senderType: data.senderType || "ADMIN",
      senderName: data.senderName,
      tenantId,
    },
  });

  return communication;
};

//////////////////////////////////////////////////////
// GET ALL COMMUNICATIONS
//////////////////////////////////////////////////////
export const getCommunications = async (query: any, tenantId: string) => {
  const { skip, limit, page } = getPagination(query);

  const [communications, total] = await Promise.all([
    prisma.communication.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.communication.count({
      where: { tenantId, isDeleted: false },
    }),
  ]);

  return {
    data: communications,
    meta: buildPaginationMeta(total, page, limit),
  };
};

//////////////////////////////////////////////////////
// DELETE COMMUNICATION (soft)
//////////////////////////////////////////////////////
export const deleteCommunication = async (id: string, tenantId: string) => {
  const comm = await prisma.communication.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!comm) {
    throw new Error("Communication not found");
  }

  await prisma.communication.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

