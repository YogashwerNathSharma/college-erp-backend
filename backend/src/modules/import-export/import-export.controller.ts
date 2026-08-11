// @ts-nocheck
import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

const MODULE_FIELDS: Record<string, { field: string; label: string; required: boolean; type: string }[]> = {
  STUDENT: [
    { field: "fullName", label: "Name", required: true, type: "string" },
    { field: "firstName", label: "First Name", required: false, type: "string" },
    { field: "lastName", label: "Last Name", required: false, type: "string" },
    { field: "admissionNo", label: "Admission Number", required: true, type: "string" },
    { field: "email", label: "Email", required: false, type: "email" },
    { field: "phone", label: "Phone", required: false, type: "phone" },
    { field: "dob", label: "Date of Birth", required: false, type: "date" },
    { field: "gender", label: "Gender", required: false, type: "string" },
    { field: "fatherName", label: "Father's Name", required: false, type: "string" },
    { field: "motherName", label: "Mother's Name", required: false, type: "string" },
    { field: "className", label: "Class", required: false, type: "string" },
    { field: "classSection", label: "Class & Section", required: false, type: "string" },
    { field: "rollNumber", label: "Roll Number", required: false, type: "string" },
    { field: "sectionName", label: "Section", required: true, type: "string" },
    { field: "address", label: "Address", required: false, type: "string" },
    { field: "city", label: "City", required: false, type: "string" },
    { field: "state", label: "State", required: false, type: "string" },
    { field: "pincode", label: "Pincode", required: false, type: "string" },
    { field: "bloodGroup", label: "Blood Group", required: false, type: "string" },
    { field: "category", label: "Category", required: false, type: "string" },
    { field: "religion", label: "Religion", required: false, type: "string" },
    { field: "nationality", label: "Nationality", required: false, type: "string" },
    { field: "aadharNo", label: "Aadhar Number", required: false, type: "string" },
  ],
  TEACHER: [
    { field: "firstName", label: "First Name", required: true, type: "string" },
    { field: "lastName", label: "Last Name", required: true, type: "string" },
    { field: "email", label: "Email", required: true, type: "email" },
    { field: "phone", label: "Phone", required: true, type: "phone" },
    { field: "employeeId", label: "Employee ID", required: true, type: "string" },
    { field: "department", label: "Department", required: true, type: "string" },
    { field: "designation", label: "Designation", required: false, type: "string" },
    { field: "qualification", label: "Qualification", required: false, type: "string" },
    { field: "experience", label: "Experience (Years)", required: false, type: "number" },
    { field: "dob", label: "Date of Birth", required: false, type: "date" },
    { field: "gender", label: "Gender", required: true, type: "enum:MALE,FEMALE,OTHER" },
    { field: "joiningDate", label: "Joining Date", required: true, type: "date" },
    { field: "salary", label: "Basic Salary", required: false, type: "number" },
    { field: "address", label: "Address", required: false, type: "string" },
  ],
  FEE_STRUCTURE: [
    { field: "className", label: "Class", required: true, type: "string" },
    { field: "feeHead", label: "Fee Head", required: true, type: "string" },
    { field: "amount", label: "Amount", required: true, type: "number" },
    { field: "frequency", label: "Frequency", required: true, type: "enum:MONTHLY,QUARTERLY,HALF_YEARLY,YEARLY,ONE_TIME" },
    { field: "dueDate", label: "Due Date", required: false, type: "date" },
  ],
  BOOK: [
    { field: "title", label: "Title", required: true, type: "string" },
    { field: "author", label: "Author", required: true, type: "string" },
    { field: "isbn", label: "ISBN", required: false, type: "string" },
    { field: "publisher", label: "Publisher", required: false, type: "string" },
    { field: "category", label: "Category", required: true, type: "string" },
    { field: "quantity", label: "Quantity", required: true, type: "number" },
    { field: "price", label: "Price", required: false, type: "number" },
    { field: "rackNumber", label: "Rack Number", required: false, type: "string" },
    { field: "edition", label: "Edition", required: false, type: "string" },
    { field: "language", label: "Language", required: false, type: "string" },
  ],
  ASSET: [
    { field: "name", label: "Item Name", required: true, type: "string" },
    { field: "category", label: "Category", required: true, type: "string" },
    { field: "serialNumber", label: "Serial Number", required: false, type: "string" },
    { field: "quantity", label: "Quantity", required: true, type: "number" },
    { field: "unitPrice", label: "Unit Price", required: false, type: "number" },
    { field: "location", label: "Location", required: false, type: "string" },
    { field: "condition", label: "Condition", required: false, type: "enum:NEW,GOOD,FAIR,DAMAGED" },
    { field: "purchaseDate", label: "Purchase Date", required: false, type: "date" },
    { field: "vendor", label: "Vendor", required: false, type: "string" },
  ],
  MARKS: [
    { field: "admissionNo", label: "Admission Number", required: true, type: "string" },
    { field: "studentName", label: "Student Name", required: false, type: "string" },
    { field: "examName", label: "Exam Name", required: true, type: "string" },
    { field: "subjectName", label: "Subject", required: true, type: "string" },
    { field: "marksObtained", label: "Marks Obtained", required: true, type: "number" },
    { field: "maxMarks", label: "Max Marks", required: true, type: "number" },
    { field: "practicalMarks", label: "Practical Marks", required: false, type: "number" },
    { field: "grade", label: "Grade", required: false, type: "string" },
  ],
};

