// Fast, production-safe student import path. Keeps the existing import UI/API contract.
// @ts-nocheck
import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import * as XLSX from "xlsx";
import fs from "fs";

const cachePath = (filePath: string) => `${filePath}.import-cache.json`;

function parseFile(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error("Uploaded file not found on server");
  const workbook = XLSX.read(fs.readFileSync(filePath), { type: "buffer", cellDates: true, raw: false, dense: true });
  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) throw new Error("No worksheet found in uploaded file");
  const sheet = workbook.Sheets[sheetName];
  const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false }) as any[][];
  const headers = (Array.isArray(matrix[0]) ? matrix[0] : []).map((v) => String(v ?? "").trim()).filter(Boolean);
  const rows: Record<string, any>[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const values = Array.isArray(matrix[i]) ? matrix[i] : [];
    const row: Record<string, any> = {};
    let hasData = false;
    headers.forEach((header, col) => {
      const value = values[col] == null ? "" : String(values[col]).trim();
      row[header] = value;
      if (value) hasData = true;
    });
    if (hasData) rows.push(row);
  }
  return { headers, rows };
}

function getRows(filePath: string) {
  const cp = cachePath(filePath);
  if (fs.existsSync(cp)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cp, "utf8"));
      if (cached && Array.isArray(cached.rows)) return cached;
    } catch {}
  }
  const parsed = parseFile(filePath);
  try { fs.writeFileSync(cp, JSON.stringify(parsed), "utf8"); } catch {}
  return parsed;
}

function clean(value: any) {
  return value == null ? "" : String(value).trim();
}

function normalizeStudent(row: Record<string, any>, mapping: Record<string, string>) {
  const out: Record<string, any> = {};
  for (const [source, target] of Object.entries(mapping || {})) out[target] = clean(row[source]);

  if (!out.firstName && out.fullName) {
    const parts = out.fullName.split(/\s+/).filter(Boolean);
    out.firstName = parts.shift() || "";
    out.lastName = parts.join(" ");
  }
  if (!out.firstName && out.lastName) {
    out.firstName = out.lastName;
    out.lastName = "";
  }

  if (out.classSection) {
    const raw = out.classSection.replace(/[–—]/g, "-").replace(/\s*-\s*/g, " ").replace(/\s+/g, " ").trim();
    const parts = raw.split(" ").filter(Boolean);
    if (!out.className) out.className = parts.length > 1 ? parts.slice(0, -1).join(" ") : raw;
    if (!out.sectionName && parts.length > 1) out.sectionName = parts[parts.length - 1];
  }

  out.admissionNo = clean(out.admissionNo);
  out.firstName = clean(out.firstName);
  out.lastName = clean(out.lastName);
  out.className = clean(out.className);
  out.sectionName = clean(out.sectionName);
  return out;
}

