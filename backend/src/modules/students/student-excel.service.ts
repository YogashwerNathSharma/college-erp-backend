// ══════════════════════════════════════════════════════════════════
// ENTERPRISE STUDENT MODULE — Excel Import/Export Service
// ══════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { StudentFilters, ExcelExportOptions, ExcelImportResult, ExcelImportError } from "./student.types";
import {
  EXCEL_IMPORT_COLUMNS,
  EXCEL_EXPORT_COLUMNS,
  GENDER_OPTIONS,
  BLOOD_GROUPS,
  CATEGORY_OPTIONS,
  RELIGION_OPTIONS,
} from "./student.constants";
import { generateAdmissionNumber, generateSrNumber } from "./admission-number.service";

const prisma = new PrismaClient();

// ============================================
// GET IMPORT TEMPLATE
// ============================================
export const getImportTemplate = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "School ERP";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Students", {
    properties: { defaultRowHeight: 20 },
  });

  // Set columns
  sheet.columns = EXCEL_IMPORT_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: 18,
  }));

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Mark required columns
  for (const col of EXCEL_IMPORT_COLUMNS) {
    if (col.required) {
      const colIndex = EXCEL_IMPORT_COLUMNS.indexOf(col) + 1;
      const cell = headerRow.getCell(colIndex);
      cell.value = `${col.header} *`;
    }
  }

  // Add dropdown validations
  const genderCol = EXCEL_IMPORT_COLUMNS.findIndex((c) => c.key === "gender") + 1;
  const bloodGroupCol = EXCEL_IMPORT_COLUMNS.findIndex((c) => c.key === "bloodGroup") + 1;
  const categoryCol = EXCEL_IMPORT_COLUMNS.findIndex((c) => c.key === "category") + 1;
  const religionCol = EXCEL_IMPORT_COLUMNS.findIndex((c) => c.key === "religion") + 1;

  // Apply validations for rows 2-1000
  for (let row = 2; row <= 1000; row++) {
    if (genderCol > 0) {
      sheet.getCell(row, genderCol).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`"${GENDER_OPTIONS.map((g) => g.value).join(",")}"`],
      };
    }
    if (bloodGroupCol > 0) {
      sheet.getCell(row, bloodGroupCol).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${BLOOD_GROUPS.join(",")}"`],
      };
    }
    if (categoryCol > 0) {
      sheet.getCell(row, categoryCol).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${CATEGORY_OPTIONS.map((c) => c.value).join(",")}"`],
      };
    }
    if (religionCol > 0) {
      sheet.getCell(row, religionCol).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${RELIGION_OPTIONS.map((r) => r.value).join(",")}"`],
      };
    }
  }

  // Add instructions sheet
  const instrSheet = workbook.addWorksheet("Instructions");
  instrSheet.getColumn(1).width = 60;
  instrSheet.addRow(["IMPORT INSTRUCTIONS"]);
  instrSheet.addRow([""]);
  instrSheet.addRow(["1. Fill student data in the 'Students' sheet"]);
  instrSheet.addRow(["2. Fields marked with * are mandatory"]);
  instrSheet.addRow(["3. Date of Birth format: DD/MM/YYYY"]);
  instrSheet.addRow(["4. Gender: Male, Female, or Other"]);
  instrSheet.addRow(["5. Phone numbers: 10 digits (Indian)"]);
  instrSheet.addRow(["6. Aadhaar: 12 digits (no spaces)"]);
  instrSheet.addRow(["7. Do not modify column headers"]);
  instrSheet.addRow(["8. Maximum 500 records per import"]);
  instrSheet.getRow(1).font = { bold: true, size: 14 };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

