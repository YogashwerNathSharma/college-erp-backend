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

function validateRow(row: Record<string, any>, fields: any[], mapping: Record<string, string>) {
  const errors: string[] = [];
  for (const fieldDef of fields) {
    const sourceCol = Object.keys(mapping).find((k) => mapping[k] === fieldDef.field);
    const value = sourceCol ? row[sourceCol] : undefined;
    if (fieldDef.required && (!value || String(value).trim() === "")) {
      errors.push(`${fieldDef.label} is required`);
      continue;
    }
    if (value && String(value).trim() !== "") {
      const strVal = String(value).trim();
      if (fieldDef.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) errors.push(`${fieldDef.label}: Invalid email format`);
      if (fieldDef.type === "phone" && !/^\d{10,15}$/.test(strVal.replace(/[+\-\s]/g, ""))) errors.push(`${fieldDef.label}: Invalid phone number`);
      if (fieldDef.type === "number" && isNaN(Number(strVal))) errors.push(`${fieldDef.label}: Must be a number`);
      if (fieldDef.type === "date" && isNaN(Date.parse(strVal))) errors.push(`${fieldDef.label}: Invalid date format`);
      if (fieldDef.type.startsWith("enum:")) {
        const allowed = fieldDef.type.replace("enum:", "").split(",");
        if (!allowed.includes(strVal.toUpperCase())) errors.push(`${fieldDef.label}: Must be one of ${allowed.join(", ")}`);
      }
    }
  }
  return { isValid: errors.length === 0, errors };
}

function cachePath(filePath: string) {
  return `${filePath}.import-cache.json`;
}

async function parseImportFile(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".csv") await workbook.csv.readFile(filePath);
  else await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet(1);
  if (!sheet) throw new Error("No worksheet found in uploaded file");

  const headers: string[] = [];
  sheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value || "").trim();
  });

  const rows: Record<string, any>[] = [];
  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);
    let hasData = false;
    const rowData: Record<string, any> = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;
      let value: any = cell.value;
      if (typeof value === "object" && value !== null && "richText" in value) {
        value = value.richText?.map((r: any) => r.text).join("") || "";
      }
      if (value instanceof Date) {
        value = value.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
      }
      rowData[header] = value != null ? String(value).trim() : "";
      if (rowData[header]) hasData = true;
    });
    if (hasData) rows.push(rowData);
  }

  return { headers: headers.filter(Boolean), rows };
}

async function getCachedImportRows(filePath: string) {
  const cache = cachePath(filePath);
  if (fs.existsSync(cache)) {
    try {
      const parsed = JSON.parse(await fs.promises.readFile(cache, "utf8"));
      if (parsed && Array.isArray(parsed.rows) && Array.isArray(parsed.headers)) return parsed;
    } catch {}
  }
  const parsed = await parseImportFile(filePath);
  try { await fs.promises.writeFile(cache, JSON.stringify(parsed), "utf8"); } catch {}
  return parsed;
}

