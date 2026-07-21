import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Eye,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { PageHeader, LoadingSkeleton, EmptyState } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type ParsedRow = Record<string, string>;

type ValidationError = {
  row: number;
  field: string;
  message: string;
};

type ColumnMapping = {
  csvColumn: string;
  studentField: string;
};

type ImportResult = {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
};

const STUDENT_FIELDS = [
  { key: "firstName", label: "First Name", required: true },
  { key: "lastName", label: "Last Name", required: true },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "dateOfBirth", label: "Date of Birth", required: true },
  { key: "gender", label: "Gender", required: true },
  { key: "class", label: "Class", required: true },
  { key: "section", label: "Section", required: true },
  { key: "rollNo", label: "Roll Number", required: false },
  { key: "admissionNo", label: "Admission Number", required: true },
  { key: "admissionDate", label: "Admission Date", required: true },
  { key: "fatherName", label: "Father's Name", required: true },
  { key: "motherName", label: "Mother's Name", required: false },
  { key: "guardianPhone", label: "Guardian Phone", required: true },
  { key: "address", label: "Address", required: false },
  { key: "city", label: "City", required: false },
  { key: "state", label: "State", required: false },
  { key: "pincode", label: "Pincode", required: false },
  { key: "bloodGroup", label: "Blood Group", required: false },
  { key: "religion", label: "Religion", required: false },
  { key: "category", label: "Category", required: false },
  { key: "nationality", label: "Nationality", required: false },
  { key: "previousSchool", label: "Previous School", required: false },
  { key: "academicYear", label: "Academic Year", required: true },
];

