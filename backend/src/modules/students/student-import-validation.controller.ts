// Student-specific validation for the existing Import/Export UI.
// Preview must use the same minimum requirements as the real student importer.
// Admission Number is optional; the real importer can create students without it.
// @ts-nocheck
import { Request, Response } from "express";
import prisma from "../..//utils/prisma";
import * as XLSX from "xlsx";
import fs from "fs";
import { validateImport } from "../import-export/import-export.controller";

const clean = (value: any) => value == null ? "" : String(value).trim();
const cachePath = (filePath: string) => `${filePath}.import-cache.json`;

function mappedValue(row: Record<string, any>, mapping: Record<string, string>, target: string) {
  const source = Object.keys(mapping || {}).find((key) => mapping[key] === target);
  return source ? row[source] : undefined;
}

function parseRows(filePath: string) {
  const cache = cachePath(filePath);
  if (fs.existsSync(cache)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(cache, "utf8"));
      if (parsed && Array.isArray(parsed.rows)) return parsed;
    } catch {}
  }
  const workbook = XLSX.read(fs.readFileSync(filePath), { type: "buffer", raw: false });
  const sheetName = workbook.SheetNames?.[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : null;
  if (!sheet) throw new Error("No worksheet found");
  const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false }) as any[][];
  const headers = (matrix[0] || []).map((v: any) => clean(v)).filter(Boolean);
  const rows = matrix.slice(1).map((values: any[]) => {
    const row: Record<string, any> = {};
    let hasData = false;
    headers.forEach((header, i) => { row[header] = clean(values?.[i]); if (row[header]) hasData = true; });
    return hasData ? row : null;
  }).filter(Boolean);
  try { fs.writeFileSync(cache, JSON.stringify({ headers, rows }), "utf8"); } catch {}
  return { headers, rows };
}

function splitClass(value: any) {
  const raw = clean(value).replace(/[–—]/g, "-").replace(/\s*-\s*/g, " ").replace(/\s+/g, " ").trim();
  const match = raw.match(/^(.*?)(?:\s+)([A-Za-z])$/);
  return match ? { className: clean(match[1]), sectionName: clean(match[2]) } : { className: raw, sectionName: "" };
}

export async function validateStudentImport(req: Request, res: Response) {
  try {
    const tenantId = (req as any).tenantId as string;
    const { jobId, mapping, previewRows = 100 } = req.body;
    if (!jobId || !mapping) return res.status(400).json({ success: false, message: "jobId and mapping are required" });
    const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) return res.status(404).json({ success: false, message: "Import job not found" });

    if (job.module !== "STUDENT") return validateImport(req, res);
    if (!job.fileUrl || !fs.existsSync(job.fileUrl)) return res.status(404).json({ success: false, message: "Uploaded file not found on server" });

    const parsed = parseRows(job.fileUrl);
    const validationResults = parsed.rows.map((row: any, index: number) => {
      const name = clean(mappedValue(row, mapping, "fullName"));
      const firstName = clean(mappedValue(row, mapping, "firstName"));
      const lastName = clean(mappedValue(row, mapping, "lastName"));
      const classSection = clean(mappedValue(row, mapping, "classSection"));
      const className = clean(mappedValue(row, mapping, "className"));
      const sectionName = clean(mappedValue(row, mapping, "sectionName"));
      const dob = clean(mappedValue(row, mapping, "dob"));
      const errors: string[] = [];

      if (!name && !firstName && !lastName) errors.push("Name is required");
      if (!className && !classSection) errors.push("Class is required");
      else if (classSection && !className) {
        const split = splitClass(classSection);
        if (!split.className || !split.sectionName) errors.push("Class must include section, e.g. LKG A");
      } else if (className && !sectionName) errors.push("Section is required");
      if (!dob) errors.push("DOB is required");

      return { row: index + 2, data: row, isValid: errors.length === 0, errors };
    });

    await prisma.importJob.update({ where: { id: jobId }, data: { mapping, totalRows: parsed.rows.length } });
    const validCount = validationResults.filter((r: any) => r.isValid).length;
    const invalidCount = validationResults.length - validCount;
    const limit = Math.max(1, Math.min(Number(previewRows) || 100, 100));

    return res.json({
      success: true,
      data: {
        totalRows: parsed.rows.length,
        previewResults: validationResults.slice(0, limit),
        validCount,
        invalidCount,
        canProceed: validCount > 0,
      },
    });
  } catch (error: any) {
    console.error("Error validating student import:", error);
    return res.status(500).json({ success: false, message: error?.message || "Student import validation failed" });
  }
}
