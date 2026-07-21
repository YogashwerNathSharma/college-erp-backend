import { useState } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Eye,
  CheckSquare,
  Square,
  Filter,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { PageHeader, LoadingSkeleton } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

type ExportFormat = "csv" | "excel" | "pdf";

type StudentField = {
  key: string;
  label: string;
  group: string;
};

type PreviewRow = Record<string, string>;

const STUDENT_FIELDS: StudentField[] = [
  // Personal
  { key: "admissionNo", label: "Admission Number", group: "Personal" },
  { key: "firstName", label: "First Name", group: "Personal" },
  { key: "lastName", label: "Last Name", group: "Personal" },
  { key: "dateOfBirth", label: "Date of Birth", group: "Personal" },
  { key: "gender", label: "Gender", group: "Personal" },
  { key: "email", label: "Email", group: "Personal" },
  { key: "phone", label: "Phone", group: "Personal" },
  { key: "bloodGroup", label: "Blood Group", group: "Personal" },
  { key: "religion", label: "Religion", group: "Personal" },
  { key: "category", label: "Category", group: "Personal" },
  { key: "nationality", label: "Nationality", group: "Personal" },
  // Academic
  { key: "class", label: "Class", group: "Academic" },
  { key: "section", label: "Section", group: "Academic" },
  { key: "rollNo", label: "Roll Number", group: "Academic" },
  { key: "academicYear", label: "Academic Year", group: "Academic" },
  { key: "admissionDate", label: "Admission Date", group: "Academic" },
  { key: "status", label: "Status", group: "Academic" },
  // Family
  { key: "fatherName", label: "Father's Name", group: "Family" },
  { key: "motherName", label: "Mother's Name", group: "Family" },
  { key: "guardianPhone", label: "Guardian Phone", group: "Family" },
  { key: "guardianEmail", label: "Guardian Email", group: "Family" },
  // Address
  { key: "address", label: "Address", group: "Address" },
  { key: "city", label: "City", group: "Address" },
  { key: "state", label: "State", group: "Address" },
  { key: "pincode", label: "Pincode", group: "Address" },
  // Other
  { key: "previousSchool", label: "Previous School", group: "Other" },
  { key: "rfidCard", label: "RFID Card", group: "Other" },
  { key: "biometricId", label: "Biometric ID", group: "Other" },
];

const FIELD_GROUPS = [...new Set(STUDENT_FIELDS.map((f) => f.group))];

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function BulkExport() {
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "admissionNo", "firstName", "lastName", "class", "section", "status",
  ]);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [filters, setFilters] = useState({
    class: "",
    section: "",
    status: "",
    academicYear: "",
  });
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  // ─── Field Selection ─────────────────────────────────────────

  const toggleField = (key: string) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const toggleGroup = (group: string) => {
    const groupFields = STUDENT_FIELDS.filter((f) => f.group === group).map((f) => f.key);
    const allSelected = groupFields.every((f) => selectedFields.includes(f));
    if (allSelected) {
      setSelectedFields((prev) => prev.filter((f) => !groupFields.includes(f)));
    } else {
      setSelectedFields((prev) => [...new Set([...prev, ...groupFields])]);
    }
  };

  const selectAll = () => setSelectedFields(STUDENT_FIELDS.map((f) => f.key));
  const deselectAll = () => setSelectedFields([]);

  // ─── Preview ─────────────────────────────────────────────────

  const fetchPreview = async () => {
    if (selectedFields.length === 0) {
      toast.error("Select at least one field");
      return;
    }
    setLoadingPreview(true);
    try {
      const response = await axios.post(
        "/api/students/bulk-export",
        {
          fields: selectedFields,
          filters,
          format: "json",
          preview: true,
          limit: 5,
        },
        authHeaders
      );
      setPreview(response.data.data || response.data.preview || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  // ─── Export ──────────────────────────────────────────────────

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast.error("Select at least one field");
      return;
    }
    setExporting(true);
    try {
      const response = await axios.post(
        "/api/students/bulk-export",
        {
          fields: selectedFields,
          filters,
          format,
        },
        {
          ...authHeaders,
          responseType: "blob",
        }
      );

      // Create download link
      const mimeTypes: Record<ExportFormat, string> = {
        csv: "text/csv",
        excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        pdf: "application/pdf",
      };
      const extensions: Record<ExportFormat, string> = {
        csv: "csv",
        excel: "xlsx",
        pdf: "pdf",
      };

      const blob = new Blob([response.data], { type: mimeTypes[format] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students_export_${new Date().toISOString().split("T")[0]}.${extensions[format]}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Bulk Export"
        subtitle="Export student data in your preferred format"
        icon={<Download className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Students", path: "/students" },
          { label: "Bulk Export" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Field Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Select Fields to Export
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <button
                  onClick={deselectAll}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {selectedFields.length} field{selectedFields.length !== 1 ? "s" : ""} selected
            </p>

            <div className="space-y-5">
              {FIELD_GROUPS.map((group) => {
                const groupFields = STUDENT_FIELDS.filter((f) => f.group === group);
                const allSelected = groupFields.every((f) => selectedFields.includes(f.key));
                const someSelected = groupFields.some((f) => selectedFields.includes(f.key));

                return (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => toggleGroup(group)}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {allSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square className={`w-4 h-4 ${someSelected ? "text-indigo-400" : ""}`} />
                        )}
                      </button>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {group}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 ml-6">
                      {groupFields.map((field) => (
                        <label
                          key={field.key}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            selectedFields.includes(field.key)
                              ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
                              : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field.key)}
                            onChange={() => toggleField(field.key)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-slate-700 dark:text-slate-300">
                            {field.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-slate-500" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Preview (first 5 rows)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800">
                      {selectedFields.slice(0, 8).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                        >
                          {STUDENT_FIELDS.find((f) => f.key === key)?.label || key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {selectedFields.slice(0, 8).map((key) => (
                          <td key={key} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {row[key] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedFields.length > 8 && (
                <p className="text-xs text-slate-400 mt-2">
                  + {selectedFields.length - 8} more columns not shown
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: Filters & Format */}
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-slate-500" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Filter Students
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Class
                </label>
                <input
                  type="text"
                  value={filters.class}
                  onChange={(e) => setFilters({ ...filters, class: e.target.value })}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  value={filters.section}
                  onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                  placeholder="e.g. A"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={filters.academicYear}
                  onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
                  placeholder="e.g. 2025-26"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
              Export Format
            </h3>

            <div className="space-y-2">
              {([
                { key: "csv", label: "CSV", desc: "Comma-separated values", icon: <FileText className="w-5 h-5" /> },
                { key: "excel", label: "Excel", desc: "Microsoft Excel (.xlsx)", icon: <FileSpreadsheet className="w-5 h-5" /> },
                { key: "pdf", label: "PDF", desc: "Portable Document Format", icon: <File className="w-5 h-5" /> },
              ] as { key: ExportFormat; label: string; desc: string; icon: React.ReactNode }[]).map((opt) => (
                <label
                  key={opt.key}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                    format === opt.key
                      ? "border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={opt.key}
                    checked={format === opt.key}
                    onChange={(e) => setFormat(e.target.value as ExportFormat)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-slate-600 dark:text-slate-400">{opt.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{opt.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={fetchPreview}
              disabled={loadingPreview || selectedFields.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4" />
              {loadingPreview ? "Loading..." : "Preview Data"}
            </button>

            <button
              onClick={handleExport}
              disabled={exporting || selectedFields.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : `Export as ${format.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
