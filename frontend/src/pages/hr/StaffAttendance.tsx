import { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar, CheckCircle2, XCircle, Clock, Users, UserCheck,
  Home, ChevronRight, Loader2, X, AlertCircle, Save, BarChart3
} from "lucide-react";

interface StaffAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
}

interface MonthlyReport {
  employeeName: string;
  employeeId: string;
  days: Record<number, "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE">;
  totalPresent: number;
  totalAbsent: number;
}

type ViewMode = "mark" | "report";

export default function StaffAttendance() {
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("mark");
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (viewMode === "mark") fetchAttendance();
    else fetchMonthlyReport();
  }, [date, viewMode, reportMonth]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/hr/staff-attendance", { headers, params: { date } });
      setRecords(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/hr/staff-attendance/report", { headers, params: { month: reportMonth } });
      setMonthlyReport(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (id: string, status: StaffAttendanceRecord["status"]) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const markAllPresent = () => {
    setRecords(prev => prev.map(r => ({ ...r, status: "PRESENT" as const })));
  };

  const submitAttendance = async () => {
    setSaving(true);
    setError("");
    try {
      await axios.post("/api/hr/staff-attendance", {
        date,
        records: records.map(r => ({ employeeId: r.employeeId, status: r.status })),
      }, { headers });
      setSuccess("Attendance submitted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit attendance");
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = records.filter(r => !departmentFilter || r.department === departmentFilter);
  const departments = [...new Set(records.map(r => r.department))].filter(Boolean);

  const summary = {
    total: filteredRecords.length,
    present: filteredRecords.filter(r => r.status === "PRESENT").length,
    absent: filteredRecords.filter(r => r.status === "ABSENT").length,
    halfDay: filteredRecords.filter(r => r.status === "HALF_DAY").length,
    leave: filteredRecords.filter(r => r.status === "LEAVE").length,
  };

  const statusOptions: { value: StaffAttendanceRecord["status"]; label: string; color: string; activeColor: string }[] = [
    { value: "PRESENT", label: "P", color: "border-gray-300 text-gray-400", activeColor: "border-green-500 bg-green-500 text-white" },
    { value: "ABSENT", label: "A", color: "border-gray-300 text-gray-400", activeColor: "border-red-500 bg-red-500 text-white" },
    { value: "HALF_DAY", label: "H", color: "border-gray-300 text-gray-400", activeColor: "border-amber-500 bg-amber-500 text-white" },
    { value: "LEAVE", label: "L", color: "border-gray-300 text-gray-400", activeColor: "border-blue-500 bg-blue-500 text-white" },
  ];

  const heatmapColor = (status?: string) => {
    switch (status) {
      case "PRESENT": return "bg-green-400";
      case "ABSENT": return "bg-red-400";
      case "HALF_DAY": return "bg-amber-400";
      case "LEAVE": return "bg-blue-400";
      default: return "bg-gray-200";
    }
  };

  const daysInMonth = (m: string) => {
    const [year, mon] = m.split("-").map(Number);
    return new Date(year, mon, 0).getDate();
  };

  return (
    <div className="page-container p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 gap-1">
        <Home size={14} /> <ChevronRight size={14} /> <span>HR</span> <ChevronRight size={14} /> <span className="text-gray-900 font-medium">Staff Attendance</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Staff Attendance</h1>
        <div className="flex gap-2">
          <button onClick={() => setViewMode("mark")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "mark" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            <UserCheck size={16} className="inline mr-1" /> Mark
          </button>
          <button onClick={() => setViewMode("report")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "report" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            <BarChart3 size={16} className="inline mr-1" /> Report
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error} <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {viewMode === "mark" ? (
        <>
          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={markAllPresent}
              className="px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
              Mark All Present
            </button>
            <button onClick={submitAttendance} disabled={saving}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Submit Attendance
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total", value: summary.total, color: "bg-gray-50 border-gray-200 text-gray-700" },
              { label: "Present", value: summary.present, color: "bg-green-50 border-green-200 text-green-700" },
              { label: "Absent", value: summary.absent, color: "bg-red-50 border-red-200 text-red-700" },
              { label: "Half Day", value: summary.halfDay, color: "bg-amber-50 border-amber-200 text-amber-700" },
              { label: "Leave", value: summary.leave, color: "bg-blue-50 border-blue-200 text-blue-700" },
            ].map(stat => (
              <div key={stat.label} className={`rounded-xl border p-3 text-center ${stat.color}`}>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Attendance List */}
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecords.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-500">No staff records found</td></tr>
                    ) : filteredRecords.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">{record.employeeName}</p>
                          <p className="text-xs text-gray-500">{record.designation}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.department}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {statusOptions.map(opt => (
                              <button key={opt.value} onClick={() => updateStatus(record.id, opt.value)}
                                className={`w-8 h-8 rounded-full border-2 text-xs font-bold transition-all ${
                                  record.status === opt.value ? opt.activeColor : opt.color
                                }`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Report View */}
          <div className="flex flex-wrap gap-3 items-center">
            <input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <div className="flex items-center gap-3 ml-auto text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400"></span> Present</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400"></span> Absent</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400"></span> Half Day</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400"></span> Leave</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10">Employee</th>
                      {Array.from({ length: daysInMonth(reportMonth) }, (_, i) => (
                        <th key={i} className="px-1 py-2.5 text-center text-xs font-medium text-gray-500 min-w-[28px]">{i + 1}</th>
                      ))}
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">P</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">A</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {monthlyReport.length === 0 ? (
                      <tr><td colSpan={daysInMonth(reportMonth) + 3} className="px-4 py-12 text-center text-gray-500">No report data available</td></tr>
                    ) : monthlyReport.map(row => (
                      <tr key={row.employeeId} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white whitespace-nowrap">{row.employeeName}</td>
                        {Array.from({ length: daysInMonth(reportMonth) }, (_, i) => (
                          <td key={i} className="px-0.5 py-2 text-center">
                            <div className={`w-5 h-5 rounded mx-auto ${heatmapColor(row.days[i + 1])}`}></div>
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center text-sm font-bold text-green-600">{row.totalPresent}</td>
                        <td className="px-3 py-2 text-center text-sm font-bold text-red-600">{row.totalAbsent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
