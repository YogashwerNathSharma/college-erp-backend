
import { PrismaClient } from "@prisma/client";
import { uploadToCloudinary, deleteFromCloudinary } from "../../config/cloudinary";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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

  // Validate file size: min 39KB, max 2MB
  if (file.size < 39 * 1024) {
    throw new Error("Photo too small. Minimum 39KB required for clear print quality.");
  }

  // Delete old photo from Cloudinary if exists
  if (student.photoUrl && student.photoUrl.startsWith("http")) {
    await deleteFromCloudinary(student.photoUrl);
  }

  // Upload to Cloudinary OR save locally if Cloudinary not configured
  let photoUrl: string;

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    // Cloudinary configured — upload there
    photoUrl = await uploadToCloudinary(file.buffer, "students/photos");
  } else {
    // Local fallback — save to /uploads/students/photos/
    const uploadsDir = path.resolve(__dirname, "../../../uploads/students/photos");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = path.extname(file.originalname) || ".jpg";
    const filename = `${studentId}_${crypto.randomBytes(4).toString("hex")}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, file.buffer);
    // Serve via /uploads/ static route
    photoUrl = `/uploads/students/photos/${filename}`;
  }

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
