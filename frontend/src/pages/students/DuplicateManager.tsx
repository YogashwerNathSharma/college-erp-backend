import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Copy,
  Search,
  Merge,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  ArrowRight,
  RefreshCw,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { PageHeader, ConfirmDialog, LoadingSkeleton, EmptyState } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DuplicateGroup {
  field: string;
  value: string;
  students: DuplicateStudent[];
}

interface DuplicateStudent {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  phone: string;
  email: string;
  aadharNo: string;
  fatherName: string;
  status: string;
  createdAt: string;
  enrollments: { class: { name: string }; section: { name: string } }[];
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

export default function DuplicateManager() {
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeConfirm, setMergeConfirm] = useState<{ primaryId: string; duplicateId: string; primaryName: string } | null>(null);
  const [selectedPrimary, setSelectedPrimary] = useState<Record<string, string>>({});

  // Manual check fields
  const [checkField, setCheckField] = useState<"aadhaar" | "phone" | "email">("phone");
  const [checkValue, setCheckValue] = useState("");
  const [checkResult, setCheckResult] = useState<DuplicateStudent[] | null>(null);
  const [checking, setChecking] = useState(false);

  // ─── Scan for Duplicates ───────────────────────────────────
  const handleScan = async () => {
    setScanning(true);
    setDuplicates([]);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/students/search/check-duplicate?scan=true`,
        authHeaders()
      );
      if (res.data.success) {
        setDuplicates(res.data.data || []);
        setHasScanned(true);
        if ((res.data.data || []).length === 0) {
          toast.success("No duplicates found! Database is clean.");
        } else {
          toast("Found potential duplicates", { icon: "⚠️" });
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  // ─── Manual Check ──────────────────────────────────────────
  const handleManualCheck = async () => {
    if (!checkValue.trim()) {
      toast.error("Please enter a value to check");
      return;
    }
    setChecking(true);
    setCheckResult(null);
    try {
      const params = new URLSearchParams();
      if (checkField === "aadhaar") params.append("aadharNo", checkValue);
      if (checkField === "phone") params.append("phone", checkValue);
      if (checkField === "email") params.append("email", checkValue);

      const res = await axios.get(
        `${API_BASE_URL}/api/students/search/check-duplicate?${params.toString()}`,
        authHeaders()
      );
      setCheckResult(res.data.data || []);
      if ((res.data.data || []).length === 0) {
        toast.success("No duplicates found for this value");
      }
    } catch (err: any) {
      toast.error("Check failed");
    } finally {
      setChecking(false);
    }
  };

  // ─── Merge Students ────────────────────────────────────────
  const handleMerge = async () => {
    if (!mergeConfirm) return;
    setMerging(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/students/operations/merge`,
        { primaryId: mergeConfirm.primaryId, duplicateId: mergeConfirm.duplicateId },
        authHeaders()
      );
      toast.success("Students merged successfully!");
      setMergeConfirm(null);
      // Re-scan
      handleScan();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Merge failed");
    } finally {
      setMerging(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Duplicate Manager"
        subtitle="Find and merge duplicate student records"
        icon={<Copy className="w-6 h-6" />}
      />

      <div className="mt-6 space-y-6">
        {/* Scan Button */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Automatic Duplicate Scan</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Scan the entire student database for potential duplicates by Aadhaar, phone number, and email.
              </p>
            </div>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Scan for Duplicates
                </>
              )}
            </button>
          </div>
        </div>

        {/* Manual Check */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Manual Check</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Field</label>
              <select
                value={checkField}
                onChange={(e) => setCheckField(e.target.value as any)}
                className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
              >
                <option value="phone">Phone Number</option>
                <option value="aadhaar">Aadhaar Number</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Value</label>
              <input
                type="text"
                value={checkValue}
                onChange={(e) => setCheckValue(e.target.value)}
                placeholder={checkField === "phone" ? "Enter 10-digit number" : checkField === "aadhaar" ? "Enter 12-digit Aadhaar" : "Enter email"}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="flex items-center gap-2 bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Check
            </button>
          </div>

          {/* Manual Check Results */}
          {checkResult !== null && (
            <div className="mt-4">
              {checkResult.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">No duplicates found</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Found {checkResult.length} record(s) matching this value:
                  </p>
                  {checkResult.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-slate-500">{s.admissionNo} | {s.enrollments?.[0]?.class?.name || ""} | {s.status}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/students/${s.id}`)}
                        className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scan Results */}
        {hasScanned && (
          <div className="space-y-4">
            {duplicates.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Duplicates Found</h3>
                <p className="text-sm text-slate-500 mt-1">Your student database is clean!</p>
              </div>
            ) : (
              duplicates.map((group, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      Duplicate {group.field}: <span className="text-indigo-600">{group.value}</span>
                    </h4>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {group.students.length} records
                    </span>
                  </div>

                  {/* Comparison Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Primary</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Adm No</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Father</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Class</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Created</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {group.students.map((student) => {
                          const groupKey = `${group.field}-${group.value}`;
                          const isPrimary = selectedPrimary[groupKey] === student.id;
                          return (
                            <tr key={student.id} className={isPrimary ? "bg-green-50 dark:bg-green-900/10" : ""}>
                              <td className="px-3 py-2">
                                <input
                                  type="radio"
                                  name={groupKey}
                                  checked={isPrimary}
                                  onChange={() => setSelectedPrimary((prev) => ({ ...prev, [groupKey]: student.id }))}
                                  className="w-4 h-4 text-indigo-600"
                                />
                              </td>
                              <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{student.firstName} {student.lastName}</td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-mono text-xs">{student.admissionNo}</td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{student.fatherName}</td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{student.enrollments?.[0]?.class?.name || "—"}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${student.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                                  {student.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-400 text-xs">{new Date(student.createdAt).toLocaleDateString("en-IN")}</td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => navigate(`/students/${student.id}`)}
                                  className="p-1 rounded text-slate-400 hover:text-indigo-500"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Merge Button */}
                  {group.students.length === 2 && selectedPrimary[`${group.field}-${group.value}`] && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => {
                          const groupKey = `${group.field}-${group.value}`;
                          const primaryId = selectedPrimary[groupKey];
                          const duplicateId = group.students.find((s) => s.id !== primaryId)?.id;
                          const primaryStudent = group.students.find((s) => s.id === primaryId);
                          if (primaryId && duplicateId && primaryStudent) {
                            setMergeConfirm({ primaryId, duplicateId, primaryName: `${primaryStudent.firstName} ${primaryStudent.lastName}` });
                          }
                        }}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Merge className="w-4 h-4" />
                        Merge into Primary
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Merge Confirmation */}
      {mergeConfirm && (
        <ConfirmDialog
          open={!!mergeConfirm}
          title="Merge Student Records"
          message={`This will merge the duplicate record into "${mergeConfirm.primaryName}" (primary). The duplicate will be permanently removed. All related data (enrollments, fees, attendance) will be transferred to the primary record. This action CANNOT be undone.`}
          confirmLabel={merging ? "Merging..." : "Yes, Merge"}
          variant="danger"
          onConfirm={handleMerge}
          onCancel={() => setMergeConfirm(null)}
        />
      )}
    </div>
  );
}