function parseDate(value: any): Date | null {
  const raw = clean(value);
  if (!raw) return null;
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  const ymd = raw.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (ymd) {
    const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function genderValue(value: any) {
  const g = clean(value).toUpperCase();
  if (g === "MALE" || g === "M") return "MALE";
  if (g === "FEMALE" || g === "F") return "FEMALE";
  return "OTHER";
}

function normalizeKey(value: any) {
  return clean(value).toLowerCase().replace(/\s+/g, " ");
}

export const processStudentImportFast = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId as string;
  const jobId = req.body?.jobId as string;
  if (!jobId) return res.status(400).json({ success: false, message: "jobId is required" });

  try {
    const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId, status: "PENDING" } });
    if (!job) return res.status(404).json({ success: false, message: "Job not found or already processed" });
    if (job.module !== "STUDENT") return res.status(400).json({ success: false, message: "This fast path is only for student imports" });
    if (!job.fileUrl || !fs.existsSync(job.fileUrl)) return res.status(404).json({ success: false, message: "Uploaded file not found on server" });

    await prisma.importJob.update({ where: { id: jobId }, data: { status: "PROCESSING", startedAt: new Date() } });

    const parsed = getRows(job.fileUrl);
    const mapping = (job.mapping || {}) as Record<string, string>;
    const normalizedRows = parsed.rows.map((row: any, index: number) => ({ row, rowNum: index + 2, data: normalizeStudent(row, mapping) }));

    // Load academic/class/section masters once. The old path queried these for every row.
    const academicYear = await prisma.academicYear.findFirst({ where: { tenantId, isActive: true } });
    const [classes, sections] = await Promise.all([
      prisma.class.findMany({ where: { tenantId } }),
      prisma.section.findMany({ where: { tenantId } }),
    ]);
    const classByName = new Map(classes.map((c: any) => [normalizeKey(c.name), c]));
    const sectionByKey = new Map(sections.map((s: any) => [`${s.classId}|${normalizeKey(s.name)}`, s]));

    const admissionNos = Array.from(new Set(normalizedRows.map((x) => x.data.admissionNo).filter(Boolean)));
    const existingStudents = admissionNos.length
      ? await prisma.student.findMany({ where: { tenantId, admissionNo: { in: admissionNos }, isDeleted: false } })
      : [];
    const studentByAdmission = new Map(existingStudents.map((s: any) => [clean(s.admissionNo), s]));

    let successRows = 0;
    let failedRows = 0;
    const errors: any[] = [];

    const processOne = async (item: any) => {
      const { rowNum, data: mapped } = item;
      try {
        if (!mapped.firstName) throw new Error("Name or First Name is required");
        if (!mapped.admissionNo) throw new Error("Admission Number is required");

        let classRecord: any = null;
        let sectionRecord: any = null;
        if (mapped.className) classRecord = classByName.get(normalizeKey(mapped.className)) || null;
        if (classRecord && mapped.sectionName) sectionRecord = sectionByKey.get(`${classRecord.id}|${normalizeKey(mapped.sectionName)}`) || null;

        const dob = parseDate(mapped.dob);
        const studentData: any = {
          firstName: mapped.firstName,
          lastName: mapped.lastName || "",
          fullName: `${mapped.firstName} ${mapped.lastName || ""}`.trim(),
          gender: genderValue(mapped.gender),
          dob: dob || new Date(),
          email: mapped.email || null,
          phone: mapped.phone || null,
          address: mapped.address || [mapped.city, mapped.state, mapped.pincode].filter(Boolean).join(", ") || "N/A",
          admissionNo: mapped.admissionNo,
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
        };

        let student = studentByAdmission.get(mapped.admissionNo);
        if (student) student = await prisma.student.update({ where: { id: student.id }, data: studentData });
        else student = await prisma.student.create({ data: studentData });
        studentByAdmission.set(mapped.admissionNo, student);

        if (classRecord && sectionRecord && academicYear) {
          const existingEnrollment = await prisma.enrollment.findFirst({ where: { tenantId, studentId: student.id, academicYearId: academicYear.id } });
          const enrollmentData: any = {
            class: { connect: { id: classRecord.id } },
            section: { connect: { id: sectionRecord.id } },
            academicYear: { connect: { id: academicYear.id } },
            tenant: { connect: { id: tenantId } },
            rollNumber: mapped.rollNumber || null,
            status: "active",
          };
          if (existingEnrollment) await prisma.enrollment.update({ where: { id: existingEnrollment.id }, data: enrollmentData });
          else await prisma.enrollment.create({ data: { student: { connect: { id: student.id } }, ...enrollmentData } });
        }
        return { ok: true };
      } catch (error: any) {
        return { ok: false, error: { row: rowNum, errors: [error?.message || "Unknown import error"] } };
      }
    };

    // Bounded concurrency is much faster than the old strictly-serial 1,700+ row loop.
    const concurrency = 12;
    for (let i = 0; i < normalizedRows.length; i += concurrency) {
      const results = await Promise.all(normalizedRows.slice(i, i + concurrency).map(processOne));
      for (const result of results) {
        if (result.ok) successRows++;
        else { failedRows++; errors.push(result.error); }
      }
      await prisma.importJob.update({ where: { id: jobId }, data: { processedRows: successRows + failedRows, successRows, failedRows } });
    }

    const processedRows = successRows + failedRows;
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: "COMPLETED", processedRows, successRows, failedRows, errors: errors.length ? errors : undefined, completedAt: new Date() },
    });

    try { fs.unlinkSync(job.fileUrl); } catch {}
    try { fs.unlinkSync(cachePath(job.fileUrl)); } catch {}

    return res.json({ success: true, data: { processedRows, successRows, failedRows, errors }, message: `Import completed: ${successRows} successful, ${failedRows} failed` });
  } catch (error: any) {
    console.error("Error processing fast student import:", error);
    await prisma.importJob.update({ where: { id: jobId }, data: { status: "FAILED", completedAt: new Date(), errors: [{ row: 0, errors: [error?.message || "Import processing failed"] }] } }).catch(() => {});
    return res.status(500).json({ success: false, message: error?.message || "Import processing failed" });
  }
};
