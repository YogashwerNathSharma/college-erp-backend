import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Database,
  Download,
  Trash2,
  Clock,
  Calendar,
  Settings,
  RefreshCw,
  HardDrive,
  Shield,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  FileArchive,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================
interface Backup {
  id: string;
  tenantId: string;
  filename: string;
  size: number;
  type: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BackupSettings {
  id: string;
  tenantId: string;
  dailyEnabled: boolean;
  weeklyEnabled: boolean;
  monthlyEnabled: boolean;
  yearlyEnabled: boolean;
  dailyTime: string;
  weeklyDay: number;
  monthlyDate: number;
  retentionDays: number;
}

interface BackupListResponse {
  backups: Backup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  storageUsed: number;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          <CheckCircle size={12} /> Completed
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
          <XCircle size={12} /> Failed
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
          <Loader2 size={12} className="animate-spin" /> In Progress
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          {status}
        </span>
      );
  }
}

function getTypeBadge(type: string) {
  const colors: Record<string, string> = {
    MANUAL: "bg-primary-100 text-primary-700",
    DAILY: "bg-purple-100 text-purple-700",
    WEEKLY: "bg-primary-100 text-primary-700",
    MONTHLY: "bg-cyan-100 text-cyan-700",
    YEARLY: "bg-orange-100 text-orange-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${colors[type] || "bg-gray-100 text-gray-700"}`}
    >
      {type}
    </span>
  );
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function BackupPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "manual" | "schedule" | "history">("dashboard");
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<{ total: number; storageUsed: number; lastBackup: string | null }>({
    total: 0,
    storageUsed: 0,
    lastBackup: null,
  });
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [notes, setNotes] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ============================================================
  // API CALLS
  // ============================================================
  const fetchBackups = useCallback(async (pageNum = 1, type = "") => {
    try {
      setLoading(true);
      const params: any = { page: pageNum, limit: 20 };
      if (type) params.type = type;

      const res = await axios.get("/api/backup", { params });
      const data: BackupListResponse = res.data.data;

      setBackups(data.backups);
      setTotalPages(data.totalPages);
      setStats({
        total: data.total,
        storageUsed: data.storageUsed,
        lastBackup: data.backups.length > 0 ? data.backups[0].createdAt : null,
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch backups");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get("/api/backup/settings");
      setSettings(res.data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch settings");
    }
  }, []);

  const triggerBackup = async () => {
    try {
      setBackupInProgress(true);
      await axios.post("/api/backup/create", { notes: notes || undefined });
      toast.success("Backup created successfully!");
      setNotes("");
      fetchBackups(page, filterType);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Backup failed");
    } finally {
      setBackupInProgress(false);
    }
  };

  const downloadBackup = async (id: string, filename: string) => {
    try {
      const res = await axios.get(`/api/backup/download/${id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error: any) {
      toast.error("Download failed");
    }
  };

  const deleteBackup = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this backup? This action cannot be undone.")) return;
    try {
      await axios.delete(`/api/backup/${id}`);
      toast.success("Backup deleted");
      fetchBackups(page, filterType);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  const updateSettings = async (updatedSettings: Partial<BackupSettings>) => {
    try {
      const res = await axios.put("/api/backup/settings", updatedSettings);
      setSettings(res.data.data);
      toast.success("Settings updated successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update settings");
    }
  };

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    fetchBackups(1, "");
    fetchSettings();
  }, [fetchBackups, fetchSettings]);

  useEffect(() => {
    fetchBackups(page, filterType);
  }, [page, filterType, fetchBackups]);

  // ============================================================
  // TAB COMPONENTS
  // ============================================================

  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-50">
              <Database size={24} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Backups</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-50">
              <HardDrive size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900">{formatBytes(stats.storageUsed)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-50">
              <Clock size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Backup</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.lastBackup ? formatDate(stats.lastBackup) : "Never"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Backups */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Backups</h3>
          <button
            onClick={() => fetchBackups(1, "")}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 size={24} className="animate-spin text-gray-400 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center">
              <FileArchive size={40} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No backups yet. Create your first backup!</p>
            </div>
          ) : (
            backups.slice(0, 5).map((backup) => (
              <div key={backup.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <FileArchive size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{backup.filename}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getTypeBadge(backup.type)}
                      {getStatusBadge(backup.status)}
                      <span className="text-xs text-gray-500">{formatBytes(backup.size)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{formatDate(backup.createdAt)}</span>
                  {backup.status === "COMPLETED" && (
                    <button
                      onClick={() => downloadBackup(backup.id, backup.filename)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const ManualBackupTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-primary-50">
            <Shield size={24} className="text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Create Manual Backup</h3>
            <p className="text-sm text-gray-500">
              Export all your data as a compressed ZIP file. This includes all collections for your tenant.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note about this backup (e.g., 'Before annual upgrade')"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={triggerBackup}
            disabled={backupInProgress}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {backupInProgress ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Plus size={18} />
                Create Backup Now
              </>
            )}
          </button>
        </div>

        {backupInProgress && (
          <div className="mt-6 p-4 bg-primary-50 border border-blue-100 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 size={20} className="animate-spin text-primary-600" />
              <div>
                <p className="text-sm font-medium text-primary-800">Backup in progress...</p>
                <p className="text-xs text-primary-600">
                  This may take a few moments depending on your data size.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* What gets backed up */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">What&apos;s included in the backup?</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            "Students & Enrollments",
            "Teachers & Assignments",
            "Classes & Sections",
            "Subjects & Timetables",
            "Fee Structures & Payments",
            "Attendance Records",
            "Exam Data & Results",
            "Documents & Settings",
            "Academic Years",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
              <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ScheduleTab = () => {
    if (!settings) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-purple-50">
              <Calendar size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Backup Schedule</h3>
              <p className="text-sm text-gray-500">
                Configure automatic backups to keep your data safe.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Daily Backup */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Clock size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Daily Backup</p>
                  <p className="text-sm text-gray-500">Runs every day at the specified time</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="time"
                  value={settings.dailyTime}
                  onChange={(e) =>
                    updateSettings({ dailyTime: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dailyEnabled}
                    onChange={(e) =>
                      updateSettings({ dailyEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>

            {/* Weekly Backup */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary-50">
                  <Calendar size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Weekly Backup</p>
                  <p className="text-sm text-gray-500">Runs once per week on the selected day</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={settings.weeklyDay}
                  onChange={(e) =>
                    updateSettings({ weeklyDay: Number(e.target.value) })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  {DAYS_OF_WEEK.map((day, i) => (
                    <option key={i} value={i}>
                      {day}
                    </option>
                  ))}
                </select>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.weeklyEnabled}
                    onChange={(e) =>
                      updateSettings({ weeklyEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>

            {/* Monthly Backup */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-cyan-50">
                  <Calendar size={18} className="text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Monthly Backup</p>
                  <p className="text-sm text-gray-500">Runs once per month on the selected date</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={settings.monthlyDate}
                  onChange={(e) =>
                    updateSettings({ monthlyDate: Number(e.target.value) })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.monthlyEnabled}
                    onChange={(e) =>
                      updateSettings({ monthlyEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>

            {/* Yearly Backup */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-orange-50">
                  <Calendar size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Yearly Backup</p>
                  <p className="text-sm text-gray-500">Runs on January 1st every year</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.yearlyEnabled}
                    onChange={(e) =>
                      updateSettings({ yearlyEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Retention Settings */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-red-50">
              <Settings size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Retention Policy</h3>
              <p className="text-sm text-gray-500">
                Automatically delete backups older than the specified number of days.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Keep backups for</label>
            <input
              type="number"
              value={settings.retentionDays}
              onChange={(e) =>
                updateSettings({ retentionDays: Number(e.target.value) })
              }
              min={7}
              max={365}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-500">days</span>
          </div>
        </div>
      </div>
    );
  };

  const HistoryTab = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Filter size={16} className="text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            <option value="MANUAL">Manual</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
          <button
            onClick={() => fetchBackups(page, filterType)}
            className="ml-auto p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Backup List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 size={24} className="animate-spin text-gray-400 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Loading...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center">
            <FileArchive size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No backups found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileArchive size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{backup.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(backup.type)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(backup.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatBytes(backup.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(backup.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                      {backup.notes || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {backup.status === "COMPLETED" && (
                          <button
                            onClick={() => downloadBackup(backup.id, backup.filename)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Database size={28} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Data Backup</h1>
        </div>
        <p className="text-sm text-gray-500 ml-10">
          Manage and schedule backups to protect your data
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { key: "dashboard", label: "Dashboard", icon: HardDrive },
            { key: "manual", label: "Manual Backup", icon: Plus },
            { key: "schedule", label: "Schedule", icon: Calendar },
            { key: "history", label: "History", icon: Clock },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && <DashboardTab />}
      {activeTab === "manual" && <ManualBackupTab />}
      {activeTab === "schedule" && <ScheduleTab />}
      {activeTab === "history" && <HistoryTab />}
    </div>
  );
}