// ============================================
// IMPORT FROM EXCEL
// ============================================
export const importFromExcel = async (
  tenantId: string,
  filePath: string,
  academicYearId: string,
  classId: string,
  sectionId: string,
  userId: string
): Promise<ExcelImportResult> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet("Students") || workbook.getWorksheet(1);
  if (!sheet) {
    throw new Error("No worksheet found in the uploaded file");
  }

  const errors: ExcelImportError[] = [];
  const createdStudents: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  // Get header row to map columns
  const headerRow = sheet.getRow(1);
  const columnMap: Record<string, number> = {};
  headerRow.eachCell((cell, colNumber) => {
    const header = String(cell.value || "").replace(" *", "").trim();
    const matchedCol = EXCEL_IMPORT_COLUMNS.find(
      (c) => c.header.toLowerCase() === header.toLowerCase()
    );
    if (matchedCol) {
      columnMap[matchedCol.key] = colNumber;
    }
  });

  // Validate required columns exist
  const requiredCols = EXCEL_IMPORT_COLUMNS.filter((c) => c.required);
  for (const col of requiredCols) {
    if (!columnMap[col.key]) {
      throw new Error(`Required column "${col.header}" not found in the file`);
    }
  }

  const totalRows = sheet.rowCount - 1; // Exclude header

  // Process each row
  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);

    // Skip empty rows
    const firstCellValue = row.getCell(columnMap["firstName"] || 1).value;
    if (!firstCellValue) continue;

    try {
      const rowData: Record<string, any> = {};
      for (const [key, colNum] of Object.entries(columnMap)) {
        let value = row.getCell(colNum).value;
        // Handle rich text
        if (typeof value === "object" && value !== null && "richText" in value) {
          value = (value as any).richText?.map((r: any) => r.text).join("") || "";
        }
        // Handle date objects
        if (value instanceof Date) {
          value = value.toISOString().split("T")[0];
        }
        rowData[key] = value ? String(value).trim() : null;
      }

      // Validate required fields
      const rowErrors: ExcelImportError[] = [];
      for (const col of requiredCols) {
        if (!rowData[col.key] || rowData[col.key] === "") {
          rowErrors.push({
            row: rowNum,
            field: col.key,
            value: rowData[col.key] || "",
            message: `${col.header} is required`,
          });
        }
      }

      // Validate phone
      if (rowData.fatherPhone && !/^[6-9]\d{9}$/.test(rowData.fatherPhone.replace(/\D/g, "").slice(-10))) {
        rowErrors.push({
          row: rowNum,
          field: "fatherPhone",
          value: rowData.fatherPhone,
          message: "Invalid phone number (must be 10 digits starting with 6-9)",
        });
      }

      // Validate gender
      if (rowData.gender && !["Male", "Female", "Other"].includes(rowData.gender)) {
        rowErrors.push({
          row: rowNum,
          field: "gender",
          value: rowData.gender,
          message: "Gender must be Male, Female, or Other",
        });
      }

      // Validate Aadhaar
      if (rowData.aadharNo && !/^\d{12}$/.test(rowData.aadharNo.replace(/\s/g, ""))) {
        rowErrors.push({
          row: rowNum,
          field: "aadharNo",
          value: rowData.aadharNo,
          message: "Aadhaar must be 12 digits",
        });
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        failedCount++;
        continue;
      }

      // Parse DOB
      let dob: Date;
      if (rowData.dob) {
        // Try DD/MM/YYYY format
        const parts = rowData.dob.split(/[\/\-\.]/);
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const year = parseInt(parts[2]);
          dob = new Date(year, month, day);
        } else {
          dob = new Date(rowData.dob);
        }
        if (isNaN(dob.getTime())) {
          errors.push({ row: rowNum, field: "dob", value: rowData.dob, message: "Invalid date format" });
          failedCount++;
          continue;
        }
      } else {
        errors.push({ row: rowNum, field: "dob", value: "", message: "Date of Birth is required" });
        failedCount++;
        continue;
      }

      // Generate admission number
      const admissionNo = await generateAdmissionNumber(tenantId, academicYearId);
      const srNo = await generateSrNumber(tenantId, admissionNo);

      // Create student + enrollment in transaction
      const result = await prisma.$transaction(async (tx) => {
        const student = await tx.student.create({
          data: {
            firstName: rowData.firstName,
            lastName: rowData.lastName || "",
            fullName: `${rowData.firstName} ${rowData.lastName || ""}`.trim(),
            gender: rowData.gender,
            dob,
            email: rowData.email || null,
            phone: rowData.phone || null,
            address: rowData.address || "N/A",
            admissionNo,
            srNo,
            bloodGroup: rowData.bloodGroup || null,
            religion: rowData.religion || null,
            category: rowData.category || null,
            nationality: rowData.nationality || "Indian",
            aadharNo: rowData.aadharNo ? rowData.aadharNo.replace(/\s/g, "") : null,
            fatherName: rowData.fatherName || "N/A",
            fatherPhone: rowData.fatherPhone ? rowData.fatherPhone.replace(/\D/g, "").slice(-10) : "N/A",
            motherName: rowData.motherName || "N/A",
            motherPhone: rowData.motherPhone || null,
            previousSchool: rowData.previousSchool || null,
            previousClass: rowData.previousClass || null,
            admissionDate: new Date(),
            admissionType: "bulk",
            status: "active",
            isDeleted: false,
            createdBy: userId,
            tenant: { connect: { id: tenantId } },
            academicYear: { connect: { id: academicYearId } },
          },
        });

        // Auto-enrollment
        await tx.enrollment.create({
          data: {
            student: { connect: { id: student.id } },
            class: { connect: { id: classId } },
            section: { connect: { id: sectionId } },
            academicYear: { connect: { id: academicYearId } },
            tenant: { connect: { id: tenantId } },
            rollNumber: rowData.rollNumber || null,
            status: "active",
          },
        });

        return student;
      });

      createdStudents.push(result.id);
      successCount++;
    } catch (error: any) {
      errors.push({
        row: rowNum,
        field: "general",
        value: "",
        message: error.message || "Unknown error",
      });
      failedCount++;
    }
  }

  // Clean up uploaded file
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {}

  return {
    totalRows,
    successCount,
    failedCount,
    errors,
    createdStudents,
  };
};

