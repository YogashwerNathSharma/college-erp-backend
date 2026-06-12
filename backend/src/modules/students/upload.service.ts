
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// ============================================
// UPLOAD STUDENT PHOTO
// ============================================
export const uploadStudentPhoto = async (
  studentId: string,
  tenantId: string,
  file: Express.Multer.File
) => {
  // Verify student belongs to tenant
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
  });

  if (!student) {
    // Delete uploaded file
    fs.unlinkSync(file.path);
    throw new Error("Student not found");
  }

  // Delete old photo file if exists
  if (student.photoUrl) {
    const oldPath = path.join(__dirname, "../../../uploads", student.photoUrl);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  // Save relative path
  const photoUrl = `photos/${file.filename}`;

  // Update student record
  await prisma.student.update({
    where: { id: studentId },
    data: { photoUrl },
  });

  return { photoUrl, filename: file.filename };
};

// ============================================
// UPLOAD STUDENT DOCUMENT
// ============================================
export const uploadStudentDocument = async (
  studentId: string,
  tenantId: string,
  file: Express.Multer.File,
  type: string = "other",
  name?: string
) => {
  // Verify student
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
  });

  if (!student) {
    fs.unlinkSync(file.path);
    throw new Error("Student not found");
  }

  const docUrl = `documents/${file.filename}`;

  // Create document record
  const document = await prisma.studentDocument.create({
    data: {
      student: { connect: { id: studentId } },
      tenantId,
      type,
      name: name || file.originalname,
      url: docUrl,
      mimeType: file.mimetype,
      size: file.size,
    },
  });

  return document;
};

// ============================================
// GET STUDENT DOCUMENTS
// ============================================
export const getStudentDocuments = async (studentId: string, tenantId: string) => {
  return prisma.studentDocument.findMany({
    where: { studentId, tenantId, isDeleted: false },
    orderBy: { uploadedAt: "desc" },
  });
};

// ============================================
// DELETE STUDENT DOCUMENT
// ============================================
export const deleteStudentDocument = async (
  documentId: string,
  tenantId: string
) => {
  const doc = await prisma.studentDocument.findFirst({
    where: { id: documentId, tenantId, isDeleted: false },
  });

  if (!doc) throw new Error("Document not found");

  // Delete file from disk
  const filePath = path.join(__dirname, "../../../uploads", doc.url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Soft delete record
  await prisma.studentDocument.update({
    where: { id: documentId },
    data: { isDeleted: true },
  });

  return { success: true };
};

// ============================================
// DELETE STUDENT PHOTO
// ============================================
export const deleteStudentPhoto = async (studentId: string, tenantId: string) => {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
  });

  if (!student) throw new Error("Student not found");

  if (student.photoUrl) {
    const filePath = path.join(__dirname, "../../../uploads", student.photoUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { photoUrl: null },
  });

  return { success: true };
};