const FIELD_ALIASES: Record<string, Record<string, string[]>> = {
  STUDENT: {
    fullName: ["name", "studentname", "studentfullname", "fullname", "student", "student_name"],
    firstName: ["firstname", "fname", "studentfirstname", "studentfname"],
    lastName: ["lastname", "lname", "studentlastname", "studentlname", "surname", "familyname"],
    admissionNo: ["admissionno", "admissionnumber", "admno", "admnumber", "admissionid", "studentid", "enrollmentno"],
    email: ["email", "emailid", "studentemail", "studentemailid", "mail"],
    phone: ["phone", "mobile", "mobileno", "mobilenumber", "contact", "contactno", "contactnumber", "phonenumber", "studentphone"],
    dob: ["dob", "dateofbirth", "birthdate", "birthdateofstudent", "datebirth"],
    gender: ["gender", "sex", "studentgender"],
    fatherName: ["fathername", "father", "fathersname", "fatherfullname", "guardianfathername"],
    motherName: ["mothername", "mother", "mothersname", "motherfullname"],
    className: ["class", "classname", "grade", "standard", "std", "classno", "classnumber"],
    classSection: ["classsection", "classandsection", "class_section", "classsec"],
    rollNumber: ["rollno", "rollnumber", "roll", "studentrollno", "classrollno"],
    sectionName: ["section", "sectionname", "sec", "sectionno", "sectionnumber"],
    address: ["address", "fulladdress", "residentialaddress", "homeaddress", "postaladdress"],
    city: ["city", "town"],
    state: ["state", "statename"],
    pincode: ["pincode", "pin", "pinno", "zipcode", "postalcode", "postalpin"],
    bloodGroup: ["bloodgroup", "bloodgrp", "blood", "bloodgroupname"],
    category: ["category", "studentcategory", "castecategory", "cat"],
    religion: ["religion", "religionname"],
    nationality: ["nationality", "nationalityname", "country"],
    aadharNo: ["aadhar", "aadhaar", "aadharno", "aadhaarno", "aadharnumber", "aadhaarnumber", "uid"],
    srNo: ["srno", "serialno", "serialnumber", "sno", "snumber"],
    medicalConditions: ["medicalconditions", "medicalcondition", "medicalhistory"],
    allergies: ["allergies", "allergy"],
    medications: ["medications", "medication", "medicines", "medicine"],
  },
};

