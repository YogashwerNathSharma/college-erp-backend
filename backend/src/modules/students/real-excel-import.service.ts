import ExcelJS from "exceljs";
import prisma from "../../utils/prisma";

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
  const parts = s.split(/[\\/.\-]/).map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    const [d, m, y] = parts;
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
  }
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeGender(value: string): string {
  const v = value.toLowerCase();
  if (["m", "male", "boy"].includes(v)) return "Male";
  if (["f", "female", "girl"].includes(v)) return "Female";
  return "Other";
}

function splitClass(value: string): { className: string; sectionName: string } {
  const s = value.replace(/\s+/g, " ").trim();
  const match = s.match(/^(.*?)(?:\s+)([A-Za-z])$/);
  if (match) return { className: match[1].trim(), sectionName: match[2].trim() };
  return { className: s, sectionName: "" };
}

export async function importRealRmsExcel(
  tenantId: string,
  filePath: string,
  academicYearId: string,
  userId: string,
) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet("Student_List") || workbook.worksheets[0];
  if (!sheet) throw new Error("No worksheet found");

  const headers: Record<string, number> = {};
  sheet.getRow(1).eachCell((cell, col) => {
    headers[text(cell.value).toLowerCase()] = col;
  });
  const col = (...names: string[]) => names.map(n => headers[n.toLowerCase()]).find(Boolean);
  const get = (row: ExcelJS.Row, ...names: string[]) => {
    const n = col(...names);
    return n ? text(row.getCell(n).value) : "";
  };

  const academicYear = await prisma.academicYear.findFirst({ where: { id: academicYearId, tenantId } });
  if (!academicYear) throw new Error("Academic year not found for this school");

  const classCache = new Map<string, string>();
  const sectionCache = new Map<string, string>();
  const errors: any[] = [];
  const imported: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);
    const name = get(row, "Name");
    const classValue = get(row, "Class");
    if (!name && !classValue) continue;

    try {
      if (!name) throw new Error("Name is required");
      if (!classValue) throw new Error("Class is required");
      const { className, sectionName } = splitClass(classValue);
      if (!className || !sectionName) throw new Error(`Class must include section, e.g. LKG A (received: ${classValue})`);

      const cacheKey = `${className.toLowerCase()}|${academicYearId}`;
      let classId = classCache.get(cacheKey);
      if (!classId) {
        const cls = await prisma.class.findFirst({
          where: { tenantId, academicYearId, name: { equals: className, mode: "insensitive" } as any, isDeleted: false },
        });
        if (!cls) throw new Error(`Class "${className}" not found for selected academic year`);
        classId = cls.id;
        classCache.set(cacheKey, classId);
      }

      const sectionKey = `${classId}|${sectionName.toLowerCase()}`;
      let sectionId = sectionCache.get(sectionKey);
      if (!sectionId) {
        const section = await prisma.section.findFirst({
          where: { tenantId, academicYearId, classId, name: { equals: sectionName, mode: "insensitive" } as any },
        });
        if (!section) throw new Error(`Section "${sectionName}" not found for class "${className}"`);
        sectionId = section.id;
        sectionCache.set(sectionKey, sectionId);
      }

      const parts = name.trim().split(/\s+/);
      const firstName = get(row, "First Name") || parts[0];
      const lastName = get(row, "Last Name") || (parts.length > 1 ? parts[parts.length - 1] : "");
      const middleName = get(row, "Middle Name");
      const gender = normalizeGender(get(row, "Gender"));
      const dob = excelDate(get(row, "DOB", "Date of Birth", "Date of Birth (DD/MM/YYYY)"));
      if (!dob) throw new Error("Valid DOB is required");

      const admissionNo = get(row, "AdmissionNumber", "Admission No", "Admission Number");
      const srNo = get(row, "SRN Number", "SR No", "SR Number");
      const rollNumber = get(row, "roleNumber", "Roll Number", "Roll No");
      const fatherName = get(row, "Father", "Father Name") || "N/A";
      const motherName = get(row, "Mother", "Mother Name") || "N/A";
      const phone = get(row, "Mobile", "Phone");
      const motherPhone = get(row, "SmsNo", "Mother Phone");
      const address = get(row, "Present Address", "Address") || "N/A";
      const nationality = get(row, "Nationality") || "Indian";
      const religion = get(row, "Religion") || null;
      const category = get(row, "Category") || null;
      const aadharNo = get(row, "Aadhaar No", "Aadhar No", "Child ID").replace(/\s/g, "") || null;
      const permanentAddress = get(row, "Permanent Address") || null;
      const studentType = get(row, "StudentType", "Student Type") || null;
      const samagraId = get(row, "Samagra ID", "SamagraID") || null;
      const employmentCategory = get(row, "Employment Category") || null;
      const statusRaw = get(row, "Status");
      const status = statusRaw && statusRaw.toLowerCase() === "inactive" ? "inactive" : "active";

      // Custom fields JSON for extra data not in schema
      const customFields: Record<string, string> = {};
      if (studentType) customFields.studentType = studentType;
      if (samagraId) customFields.samagraId = samagraId;
      if (employmentCategory) customFields.employmentCategory = employmentCategory;
      if (permanentAddress) customFields.permanentAddress = permanentAddress;

      const result = await prisma.$transaction(async tx => {
        let student = admissionNo
          ? await tx.student.findFirst({ where: { tenantId, admissionNo, isDeleted: false } })
          : null;

        if (student) {
          student = await tx.student.update({
            where: { id: student.id },
            data: {
              firstName, middleName: middleName || null, lastName,
              fullName: name.trim(), gender, dob,
              phone: phone || null, address, fatherName, fatherPhone: phone || null,
              motherName, motherPhone: motherPhone || null, religion, category,
              nationality, aadharNo, status, updatedAt: new Date(),
              ...(Object.keys(customFields).length > 0 && { customFields }),
            },
          });
        } else {
          student = await tx.student.create({
            data: {
              firstName, middleName: middleName || null, lastName,
              fullName: name.trim(), gender, dob,
              phone: phone || null, address, fatherName, fatherPhone: phone || "N/A",
              motherName, motherPhone: motherPhone || null, religion, category,
              nationality, aadharNo, admissionNo: admissionNo || undefined,
              srNo: srNo || undefined, admissionDate: new Date(), admissionType: "bulk",
              status, isDeleted: false, createdBy: userId,
              ...(Object.keys(customFields).length > 0 && { customFields }),
              tenant: { connect: { id: tenantId } },
              academicYear: { connect: { id: academicYearId } },
            },
          });
        }

        const existingEnrollment = await tx.enrollment.findFirst({
          where: { tenantId, studentId: student.id, academicYearId },
        });
        if (existingEnrollment) {
          await tx.enrollment.update({ where: { id: existingEnrollment.id }, data: { classId, sectionId, rollNumber: rollNumber || null, status: "active", isDeleted: false } });
        } else {
          await tx.enrollment.create({ data: { studentId: student.id, classId, sectionId, academicYearId, tenantId, rollNumber: rollNumber || null, status: "active" } });
        }
        return student;
      });

      imported.push(result.id);
      successCount++;
    } catch (error: any) {
      failedCount++;
      errors.push({ row: rowNum, message: error?.message || "Import failed" });
    }
  }

  return { totalRows: sheet.rowCount - 1, successCount, failedCount, errors, importedStudentIds: imported };
}
