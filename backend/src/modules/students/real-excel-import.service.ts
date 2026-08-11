import ExcelJS from "exceljs";
import prisma from "../../utils/prisma";
import { generateAdmissionNumber, generateSrNumber } from "./admission-number.service";

// ══════════════════════════════════════════════════════════════════
// REAL EXCEL STUDENT IMPORT SERVICE
// Handles the actual Excel file parsing and student import
// Supports BOTH combined "Class" column (e.g. "LKG A") AND separate
// "Class" + "Section" columns.
// ══════════════════════════════════════════════════════════════════

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && value && "richText" in (value as any)) {
    return ((value as any).richText || []).map((x: any) => x.text || "").join("").trim();
  }
  return String(value).trim();
}

function excelDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const s = text(value);
  if (!s) return null;
  // Try DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY formats
  const parts = s.split(/[/.\-]/).map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    const [d, m, y] = parts;
    if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
    }
    // Try MM/DD/YYYY fallback
    if (d >= 1 && d <= 12 && m >= 1 && m <= 31 && y > 1900) {
      const date = new Date(y, d - 1, m);
      if (date.getFullYear() === y && date.getMonth() === d - 1 && date.getDate() === m) return date;
    }
  }
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Normalize gender to Prisma Gender enum: MALE | FEMALE | OTHER
 */
function normalizeGender(value: string): "MALE" | "FEMALE" | "OTHER" {
  const v = value.toLowerCase().trim();
  if (["m", "male", "boy"].includes(v)) return "MALE";
  if (["f", "female", "girl"].includes(v)) return "FEMALE";
  return "OTHER";
}

/**
 * Split combined class+section value like "LKG A" into className="LKG" sectionName="A"
 * Returns null sectionName if no section part detected.
 */
function splitClassSection(value: string): { className: string; sectionName: string | null } {
  const s = value.replace(/\s+/g, " ").trim();
  // Match patterns like "LKG A", "Class 1 B", "10th A"
  const match = s.match(/^(.*?)(?:\s+)([A-Za-z])$/);
  if (match) return { className: match[1].trim(), sectionName: match[2].trim() };
  return { className: s, sectionName: null };
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  prismaCode?: string;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: ImportError[];
  importedStudentIds: string[];
}

