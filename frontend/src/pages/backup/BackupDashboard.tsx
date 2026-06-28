import { useEffect, useState } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Database, HardDrive, Clock, Calendar, Download, Upload,
  RefreshCw, Settings, AlertTriangle, CheckCircle, XCircle,
  Play, Pause, Trash2, RotateCcw, Search, Filter,
  ChevronLeft, ChevronRight, ArrowUpRight, Shield,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface BackupRecord {
  id: string;
  date: string;
  time: string;
  size: string;
  type: "Auto" | "Manual";
  status: "Success" | "Failed" | "In Progress";
  modules: string[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function BackupDashboard() {
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    lastBackup: "2 hours ago",
    lastBackupDate: "27 Jun 2026, 4:30 PM",
    totalBackups: 48,
    storageUsed: "12.4 GB",
    storageTotal: "50 GB",
    storagePercent: 24.8,
    nextScheduled: "Tonight 2:00 AM",
    autoBackupEnabled: true,
  });
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);

  useEffect(() => {
    fetchBackupData();
  }, []);

  const fetchBackupData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getFullUrl("/api/backup/dashboard"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data) {
        setStats(res.data.stats || stats);
        setHistoryData(res.data.historyChart || defaultHistoryData);
        setBackupHistory(res.data.backupRecords || defaultBackupHistory);
      }
    } catch (error) {
      console.error("Failed to fetch backup dashboard:", error);
      setHistoryData(defaultHistoryData);
      setBackupHistory(defaultBackupHistory);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupNow = async () => {
    setBackupInProgress(true);
    try {
      await axios.post(getFullUrl("/api/backup/create"), {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // Refresh data after backup
      setTimeout(() => {
        fetchBackupData();
        setBackupInProgress(false);
      }, 3000);
    } catch (error) {
      console.error("Backup failed:", error);
      setBackupInProgress(false);
    }
  };

  const itemsPerPage = 6;
  const totalPages = Math.ceil(backupHistory.length / itemsPerPage);
  const paginatedHistory = backupHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-slate-700" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Backup & Recovery</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage database backups, scheduling, and data recovery</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBackupNow}
            disabled={backupInProgress}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all ${
              backupInProgress
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            }`}
          >
            {backupInProgress ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Backing up...
              </>
            ) : (
              <>
                <Database size={16} /> Backup Now
              </>
            )}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm">
            <Settings size={16} /> Schedule
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Last Backup */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 flex items-center justify-center">
              <Clock size={22} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Backup</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.lastBackup}</p>
              <p className="text-[10px] text-gray-400">{stats.lastBackupDate}</p>
            </div>
            <CheckCircle size={16} className="text-green-500" />
          </div>
        </div>

        {/* Total Backups */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Database size={22} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Backups</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalBackups}</p>
              <p className="text-[10px] text-gray-400">This month</p>
            </div>
            <span className="flex items-center text-xs font-medium text-green-600">
              <ArrowUpRight size={12} /> 12%
            </span>
          </div>
        </div>

        {/* Storage Used */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <HardDrive size={22} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Storage Used</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.storageUsed}</p>
              <div className="mt-1 w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${stats.storagePercent}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{stats.storagePercent}% of {stats.storageTotal}</p>
            </div>
          </div>
        </div>

        {/* Next Scheduled */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <Calendar size={22} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Next Scheduled</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.nextScheduled}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${stats.autoBackupEnabled ? "bg-green-500" : "bg-red-500"}`} />
                <p className="text-[10px] text-gray-400">{stats.autoBackupEnabled ? "Auto-backup ON" : "Auto-backup OFF"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={handleBackupNow}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play size={16} /> Take Backup
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Settings size={16} /> Schedule
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
          <RotateCcw size={16} /> Restore
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Download size={16} /> Download
        </button>
      </div>

      {/* ── Backup History Chart ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Backup History (Size Trend)</h3>
          <select className="text-xs px-2 py-1 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>Last 90 Days</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={historyData}>
            <defs>
              <linearGradient id="backupGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" unit=" MB" />
            <Tooltip
              formatter={(value: any) => [`${value} MB`, "Size"]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
            />
            <Area
              type="monotone"
              dataKey="size"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#backupGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Backup Schedule Info ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield size={16} className="text-indigo-500" />
          Backup Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Frequency</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">Daily at 2:00 AM</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Retention</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">30 Days</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Compression</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">Enabled (gzip)</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Encryption</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">AES-256</p>
          </div>
        </div>
      </div>

      {/* ── Backup History Table ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Backup History</h3>
          <div className="flex items-center gap-2">
            <select className="text-xs px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300">
              <option>All Types</option>
              <option>Auto</option>
              <option>Manual</option>
            </select>
            <select className="text-xs px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300">
              <option>All Status</option>
              <option>Success</option>
              <option>Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Modules</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.map((record) => (
                <tr key={record.id} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{record.date}</p>
                    <p className="text-xs text-gray-400">{record.time}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">{record.size}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      record.type === "Auto"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    }`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      record.status === "Success"
                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : record.status === "Failed"
                        ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {record.status === "Success" && <CheckCircle size={10} />}
                      {record.status === "Failed" && <XCircle size={10} />}
                      {record.status === "In Progress" && <RefreshCw size={10} className="animate-spin" />}
                      {record.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {record.modules.slice(0, 3).map((mod, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400">
                          {mod}
                        </span>
                      ))}
                      {record.modules.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500">
                          +{record.modules.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600" title="Download">
                        <Download size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600" title="Restore">
                        <RotateCcw size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 flex items-center justify-between border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, backupHistory.length)} of {backupHistory.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-medium ${currentPage === i + 1 ? "bg-blue-600 text-white" : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"}`}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Warning Note ── */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Backup Reminder</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Always verify your backups periodically. Download a copy and test restoration in a staging environment before relying on automated backups for disaster recovery.
          </p>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEFAULT DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const defaultHistoryData = [
  { date: "Jun 1", size: 280 },
  { date: "Jun 5", size: 295 },
  { date: "Jun 9", size: 310 },
  { date: "Jun 13", size: 305 },
  { date: "Jun 17", size: 325 },
  { date: "Jun 21", size: 340 },
  { date: "Jun 25", size: 355 },
  { date: "Jun 27", size: 362 },
];

const defaultBackupHistory: BackupRecord[] = [
  { id: "1", date: "27 Jun 2026", time: "04:30 PM", size: "362 MB", type: "Manual", status: "Success", modules: ["Students", "Fees", "Attendance", "Exams", "Teachers", "All"] },
  { id: "2", date: "27 Jun 2026", time: "02:00 AM", size: "358 MB", type: "Auto", status: "Success", modules: ["Full Database"] },
  { id: "3", date: "26 Jun 2026", time: "02:00 AM", size: "355 MB", type: "Auto", status: "Success", modules: ["Full Database"] },
  { id: "4", date: "25 Jun 2026", time: "02:00 AM", size: "352 MB", type: "Auto", status: "Failed", modules: ["Full Database"] },
  { id: "5", date: "25 Jun 2026", time: "10:15 AM", size: "350 MB", type: "Manual", status: "Success", modules: ["Students", "Fees"] },
  { id: "6", date: "24 Jun 2026", time: "02:00 AM", size: "348 MB", type: "Auto", status: "Success", modules: ["Full Database"] },
  { id: "7", date: "23 Jun 2026", time: "02:00 AM", size: "345 MB", type: "Auto", status: "Success", modules: ["Full Database"] },
  { id: "8", date: "22 Jun 2026", time: "02:00 AM", size: "342 MB", type: "Auto", status: "Success", modules: ["Full Database"] },
  { id: "9", date: "21 Jun 2026", time: "02:00 AM", size: "340 MB", type: "Auto", status: "Success", modules: ["Full Database"] },
  { id: "10", date: "20 Jun 2026", time: "03:45 PM", size: "338 MB", type: "Manual", status: "Success", modules: ["Students", "Fees", "Teachers"] },
  { id: "11", date: "20 Jun 2026", time: "02:00 AM", size: "335 MB", type: "Auto", status: "Success", modules: ["Full Database"] },
  { id: "12", date: "19 Jun 2026", time: "02:00 AM", size: "332 MB", type: "Auto", status: "Success", modules: ["Full Database"] },
];
