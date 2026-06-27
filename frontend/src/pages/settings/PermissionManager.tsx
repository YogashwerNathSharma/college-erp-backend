import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Shield,
  UserCheck,
  Clock,
  Save,
  X,
  Loader2,
  Zap,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

//////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////

interface Permission {
  key: string;
  label: string;
  defaultValue: boolean;
}

interface PermissionModule {
  id: string;
  label: string;
  permissions: Permission[];
}

interface TempAdminInfo {
  active: boolean;
  expiresAt: string | null;
  grantedAt: string | null;
}

interface PermissionManagerProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onClose: () => void;
}

//////////////////////////////////////////////////////
// PERMISSION MODULES CONFIG
//////////////////////////////////////////////////////

const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: "students",
    label: "Students",
    permissions: [
      { key: "canViewStudents", label: "View Students", defaultValue: true },
      { key: "canEditStudents", label: "Edit Students", defaultValue: false },
    ],
  },
  {
    id: "attendance",
    label: "Attendance",
    permissions: [
      { key: "canViewAttendance", label: "View Attendance", defaultValue: true },
      {
        key: "canMarkAttendance",
        label: "Mark Attendance",
        defaultValue: false,
      },
    ],
  },
  {
    id: "exams",
    label: "Exams",
    permissions: [
      { key: "canViewResults", label: "View Results", defaultValue: true },
      { key: "canEnterMarks", label: "Enter Marks", defaultValue: false },
    ],
  },
  {
    id: "fees",
    label: "Fees",
    permissions: [
      { key: "canViewFees", label: "View Fees", defaultValue: false },
      { key: "canCollectFees", label: "Collect Fees", defaultValue: false },
    ],
  },
  {
    id: "library",
    label: "Library",
    permissions: [
      { key: "canManageLibrary", label: "Manage Library", defaultValue: false },
    ],
  },
  {
    id: "timetable",
    label: "Timetable",
    permissions: [
      { key: "canViewTimetable", label: "View Timetable", defaultValue: true },
      {
        key: "canManageTimetable",
        label: "Manage Timetable",
        defaultValue: false,
      },
    ],
  },
  {
    id: "leave",
    label: "Leave",
    permissions: [
      { key: "canViewLeave", label: "View Leave", defaultValue: true },
      { key: "canApproveLeave", label: "Approve Leave", defaultValue: false },
    ],
  },
  {
    id: "salary",
    label: "Salary",
    permissions: [
      { key: "canViewSalary", label: "View Salary", defaultValue: false },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    permissions: [
      { key: "canViewReports", label: "View Reports", defaultValue: true },
    ],
  },
];

//////////////////////////////////////////////////////
// DURATION OPTIONS
//////////////////////////////////////////////////////

const DURATION_OPTIONS = [
  { label: "1 hour", value: 1 },
  { label: "4 hours", value: 4 },
  { label: "8 hours", value: 8 },
  { label: "24 hours", value: 24 },
  { label: "Custom", value: -1 },
];