export async function importRealRmsExcel(
  tenantId: string,
  filePath: string,
  academicYearId: string,
  userId: string,
): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet("Student_List") || workbook.worksheets[0];
  if (!sheet) throw new Error("No worksheet found in the uploaded Excel file");

  // ─── Parse headers ────────────────────────────────────────────────
  const headers: Record<string, number> = {};
  sheet.getRow(1).eachCell((cell, col) => {
    const h = text(cell.value).toLowerCase();
    if (h) headers[h] = col;
  });

  const col = (...names: string[]): number | undefined =>
    names.map(n => headers[n.toLowerCase()]).find(Boolean);

  const get = (row: ExcelJS.Row, ...names: string[]): string => {
    const n = col(...names);
    return n ? text(row.getCell(n).value) : "";
  };

  // ─── Validate academic year ────────────────────────────────────────
  const academicYear = await prisma.academicYear.findFirst({ where: { id: academicYearId, tenantId } });
  if (!academicYear) throw new Error("Academic year not found for this tenant");

  // ─── Caches ─────────────────────────────────────────────────────────
  const classCache = new Map<string, string>(); // className -> classId
  const sectionCache = new Map<string, string>(); // classId|sectionName -> sectionId
  const admissionNoSet = new Set<string>(); // track generated admission numbers in this batch

  const errors: ImportError[] = [];
  const imported: string[] = [];
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  // Detect whether we have separate Section column
  const hasSeparateSectionCol = col("Section", "Section Name") !== undefined;

  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);
    const name = get(row, "Name", "Student Name", "Full Name");
    const classValue = get(row, "Class", "Class Name");

    // Skip completely empty rows
    if (!name && !classValue) {
      skippedCount++;
      continue;
    }

    try {
      // ─── Validate required fields ──────────────────────────────────
      if (!name) {
        throw { field: "Name", message: "Name is required" };
      }
      if (!classValue) {
        throw { field: "Class", message: "Class is required" };
      }

      // ─── Resolve Class and Section ─────────────────────────────────
      let className: string;
      let sectionName: string;

      if (hasSeparateSectionCol) {
        // Separate Class and Section columns in Excel
        className = classValue.trim();
        sectionName = get(row, "Section", "Section Name").trim();
      } else {
        // Combined column like "LKG A"
        const parsed = splitClassSection(classValue);
        className = parsed.className;
        sectionName = parsed.sectionName || "";
      }

      if (!className) {
        throw { field: "Class", message: "Class name is empty" };
      }
      if (!sectionName) {
        throw { field: "Section", message: `Section is required. Class value: "${classValue}"` };
      }

      // Look up class
      const classCacheKey = `${className.toLowerCase()}|${academicYearId}`;
      let classId = classCache.get(classCacheKey);
      if (!classId) {
        const cls = await prisma.class.findFirst({
          where: {
            tenantId,
            academicYearId,
            name: { equals: className, mode: "insensitive" } as any,
            isDeleted: false,
          },
        });
        if (!cls) {
          throw { field: "Class", message: `Class "${className}" not found for the selected academic year` };
        }
        classId = cls.id;
        classCache.set(classCacheKey, classId);
      }

      // Look up section under the resolved class
      const sectionCacheKey = `${classId}|${sectionName.toLowerCase()}`;
      let sectionId = sectionCache.get(sectionCacheKey);
      if (!sectionId) {
        const section = await prisma.section.findFirst({
          where: {
            tenantId,
            academicYearId,
            classId,
            name: { equals: sectionName, mode: "insensitive" } as any,
          },
        });
        if (!section) {
          throw { field: "Section", message: `Section "${sectionName}" not found under class "${className}"` };
        }
        sectionId = section.id;
        sectionCache.set(sectionCacheKey, sectionId);
      }

      // ─── Parse student fields ──────────────────────────────────────
      const nameParts = name.trim().split(/\s+/);
      const firstName = get(row, "First Name") || nameParts[0] || "";
      const lastName = get(row, "Last Name") || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName);

      // Gender — MUST match Prisma enum: MALE | FEMALE | OTHER
      const genderRaw = get(row, "Gender");
      const gender = normalizeGender(genderRaw || "");

      // DOB — MANDATORY
      const dobRaw = get(row, "DOB", "Date of Birth", "Date of Birth (DD/MM/YYYY)");
      if (!dobRaw) {
        throw { field: "DOB", message: "Date of Birth is required" };
      }
      const dob = excelDate(dobRaw);
      if (!dob) {
        throw { field: "DOB", message: `Invalid date format: "${dobRaw}"` };
      }

      // Admission Number — generate if blank
      let admissionNo = get(row, "Admission Number", "AdmissionNumber", "Admission No");
      if (!admissionNo) {
        admissionNo = await generateAdmissionNumber(tenantId, academicYearId);
        // Ensure uniqueness within batch
        while (admissionNoSet.has(admissionNo)) {
          admissionNo = await generateAdmissionNumber(tenantId, academicYearId);
        }
      }
      admissionNoSet.add(admissionNo);

      // SR Number — generate if blank
      let srNo = get(row, "SR Number", "SRN Number", "SR No");
      if (!srNo) {
        srNo = await generateSrNumber(tenantId, admissionNo);
      }

      // Roll Number
      const rollNumber = get(row, "Roll Number", "Roll No", "roleNumber") || null;

      // Parent info
      const fatherName = get(row, "Father Name", "Father") || "N/A";
      const motherName = get(row, "Mother Name", "Mother") || "N/A";
      const fatherPhone = get(row, "Father Phone", "Mobile", "Phone") || "N/A";
      const motherPhone = get(row, "Mother Phone", "SmsNo") || null;
      const phone = get(row, "Mobile", "Phone") || null;
      const email = get(row, "Email") || null;
      const address = get(row, "Address", "Present Address") || "N/A";

      // Optional reference fields — store as null (NOT as string values)
      // Schema uses religionId/categoryId/nationalityId (ObjectId FKs), not text fields
      // We'll skip setting these FKs since we don't have ID mappings; leave as null
      const aadharNo = get(row, "Aadhar Number", "Aadhaar No", "Aadhar No", "Child ID").replace(/\s/g, "") || null;

      // Extra fields for customFields JSON
      const permanentAddress = get(row, "Permanent Address") || null;
      const studentType = get(row, "StudentType", "Student Type") || null;
      const samagraId = get(row, "Samagra ID", "SamagraID") || null;
      const employmentCategory = get(row, "Employment Category") || null;
      const religion = get(row, "Religion") || null;
      const category = get(row, "Category") || null;
      const nationality = get(row, "Nationality") || null;

      const customFields: Record<string, string> = {};
      if (studentType) customFields.studentType = studentType;
      if (samagraId) customFields.samagraId = samagraId;
      if (employmentCategory) customFields.employmentCategory = employmentCategory;
      if (permanentAddress) customFields.permanentAddress = permanentAddress;
      if (religion) customFields.religion = religion;
      if (category) customFields.category = category;
      if (nationality) customFields.nationality = nationality;

      // Status
      const statusRaw = get(row, "Status");
      const status = statusRaw && statusRaw.toLowerCase() === "inactive" ? "inactive" : "active";

      // ─── Prisma transaction: create/update student + enrollment ─────
      const result = await prisma.$transaction(async (tx) => {
        // Check if student already exists by admissionNo + tenantId
        let student = await tx.student.findFirst({
          where: { tenantId, admissionNo, isDeleted: false },
        });

        const studentData = {
          firstName,
          lastName,
          fullName: name.trim(),
          gender,
          dob,
          phone,
          email,
          address,
          fatherName,
          fatherPhone,
          motherName,
          motherPhone,
          aadharNo,
          status,
          ...(Object.keys(customFields).length > 0 ? { customFields } : {}),
        };

        if (student) {
          // UPDATE existing student
          student = await tx.student.update({
            where: { id: student.id },
            data: {
              ...studentData,
              updatedAt: new Date(),
              updatedBy: userId,
            },
          });
        } else {
          // CREATE new student
          student = await tx.student.create({
            data: {
              ...studentData,
              admissionNo,
              srNo: srNo || undefined,
              rollNumber,
              admissionDate: new Date(),
              isDeleted: false,
              createdBy: userId,
              tenant: { connect: { id: tenantId } },
              academicYear: { connect: { id: academicYearId } },
            },
          });
        }

        // Enrollment: create or update
        const existingEnrollment = await tx.enrollment.findFirst({
          where: { tenantId, studentId: student.id, academicYearId },
        });

        if (existingEnrollment) {
          await tx.enrollment.update({
            where: { id: existingEnrollment.id },
            data: { classId, sectionId, rollNumber, status: "active", isDeleted: false },
          });
        } else {
          await tx.enrollment.create({
            data: {
              studentId: student.id,
              classId,
              sectionId,
              academicYearId,
              tenantId,
              rollNumber,
              status: "active",
            },
          });
        }

        return student;
      });

      imported.push(result.id);
      successCount++;
    } catch (error: any) {
      failedCount++;

      // Build detailed error
      const importError: ImportError = { row: rowNum, message: "" };

      if (error?.field) {
        // Our structured validation error
        importError.field = error.field;
        importError.message = error.message;
      } else if (error?.code) {
        // Prisma error
        importError.prismaCode = error.code;
        if (error.code === "P2002") {
          const target = error.meta?.target || [];
          importError.field = Array.isArray(target) ? target.join(", ") : String(target);
          importError.message = `Duplicate value: ${importError.field}`;
        } else if (error.code === "P2003") {
          importError.message = `Foreign key constraint failed: ${error.meta?.field_name || "unknown"}`;
        } else {
          importError.message = error.message || `Prisma error: ${error.code}`;
        }
      } else {
        importError.message = error?.message || "Unknown import error";
      }

      errors.push(importError);
    }
  }

  return { totalRows: sheet.rowCount - 1, successCount, failedCount, skippedCount, errors, importedStudentIds: imported };
}
