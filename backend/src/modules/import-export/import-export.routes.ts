// UNIFIED IMPORT ENGINE: keep AWS/local work on main and deploy the same baseline.

import { Router } from "express";

import multer from "multer";

import path from "path";

import fs from "fs";

import os from "os";

// @ts-ignore - xlsx has no type declarations but is used at runtime
const XLSX = require("xlsx");

import prisma from "../../utils/prisma";

import {

  uploadForImport,

  validateImport,

  processImport,

  listImportJobs,

  getImportTemplate,

  generateExport,

  listExportJobs,

  downloadExport,

  cancelImportJob,

  getStats,

} from "./import-export.controller";

import { processStudentImportFast } from "../students/student-import-fast.controller";

import { validateStudentImport } from "../students/student-import-validation.controller";



import { authMiddleware } from '../../middleware/auth.middleware';

import { resolveTenant } from '../../middleware/tenant.middleware';

import { allowRoles } from '../../middleware/role.middleware';

import { uploadDocument } from '../../utils/upload';

import { importRealRmsExcel } from '../students/real-excel-import.service';



const router = Router({ mergeParams: true });



const uploadsDir = path.join(__dirname, "../../../uploads/imports");

if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); }



const storage = multer.diskStorage({

  destination: (_req, _file, cb) => cb(null, path.join(__dirname, "../../../uploads/imports")),

  filename: (_req, file, cb) => {

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, `import-${uniqueSuffix}${path.extname(file.originalname)}`);

  },

});



const upload = multer({

  storage,

  limits: { fileSize: 10 * 1024 * 1024 },

  fileFilter: (_req, file, cb) => {

    const allowedTypes = [

      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

      "application/vnd.ms-excel",

      "text/csv",

      "application/csv",

    ];

    const allowedExtensions = [".xlsx", ".xls", ".csv"];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) cb(null, true);

    else cb(new Error("Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed"));

  },

});



router.use(authMiddleware);

router.use(resolveTenant);



router.get("/stats", getStats);



// Safe real RMS/student-list import. Does not delete demo data.

router.post("/real-student-import", allowRoles("ADMIN", "SUPER_ADMIN", "TENANT_ADMIN"), (req: any, res: any) => {

  console.log("\n🚀 REAL-STUDENT-IMPORT HIT");

  uploadDocument(req, res, async (err: any) => {

    if (err) {

      console.error("❌ Upload middleware error:", err.message);

      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });

    }

    console.log("📂 File received:", req.file ? { name: req.file.originalname, size: req.file.size, hasBuffer: !!req.file.buffer, hasPath: !!req.file.path } : "NO FILE");

    console.log("📂 Body keys:", Object.keys(req.body || {}));

    console.log("📂 tenantId:", req.tenantId, "| user:", req.user?.userId, "| role:", req.user?.role);

    if (!req.file) return res.status(400).json({ success: false, message: "No Excel file uploaded. Make sure you send field name 'file' or 'document'." });

    try {

      const { academicYearId } = req.body;

      if (!academicYearId) return res.status(400).json({ success: false, message: "academicYearId is required in form data" });

      console.log("📂 academicYearId:", academicYearId);



      // Pass buffer directly if available (more reliable on cloud), otherwise use file path

      let fileInput: string | Buffer;

      if (req.file.buffer) {

        fileInput = req.file.buffer;

        console.log("📂 Using BUFFER input, size:", req.file.buffer.length);

      } else if (req.file.path && fs.existsSync(req.file.path)) {

        fileInput = req.file.path;

        console.log("📂 Using FILE PATH input:", req.file.path);

      } else {

        console.error("❌ No buffer or valid path!");

        return res.status(400).json({ success: false, message: "File upload failed: no buffer or valid path available" });

      }



      try {

        const result = await importRealRmsExcel(req.tenantId, fileInput, academicYearId, req.user?.userId || "system");

        console.log("✅ Import complete:", { success: result.successCount, failed: result.failedCount, errors: result.errors.length });

        return res.json({ success: true, data: result });

      } finally {

        // Cleanup temp file if it was a path

        try { if (typeof fileInput === "string" && fileInput.startsWith(os.tmpdir())) fs.unlinkSync(fileInput); } catch {}

      }

    } catch (error: any) {

      console.error("❌ IMPORT FAILED:", error?.message);

      console.error("❌ STACK:", error?.stack);

      return res.status(400).json({ success: false, message: error?.message || "Real student import failed" });

    }

  });

});



const normalizeHeader = (value: any) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");



const STUDENT_ALIASES: Record<string, string[]> = {

  fullName: ["name", "studentname", "studentfullname", "fullname", "nameofstudent", "candidatename"],

  firstName: ["firstname", "studentfirstname", "givenname"],

  lastName: ["lastname", "studentlastname", "surname", "familyname"],

  admissionNo: ["admissionnumber", "admissionno", "admno", "admissionid", "registrationnumber", "registrationno", "regno", "enrollmentnumber", "enrollmentno", "enrolmentno"],

  email: ["email", "emailid", "mail"],

  phone: ["phone", "phonenumber", "mobile", "mobilenumber", "contactnumber", "contactno"],

  dob: ["dob", "dateofbirth", "birthdate", "datebirth"],

  gender: ["gender", "sex"],

  fatherName: ["fathername", "father", "fatherfullname", "fathersname"],

  motherName: ["mothername", "mother", "motherfullname", "mothersname"],

  className: ["classname", "standard", "std", "grade", "studyingclass", "classno", "classnumber"],

  classSection: ["class", "classsection", "classandsection", "classsectionname", "classwithsection", "standardsection"],

  sectionName: ["section", "sectionname", "sec", "division", "div"],

  rollNumber: ["rollnumber", "rollno", "roll", "rollnum", "studentrollnumber", "rolenumber"],

  address: ["address", "fulladdress", "residentialaddress"],

  city: ["city", "town"],

  state: ["state", "statename"],

  pincode: ["pincode", "pin", "zipcode", "postalcode"],

  bloodGroup: ["bloodgroup", "bloodtype"],

  category: ["category", "castecategory", "studentcategory"],

  religion: ["religion", "religionname"],

  nationality: ["nationality", "nation"],

  aadharNo: ["aadhar", "aadharno", "aadharnumber", "aadhaar", "aadhaarno", "aadhaarnumber"],

};