//////////////////////////////////////////////////////
// TOGGLE COMPONENT
//////////////////////////////////////////////////////

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${checked ? "bg-primary-600" : "bg-gray-200"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0
          transition duration-200 ease-in-out
          ${checked ? "translate-x-5" : "translate-x-0"}
        `}
      />
    </button>
  );
}

//////////////////////////////////////////////////////
// MAIN COMPONENT
//////////////////////////////////////////////////////

export default function PermissionManager({
  user,
  onClose,
}: PermissionManagerProps) {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [originalPermissions, setOriginalPermissions] = useState<
    Record<string, boolean>
  >({});
  const [tempAdmin, setTempAdmin] = useState<TempAdminInfo>({
    active: false,
    expiresAt: null,
    grantedAt: null,
  });
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(24);
  const [customHours, setCustomHours] = useState(2);
  const [grantingTempAdmin, setGrantingTempAdmin] = useState(false);
  const [revokingTempAdmin, setRevokingTempAdmin] = useState(false);
  const [countdown, setCountdown] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  //////////////////////////////////////////////////////
  // FETCH PERMISSIONS
  //////////////////////////////////////////////////////

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/permissions/${user.id}`, { headers });
      const data = res.data.data || res.data;

      // Set permissions from API (fields are flat on the response object)
      const perms: Record<string, boolean> = {};
      PERMISSION_MODULES.forEach((mod) => {
        mod.permissions.forEach((p) => {
          perms[p.key] = data[p.key] ?? p.defaultValue;
        });
      });
      setPermissions(perms);
      setOriginalPermissions({ ...perms });

      // Set temp admin info (flat fields on the response)
      setTempAdmin({
        active: data.isTemporaryAdmin || false,
        expiresAt: data.tempAdminExpiry || null,
        grantedAt: data.createdAt || null,
      });
    } catch (err: any) {
      // If 404 - API not ready, use defaults
      if (err?.response?.status === 404) {
        const defaults: Record<string, boolean> = {};
        PERMISSION_MODULES.forEach((mod) => {
          mod.permissions.forEach((p) => {
            defaults[p.key] = p.defaultValue;
          });
        });
        setPermissions(defaults);
        setOriginalPermissions({ ...defaults });
      } else {
        toast.error("Failed to load permissions");
      }
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // SAVE PERMISSIONS
  //////////////////////////////////////////////////////

  const handleSave = async () => {
    // Only send changed fields
    const changedPermissions: Record<string, boolean> = {};
    Object.keys(permissions).forEach((key) => {
      if (permissions[key] !== originalPermissions[key]) {
        changedPermissions[key] = permissions[key];
      }
    });

    if (Object.keys(changedPermissions).length === 0) {
      toast("No changes to save", { icon: "ℹ️" });
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `/api/permissions/${user.id}`,
        { permissions: changedPermissions },
        { headers }
      );
      setOriginalPermissions({ ...permissions });
      toast.success("Permissions saved successfully! ✅");
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast.error("Permissions API not available yet");
      } else {
        toast.error(
          err?.response?.data?.message || "Failed to save permissions"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  //////////////////////////////////////////////////////
  // TEMP ADMIN - GRANT
  //////////////////////////////////////////////////////

  const handleGrantTempAdmin = async () => {
    const hours = selectedDuration === -1 ? customHours : selectedDuration;
    if (hours <= 0) {
      toast.error("Please select a valid duration");
      return;
    }

    setGrantingTempAdmin(true);
    try {
      const res = await axios.post(
        `/api/permissions/temp-admin/${user.id}`,
        { durationInHours: hours },
        { headers }
      );
      const data = res.data.data || res.data;
      setTempAdmin({
        active: true,
        expiresAt: data.tempAdminExpiry || new Date(Date.now() + hours * 3600000).toISOString(),
        grantedAt: data.createdAt || new Date().toISOString(),
      });
      setShowDurationPicker(false);
      toast.success(`Temporary admin granted for ${hours}h! ⚡`);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast.error("Temp admin API not available yet");
      } else {
        toast.error(
          err?.response?.data?.message || "Failed to grant temp admin"
        );
      }
    } finally {
      setGrantingTempAdmin(false);
    }
  };

  //////////////////////////////////////////////////////
  // TEMP ADMIN - REVOKE
  //////////////////////////////////////////////////////

  const handleRevokeTempAdmin = async () => {
    setRevokingTempAdmin(true);
    try {
      await axios.delete(`/api/permissions/temp-admin/${user.id}`, { headers });
      setTempAdmin({ active: false, expiresAt: null, grantedAt: null });
      toast.success("Temporary admin revoked! 🔒");
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast.error("Temp admin API not available yet");
      } else {
        toast.error(
          err?.response?.data?.message || "Failed to revoke temp admin"
        );
      }
    } finally {
      setRevokingTempAdmin(false);
    }
  };

  //////////////////////////////////////////////////////
  // COUNTDOWN TIMER
  //////////////////////////////////////////////////////

  useEffect(() => {
    if (tempAdmin.active && tempAdmin.expiresAt) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const expires = new Date(tempAdmin.expiresAt!).getTime();
        const diff = expires - now;

        if (diff <= 0) {
          setTempAdmin({ active: false, expiresAt: null, grantedAt: null });
          setCountdown("");
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }

        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setCountdown(`${minutes}m ${seconds}s`);
        } else {
          setCountdown(`${seconds}s`);
        }
      };

      updateCountdown();
      timerRef.current = setInterval(updateCountdown, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [tempAdmin.active, tempAdmin.expiresAt]);

  //////////////////////////////////////////////////////
  // EFFECTS
  //////////////////////////////////////////////////////

  useEffect(() => {
    fetchPermissions();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user.id]);

  //////////////////////////////////////////////////////
  // HELPERS
  //////////////////////////////////////////////////////

  const hasChanges = () => {
    return Object.keys(permissions).some(
      (key) => permissions[key] !== originalPermissions[key]
    );
  };

  //////////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////////

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 z-[101] w-full max-w-lg transform transition-transform duration-300 ease-out">
        <div className="h-full flex flex-col bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={24} />
                <div>
                  <h2 className="text-lg font-bold">User Permissions</h2>
                  <p className="text-primary-100 text-sm">{user.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-white/20 rounded-md text-xs font-medium">
                {user.role}
              </span>
              <span className="text-primary-200 text-xs">{user.email}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-primary-600" size={32} />
                <span className="ml-3 text-slate-500">
                  Loading permissions...
                </span>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* ⚡ Quick Actions - Temp Admin */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
                    <Zap size={16} className="text-amber-500" />
                    Quick Actions
                  </h3>

                  {tempAdmin.active ? (
                    <div className="space-y-3">
                      {/* Active Temp Admin Badge */}
                      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex-shrink-0">
                          <UserCheck
                            size={20}
                            className="text-amber-600"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-amber-800">
                            Temporary Admin Active
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock size={12} className="text-amber-600" />
                            <span className="text-xs text-amber-700 font-mono">
                              Expires in: {countdown || "calculating..."}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Revoke Button */}
                      <button
                        onClick={handleRevokeTempAdmin}
                        disabled={revokingTempAdmin}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {revokingTempAdmin ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <AlertTriangle size={16} />
                        )}
                        Revoke Admin Access
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {!showDurationPicker ? (
                        <button
                          onClick={() => setShowDurationPicker(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-700 text-sm font-medium transition-colors"
                        >
                          <Shield size={16} />
                          Make Temporary Admin
                        </button>
                      ) : (
                        <div className="space-y-3 animate-in fade-in duration-200">
                          <p className="text-xs text-slate-500">
                            Select duration for temporary admin access:
                          </p>

                          {/* Duration Options */}
                          <div className="grid grid-cols-3 gap-2">
                            {DURATION_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setSelectedDuration(opt.value)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                  selectedDuration === opt.value
                                    ? "bg-primary-50 border-primary-300 text-primary-700"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          {/* Custom Hours Input */}
                          {selectedDuration === -1 && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                max={168}
                                value={customHours}
                                onChange={(e) =>
                                  setCustomHours(
                                    Math.max(1, parseInt(e.target.value) || 1)
                                  )
                                }
                                className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                              <span className="text-sm text-slate-500">
                                hours
                              </span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={handleGrantTempAdmin}
                              disabled={grantingTempAdmin}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {grantingTempAdmin ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <UserCheck size={14} />
                              )}
                              Grant Access
                            </button>
                            <button
                              onClick={() => setShowDurationPicker(false)}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 📋 Module Permissions */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
                    <Shield size={16} className="text-primary-500" />
                    Module Permissions
                  </h3>

                  <div className="space-y-4">
                    {PERMISSION_MODULES.map((module) => (
                      <div
                        key={module.id}
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                      >
                        {/* Module Header */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                          <h4 className="text-sm font-semibold text-slate-700">
                            {module.label}
                          </h4>
                        </div>

                        {/* Permissions */}
                        <div className="divide-y divide-slate-50">
                          {module.permissions.map((perm) => (
                            <div
                              key={perm.key}
                              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors"
                            >
                              <span className="text-sm text-slate-600">
                                {perm.label}
                              </span>
                              <Toggle
                                checked={permissions[perm.key] ?? perm.defaultValue}
                                onChange={(val) =>
                                  setPermissions((prev) => ({
                                    ...prev,
                                    [perm.key]: val,
                                  }))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Save Button */}
          {!loading && (
            <div className="px-6 py-4 border-t border-slate-200 bg-white">
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges()}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  hasChanges()
                    ? "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {hasChanges() && (
                <p className="text-xs text-center text-amber-600 mt-2">
                  You have unsaved changes
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
