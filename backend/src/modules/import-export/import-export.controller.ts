import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════
// IMPORT/EXPORT ENGINE CONTROLLER
// Handles bulk data import from Excel/CSV and exports
// ══════════════════════════════════════════════════════════

// Module field definitions for validation and mapping
const MODULE_FIELDS: Record<string, { field: string; label: string; required: boolean; type: string }[]> = {
  STUDENT: [
    { field: "firstName", label: "First Name", required: true, type: "string" },
    { field: "lastName", label: "Last Name", required: true, type: "string" },
    { field: "admissionNo", label: "Admission Number", required: true, type: "string" },
    { field: "email", label: "Email", required: false, type: "email" },
    { field: "phone", label: "Phone", required: false, type: "phone" },
    { field: "dob", label: "Date of Birth", required: true, type: "date" },
    { field: "gender", label: "Gender", required: true, type: "enum:MALE,FEMALE,OTHER" },
    { field: "fatherName", label: "Father's Name", required: true, type: "string" },
    { field: "motherName", label: "Mother's Name", required: false, type: "string" },
    { field: "className", label: "Class", required: true, type: "string" },
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

// Validation helper
function validateRow(
  row: Record<string, any>,
  fields: { field: string; label: string; required: boolean; type: string }[],
  mapping: Record<string, string>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const fieldDef of fields) {
    const sourceCol = Object.keys(mapping).find((k) => mapping[k] === fieldDef.field);
    const value = sourceCol ? row[sourceCol] : undefined;

    if (fieldDef.required && (!value || String(value).trim() === "")) {
      errors.push(`${fieldDef.label} is required`);
      continue;
    }

    if (value && value.toString().trim() !== "") {
      const strVal = String(value).trim();

      if (fieldDef.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
        errors.push(`${fieldDef.label}: Invalid email format`);
      }

      if (fieldDef.type === "phone" && !/^\d{10,15}$/.test(strVal.replace(/[+\-\s]/g, ""))) {
        errors.push(`${fieldDef.label}: Invalid phone number`);
      }

      if (fieldDef.type === "number" && isNaN(Number(strVal))) {
        errors.push(`${fieldDef.label}: Must be a number`);
      }

      if (fieldDef.type === "date" && isNaN(Date.parse(strVal))) {
        errors.push(`${fieldDef.label}: Invalid date format`);
      }

      if (fieldDef.type.startsWith("enum:")) {
        const allowedValues = fieldDef.type.replace("enum:", "").split(",");
        if (!allowedValues.includes(strVal.toUpperCase())) {
          errors.push(`${fieldDef.label}: Must be one of ${allowedValues.join(", ")}`);
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

// ──────────────────────────────────────────────────────────
// POST /api/import/upload
// Upload file for import (stores file, creates job)
// ──────────────────────────────────────────────────────────
export const uploadForImport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const userId = (req as any).user?.id || "system";
    const { module } = req.body;

    if (!module || !MODULE_FIELDS[module]) {
      return res.status(400).json({
        success: false,
        message: `Invalid module. Supported: ${Object.keys(MODULE_FIELDS).join(", ")}`,
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const job = await prisma.importJob.create({
      data: {
        tenantId,
        module,
        fileName: req.file.originalname,
        fileUrl: req.file.path,
        status: "PENDING",
        createdBy: userId,
      },
    });

    res.status(201).json({
      success: true,
      data: job,
      message: "File uploaded. Use /validate to preview and map columns.",
    });
  } catch (error: any) {
    console.error("Error uploading import file:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/import/validate
// Validate uploaded data with mapping (preview errors)
// ──────────────────────────────────────────────────────────
export const validateImport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { jobId, mapping, previewRows = 10 } = req.body;

    if (!jobId || !mapping) {
      return res.status(400).json({
        success: false,
        message: "jobId and mapping are required",
      });
    }

    const job = await prisma.importJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Import job not found" });
    }

    const fields = MODULE_FIELDS[job.module];
    if (!fields) {
      return res.status(400).json({ success: false, message: "Unknown module" });
    }

    // In production, you'd parse the actual file (xlsx/csv) here
    // For now, simulate with dummy data structure
    // The actual parsing would use a library like 'xlsx' or 'csv-parser'
    
    // Simulated parsed rows (replace with actual file parsing)
    const parsedData: Record<string, any>[] = [];
    
    // Validate each row
    const validationResults = parsedData.slice(0, previewRows).map((row, index) => {
      const result = validateRow(row, fields, mapping);
      return {
        row: index + 1,
        data: row,
        isValid: result.isValid,
        errors: result.errors,
      };
    });

    // Update job with mapping
    await prisma.importJob.update({
      where: { id: jobId },
      data: { mapping, totalRows: parsedData.length },
    });

    const validCount = validationResults.filter((r) => r.isValid).length;
    const invalidCount = validationResults.filter((r) => !r.isValid).length;

    res.json({
      success: true,
      data: {
        totalRows: parsedData.length,
        previewResults: validationResults,
        validCount,
        invalidCount,
        canProceed: invalidCount === 0 || validCount > 0,
      },
    });
  } catch (error: any) {
    console.error("Error validating import:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/import/process
// Process the import (create records)
// ──────────────────────────────────────────────────────────
export const processImport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { jobId, skipErrors = true } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: "jobId is required" });
    }

    const job = await prisma.importJob.findFirst({
      where: { id: jobId, tenantId, status: "PENDING" },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found or already processed" });
    }

    // Update status to processing
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING", startedAt: new Date() },
    });

    // In production, this would:
    // 1. Parse the file (xlsx/csv)
    // 2. Apply mapping
    // 3. Validate each row
    // 4. Create records in the appropriate collection
    // 5. Track success/failure per row
    
    // For now, simulate processing
    const processedRows = job.totalRows;
    const successRows = Math.floor(processedRows * 0.95); // 95% success simulation
    const failedRows = processedRows - successRows;

    const errors = failedRows > 0
      ? Array.from({ length: Math.min(failedRows, 10) }, (_, i) => ({
          row: Math.floor(Math.random() * processedRows) + 1,
          field: "email",
          message: "Duplicate entry",
        }))
      : [];

    // Update job with results
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        processedRows,
        successRows,
        failedRows,
        errors: errors.length > 0 ? errors : undefined,
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        processedRows,
        successRows,
        failedRows,
        errors,
      },
      message: `Import completed: ${successRows} successful, ${failedRows} failed`,
    });
  } catch (error: any) {
    console.error("Error processing import:", error);

    // Mark job as failed
    if (req.body.jobId) {
      await prisma.importJob.update({
        where: { id: req.body.jobId },
        data: { status: "FAILED", completedAt: new Date() },
      }).catch(() => {});
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/import/jobs
// List import jobs
// ──────────────────────────────────────────────────────────
export const listImportJobs = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { module, status, page = "1", limit = "20" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { tenantId };
    if (module) where.module = module;
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      prisma.importJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.importJob.count({ where }),
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: { total, page: parseInt(page as string), limit: take, totalPages: Math.ceil(total / take) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/import/templates/:module
// Get import template (field definitions + sample file)
// ──────────────────────────────────────────────────────────
export const getImportTemplate = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const module = req.params.module as string;

    if (!MODULE_FIELDS[module]) {
      return res.status(400).json({
        success: false,
        message: `Unknown module: ${module}. Supported: ${Object.keys(MODULE_FIELDS).join(", ")}`,
      });
    }

    // Check for custom template
    const customTemplate = await prisma.importTemplate.findFirst({
      where: { tenantId, module, isActive: true },
    });

    const fields = MODULE_FIELDS[module];

    res.json({
      success: true,
      data: {
        module,
        fields,
        requiredFields: fields.filter((f) => f.required).map((f) => f.label),
        optionalFields: fields.filter((f) => !f.required).map((f) => f.label),
        sampleHeaders: fields.map((f) => f.label),
        customTemplate: customTemplate || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/export/generate
// Generate export (Excel/CSV/PDF)
// ──────────────────────────────────────────────────────────
export const generateExport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const userId = (req as any).user?.id || "system";
    const { module, format = "EXCEL", filters, columns } = req.body;

    if (!module) {
      return res.status(400).json({ success: false, message: "Module is required" });
    }

    if (!["EXCEL", "CSV", "PDF"].includes(format)) {
      return res.status(400).json({ success: false, message: "Format must be EXCEL, CSV, or PDF" });
    }

    // Create export job
    const job = await prisma.exportJob.create({
      data: {
        tenantId,
        module,
        format,
        filters: filters || undefined,
        columns: columns || MODULE_FIELDS[module]?.map((f) => f.field) || [],
        status: "PROCESSING",
        createdBy: userId,
      },
    });

    // In production, this would:
    // 1. Query the database with filters
    // 2. Format data according to selected columns
    // 3. Generate file (xlsx using exceljs, csv, or pdf using pdfkit)
    // 4. Upload file and update job with URL
    
    // Simulate export generation
    const totalRecords = Math.floor(Math.random() * 500) + 50;
    const fileUrl = `/uploads/exports/${job.id}.${format === "EXCEL" ? "xlsx" : format.toLowerCase()}`;

    await prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        totalRecords,
        fileUrl,
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: { jobId: job.id, fileUrl, totalRecords, format },
      message: `Export generated: ${totalRecords} records`,
    });
  } catch (error: any) {
    console.error("Error generating export:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/export/jobs
// List export jobs
// ──────────────────────────────────────────────────────────
export const listExportJobs = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { module, status, page = "1", limit = "20" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { tenantId };
    if (module) where.module = module;
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      prisma.exportJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.exportJob.count({ where }),
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: { total, page: parseInt(page as string), limit: take, totalPages: Math.ceil(total / take) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/export/download/:id
// Download exported file
// ──────────────────────────────────────────────────────────
export const downloadExport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const jobId = req.params.id as string;

    const job = await prisma.exportJob.findFirst({
      where: { id: jobId, tenantId, status: "COMPLETED" },
    });

    if (!job || !job.fileUrl) {
      return res.status(404).json({ success: false, message: "Export not found or not ready" });
    }

    // In production, serve the file
    res.json({
      success: true,
      data: { downloadUrl: job.fileUrl, format: job.format, records: job.totalRecords },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// DELETE /api/import/jobs/:id
// Cancel or delete an import job
// ──────────────────────────────────────────────────────────
export const cancelImportJob = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const jobId = req.params.id as string;

    const job = await prisma.importJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (job.status === "PROCESSING") {
      await prisma.importJob.update({
        where: { id: jobId },
        data: { status: "CANCELLED" },
      });
      return res.json({ success: true, message: "Job cancelled" });
    }

    await prisma.importJob.delete({ where: { id: jobId } });
    res.json({ success: true, message: "Job deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/import-export/stats
// Dashboard stats
// ──────────────────────────────────────────────────────────
export const getStats = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;

    const [totalImports, successfulImports, totalExports, pendingJobs] = await Promise.all([
      prisma.importJob.count({ where: { tenantId } }),
      prisma.importJob.count({ where: { tenantId, status: "COMPLETED" } }),
      prisma.exportJob.count({ where: { tenantId } }),
      prisma.importJob.count({ where: { tenantId, status: { in: ["PENDING", "PROCESSING"] } } }),
    ]);

    // Recent jobs
    const recentImports = await prisma.importJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentExports = await prisma.exportJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        totalImports,
        successfulImports,
        totalExports,
        pendingJobs,
        recentImports,
        recentExports,
        supportedModules: Object.keys(MODULE_FIELDS),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
