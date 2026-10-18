
import prisma from "../../utils/prisma";
import { normalizeClass } from "../../utils/classNormalizer";
// ─────── Types ──────────────────────────────────────────────────────────────────────────────────────────────────────

export interface AgeLimit {
  className: string;
  minAge: number;
  maxAge: number;
}

// ─────── Board-wise Age Limits ──────────────────────────────────────────────────────────────────────────────────

export const UP_BOARD_AGE_LIMITS: AgeLimit[] = [
  { className: "Play Group", minAge: 2.0, maxAge: 3.0 },
  { className: "Nursery", minAge: 3.0, maxAge: 4.0 },
  { className: "LKG", minAge: 4.0, maxAge: 5.0 },
  { className: "UKG", minAge: 5.0, maxAge: 6.0 },
  { className: "Class 1", minAge: 6.0, maxAge: 7.0 },
  { className: "Class 2", minAge: 7.0, maxAge: 8.0 },
  { className: "Class 3", minAge: 8.0, maxAge: 9.0 },
  { className: "Class 4", minAge: 9.0, maxAge: 10.0 },
  { className: "Class 5", minAge: 10.0, maxAge: 11.0 },
  { className: "Class 6", minAge: 11.0, maxAge: 12.0 },
  { className: "Class 7", minAge: 12.0, maxAge: 13.0 },
  { className: "Class 8", minAge: 13.0, maxAge: 14.0 },
  { className: "Class 9", minAge: 14.0, maxAge: 15.0 },
  { className: "Class 10", minAge: 15.0, maxAge: 16.0 },
  { className: "Class 11", minAge: 16.0, maxAge: 17.0 },
  { className: "Class 12", minAge: 17.0, maxAge: 18.0 },
];

export const CBSE_AGE_LIMITS: AgeLimit[] = [
  { className: "Play Group", minAge: 2.0, maxAge: 3.0 },
  { className: "Nursery", minAge: 3.0, maxAge: 4.0 },
  { className: "LKG", minAge: 4.0, maxAge: 5.0 },
  { className: "UKG", minAge: 5.0, maxAge: 6.0 },
  { className: "Class 1", minAge: 6.0, maxAge: 7.0 },
  { className: "Class 2", minAge: 7.0, maxAge: 8.0 },
  { className: "Class 3", minAge: 8.0, maxAge: 9.0 },
  { className: "Class 4", minAge: 9.0, maxAge: 10.0 },
  { className: "Class 5", minAge: 10.0, maxAge: 11.0 },
  { className: "Class 6", minAge: 11.0, maxAge: 12.0 },
  { className: "Class 7", minAge: 12.0, maxAge: 13.0 },
  { className: "Class 8", minAge: 13.0, maxAge: 14.0 },
  { className: "Class 9", minAge: 14.0, maxAge: 15.0 },
  { className: "Class 10", minAge: 15.0, maxAge: 16.0 },
  { className: "Class 11", minAge: 16.0, maxAge: 17.0 },
  { className: "Class 12", minAge: 17.0, maxAge: 18.0 },
];

export const ICSE_AGE_LIMITS: AgeLimit[] = [
  { className: "Play Group", minAge: 2.0, maxAge: 3.0 },
  { className: "Nursery", minAge: 3.0, maxAge: 4.0 },
  { className: "LKG", minAge: 4.0, maxAge: 5.0 },
  { className: "UKG", minAge: 5.0, maxAge: 6.0 },
  { className: "Class 1", minAge: 5.5, maxAge: 7.0 },
  { className: "Class 2", minAge: 6.5, maxAge: 8.0 },
  { className: "Class 3", minAge: 7.5, maxAge: 9.0 },
  { className: "Class 4", minAge: 8.5, maxAge: 10.0 },
  { className: "Class 5", minAge: 9.5, maxAge: 11.0 },
  { className: "Class 6", minAge: 10.5, maxAge: 12.0 },
  { className: "Class 7", minAge: 11.5, maxAge: 13.0 },
  { className: "Class 8", minAge: 12.5, maxAge: 14.0 },
  { className: "Class 9", minAge: 13.5, maxAge: 15.0 },
  { className: "Class 10", minAge: 14.5, maxAge: 16.0 },
  { className: "Class 11", minAge: 15.5, maxAge: 17.0 },
  { className: "Class 12", minAge: 16.5, maxAge: 18.0 },
];