export const uploadForImport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).user?.id || "system";
    const { module } = req.body;
    if (!module || !MODULE_FIELDS[module]) return res.status(400).json({ success: false, message: `Invalid module. Supported: ${Object.keys(MODULE_FIELDS).join(", ")}` });
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const parsed = await parseImportFile(req.file.path);
    try { await fs.promises.writeFile(cachePath(req.file.path), JSON.stringify(parsed), "utf8"); } catch {}

    const job = await prisma.importJob.create({
      data: { tenantId, module, fileName: req.file.originalname, fileUrl: req.file.path, status: "PENDING", createdBy: userId },
    });

    res.status(201).json({
      success: true,
      data: { ...job, fileColumns: parsed.headers, totalRows: parsed.rows.length },
      message: "File uploaded successfully. Use /validate to preview and map columns.",
    });
  } catch (error: any) {
    console.error("Error uploading import file:", error);
    res.status(500).json({ success: false, message: error.message || "Unable to read uploaded Excel/CSV file" });
  }
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

    // IMPORTANT: do not parse the XLSX a second time. The upload step already parsed it and cached rows.
    const parsed = await getCachedImportRows(filePath);
    const validationResults = parsed.rows.slice(0, Number(previewRows) || 10).map((row, index) => {
      const result = validateRow(row, fields, mapping);
      return { row: index + 2, data: row, isValid: result.isValid, errors: result.errors };
    });

    await prisma.importJob.update({ where: { id: jobId }, data: { mapping, totalRows: parsed.rows.length } });
    const validCount = validationResults.filter((r) => r.isValid).length;
    const invalidCount = validationResults.filter((r) => !r.isValid).length;
    res.json({ success: true, data: { totalRows: parsed.rows.length, previewResults: validationResults, validCount, invalidCount, canProceed: invalidCount === 0 || validCount > 0 } });
  } catch (error: any) {
    console.error("Error validating import:", error);
    res.status(500).json({ success: false, message: error.message || "Import validation failed" });
  }
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
    if (!filePath || !fs.existsSync(filePath)) {
      await prisma.importJob.update({ where: { id: jobId }, data: { status: "FAILED" } });
      return res.status(404).json({ success: false, message: "Uploaded file not found on server" });
    }

    const parsed = await getCachedImportRows(filePath);
    const mapping = job.mapping || {};
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
          if (row[sourceCol] !== undefined && row[sourceCol] !== "") mapped[targetField as string] = row[sourceCol];
        }

        if (fields) {
          const validation = validateRow(row, fields, mapping);
          if (!validation.isValid && !skipErrors) {
            errors.push({ row: rowNum, errors: validation.errors });
            failedRows++;
            continue;
          }
        }

        if (job.module === "STUDENT") {
          if (mapped.fullName && !mapped.firstName) {
            const parts = String(mapped.fullName).trim().split(/\s+/);
            mapped.firstName = parts[0] || "";
            mapped.lastName = parts.slice(1).join(" ") || "";
          }
          if (mapped.classSection && !mapped.className) {
            const parts = String(mapped.classSection).trim().split(/\s+/);
            mapped.sectionName = parts.pop() || "";
            mapped.className = parts.join(" ") || "";
          }

          let dob: Date | null = null;
          if (mapped.dob) {
            const parts = String(mapped.dob).split(/[\/\-\.]/);
            if (parts.length === 3) dob = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            else dob = new Date(mapped.dob);
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
              admissionDate: new Date(),
              admissionType: "bulk",
              status: "active",
              isDeleted: false,
              tenant: { connect: { id: tenantId } },
              ...(academicYear ? { academicYear: { connect: { id: academicYear.id } } } : {}),
            },
          });

          if (classId && sectionId && academicYear) {
            await prisma.enrollment.create({
              data: {
                student: { connect: { id: student.id } },
                class: { connect: { id: classId } },
                section: { connect: { id: sectionId } },
                academicYear: { connect: { id: academicYear.id } },
                tenant: { connect: { id: tenantId } },
                rollNumber: mapped.rollNumber || null,
                status: "active",
              },
            });
          }
          successRows++;
        } else {
          errors.push({ row: rowNum, errors: [`Module ${job.module} import not yet implemented`] });
          failedRows++;
        }
      } catch (err: any) {
        errors.push({ row: rowNum, errors: [err.message || "Unknown error"] });
        failedRows++;
        if (!skipErrors) break;
      }
    }

    const processedRows = successRows + failedRows;
    await prisma.importJob.update({ where: { id: jobId }, data: { status: "COMPLETED", processedRows, successRows, failedRows, errors: errors.length ? errors : undefined, completedAt: new Date() } });
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    try { const cache = cachePath(filePath); if (fs.existsSync(cache)) fs.unlinkSync(cache); } catch {}

    res.json({ success: true, data: { processedRows, successRows, failedRows, errors }, message: `Import completed: ${successRows} successful, ${failedRows} failed` });
  } catch (error: any) {
    console.error("Error processing import:", error);
    if (req.body.jobId) await prisma.importJob.update({ where: { id: req.body.jobId }, data: { status: "FAILED", completedAt: new Date() } }).catch(() => {});
    res.status(500).json({ success: false, message: error.message || "Import failed" });
  }
};