const STEPS = ["Upload", "Map Columns", "Validate", "Import"];

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function BulkAdmission() {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  // ─── File Handling ───────────────────────────────────────────

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      toast.error("File must have at least a header row and one data row");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: ParsedRow = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      rows.push(row);
    }

    setCsvColumns(headers);
    setParsedData(rows);

    // Auto-map columns
    const autoMappings: ColumnMapping[] = headers.map((col) => {
      const match = STUDENT_FIELDS.find(
        (f) =>
          f.key.toLowerCase() === col.toLowerCase() ||
          f.label.toLowerCase() === col.toLowerCase()
      );
      return { csvColumn: col, studentField: match?.key || "" };
    });
    setMappings(autoMappings);
    setStep(1);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (
      !selectedFile.name.endsWith(".csv") &&
      !selectedFile.name.endsWith(".xlsx") &&
      !selectedFile.name.endsWith(".xls")
    ) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  // ─── Column Mapping ──────────────────────────────────────────

  const updateMapping = (csvColumn: string, studentField: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.csvColumn === csvColumn ? { ...m, studentField } : m))
    );
  };

  // ─── Validation ──────────────────────────────────────────────

  const validate = () => {
    const errors: ValidationError[] = [];
    const requiredFields = STUDENT_FIELDS.filter((f) => f.required);
    const mappedRequiredFields = requiredFields.filter((rf) =>
      mappings.some((m) => m.studentField === rf.key)
    );

    // Check that all required fields are mapped
    const unmappedRequired = requiredFields.filter(
      (rf) => !mappings.some((m) => m.studentField === rf.key)
    );

    unmappedRequired.forEach((field) => {
      errors.push({ row: 0, field: field.key, message: `Required field "${field.label}" is not mapped` });
    });

    // Validate each row
    parsedData.forEach((row, idx) => {
      mappedRequiredFields.forEach((field) => {
        const mapping = mappings.find((m) => m.studentField === field.key);
        if (mapping && !row[mapping.csvColumn]?.trim()) {
          errors.push({
            row: idx + 1,
            field: field.key,
            message: `"${field.label}" is empty`,
          });
        }
      });

      // Date of birth validation
      const dobMapping = mappings.find((m) => m.studentField === "dateOfBirth");
      if (dobMapping && row[dobMapping.csvColumn]) {
        const dob = new Date(row[dobMapping.csvColumn]);
        if (isNaN(dob.getTime())) {
          errors.push({ row: idx + 1, field: "dateOfBirth", message: "Invalid date of birth" });
        } else {
          const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          if (age < 3 || age > 25) {
            errors.push({ row: idx + 1, field: "dateOfBirth", message: `Age ${Math.floor(age)} is outside allowed range (3-25)` });
          }
        }
      }

      // Email validation
      const emailMapping = mappings.find((m) => m.studentField === "email");
      if (emailMapping && row[emailMapping.csvColumn]) {
        const email = row[emailMapping.csvColumn];
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push({ row: idx + 1, field: "email", message: "Invalid email format" });
        }
      }
    });

    setValidationErrors(errors);
    setStep(2);
  };

  // ─── Import ──────────────────────────────────────────────────

  const startImport = async () => {
    setStep(3);
    setImporting(true);
    setImportProgress(0);

    try {
      // Build mapped data
      const mappedStudents = parsedData.map((row) => {
        const student: Record<string, string> = {};
        mappings.forEach((m) => {
          if (m.studentField) {
            student[m.studentField] = row[m.csvColumn] || "";
          }
        });
        return student;
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await axios.post(
        "/api/students/bulk-import",
        { students: mappedStudents },
        authHeaders
      );

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(response.data);
      toast.success(`Import complete: ${response.data.success} students added`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Import failed");
      setImportResult({
        total: parsedData.length,
        success: 0,
        failed: parsedData.length,
        errors: [{ row: 0, message: error.response?.data?.message || "Import failed" }],
      });
    } finally {
      setImporting(false);
    }
  };

  // ─── Template Download ───────────────────────────────────────

  const downloadTemplate = () => {
    const headers = STUDENT_FIELDS.map((f) => f.label).join(",");
    const sampleRow = STUDENT_FIELDS.map((f) => {
      const samples: Record<string, string> = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "9876543210",
        dateOfBirth: "2010-05-15",
        gender: "Male",
        class: "5",
        section: "A",
        rollNo: "1",
        admissionNo: "ADM2025001",
        admissionDate: "2025-04-01",
        fatherName: "Robert Doe",
        motherName: "Jane Doe",
        guardianPhone: "9876543211",
        address: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        bloodGroup: "O+",
        religion: "Hindu",
        category: "General",
        nationality: "Indian",
        previousSchool: "ABC School",
        academicYear: "2025-26",
      };
      return samples[f.key] || "";
    }).join(",");

    const csv = `${headers}\n${sampleRow}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  // ─── Reset ───────────────────────────────────────────────────

  const reset = () => {
    setStep(0);
    setFile(null);
    setParsedData([]);
    setCsvColumns([]);
    setMappings([]);
    setValidationErrors([]);
    setImporting(false);
    setImportProgress(0);
    setImportResult(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Bulk Admission"
        subtitle="Import multiple students from CSV or Excel file"
        icon={<Upload className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Students", path: "/students" },
          { label: "Bulk Admission" },
        ]}
        actions={
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
        }
      />

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    idx < step
                      ? "bg-emerald-500 text-white"
                      : idx === step
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {idx < step ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <span className="text-xs mt-1.5 text-slate-600 dark:text-slate-400 font-medium">
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 ${
                    idx < step ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 0: Upload */}
      {step === 0 && (
        <div className="max-w-2xl mx-auto">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Supports CSV and Excel (.csv, .xlsx, .xls)
                </p>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
        </div>
      )}

      {/* Step 1: Column Mapping */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Map CSV Columns to Student Fields
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Match each column from your file to the corresponding student field. Required fields are marked with *.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {csvColumns.map((col) => {
                const mapping = mappings.find((m) => m.csvColumn === col);
                return (
                  <div key={col} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {col}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        (e.g. "{parsedData[0]?.[col] || "—"}")
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <select
                      value={mapping?.studentField || ""}
                      onChange={(e) => updateMapping(col, e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">— Skip —</option>
                      {STUDENT_FIELDS.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label} {f.required ? "*" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-slate-500" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Preview (first 5 rows)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                      #
                    </th>
                    {csvColumns.slice(0, 8).map((col) => (
                      <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {parsedData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                      {csvColumns.slice(0, 8).map((col) => (
                        <td key={col} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                          {row[col] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.length > 5 && (
              <p className="text-xs text-slate-400 mt-3">
                ... and {parsedData.length - 5} more rows
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={validate}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Validate Data
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Validation */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{parsedData.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Rows</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {parsedData.length - new Set(validationErrors.filter((e) => e.row > 0).map((e) => e.row)).size}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Valid Rows</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {validationErrors.length}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Errors</p>
                </div>
              </div>
            </div>
          </div>

          {/* Errors List */}
          {validationErrors.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Validation Issues
              </h3>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {validationErrors.map((err, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg"
                  >
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {err.row > 0 ? `Row ${err.row}: ` : ""}
                      {err.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {validationErrors.length === 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                All rows are valid!
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                Ready to import {parsedData.length} students.
              </p>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Mapping
            </button>
            <button
              onClick={startImport}
              disabled={validationErrors.filter((e) => e.row === 0).length > 0}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Import
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Import Progress / Results */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {importing ? "Importing Students..." : "Import Complete"}
            </h3>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  importResult && importResult.failed > 0
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {importProgress}% complete
            </p>
          </div>

          {/* Results */}
          {importResult && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Import Summary
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {importResult.total}
                  </p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {importResult.success}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Success</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {importResult.failed}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {importResult.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/10 rounded text-sm text-red-700 dark:text-red-300"
                    >
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      {err.row > 0 ? `Row ${err.row}: ` : ""}
                      {err.message}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={reset}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Import Another File
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
