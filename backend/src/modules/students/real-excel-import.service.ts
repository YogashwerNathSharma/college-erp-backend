import ExcelJS from "exceljs";
import prisma from "../../utils/prisma";
import { generateAdmissionNumber, generateSrNumber } from "./admission-number.service";

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && value && "richText" in (value as any)) {
    return ((value as any).richText || []).map((x: any) => x.text || "").join("").trim();
  }
  return String(value).trim();
}

function headerKey(value: unknown): string {
  return text(value).replace(/^\uFEFF/, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function excelDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const s = text(value);
  if (!s) return null;
  const parts = s.split(/[\\/.\-]/).map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    let [a, b, c] = parts;
    if (a >= 1000) [c, b, a] = parts;
    const date = new Date(c, b - 1, a);
    if (date.getFullYear() === c && date.getMonth() === b - 1 && date.getDate() === a) return date;
  }
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeGender(value: string): string {
  const v = value.trim().toLowerCase();
  if (["m", "male", "boy", "man"].includes(v)) return "Male";
  if (["f", "female", "girl", "woman"].includes(v)) return "Female";
  return "Other";
}

function splitClass(value: string, explicitSection = ""): { className: string; sectionName: string } {
  const raw = value.replace(/\s+/g, " ").trim();
  const section = explicitSection.replace(/\s+/g, " ").trim();
  if (section) {
    const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const trailing = raw.match(new RegExp(`^(.*?)[\\s_-]+${escaped}$`, "i"));
    return { className: (trailing ? trailing[1] : raw).trim(), sectionName: section };
  }
  const match = raw.match(/^(.*?)[\s_-]+([A-Za-z])$/);
  if (match) return { className: match[1].trim(), sectionName: match[2].trim() };
  return { className: raw, sectionName: "" };
}

function classCandidates(value: string): string[] {
  const raw = value.replace(/\s+/g, " ").trim();
  const stripped = raw.replace(/^(class|grade|std|standard)\s*/i, "").trim();
  return Array.from(new Set([raw, stripped].filter(Boolean)));
}

type ImportOptions = {
  dryRun?: boolean;
  maxRows?: number;
  mapping?: Record<string, string>;
};

export async function importRealRmsExcel(
  tenantId: string,
  filePath: string,
  academicYearId: string,
  userId: string,
  options: ImportOptions = {},
) {
  const workbook = new ExcelJS.Workbook();
  const lowerPath = filePath.toLowerCase();
  if (lowerPath.endsWith(".csv")) await workbook.csv.readFile(filePath);
  else if (lowerPath.endsWith(".xlsx")) await workbook.xlsx.readFile(filePath);
  else throw new Error("Only .xlsx and .csv files are supported. Please save legacy .xls files as .xlsx first.");

  const sheet = workbook.getWorksheet("Student_List") || workbook.getWorksheet("Students") || workbook.worksheets[0];
  if (!sheet) throw new Error("No worksheet found in the uploaded file");

  const headers: Record<string, number> = {};
  sheet.getRow(1).eachCell((cell, col) => {
    const key = headerKey(cell.value);
    if (key && headers[key] === undefined) headers[key] = col;
  });

  const col = (...names: string[]) => names.map(headerKey).map(k => headers[k]).find((n): n is number => !!n);
  const getRaw = (row: ExcelJS.Row, ...names: string[]) => {
    const n = col(...names);
    return n ? text(row.getCell(n).value) : "";
  };

  // Import/Export stores mapping as source-header -> ERP-field. Keep that contract here.
  const mapping = options.mapping || {};
  const mappedSource = (target: string) => Object.keys(mapping).find(source => mapping[source] === target);
  const get = (row: ExcelJS.Row, target: string, ...aliases: string[]) => {
    const source = mappedSource(target);
    if (source) {
      const n = col(source);
      if (n) return text(row.getCell(n).value);
    }
    return getRaw(row, target, ...aliases);
  };

  const academicYear = await prisma.academicYear.findFirst({ where: { id: academicYearId, tenantId } });
  if (!academicYear) throw new Error("Academic year not found for this school");

  // Support both a single Full Name column and First Name + Last Name mappings.
  const nameColumn = mappedSource("fullName") || col("Name", "Student Name", "StudentName", "Full Name", "FullName", "name");
  const firstNameColumn = mappedSource("firstName") || col("First Name", "FirstName", "FName");
  const lastNameColumn = mappedSource("lastName") || col("Last Name", "LastName", "LName", "Surname");

  // Support Class + Section as separate columns or one Class & Section column.
  const classColumn = mappedSource("className") || col("Class", "Class Name", "ClassName", "Class & Section", "ClassSection", "class");
  const classSectionColumn = mappedSource("classSection") || col("Class & Section", "ClassSection", "Class and Section", "Class_Section");
  if (!nameColumn && !firstNameColumn && !lastNameColumn) throw new Error("Student Name column not found. Map Name/Full Name or First Name/Last Name.");
  if (!classColumn && !classSectionColumn) throw new Error("Class column not found. Map Class or Class & Section.");

  const classCache = new Map<string, string>();
  const sectionCache = new Map<string, string>();
  const errors: any[] = [];
  const imported: string[] = [];
  let successCount = 0;
  let failedCount = 0;
  const lastRow = options.maxRows ? Math.min(sheet.rowCount, options.maxRows + 1) : sheet.rowCount;

  for (let rowNum = 2; rowNum <= lastRow; rowNum++) {
    const row = sheet.getRow(rowNum);
    const firstNameValue = get(row, "firstName", "First Name", "FirstName", "FName");
    const lastNameValue = get(row, "lastName", "Last Name", "LastName", "LName", "Surname");
    const fullNameValue = get(row, "fullName", "Name", "Student Name", "StudentName", "Full Name", "FullName") || [firstNameValue, lastNameValue].filter(Boolean).join(" ");

    let classValue = get(row, "className", "Class", "Class Name", "ClassName", "class");
    const classSectionValue = get(row, "classSection", "Class & Section", "ClassSection", "Class and Section", "Class_Section");
    if (!classValue) classValue = classSectionValue;
    const sectionValue = get(row, "sectionName", "Section", "Section Name", "SectionName", "Sec");
    if (!fullNameValue && !classValue) continue;

    try {
      if (!fullNameValue) throw new Error("Name is required");
      if (!classValue) throw new Error("Class is required");

      const { className, sectionName } = splitClass(classValue, sectionValue);
      if (!className || !sectionName) {
        throw new Error(`Class and Section are required. Received: ${classValue}${sectionValue ? ` / ${sectionValue}` : ""}`);
      }

      const cacheKey = `${className.toLowerCase()}|${academicYearId}`;
      let classId = classCache.get(cacheKey);
      if (!classId) {
        let cls: any = null;
        for (const candidate of classCandidates(className)) {
          cls = await prisma.class.findFirst({
            where: { tenantId, academicYearId, name: { equals: candidate, mode: "insensitive" } as any, isDeleted: false },
            select: { id: true },
          });
          if (cls) break;
        }
        if (!cls) throw new Error(`Class "${className}" not found for selected academic year`);
        classId = cls.id;
        classCache.set(cacheKey, classId);
      }

      const sectionKey = `${classId}|${sectionName.toLowerCase()}`;
      let sectionId = sectionCache.get(sectionKey);
      if (!sectionId) {
        const section = await prisma.section.findFirst({
          where: { tenantId, academicYearId, classId, name: { equals: sectionName, mode: "insensitive" } as any },
          select: { id: true },
        });
        if (!section) throw new Error(`Section "${sectionName}" not found for class "${className}"`);
        sectionId = section.id;
        sectionCache.set(sectionKey, sectionId);
      }

      const parts = fullNameValue.trim().split(/\s+/);
      const firstName = firstNameValue || parts[0];
      const lastName = lastNameValue || (parts.length > 1 ? parts[parts.length - 1] : "");
      const middleName = get(row, "middleName", "Middle Name", "MiddleName") || (parts.length > 2 ? parts.slice(1, -1).join(" ") : "");
      const gender = normalizeGender(get(row, "gender", "Gender", "Sex"));
      const dob = excelDate(get(row, "dob", "DOB", "Date of Birth", "Date of Birth (DD/MM/YYYY)", "Birth Date", "BirthDate"));
      if (!dob) throw new Error("Valid DOB is required");

      const suppliedAdmissionNo = get(row, "admissionNo", "AdmissionNumber", "Admission No", "Admission Number", "AdmissionNo", "Admission No.");
      const suppliedSrNo = get(row, "srNo", "SRN Number", "SR No", "SR Number", "SRN", "SR No.");
      const rollNumber = get(row, "rollNumber", "Roll Number", "Roll No", "RollNumber");
      const fatherName = get(row, "fatherName", "Father", "Father Name", "FatherName") || "N/A";
      const fatherPhone = get(row, "fatherPhone", "Father Phone", "Father Mobile", "Father Mobile No", "FatherPhone", "FatherMobile");
      const motherName = get(row, "motherName", "Mother", "Mother Name", "MotherName") || "N/A";
      const motherPhone = get(row, "motherPhone", "Mother Mobile", "Mother Mobile No", "MotherPhone", "MotherMobile", "SmsNo");
      const phone = get(row, "phone", "Mobile", "Phone", "Mobile Number", "MobileNo", "Student Mobile");
      const address = get(row, "address", "Present Address", "Address", "Permanent Address") || "N/A";
      const nationality = get(row, "nationality", "Nationality") || "Indian";
      const religion = get(row, "religion", "Religion");
      const category = get(row, "category", "Category");
      const aadharNo = get(row, "aadharNo", "Aadhaar No", "Aadhar No", "Child ID", "Aadhaar", "Aadhar").replace(/\s/g, "");
      const email = get(row, "email", "Email", "Email Address");

      if (options.dryRun) {
        successCount++;
        continue;
      }

      const result = await prisma.$transaction(async tx => {
        let student = suppliedAdmissionNo
          ? await tx.student.findFirst({ where: { tenantId, admissionNo: suppliedAdmissionNo, isDeleted: false } })
          : null;

        if (!student && !suppliedAdmissionNo && aadharNo) {
          student = await tx.student.findFirst({ where: { tenantId, aadharNo, isDeleted: false } });
        }

        let admissionNo = suppliedAdmissionNo;
        let srNo = suppliedSrNo;
        if (!student && !admissionNo) admissionNo = await generateAdmissionNumber(tenantId, academicYearId);
        if (!srNo) srNo = student?.srNo || await generateSrNumber(tenantId, admissionNo || undefined);

        const studentData: any = {
          firstName,
          middleName: middleName || null,
          lastName,
          fullName: fullNameValue.trim(),
          gender,
          dob,
          email: email || "N/A",
          phone: phone || "N/A",
          address,
          admissionNo: admissionNo || undefined,
          srNo: srNo || undefined,
          rollNumber: rollNumber || null,
          fatherName,
          fatherPhone: fatherPhone || "N/A",
          motherName,
          motherPhone: motherPhone || null,
          religion: religion || null,
          category: category || null,
          nationality,
          aadharNo: aadharNo || null,
          status: "active",
          medicalConditions: [],
          allergies: [],
          medications: [],
        };

        if (student) {
          student = await tx.student.update({ where: { id: student.id }, data: studentData });
        } else {
          student = await tx.student.create({
            data: {
              ...studentData,
              admissionDate: new Date(),
              admissionType: "bulk",
              isDeleted: false,
              tenant: { connect: { id: tenantId } },
              academicYear: { connect: { id: academicYearId } },
            },
          });
        }

        const existingEnrollment = await tx.enrollment.findFirst({ where: { tenantId, studentId: student.id, academicYearId } });
        if (existingEnrollment) {
          await tx.enrollment.update({ where: { id: existingEnrollment.id }, data: { classId, sectionId, rollNumber: rollNumber || null, status: "active" } as any });
        } else {
          await tx.enrollment.create({ data: { studentId: student.id, classId, sectionId, academicYearId, tenantId, rollNumber: rollNumber || null, status: "active" } as any });
        }
        return student;
      });

      imported.push(result.id);
      successCount++;
    } catch (error: any) {
      failedCount++;
      const message = error?.message || error?.error?.message || String(error) || "Import failed";
      errors.push({ row: rowNum, field: "general", message });
    }
  }

  return {
    totalRows: Math.max(0, sheet.rowCount - 1),
    checkedRows: Math.max(0, lastRow - 1),
    successCount,
    failedCount,
    errors,
    importedStudentIds: imported,
  };
}

export async function validateRealRmsExcel(tenantId: string, filePath: string, academicYearId: string, limit?: number, mapping?: Record<string, string>) {
  return importRealRmsExcel(tenantId, filePath, academicYearId, "system", { dryRun: true, maxRows: limit, mapping });
}
