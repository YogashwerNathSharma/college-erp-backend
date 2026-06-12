

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

import {
  Settings,
  Download,
  Edit3,
  Check,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Power,
  GraduationCap,
  Calendar,
  Info,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface AgeConfig {
  id: string;
  classId: string;
  className: string;
  board: string;
  minAge: number;
  maxAge: number;
  ageCalcRefMonth: number;
  ageCalcRefDay: number;
  isActive: boolean;
}

interface ClassItem {
  id: string;
  name: string;
  academicYearId: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

// ─── API Config ────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:5000";

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// ─── Component ─────────────────────────────────────────────────────────────

const AgeSettings: React.FC = () => {
  const [configs, setConfigs] = useState<AgeConfig[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState("UP_BOARD");

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ minAge: 0, maxAge: 0 });
  const [saving, setSaving] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = React.useRef(0);

  // ─── Toast Helper ──────────────────────────────────────────────────────

  const showToast = useCallback((type: "success" | "error", message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // ─── Fetch Data ────────────────────────────────────────────────────────

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/students/age-config`,
        getAuthHeaders()
      );
      setConfigs(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch age configs:", err);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/class`, getAuthHeaders());
      setClasses(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConfigs(), fetchClasses()]);
      setLoading(false);
    };
    loadData();
  }, [fetchConfigs, fetchClasses]);

  // ─── Seed Defaults ────────────────────────────────────────────────────

  const handleSeedDefaults = async () => {
    if (classes.length === 0) {
      showToast("error", "No classes found. Create classes first.");
      return;
    }

    const classMapping = classes.map((c) => ({
      className: c.name,
      classId: c.id,
    }));

    setSeeding(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/students/age-config/seed`,
        { board: selectedBoard, classMapping },
        getAuthHeaders()
      );

      if (res.data.success) {
        const { matched, skipped } = res.data.data || {};
        if (matched > 0) {
          showToast(
            "success",
            `${selectedBoard} defaults loaded! ${matched} classes configured${skipped > 0 ? `, ${skipped} skipped (no match)` : ""}.`
          );
        } else {
          showToast(
            "error",
            `No classes matched ${selectedBoard} defaults. Check class names (expected: "Class 1", "Nursery", etc.)`
          );
        }
        await fetchConfigs();
      } else {
        showToast("error", res.data.message || "Failed to seed defaults.");
      }
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load defaults.");
    } finally {
      setSeeding(false);
    }
  };

  // ─── Edit Config ────────────────────────────────────────────────────

  const handleEdit = (config: AgeConfig) => {
    setEditingId(config.id);
    setEditData({ minAge: config.minAge, maxAge: config.maxAge });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ minAge: 0, maxAge: 0 });
  };

  const handleSave = async (id: string) => {
    if (editData.minAge >= editData.maxAge) {
      showToast("error", "Min age must be less than max age.");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(
        `${API_BASE}/api/students/age-config/${id}`,
        editData,
        getAuthHeaders()
      );
      if (res.data.success) {
        showToast("success", "Age limit updated!");
        setEditingId(null);
        await fetchConfigs();
      } else {
        showToast("error", res.data.message || "Update failed.");
      }
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle Active/Inactive ────────────────────────────────────────

  const handleToggleStatus = async (config: AgeConfig) => {
    try {
      setActionLoading(config.id);
      const res = await axios.patch(
        `${API_BASE}/api/students/age-config/${config.id}/toggle-status`,
        {},
        getAuthHeaders()
      );
      if (res.data.success) {
        showToast(
          "success",
          config.isActive
            ? `"${config.className}" age rule deactivated.`
            : `"${config.className}" age rule activated.`
        );
        await fetchConfigs();
      }
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Toggle failed.");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Board Colors ──────────────────────────────────────────────────

  const boardColors: Record<string, string> = {
    UP_BOARD: "bg-orange-100 text-orange-800",
    CBSE: "bg-blue-100 text-blue-800",
    ICSE: "bg-purple-100 text-purple-800",
  };

  const boardLabels: Record<string, string> = {
    UP_BOARD: "UP Board",
    CBSE: "CBSE",
    ICSE: "ICSE",
  };

  // ─── Loading ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-80 bg-gray-100 rounded" />
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="h-6 w-64 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-100 rounded-xl" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-indigo-600" />
          </div>
          Age Configuration
        </h1>
        <p className="text-sm text-gray-500 mt-1 ml-[52px]">
          Class-wise min/max age for admission. Age calculated as on March 31.
        </p>
      </div>

      {/* Quick Setup Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Quick Setup - Load Board Defaults
            </h2>
            <p className="text-sm text-gray-500">
              Select board to load government age limits. Customize later.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
          >
            <option value="UP_BOARD">UP Board</option>
            <option value="CBSE">CBSE</option>
            <option value="ICSE">ICSE</option>
          </select>

          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {seeding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Load Defaults
              </>
            )}
          </button>
        </div>

        {/* Info box */}
        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2">
          <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            {selectedBoard === "UP_BOARD" && (
              <p><strong>UP Board:</strong> Play Group 2+, Nursery 3+, LKG 4+, UKG 5+, Class 1 = 6+</p>
            )}
            {selectedBoard === "CBSE" && (
              <p><strong>CBSE (NEP 2020):</strong> Class 1 minimum 6 years as on March 31</p>
            )}
            {selectedBoard === "ICSE" && (
              <p><strong>ICSE:</strong> Class 1 = 5.5 to 7 years. Flexible range.</p>
            )}
          </div>
        </div>

        {/* Classes count info */}
        <div className="mt-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">
            {classes.length} classes found in database
            {classes.length > 0 && (
              <span className="text-gray-400 ml-1">
                ({classes.slice(0, 5).map((c) => c.name).join(", ")}
                {classes.length > 5 ? ` +${classes.length - 5} more` : ""})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Age Config Table */}
      {configs.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-800">
                Current Age Limits
              </h2>
              <span className="text-sm text-gray-500">
                ({configs.length} rules)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Board
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Min Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Max Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {configs.map((config) => (
                  <tr
                    key={config.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      !config.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-medium text-gray-800">
                          {config.className}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          boardColors[config.board] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {boardLabels[config.board] || config.board}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {editingId === config.id ? (
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={editData.minAge}
                          onChange={(e) =>
                            setEditData({ ...editData, minAge: parseFloat(e.target.value) || 0 })
                          }
                          className="w-20 border border-indigo-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      ) : (
                        <span className="text-sm text-gray-700 font-medium">
                          {config.minAge} yrs
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {editingId === config.id ? (
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={editData.maxAge}
                          onChange={(e) =>
                            setEditData({ ...editData, maxAge: parseFloat(e.target.value) || 0 })
                          }
                          className="w-20 border border-indigo-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      ) : (
                        <span className="text-sm text-gray-700 font-medium">
                          {config.maxAge} yrs
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          config.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            config.isActive ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        {config.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {editingId === config.id ? (
                          <>
                            <button
                              onClick={() => handleSave(config.id)}
                              disabled={saving}
                              className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                              title="Save"
                            >
                              {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(config)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(config)}
                              disabled={actionLoading === config.id}
                              className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors disabled:opacity-50"
                              title={config.isActive ? "Deactivate" : "Activate"}
                            >
                              {actionLoading === config.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-lg font-medium">No age configurations yet</p>
          <p className="text-sm mt-1">Load defaults from a board to get started</p>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgeSettings;

