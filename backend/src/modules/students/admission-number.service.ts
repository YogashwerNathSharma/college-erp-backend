
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// GENERATE ADMISSION NUMBER — Format: ADM/2026/001
// ============================================
export const generateAdmissionNumber = async (
  tenantId: string,
  academicYearId: string
): Promise<string> => {
  const academicYear = await prisma.academicYear.findFirst({
    where: { id: academicYearId },
    select: { name: true },
  });

  let yearPart = new Date().getFullYear().toString();
  if (academicYear?.name) {
    const match = academicYear.name.match(/(\d{4})/);
    if (match) yearPart = match[1];
  }

  const counter = await prisma.admissionCounter.findFirst({
    where: { tenantId, academicYearId },
  });

  let nextSerial = 1;

  if (counter) {
    nextSerial = counter.lastNumber + 1;
    await prisma.admissionCounter.update({
      where: { id: counter.id },
      data: { lastNumber: nextSerial },
    });
  } else {
    const existingCount = await prisma.student.count({
      where: { tenantId, academicYearId },
    });
    nextSerial = existingCount + 1;

    await prisma.admissionCounter.create({
      data: {
        tenant: { connect: { id: tenantId } },
        academicYearId,
        prefix: "ADM",
        lastNumber: nextSerial,
      },
    });
  }

  const serialPadded = String(nextSerial).padStart(3, "0");
  return `ADM/${yearPart}/${serialPadded}`;
};

// ============================================
// GENERATE SR NUMBER
// ============================================
export const generateSrNumber = async (tenantId: string): Promise<string> => {
  const lastStudent = await prisma.student.findFirst({
    where: { tenantId, srNo: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { srNo: true },
  });

  let nextSr = 1;

  if (lastStudent?.srNo) {
    const match = lastStudent.srNo.match(/(\d+)$/);
    if (match) {
      nextSr = parseInt(match[1]) + 1;
    }
  } else {
    const count = await prisma.student.count({ where: { tenantId } });
    nextSr = count + 1;
  }

  const serialPadded = String(nextSr).padStart(4, "0");
  return `SR/${serialPadded}`;
};

// ============================================
// SYNC COUNTER
// ============================================
export const syncAdmissionCounter = async (
  tenantId: string,
  academicYearId: string
): Promise<{ lastNumber: number }> => {
  const students = await prisma.student.findMany({
    where: { tenantId, academicYearId },
    select: { admissionNo: true },
  });

  let maxSerial = 0;
  for (const s of students) {
    if (s.admissionNo) {
      const match = s.admissionNo.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxSerial) maxSerial = num;
      }
    }
  }

  const existing = await prisma.admissionCounter.findFirst({
    where: { tenantId, academicYearId },
  });

  if (existing) {
    await prisma.admissionCounter.update({
      where: { id: existing.id },
      data: { lastNumber: maxSerial },
    });
  } else {
    await prisma.admissionCounter.create({
      data: {
        tenant: { connect: { id: tenantId } },
        academicYearId,
        prefix: "ADM",
        lastNumber: maxSerial,
      },
    });
  }

  return { lastNumber: maxSerial };
};