function normalizeHeader(value: any): string {
  return String(value ?? "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

function canonicalizeMapping(module: string, headers: string[], incomingMapping: Record<string, string> = {}): Record<string, string> {
  const fields = MODULE_FIELDS[module] || [];
  const validFields = new Set(fields.map((f) => f.field));
  const aliases = FIELD_ALIASES[module] || {};
  const aliasLookup = new Map<string, string>();

  for (const field of fields) {
    aliasLookup.set(normalizeHeader(field.field), field.field);
    aliasLookup.set(normalizeHeader(field.label), field.field);
    for (const alias of aliases[field.field] || []) aliasLookup.set(normalizeHeader(alias), field.field);
  }

  const result: Record<string, string> = {};
  for (const header of headers) {
    if (!header) continue;
    const explicit = incomingMapping[header];
    if (explicit && validFields.has(explicit)) {
      result[header] = explicit;
      continue;
    }
    const normalized = normalizeHeader(header);
    const inferred = aliasLookup.get(normalized);
    if (inferred) result[header] = inferred;
  }
  return result;
}

function validateRow(row: Record<string, any>, fields: { field: string; label: string; required: boolean; type: string }[], mapping: Record<string, string>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const fieldDef of fields) {
    const sourceCol = Object.keys(mapping).find((k) => mapping[k] === fieldDef.field);
    const value = sourceCol ? row[sourceCol] : undefined;

    // A student can provide either a single Name column or First Name + Last Name.
    if (fieldDef.field === "fullName" && (!value || String(value).trim() === "")) {
      const firstCol = Object.keys(mapping).find((k) => mapping[k] === "firstName");
      const lastCol = Object.keys(mapping).find((k) => mapping[k] === "lastName");
      if ((firstCol && row[firstCol]) || (lastCol && row[lastCol])) continue;
    }

    // A Class & Section column is enough to derive both values for Student import.
    if (fieldDef.field === "sectionName" && (!value || String(value).trim() === "")) {
      const classSectionCol = Object.keys(mapping).find((k) => mapping[k] === "classSection");
      if (classSectionCol && row[classSectionCol]) continue;
    }

    if (fieldDef.required && (!value || String(value).trim() === "")) {
      errors.push(`${fieldDef.label} is required`);
      continue;
    }
    if (value && value.toString().trim() !== "") {
      const strVal = String(value).trim();
      if (fieldDef.type === "email" && !/^([^\s@]+)@([^\s@]+\.[^\s@]+)$/.test(strVal)) errors.push(`${fieldDef.label}: Invalid email format`);
      if (fieldDef.type === "phone" && !/^\d{10,15}$/.test(strVal.replace(/[+\-\s]/g, ""))) errors.push(`${fieldDef.label}: Invalid phone number`);
      if (fieldDef.type === "number" && isNaN(Number(strVal))) errors.push(`${fieldDef.label}: Must be a number`);
      if (fieldDef.type === "date" && isNaN(Date.parse(strVal))) errors.push(`${fieldDef.label}: Invalid date format`);
      if (fieldDef.type.startsWith("enum:")) {
        const allowedValues = fieldDef.type.replace("enum:", "").split(",");
        if (!allowedValues.includes(strVal.toUpperCase())) errors.push(`${fieldDef.label}: Must be one of ${allowedValues.join(", ")}`);
      }
    }
  }
  return { isValid: errors.length === 0, errors };
}

async function readImportRows(filePath: string): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  const workbook = new ExcelJS.Workbook();
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".csv") await workbook.csv.readFile(filePath); else await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet(1);
  if (!sheet) throw new Error("No worksheet found in file");

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => { headers[colNumber] = String(cell.value || "").trim(); });

  const rows: Record<string, any>[] = [];
  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);
    let hasData = false;
    const rowData: Record<string, any> = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;
      let value = cell.value;
      if (typeof value === "object" && value !== null && "richText" in value) value = (value as any).richText?.map((r: any) => r.text).join("") || "";
      if (value instanceof Date) value = value.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
      rowData[header] = value != null ? String(value).trim() : "";
      if (rowData[header]) hasData = true;
    });
    if (hasData) rows.push(rowData);
  }
  return { headers, rows };
}

