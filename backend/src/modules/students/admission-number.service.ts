import prisma from "../../utils/prisma";

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

  // ✅ ATOMIC OPERATION: Use upsert with atomic increment to prevent race conditions
  // This ensures only ONE request gets a unique number, even if multiple requests arrive simultaneously
  try {
    const counter = await prisma.admissionCounter.upsert({
      where: {
        tenantId_academicYearId: {
          tenantId,
          academicYearId,
        },
      },
      update: {
        lastNumber: {
          increment: 1, // ✅ Atomic database-level increment - MongoDB $inc operator
        },
      },
      create: {
        prefix: "ADM",
        lastNumber: 1,
        tenant: {
          connect: { id: tenantId },
        },
        academicYear: {
          connect: { id: academicYearId },
        },
      },
    });

    const serialPadded = String(counter.lastNumber).padStart(3, "0");
    return `ADM/${yearPart}/${serialPadded}`;
  } catch (err: any) {
    console.error("❌ Error generating admission number:", err.message);
    throw new Error(`Failed to generate admission number: ${err.message}`);
  }
};

// ============================================
// GENERATE SR NUMBER
// ============================================
export const generateSrNumber = async (tenantId: string, admissionNo?: string): Promise<string> => {
  // Derive SR serial from admission number to keep last digits in sync
  // ADM/2025/302 → SR/0302
  let nextSr = 1;
  if (admissionNo) {
    const match = admissionNo.match(/(\d+)$/);
    if (match) {
      nextSr = parseInt(match[1]);
    }
  } else {
    // Fallback: count all students
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
    orderBy: { createdAt: "desc" },
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

  // ✅ Use upsert for atomic sync operation
  const counter = await prisma.admissionCounter.upsert({
    where: {
      tenantId_academicYearId: {
        tenantId,
        academicYearId,
      },
    },
    update: {
      lastNumber: maxSerial,
    },
    create: {
      tenantId,
      academicYearId,
      prefix: "ADM",
      lastNumber: maxSerial,
      tenant: {
        connect: { id: tenantId },
      },
      academicYear: {
        connect: { id: academicYearId },
      },
    },
  });

  return { lastNumber: counter.lastNumber };
};