// ─────── Age Calculation ────────────────────────────────────────────────────────────────────────────────────────────

export function calculatePreciseAge(dob: Date, referenceDate: Date): number {
  const years = referenceDate.getFullYear() - dob.getFullYear();
  const months = referenceDate.getMonth() - dob.getMonth();
  const days = referenceDate.getDate() - dob.getDate();

  let age = years;
  if (months < 0 || (months === 0 && days < 0)) {
    age--;
  }

  const lastBirthday = new Date(dob);
  lastBirthday.setFullYear(referenceDate.getFullYear());
  if (lastBirthday > referenceDate) {
    lastBirthday.setFullYear(lastBirthday.getFullYear() - 1);
  }

  const nextBirthday = new Date(lastBirthday);
  nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);

  const totalDaysInYear =
    (nextBirthday.getTime() - lastBirthday.getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceLastBirthday =
    (referenceDate.getTime() - lastBirthday.getTime()) / (1000 * 60 * 60 * 24);

  return age + daysSinceLastBirthday / totalDaysInYear;
}

export function getAgeReferenceDate(
  academicYearStart: number,
  refMonth: number = 3,
  refDay: number = 31
): Date {
  return new Date(academicYearStart + 1, refMonth - 1, refDay);
}

// ─────── Validation Result Type ────────────────────────────────────────────────────────────────────────────────────

export interface AgeValidationResult {
  isValid: boolean;
  studentAge: number;
  minAge: number;
  maxAge: number;
  message: string;
  board: string;
  className: string;
  referenceDate: Date;
}

// ─────── Validate Student Age ──────────────────────────────────────────────────────────────────────────────────────

export async function validateStudentAge(
  tenantId: string,
  classId: string,
  dob: Date,
  academicYearStart: number,
  board?: string
): Promise<AgeValidationResult> {
  const customConfig = await prisma.classAgeConfig.findFirst({
    where: { tenantId, classId, isActive: true },
  });

  if (customConfig) {
    const referenceDate = getAgeReferenceDate(
      academicYearStart,
      customConfig.ageCalcRefMonth,
      customConfig.ageCalcRefDay
    );
    const studentAge = calculatePreciseAge(dob, referenceDate);

    return {
      isValid: studentAge >= customConfig.minAge && studentAge < customConfig.maxAge,
      studentAge: Math.round(studentAge * 10) / 10,
      minAge: customConfig.minAge,
      maxAge: customConfig.maxAge,
      message:
        studentAge < customConfig.minAge
          ? `Student is too young. Age ${studentAge.toFixed(1)} years is below minimum ${customConfig.minAge} years for ${customConfig.className}`
          : studentAge >= customConfig.maxAge
            ? `Student is too old. Age ${studentAge.toFixed(1)} years exceeds maximum ${customConfig.maxAge} years for ${customConfig.className}`
            : `Age ${studentAge.toFixed(1)} years is valid for ${customConfig.className}`,
      board: customConfig.board,
      className: customConfig.className,
      referenceDate,
    };
  }

  return {
    isValid: true,
    studentAge: 0,
    minAge: 0,
    maxAge: 0,
    message: "No age configuration found for this class. Please set up age limits in settings.",
    board: board || "NONE",
    className: "Unknown",
    referenceDate: new Date(),
  };
}

// ─────── Flexible Class Name Matching ───────────────────────────────────────────────────────────────────────────────