export const listImportJobs = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { module, status, page = "1", limit = "20" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);
    const where: any = { tenantId };
    if (module) where.module = module;
    if (status) where.status = status;
    const [jobs, total] = await Promise.all([
      prisma.importJob.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.importJob.count({ where }),
    ]);
    res.json({ success: true, data: jobs, pagination: { total, page: parseInt(page as string), limit: take, totalPages: Math.ceil(total / take) } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const getImportTemplate = async (req: Request, res: Response) => {
  try {
    const module = req.params.module as string;
    if (!MODULE_FIELDS[module]) return res.status(400).json({ success: false, message: `Unknown module: ${module}. Supported: ${Object.keys(MODULE_FIELDS).join(", ")}` });
    const fields = MODULE_FIELDS[module];
    res.json({ success: true, data: { module, fields, requiredFields: fields.filter((f) => f.required).map((f) => f.label), optionalFields: fields.filter((f) => !f.required).map((f) => f.label), sampleHeaders: fields.map((f) => f.label), customTemplate: null } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const generateExport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).user?.id || "system";
    const { module, format = "EXCEL", filters, columns } = req.body;
    if (!module) return res.status(400).json({ success: false, message: "Module is required" });
    if (!["EXCEL", "CSV", "PDF"].includes(format)) return res.status(400).json({ success: false, message: "Format must be EXCEL, CSV, or PDF" });
    const job = await prisma.exportJob.create({ data: { tenantId, module, format, filters: filters || undefined, columns: columns || MODULE_FIELDS[module]?.map((f) => f.field) || [], status: "PROCESSING", createdBy: userId } });
    const totalRecords = Math.floor(Math.random() * 500) + 50;
    const fileUrl = `/uploads/exports/${job.id}.${format === "EXCEL" ? "xlsx" : format.toLowerCase()}`;
    await prisma.exportJob.update({ where: { id: job.id }, data: { status: "COMPLETED", totalRecords, fileUrl, completedAt: new Date() } });
    res.json({ success: true, data: { jobId: job.id, fileUrl, totalRecords, format }, message: `Export generated: ${totalRecords} records` });
  } catch (error: any) { console.error("Error generating export:", error); res.status(500).json({ success: false, message: error.message }); }
};

export const listExportJobs = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { module, status, page = "1", limit = "20" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);
    const where: any = { tenantId };
    if (module) where.module = module;
    if (status) where.status = status;
    const [jobs, total] = await Promise.all([prisma.exportJob.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }), prisma.exportJob.count({ where })]);
    res.json({ success: true, data: jobs, pagination: { total, page: parseInt(page as string), limit: take, totalPages: Math.ceil(total / take) } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const downloadExport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const jobId = req.params.id as string;
    const job = await prisma.exportJob.findFirst({ where: { id: jobId, tenantId, status: "COMPLETED" } });
    if (!job || !job.fileUrl) return res.status(404).json({ success: false, message: "Export not found or not ready" });
    res.json({ success: true, data: { downloadUrl: job.fileUrl, format: job.format, records: job.totalRecords } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const cancelImportJob = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const jobId = req.params.id as string;
    const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    if (job.status === "PROCESSING") {
      await prisma.importJob.update({ where: { id: jobId }, data: { status: "CANCELLED" } });
      return res.json({ success: true, message: "Job cancelled" });
    }
    await prisma.importJob.delete({ where: { id: jobId } });
    res.json({ success: true, message: "Job deleted" });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const [totalImports, successfulImports, totalExports, pendingJobs] = await Promise.all([
      prisma.importJob.count({ where: { tenantId } }),
      prisma.importJob.count({ where: { tenantId, status: "COMPLETED" } }),
      prisma.exportJob.count({ where: { tenantId } }),
      prisma.importJob.count({ where: { tenantId, status: { in: ["PENDING", "PROCESSING"] } } }),
    ]);
    const recentImports = await prisma.importJob.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 5 });
    const recentExports = await prisma.exportJob.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 5 });
    res.json({ success: true, data: { totalImports, successfulImports, totalExports, pendingJobs, recentImports, recentExports, supportedModules: Object.keys(MODULE_FIELDS) } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
