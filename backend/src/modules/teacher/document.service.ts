

import prisma from "../../utils/prisma";

//////////////////////////////////////////////////////
// UPLOAD DOCUMENT
//////////////////////////////////////////////////////
export const uploadDocument = async (data: any, tenantId: string) => {
  // Validate teacher
  const teacher = await prisma.teacher.findFirst({
    where: { id: data.teacherId, tenantId, isDeleted: false },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  const document = await prisma.teacherDocument.create({
    data: {
      teacherId: data.teacherId,
      name: data.name,
      type: data.type,
      fileUrl: data.fileUrl,
      tenantId,
    },
  });

  return document;
};

//////////////////////////////////////////////////////
// GET DOCUMENTS BY TEACHER
//////////////////////////////////////////////////////
export const getDocuments = async (teacherId: string, tenantId: string) => {
  const documents = await prisma.teacherDocument.findMany({
    where: {
      teacherId,
      tenantId,
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
  });

  return documents;
};

//////////////////////////////////////////////////////
// GET ALL DOCUMENTS
//////////////////////////////////////////////////////
export const getAllDocuments = async (tenantId: string) => {
  const documents = await prisma.teacherDocument.findMany({
    where: {
      tenantId,
      isDeleted: false,
    },
    include: {
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return documents;
};

//////////////////////////////////////////////////////
// DELETE DOCUMENT (soft)
//////////////////////////////////////////////////////
export const deleteDocument = async (id: string, tenantId: string) => {
  const doc = await prisma.teacherDocument.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!doc) {
    throw new Error("Document not found");
  }

  await prisma.teacherDocument.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};