// ============================================
// EXPORT TO EXCEL
// ============================================
export const exportToExcel = async (
  tenantId: string,
  filters: StudentFilters = {},
  columns?: string[]
): Promise<Buffer> => {
  const { classId, sectionId, academicYearId, status, gender, search } = filters;

  // Build where clause
  const where: any = { tenantId, isDeleted: false };
  if (status) where.status = status;
  if (gender) where.gender = { in: [gender, gender.toLowerCase()] };
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { admissionNo: { contains: search, mode: "insensitive" } },
    ];
  }
  if (classId || sectionId || academicYearId) {
    where.enrollments = {
      some: {
        status: "active",
        isDeleted: false,
        ...(classId && { classId }),
        ...(sectionId && { sectionId }),
        ...(academicYearId && { academicYearId }),
      },
    };
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      enrollments: {
        where: { status: "active", isDeleted: false },
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { firstName: "asc" },
    take: 10000,
  });

  // Determine which columns to export
  const exportCols = columns
    ? EXCEL_EXPORT_COLUMNS.filter((c) => columns.includes(c.key))
    : EXCEL_EXPORT_COLUMNS;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "School ERP";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Students", {
    properties: { defaultRowHeight: 18 },
  });

  // Set columns
  sheet.columns = exportCols.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 22;

  // Add data rows
  for (const student of students) {
    const enrollment = student.enrollments[0];
    const rowData: Record<string, any> = {
      admissionNo: student.admissionNo,
      srNo: student.srNo,
      rollNumber: (enrollment as any)?.rollNumber || "",
      firstName: student.firstName,
      middleName: (student as any).middleName || "",
      lastName: student.lastName,
      gender: student.gender,
      dob: new Date(student.dob).toLocaleDateString("en-IN"),
      className: enrollment?.class?.name || "",
      sectionName: enrollment?.section?.name || "",
      fatherName: student.fatherName,
      fatherPhone: student.fatherPhone,
      motherName: student.motherName,
      motherPhone: student.motherPhone || "",
      email: student.email || "",
      phone: student.phone || "",
      address: student.address,
      category: student.category || "",
      religion: student.religion || "",
      bloodGroup: student.bloodGroup || "",
      aadharNo: student.aadharNo || "",
      status: student.status,
      admissionDate: new Date(student.admissionDate).toLocaleDateString("en-IN"),
    };

    sheet.addRow(rowData);
  }

  // Auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: students.length + 1, column: exportCols.length },
  };

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