function matchClassName(dbName: string, limitName: string): boolean {
  const a = dbName.toLowerCase().trim();
  const b = limitName.toLowerCase().trim();

  if (a === b) return true;

  const numFromA = a.replace("class", "").replace("-", "").trim();
  const numFromB = b.replace("class", "").replace("-", "").trim();
  if (numFromA === numFromB && numFromA !== "") return true;

  return false;
}

// ─────── Seed Age Config ───────────────────────────────────────────────────────────────────────────────────────────

export async function seedAgeConfigForTenant(
  tenantId: string,
  board: "UP_BOARD" | "CBSE" | "ICSE",
  classMapping: { className: string; classId: string }[]
): Promise<{ matched: number; skipped: number; total: number }> {

  const ageLimits =
    board === "UP_BOARD"
      ? UP_BOARD_AGE_LIMITS
      : board === "CBSE"
      ? CBSE_AGE_LIMITS
      : ICSE_AGE_LIMITS;

  let matched = 0;
  let skipped = 0;

  for (const mapping of classMapping) {

    const ageLimit = ageLimits.find(
      (al) =>
        normalizeClass(mapping.className) ===
        normalizeClass(al.className)
    );

    if (ageLimit) {
      await prisma.classAgeConfig.upsert({
        where: {
          tenantId_classId_board: {
            tenantId,
            classId: mapping.classId,
            board,
          },
        },
        update: {
          minAge: ageLimit.minAge,
          maxAge: ageLimit.maxAge,
          className: mapping.className,
          isActive: true,
        },
        create: {
          tenant: { connect: { id: tenantId } },
          class: { connect: { id: mapping.classId } },
          board,
          className: mapping.className,
          minAge: ageLimit.minAge,
          maxAge: ageLimit.maxAge,
          isActive: true,
        },
      });

      matched++;
    } else {
      skipped++;
    }
  }

  return {
    matched,
    skipped,
    total: classMapping.length,
  };
}
// ─────── Get Age Configs (with optional board filter) ────────────────────────────────────────────────────────────

export async function getAgeConfigs(tenantId: string, board?: string) {
  const where: any = { tenantId, isActive: true };
  if (board) where.board = board;

  return prisma.classAgeConfig.findMany({
    where,
    orderBy: { minAge: "asc" },
  });
}

// ─────── Update Age Config ────────────────────────────────────────────────────────────────────────────────────────

export async function updateAgeConfig(
  id: string,
  tenantId: string,
  data: { minAge?: number; maxAge?: number; ageCalcRefMonth?: number; ageCalcRefDay?: number }
) {
  const config = await prisma.classAgeConfig.findFirst({
    where: { id, tenantId },
  });

  if (!config) {
    throw new Error("Age config not found");
  }

  return prisma.classAgeConfig.update({
    where: { id },
    data,
  });
}

// ─────── Toggle Age Config Active/Inactive ────────────────────────────────────────────────────────────────────────

export async function toggleAgeConfigStatus(id: string, tenantId: string) {
  const config = await prisma.classAgeConfig.findFirst({
    where: { id, tenantId },
  });

  if (!config) {
    throw new Error("Age config not found");
  }

  return prisma.classAgeConfig.update({
    where: { id },
    data: { isActive: !config.isActive },
  });
}

// ─────── Delete Age Config (soft — just deactivate) ──────────────────────────────────────────────────────────────

export async function deleteAgeConfig(id: string, tenantId: string) {
  const config = await prisma.classAgeConfig.findFirst({
    where: { id, tenantId },
  });

  if (!config) {
    throw new Error("Age config not found");
  }

  return prisma.classAgeConfig.update({
    where: { id },
    data: { isActive: false },
  });
}

// ─────── Get All Configs (including inactive for admin view) ──────────────────────────────────────────────────────

export async function getAllAgeConfigs(tenantId: string) {
  return prisma.classAgeConfig.findMany({
    where: { tenantId },
    orderBy: { minAge: "asc" },
  });
}
