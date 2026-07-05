import prisma from "../../config/prisma";
import { generateTCData } from "./helpers/tc.helper";
import { generateCharacterCertData } from "./helpers/character.helper";
import { generateMigrationCertData } from "./helpers/migration.helper";

// ============================================
// TRANSFER CERTIFICATE
// ============================================

export const generateTC = async (data: any, tenantId: string, generatedBy: string) => {
  const { studentId, reason, lastAttendanceDate, remarks, character, conduct } = data;

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    include: {
      enrollments: {
        where: { isDeleted: false, status: "active" },
        include: { class: true, section: true, academicYear: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!student) throw new Error("Student not found");

  // Generate TC number
  const tcCount = await prisma.transferCertificate.count({ where: { tenantId } });
  const tcNumber = `TC-${new Date().getFullYear()}-${String(tcCount + 1).padStart(4, "0")}`;

  const tc = await prisma.transferCertificate.create({
    data: {
      tcNumber,
      studentId,
      tenantId,
      reason,
      lastAttendanceDate: lastAttendanceDate ? new Date(lastAttendanceDate) : new Date(),
      remarks,
      generatedBy: generatedBy || "system",
      status: "DRAFT",
      conductAndCharacter: `${character || "Good"} / ${conduct || "Good"}`,
      dateOfLeaving: lastAttendanceDate ? new Date(lastAttendanceDate) : new Date(),
      dateOfAdmission: student.admissionDate || student.createdAt,
      classAtLeaving: student.enrollments?.[0]?.class?.name || "N/A",
      generalRemarks: remarks || null,
    },
  });

  return tc;
};

export const getTCById = async (id: string, tenantId: string) => {
  return prisma.transferCertificate.findFirst({
    where: { id, tenantId },
    include: { student: true },
  });
};

export const getAllTCs = async (tenantId: string, filters?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { tcNumber: { contains: filters.search, mode: "insensitive" } },
      { student: { firstName: { contains: filters.search, mode: "insensitive" } } },
      { student: { admissionNo: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const [tcs, total] = await Promise.all([
    prisma.transferCertificate.findMany({
      where,
      include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.transferCertificate.count({ where }),
  ]);

  return { tcs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const approveTC = async (id: string, tenantId: string, approvedBy: string) => {
  const tc = await prisma.transferCertificate.findFirst({ where: { id, tenantId } });
  if (!tc) throw new Error("TC not found");
  if (tc.status === "APPROVED") throw new Error("TC is already approved");

  // Update student status to tc_issued
  await prisma.student.update({
    where: { id: tc.studentId },
    data: { status: "tc_issued" },
  });

  return prisma.transferCertificate.update({
    where: { id },
    data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
  });
};

// ============================================
// CHARACTER CERTIFICATE
// ============================================

export const generateCharacterCert = async (data: any, tenantId: string, generatedBy: string) => {
  const { studentId, purpose, remarks } = data;

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
  });
  if (!student) throw new Error("Student not found");

  const certData = generateCharacterCertData(student, purpose);
  const certCount = await prisma.characterCertificate.count({ where: { tenantId } });
  const certNumber = `CC-${new Date().getFullYear()}-${String(certCount + 1).padStart(4, "0")}`;

  return prisma.characterCertificate.create({
    data: {
      certNumber,
      studentId,
      tenantId,
      purpose,
      remarks,
      generatedBy,
      ...certData,
    },
  });
};

export const getCharacterCerts = async (tenantId: string, filters?: {
  studentId?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (filters?.studentId) where.studentId = filters.studentId;

  const [certs, total] = await Promise.all([
    prisma.characterCertificate.findMany({
      where,
      include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.characterCertificate.count({ where }),
  ]);

  return { certs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ============================================
// MIGRATION CERTIFICATE
// ============================================

export const generateMigrationCert = async (data: any, tenantId: string, generatedBy: string) => {
  const { studentId, migratingTo, purpose, remarks } = data;

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
  });
  if (!student) throw new Error("Student not found");

  const certData = generateMigrationCertData(student, migratingTo, purpose);
  const certCount = await prisma.migrationCertificate.count({ where: { tenantId } });
  const certNumber = `MC-${new Date().getFullYear()}-${String(certCount + 1).padStart(4, "0")}`;

  return prisma.migrationCertificate.create({
    data: {
      certNumber,
      studentId,
      tenantId,
      purpose,
      remarks,
      generatedBy,
      ...certData,
    },
  });
};

export const getMigrationCerts = async (tenantId: string, filters?: {
  studentId?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (filters?.studentId) where.studentId = filters.studentId;

  const [certs, total] = await Promise.all([
    prisma.migrationCertificate.findMany({
      where,
      include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.migrationCertificate.count({ where }),
  ]);

  return { certs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ============================================
// STATS
// ============================================

export const getCertificateStats = async (tenantId: string) => {
  const [totalTC, pendingTC, totalCC, totalMC] = await Promise.all([
    prisma.transferCertificate.count({ where: { tenantId } }),
    prisma.transferCertificate.count({ where: { tenantId, status: "DRAFT" } }),
    prisma.characterCertificate.count({ where: { tenantId } }),
    prisma.migrationCertificate.count({ where: { tenantId } }),
  ]);

  return { totalTC, pendingTC, totalCC, totalMC };
};