export const uploadForImport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).user?.id || "system";
    const { module } = req.body;
    if (!module || !MODULE_FIELDS[module]) return res.status(400).json({ success: false, message: `Invalid module. Supported: ${Object.keys(MODULE_FIELDS).join(", ")}` });
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const job = await prisma.importJob.create({ data: { tenantId, module, fileName: req.file.originalname, fileUrl: req.file.path, status: "PENDING", createdBy: userId } });
    let fileColumns: string[] = [];
    try {
      const parsed = await readImportRows(req.file.path);
      fileColumns = parsed.headers.filter(Boolean);
    } catch {}
    res.status(201).json({ success: true, data: { ...job, fileColumns }, message: "File uploaded. Use /validate to preview and map columns." });
  } catch (error: any) { console.error("Error uploading import file:", error); res.status(500).json({ success: false, message: error.message }); }
};

export const validateImport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { jobId, mapping, previewRows = 10 } = req.body;
    if (!jobId || !mapping) return res.status(400).json({ success: false, message: "jobId and mapping are required" });
    const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) return res.status(404).json({ success: false, message: "Import job not found" });
    const fields = MODULE_FIELDS[job.module];
    if (!fields) return res.status(400).json({ success: false, message: "Unknown module" });
    const filePath = job.fileUrl;
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ success: false, message: "Uploaded file not found on server" });

    const parsed = await readImportRows(filePath);
    const normalizedMapping = canonicalizeMapping(job.module, parsed.headers.filter(Boolean), mapping);
    const validationResults = parsed.rows.slice(0, previewRows).map((row, index) => {
      const result = validateRow(row, fields, normalizedMapping);
      return { row: index + 2, data: row, isValid: result.isValid, errors: result.errors };
    });

    await prisma.importJob.update({ where: { id: jobId }, data: { mapping: normalizedMapping, totalRows: parsed.rows.length } });
    const validCount = validationResults.filter((r) => r.isValid).length;
    const invalidCount = validationResults.filter((r) => !r.isValid).length;
    res.json({ success: true, data: { totalRows: parsed.rows.length, previewResults: validationResults, validCount, invalidCount, canProceed: invalidCount === 0 || validCount > 0, mapping: normalizedMapping } });
  } catch (error: any) { console.error("Error validating import:", error); res.status(500).json({ success: false, message: error.message }); }
};