// ============================================
// EXPORT MULTI-SHEET (one sheet per class)
// ============================================
export const exportMultiSheet = async (
  tenantId: string,
  academicYearId: string
): Promise<Buffer> => {
  const classes = await prisma.class.findMany({
    where: { tenantId, isDeleted: false },
    orderBy: { name: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "School ERP";

  for (const cls of classes) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        tenantId,
        classId: cls.id,
        academicYearId,
        status: "active",
        isDeleted: false,
      },
      include: {
        student: true,
        section: { select: { name: true } },
      },
      orderBy: [{ section: { name: "asc" } }, { rollNumber: "asc" }],
    });

    if (enrollments.length === 0) continue;

    const sheet = workbook.addWorksheet(cls.name.substring(0, 31)); // Excel 31-char limit
    sheet.columns = [
      { header: "#", key: "sno", width: 5 },
      { header: "Adm.No", key: "admissionNo", width: 12 },
      { header: "Roll No", key: "rollNumber", width: 8 },
      { header: "Student Name", key: "name", width: 22 },
      { header: "Section", key: "section", width: 8 },
      { header: "Gender", key: "gender", width: 8 },
      { header: "DOB", key: "dob", width: 12 },
      { header: "Father Name", key: "fatherName", width: 20 },
      { header: "Father Phone", key: "fatherPhone", width: 14 },
      { header: "Category", key: "category", width: 10 },
    ];

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    enrollments.forEach((e, idx) => {
      sheet.addRow({
        sno: idx + 1,
        admissionNo: e.student.admissionNo,
        rollNumber: (e as any).rollNumber || "",
        name: `${e.student.firstName} ${e.student.lastName}`,
        section: e.section?.name || "",
        gender: e.student.gender,
        dob: new Date(e.student.dob).toLocaleDateString("en-IN"),
        fatherName: e.student.fatherName,
        fatherPhone: e.student.fatherPhone,
        category: e.student.category || "",
      });
    });

    sheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

// ============================================
// EXPORT SELECTED RECORDS
// ============================================
export const exportSelectedRecords = async (
  tenantId: string,
  studentIds: string[],
  columns?: string[]
): Promise<Buffer> => {
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, tenantId, isDeleted: false },
    include: {
      enrollments: {
        where: { status: "active", isDeleted: false },
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const exportCols = columns
    ? EXCEL_EXPORT_COLUMNS.filter((c) => columns.includes(c.key))
    : EXCEL_EXPORT_COLUMNS;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Selected Students");

  sheet.columns = exportCols.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };

  for (const student of students) {
    const enrollment = student.enrollments[0];
    sheet.addRow({
      admissionNo: student.admissionNo,
      srNo: student.srNo,
      rollNumber: (enrollment as any)?.rollNumber || "",
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      dob: new Date(student.dob).toLocaleDateString("en-IN"),
      className: enrollment?.class?.name || "",
      sectionName: enrollment?.section?.name || "",
      fatherName: student.fatherName,
      fatherPhone: student.fatherPhone,
      motherName: student.motherName,
      motherPhone: student.motherPhone || "",
      email: student.email || "",
      phone: student.phone || "",
      address: student.address,
      category: student.category || "",
      religion: student.religion || "",
      bloodGroup: student.bloodGroup || "",
      aadharNo: student.aadharNo || "",
      status: student.status,
      admissionDate: new Date(student.admissionDate).toLocaleDateString("en-IN"),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
