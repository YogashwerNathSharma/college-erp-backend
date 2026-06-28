import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  Eye,
  FileDown,
  Loader2,
  ArrowUpDown,
  Table2,
  CloudUpload,
} from "lucide-react";

// ══════════════════════════════════════════════════════════
// IMPORT/EXPORT ENGINE - Frontend
// Handles bulk import from Excel/CSV and data exports
// ══════════════════════════════════════════════════════════

interface ImportJob {
  id: string;
  module: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  status: string;
  errors?: any[];
  createdAt: string;
  completedAt?: string;
}

interface ExportJob {
  id: string;
  module: string;
  format: string;
  totalRecords: number;
  status: string;
  fileUrl?: string;
  createdAt: string;
}

interface FieldDef {
  field: string;
  label: string;
  required: boolean;
  type: string;
}

const MODULES = [
  { key: "STUDENT", label: "Students", icon: "👨‍🎓" },
  { key: "TEACHER", label: "Teachers", icon: "👩‍🏫" },
  { key: "FEE_STRUCTURE", label: "Fee Structures", icon: "💰" },
  { key: "BOOK", label: "Library Books", icon: "📚" },
  { key: "ASSET", label: "Assets/Inventory", icon: "📦" },
  { key: "MARKS", label: "Exam Marks", icon: "📝" },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  PROCESSING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function ImportExport() {
  const [activeTab, setActiveTab] = useState<"import" | "export" | "history">("import");
  const [step, setStep] = useState(1); // 1: Select Module, 2: Upload, 3: Map Columns, 4: Preview, 5: Result

  // Import state
  const [selectedModule, setSelectedModule] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState("");
  const [templateFields, setTemplateFields] = useState<FieldDef[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  // Export state
  const [exportModule, setExportModule] = useState("");
  const [exportFormat, setExportFormat] = useState("EXCEL");
  const [exportColumns, setExportColumns] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  // History
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [stats, setStats] = useState<any>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const tenantId = user.tenantId;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const [statsRes, importsRes, exportsRes] = await Promise.all([
        axios.get(getFullUrl(`/api/import-export/stats`)),
        axios.get(getFullUrl(`/api/import-export/import/jobs?limit=10`)),
        axios.get(getFullUrl(`/api/import-export/export/jobs?limit=10`)),
      ]);
      setStats(statsRes.data.data);
      setImportJobs(importsRes.data.data || []);
      setExportJobs(exportsRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  // ── Import Flow ────────────────────────────────────────

  const handleModuleSelect = async (module: string) => {
    setSelectedModule(module);
    try {
      const res = await axios.get(getFullUrl(`/api/import-export/import/templates/${module}`));
      setTemplateFields(res.data.data.fields || []);
      setStep(2);
    } catch (err) {
      console.error("Failed to get template:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);

    // Simulate extracting column headers from file
    // In production, you'd parse the first row of the Excel/CSV
    const simulatedColumns = templateFields.map((f) => f.label);
    setFileColumns(simulatedColumns);

    // Auto-map columns by matching labels
    const autoMapping: Record<string, string> = {};
    simulatedColumns.forEach((col) => {
      const matchedField = templateFields.find(
        (f) => f.label.toLowerCase() === col.toLowerCase()
      );
      if (matchedField) {
        autoMapping[col] = matchedField.field;
      }
    });
    setColumnMapping(autoMapping);

    // Upload to server
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("module", selectedModule);

      const res = await axios.post(getFullUrl(`/api/import-export/import/upload`), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setJobId(res.data.data.id);
      setStep(3);
    } catch (err: any) {
      alert(err.response?.data?.message || "Upload failed");
    }
  };

  const handleValidate = async () => {
    try {
      const res = await axios.post(getFullUrl(`/api/import-export/import/validate`), {
        jobId,
        mapping: columnMapping,
        previewRows: 10,
      });
      setPreviewData(res.data.data);
      setStep(4);
    } catch (err: any) {
      alert(err.response?.data?.message || "Validation failed");
    }
  };

  const handleProcessImport = async () => {
    setImporting(true);
    try {
      const res = await axios.post(getFullUrl(`/api/import-export/import/process`), {
        jobId,
        skipErrors: true,
      });
      setImportResult(res.data.data);
      setStep(5);
      fetchHistory();
    } catch (err: any) {
      alert(err.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setStep(1);
    setSelectedModule("");
    setUploadedFile(null);
    setJobId("");
    setTemplateFields([]);
    setColumnMapping({});
    setFileColumns([]);
    setPreviewData(null);
    setImportResult(null);
  };

  // ── Export Flow ────────────────────────────────────────

  const handleExport = async () => {
    if (!exportModule) return alert("Select a module to export");
    setExporting(true);
    try {
      const res = await axios.post(getFullUrl(`/api/import-export/export/generate`), {
        module: exportModule,
        format: exportFormat,
        columns: exportColumns.length > 0 ? exportColumns : undefined,
      });
      alert(`Export generated: ${res.data.data.totalRecords} records`);
      fetchHistory();
    } catch (err: any) {
      alert(err.response?.data?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowUpDown className="w-7 h-7 text-indigo-600" />
            Import / Export
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Bulk import data from Excel/CSV or export module data
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
            <Upload size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Imports</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalImports || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Successful</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.successfulImports || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
            <Download size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Exports</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalExports || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
            <Loader2 size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Pending Jobs</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.pendingJobs || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {[
            { key: "import", label: "Import Data", icon: <Upload size={16} /> },
            { key: "export", label: "Export Data", icon: <Download size={16} /> },
            { key: "history", label: "Job History", icon: <Table2 size={16} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* IMPORT TAB */}
      {activeTab === "import" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {["Select Module", "Upload File", "Map Columns", "Preview", "Result"].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > i + 1
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : step === i + 1
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-700"
                  }`}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${step === i + 1 ? "text-indigo-600 font-medium" : "text-gray-400"}`}>
                  {s}
                </span>
                {i < 4 && <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700" />}
              </div>
            ))}
          </div>

          {/* Step 1: Select Module */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Module to Import
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {MODULES.map((mod) => (
                  <button
                    key={mod.key}
                    onClick={() => handleModuleSelect(mod.key)}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-center group"
                  >
                    <span className="text-3xl">{mod.icon}</span>
                    <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600">
                      {mod.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Upload File */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upload {MODULES.find((m) => m.key === selectedModule)?.label} File
                </h3>
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
              </div>

              {/* Required fields info */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Required Fields:</h4>
                <div className="flex flex-wrap gap-2">
                  {templateFields.filter((f) => f.required).map((f) => (
                    <span key={f.field} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-400">
                      {f.label} *
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  Optional: {templateFields.filter((f) => !f.required).map((f) => f.label).join(", ")}
                </p>
              </div>

              {/* Upload area */}
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all">
                <CloudUpload size={40} className="text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Drop Excel or CSV file here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv (max 10MB)</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {uploadedFile && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg flex items-center gap-3">
                  <FileSpreadsheet size={20} className="text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">{uploadedFile.name}</span>
                  <span className="text-xs text-gray-400">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Column Mapping */}
          {step === 3 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Map Columns</h3>
                <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Map your file columns to the corresponding database fields
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {fileColumns.map((col) => (
                  <div key={col} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{col}</p>
                      <p className="text-xs text-gray-400">File Column</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-400" />
                    <select
                      value={columnMapping[col] || ""}
                      onChange={(e) => setColumnMapping({ ...columnMapping, [col]: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                    >
                      <option value="">— Skip this column —</option>
                      {templateFields.map((f) => (
                        <option key={f.field} value={f.field}>
                          {f.label} {f.required ? "*" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleValidate}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
                >
                  Validate & Preview
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Preview / Validation Results */}
          {step === 4 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Validation Preview</h3>
                <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
              </div>

              {previewData && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{previewData.totalRows}</p>
                      <p className="text-xs text-gray-500">Total Rows</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{previewData.validCount}</p>
                      <p className="text-xs text-gray-500">Valid</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600">{previewData.invalidCount}</p>
                      <p className="text-xs text-gray-500">Errors</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">
                    {previewData.canProceed
                      ? "✅ Data looks good! You can proceed with the import."
                      : "❌ Too many errors. Please fix your file and re-upload."}
                  </p>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={resetImport}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProcessImport}
                      disabled={importing || !previewData.canProceed}
                      className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {importing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {importing ? "Importing..." : "Start Import"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 5: Result */}
          {step === 5 && importResult && (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Import Complete!</h3>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto my-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">{importResult.processedRows}</p>
                  <p className="text-xs text-gray-500">Processed</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <p className="text-xl font-bold text-green-600">{importResult.successRows}</p>
                  <p className="text-xs text-gray-500">Success</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                  <p className="text-xl font-bold text-red-600">{importResult.failedRows}</p>
                  <p className="text-xs text-gray-500">Failed</p>
                </div>
              </div>
              {importResult.errors?.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg text-left max-w-md mx-auto">
                  <p className="text-sm font-medium text-red-700 mb-2">Errors:</p>
                  {importResult.errors.slice(0, 5).map((err: any, i: number) => (
                    <p key={i} className="text-xs text-red-600">
                      Row {err.row}: {err.field} — {err.message}
                    </p>
                  ))}
                </div>
              )}
              <button
                onClick={resetImport}
                className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                Import Another File
              </button>
            </div>
          )}
        </div>
      )}

      {/* EXPORT TAB */}
      {activeTab === "export" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Export Data</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Module Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Module *
              </label>
              <select
                value={exportModule}
                onChange={(e) => setExportModule(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
              >
                <option value="">Choose module...</option>
                {MODULES.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.icon} {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format *
              </label>
              <div className="flex gap-3">
                {[
                  { key: "EXCEL", label: "Excel (.xlsx)", icon: <FileSpreadsheet size={16} /> },
                  { key: "CSV", label: "CSV", icon: <FileText size={16} /> },
                  { key: "PDF", label: "PDF", icon: <FileDown size={16} /> },
                ].map((fmt) => (
                  <button
                    key={fmt.key}
                    onClick={() => setExportFormat(fmt.key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                      exportFormat === fmt.key
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                        : "border-gray-200 dark:border-gray-600 text-gray-600 hover:border-indigo-300"
                    }`}
                  >
                    {fmt.icon}
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleExport}
              disabled={!exportModule || exporting}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {exporting ? "Generating..." : "Generate Export"}
            </button>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Import History */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload size={18} className="text-blue-600" />
                Import History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">File</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Module</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Rows</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {importJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">No import history</td>
                    </tr>
                  ) : (
                    importJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{job.fileName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.module}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[job.status]}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          <span className="text-green-600">{job.successRows}</span>
                          {job.failedRows > 0 && <span className="text-red-500 ml-1">/ {job.failedRows} failed</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(job.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export History */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Download size={18} className="text-purple-600" />
                Export History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Module</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Format</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Records</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {exportJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">No export history</td>
                    </tr>
                  ) : (
                    exportJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{job.module}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.format}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.totalRecords}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[job.status]}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(job.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {job.fileUrl && (
                            <a
                              href={job.fileUrl}
                              className="text-indigo-600 hover:underline text-xs"
                              download
                            >
                              Download
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