function inferStudentMapping(headers: string[], current: Record<string, string>) {

  const mapping: Record<string, string> = { ...(current || {}) };

  const usedTargets = new Set(Object.values(mapping));

  const aliases = new Map<string, string>();

  for (const [target, names] of Object.entries(STUDENT_ALIASES)) for (const name of names) aliases.set(normalizeHeader(name), target);

  for (const header of headers) {

    if (mapping[header]) continue;

    const target = aliases.get(normalizeHeader(header));

    if (target && !usedTargets.has(target)) { mapping[header] = target; usedTargets.add(target); }

  }

  return mapping;

}



const normalizeStudentImportMapping = async (req: any, _res: any, next: any) => {

  try {

    const tenantId = req.tenantId as string;

    const jobId = req.body?.jobId as string;

    if (!jobId) return next();

    const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId } });

    if (!job || job.module !== "STUDENT" || !job.fileUrl || !fs.existsSync(job.fileUrl)) return next();



    const workbook = XLSX.read(fs.readFileSync(job.fileUrl), { type: "buffer", raw: false });

    const sheetName = workbook.SheetNames?.[0];

    const sheet = sheetName ? workbook.Sheets[sheetName] : null;

    const matrix: any[][] = sheet ? (XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false }) as any[][]) : [];

    const headers = Array.isArray(matrix[0]) ? matrix[0].map((v: any) => String(v ?? "").trim()).filter(Boolean) : [];



    const mapping = inferStudentMapping(headers, req.body?.mapping || {});

    const cacheFile = `${job.fileUrl}.import-cache.json`;

    let cached: any = null;

    try { if (fs.existsSync(cacheFile)) cached = JSON.parse(fs.readFileSync(cacheFile, "utf8")); } catch {}



    const classHeader = headers.find((header) => normalizeHeader(header) === "class");

    const classValues = cached && Array.isArray(cached.rows) && classHeader ? cached.rows.map((row: any) => String(row[classHeader] ?? "").trim()).filter(Boolean) : [];

    const hasCombinedClassSection = classValues.some((value: string) => /^(.*?)[\s_-]+([A-Za-z])$/.test(value));

    if (classHeader && hasCombinedClassSection) { delete mapping[classHeader]; mapping[classHeader] = "classSection"; }



    const classSectionSource = Object.keys(mapping).find((source) => mapping[source] === "classSection");

    if (classSectionSource && cached && Array.isArray(cached.rows)) {

      const classKey = "__import_class_name";

      const sectionKey = "__import_section_name";

      cached.headers = Array.from(new Set([...(cached.headers || []), classKey, sectionKey]));

      for (const row of cached.rows) {

        const raw = String(row[classSectionSource] ?? "").trim();

        const parts = raw.replace(/\s+/g, " ").trim().split(/[\s_-]+/).filter(Boolean);

        row[classKey] = parts.length > 1 ? parts.slice(0, -1).join(" ") : raw;

        row[sectionKey] = parts.length > 1 ? parts[parts.length - 1] : "";

      }

      try { fs.writeFileSync(cacheFile, JSON.stringify(cached), "utf8"); } catch {}

      mapping[classKey] = "className";

      mapping[sectionKey] = "sectionName";

    }



    if (!Object.values(mapping).includes("fullName")) {

      const firstSource = Object.keys(mapping).find((source) => mapping[source] === "firstName");

      const lastSource = Object.keys(mapping).find((source) => mapping[source] === "lastName");

      if (firstSource || lastSource) {

        try {

          const nameKey = "__import_full_name";

          cached = cached || JSON.parse(fs.readFileSync(cacheFile, "utf8"));

          if (cached && Array.isArray(cached.rows)) {

            cached.headers = Array.from(new Set([...(cached.headers || []), nameKey]));

            for (const row of cached.rows) row[nameKey] = [row[firstSource || ""], row[lastSource || ""]].filter(Boolean).join(" ").trim();

            fs.writeFileSync(cacheFile, JSON.stringify(cached), "utf8");

            mapping[nameKey] = "fullName";

          }

        } catch {}

      }

    }



    req.body.mapping = mapping;

    return next();

  } catch (error) {

    console.warn("[Student Import] Mapping normalization skipped:", error);

    return next();

  }

};



router.post("/import/upload", upload.single("file"), uploadForImport);

router.post("/import/validate", normalizeStudentImportMapping, validateStudentImport);

router.post("/import/process", processStudentImportFast);

router.get("/import/jobs", listImportJobs);

router.get("/import/templates/:module", getImportTemplate);

router.delete("/import/jobs/:id", cancelImportJob);



router.post("/export/generate", generateExport);

router.get("/export/jobs", listExportJobs);

router.get("/export/download/:id", downloadExport);



export default router;

