
import { PrismaClient } from "@prisma/client";
import { uploadToCloudinary, deleteFromCloudinary } from "../../config/cloudinary";

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
    throw new Error("Student not found");
  }

  // Delete old photo from Cloudinary if exists
  if (student.photoUrl && student.photoUrl.startsWith("http")) {
    await deleteFromCloudinary(student.photoUrl);
  }

  // Upload to Cloudinary
  const photoUrl = await uploadToCloudinary(file.buffer, "students/photos");

  // Update student record
  await prisma.student.update({
    where: { id: studentId },
    data: { photoUrl },
  });

  return { photoUrl };
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
    throw new Error("Student not found");
  }

  // Upload to Cloudinary
  const docUrl = await uploadToCloudinary(file.buffer, "students/documents");

  // Create document record
  const document = await prisma.studentDocument.create({
    data: {
      student: { connect: { id: studentId } },
      tenant: { connect: { id: tenantId } },
      type,
      name: name || file.originalname,
      url: docUrl,
    },
  });

  return document;
};

// ============================================
// GET STUDENT DOCUMENTS
// ============================================
export const getStudentDocuments = async (
  studentId: string,
  tenantId: string
) => {
  return prisma.studentDocument.findMany({
    where: { studentId, tenantId },
  });
};

// ============================================
// DELETE STUDENT DOCUMENT
// ============================================
export const deleteStudentDocument = async (
  docId: string,
  tenantId: string
) => {
  const doc = await prisma.studentDocument.findFirst({
    where: { id: docId, tenantId },
  });

  if (!doc) throw new Error("Document not found");

  // Delete from Cloudinary
  if (doc.url && doc.url.startsWith("http")) {
    await deleteFromCloudinary(doc.url);
  }

  await prisma.studentDocument.delete({ where: { id: docId } });
  return { success: true };
};

// ============================================
// DELETE STUDENT PHOTO
// ============================================
export const deleteStudentPhoto = async (
  studentId: string,
  tenantId: string
) => {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
  });

  if (!student) throw new Error("Student not found");

  // Delete from Cloudinary
  if (student.photoUrl && student.photoUrl.startsWith("http")) {
    await deleteFromCloudinary(student.photoUrl);
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { photoUrl: null },
  });

  return { success: true };
};