export const processImport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { jobId, skipErrors = true } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: "jobId is required" });
    const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId, status: "PENDING" } });
    if (!job) return res.status(404).json({ success: false, message: "Job not found or already processed" });
    await prisma.importJob.update({ where: { id: jobId }, data: { status: "PROCESSING", startedAt: new Date() } });

    const filePath = job.fileUrl;
    if (!filePath || !fs.existsSync(filePath)) { await prisma.importJob.update({ where: { id: jobId }, data: { status: "FAILED" } }); return res.status(404).json({ success: false, message: "Uploaded file not found on server" }); }

    const parsed = await readImportRows(filePath);
    const mapping = canonicalizeMapping(job.module, parsed.headers.filter(Boolean), job.mapping || {});
    const fields = MODULE_FIELDS[job.module];
    let successRows = 0;
    let failedRows = 0;
    const errors: any[] = [];

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const rowNum = i + 2;
      try {
        const mapped: Record<string, any> = {};
        for (const [sourceCol, targetField] of Object.entries(mapping)) {
          if (row[sourceCol] !== undefined && row[sourceCol] !== "") mapped[targetField] = row[sourceCol];
        }

        if (fields) {
          const validation = validateRow(row, fields, mapping);
          if (!validation.isValid) {
            errors.push({ row: rowNum, errors: validation.errors });
            failedRows++;
            if (!skipErrors) break;
            continue;
          }
        }

        if (job.module === "STUDENT") {
          if (mapped.fullName && !mapped.firstName) {
            const nameParts = mapped.fullName.trim().split(/\s+/);
            mapped.firstName = nameParts[0] || "";
            mapped.lastName = nameParts.slice(1).join(" ") || "";
          }
          if ((mapped.firstName || mapped.lastName) && !mapped.fullName) mapped.fullName = `${mapped.firstName || ""} ${mapped.lastName || ""}`.trim();
          if (mapped.classSection && !mapped.className) {
            const parts = mapped.classSection.trim().split(/\s+/);
            mapped.sectionName = parts.pop() || "";
            mapped.className = parts.join(" ") || "";
          }

          let dob: Date | null = null;
          if (mapped.dob) {
            const parts = String(mapped.dob).split(/[\/\-\.]/);
            if (parts.length === 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1;
              const year = parseInt(parts[2]);
              dob = new Date(year, month, day);
            } else dob = new Date(mapped.dob);
            if (isNaN(dob.getTime())) dob = null;
          }

          let classId: string | null = null;
          let sectionId: string | null = null;
          if (mapped.className) {
            const classRecord = await prisma.class.findFirst({ where: { tenantId, name: { equals: mapped.className, mode: "insensitive" } } });
            if (classRecord) classId = classRecord.id;
          }
          if (mapped.sectionName && classId) {
            const sectionRecord = await prisma.section.findFirst({ where: { tenantId, name: { equals: mapped.sectionName, mode: "insensitive" }, classId } });
            if (sectionRecord) sectionId = sectionRecord.id;
          }

          const academicYear = await prisma.academicYear.findFirst({ where: { tenantId, isActive: true } });
          let gender = "OTHER";
          if (mapped.gender) {
            const g = String(mapped.gender).toUpperCase();
            if (g === "MALE" || g === "M") gender = "MALE";
            else if (g === "FEMALE" || g === "F") gender = "FEMALE";
          }

          const firstName = mapped.firstName || "";
          const lastName = mapped.lastName || "";
          const toArray = (value: any): string[] => value ? String(value).split(/[,;|]/).map((v) => v.trim()).filter(Boolean) : [];

          const student = await prisma.student.create({
            data: {
              firstName,
              lastName,
              fullName: `${firstName} ${lastName}`.trim(),
              gender,
              dob: dob || new Date(),
              email: mapped.email || null,
              phone: mapped.phone || null,
              address: mapped.address || [mapped.city, mapped.state, mapped.pincode].filter(Boolean).join(", ") || "N/A",
              admissionNo: mapped.admissionNo || `IMP-${Date.now()}-${i}`,
              srNo: mapped.srNo || null,
              rollNumber: mapped.rollNumber || null,
              fatherName: mapped.fatherName || "N/A",
              motherName: mapped.motherName || "N/A",
              fatherPhone: mapped.phone || "N/A",
              aadharNo: mapped.aadharNo || null,
              bloodGroup: mapped.bloodGroup || null,
              category: mapped.category || null,
              nationality: mapped.nationality || "Indian",
              medicalConditions: toArray(mapped.medicalConditions),
              allergies: toArray(mapped.allergies),
              medications: toArray(mapped.medications),
              admissionDate: new Date(),
              admissionType: "bulk",
              status: "active",
              isDeleted: false,
              tenant: { connect: { id: tenantId } },
              ...(academicYear ? { academicYear: { connect: { id: academicYear.id } } } : {}),
            },
          });

          if (classId && sectionId && academicYear) {
            await prisma.enrollment.create({ data: { student: { connect: { id: student.id } }, class: { connect: { id: classId } }, section: { connect: { id: sectionId } }, academicYear: { connect: { id: academicYear.id } }, tenant: { connect: { id: tenantId } }, rollNumber: mapped.rollNumber || null, status: "active" } });
          }
          successRows++;
        } else {
          errors.push({ row: rowNum, errors: [`Module ${job.module} import not yet implemented`] });
          failedRows++;
        }
      } catch (err: any) {
        const message = err?.message || "Unknown error";
        errors.push({ row: rowNum, errors: [message] });
        failedRows++;
        if (!skipErrors) break;
      }
    }

    const processedRows = successRows + failedRows;
    await prisma.importJob.update({ where: { id: jobId }, data: { status: "COMPLETED", processedRows, successRows, failedRows, errors: errors.length > 0 ? errors : undefined, completedAt: new Date() } });
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    res.json({ success: true, data: { processedRows, successRows, failedRows, errors }, message: `Import completed: ${successRows} successful, ${failedRows} failed` });
  } catch (error: any) {
    console.error("Error processing import:", error);
    if (req.body.jobId) await prisma.importJob.update({ where: { id: req.body.jobId }, data: { status: "FAILED", completedAt: new Date() } }).catch(() => {});
    res.status(500).json({ success: false, message: error.message });
  }
};
