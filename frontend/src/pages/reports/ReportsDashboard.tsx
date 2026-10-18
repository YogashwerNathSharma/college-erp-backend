import { useState, useEffect } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, IndianRupee, CalendarCheck, ClipboardList,
  UserCog, Bus, BookOpen, Users, BedDouble, MessageSquare,
  UserPlus, FileText, Download, Search, Filter, Calendar,
  ArrowRight, FileSpreadsheet, FileDown, Eye, Trash2,
  BarChart3, PieChart, TrendingUp, Printer,
} from "lucide-react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ReportCategory {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  route: string;
}

interface RecentReport {
  id: string;
  name: string;
  module: string;
  generatedBy: string;
  date: string;
  format: "PDF" | "Excel";
  size: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function ReportsDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // ── Report Categories Grid ──
  
  // ── Real-time Stats from API ──
  const [stats, setStats] = useState<any>({ totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalPaid: 0, totalPending: 0 });
  const [apiReports, setApiReports] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, reportsRes] = await Promise.all([
          axios.get(getFullUrl("/api/dashboard")).catch(() => null),
          axios.get(getFullUrl("/api/report-builder/generated?limit=7")).catch(() => null),
        ]);
        if (dashRes?.data?.data) setStats(dashRes.data.data);
        if (reportsRes?.data?.data) setApiReports(reportsRes.data.data);
      } catch(e) {}
      setStatsLoading(false);
    };
    fetchData();
  }, []);

const reportCategories: ReportCategory[] = [
    { title: "Student Reports", description: "Class lists, strength, demographics, profiles", icon: <GraduationCap size={24} />, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950", route: "/students/reports" },
    { title: "Fee Reports", description: "Collection, pending, defaulters, receipts", icon: <IndianRupee size={24} />, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950", route: "/fees/reports" },
    { title: "Attendance Reports", description: "Daily, monthly, class-wise, student-wise", icon: <CalendarCheck size={24} />, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950", route: "/attendance-report" },
    { title: "Exam Reports", description: "Results, mark sheets, toppers, analytics", icon: <ClipboardList size={24} />, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950", route: "/exam-reports" },
    { title: "Teacher Reports", description: "Attendance, performance, workload, salary", icon: <UserCog size={24} />, color: "text-teal-600", bgColor: "bg-teal-50 dark:bg-teal-950", route: "/teacher-reports" },
    { title: "Transport Reports", description: "Routes, vehicles, student assignments", icon: <Bus size={24} />, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950", route: "/transport" },
    { title: "Library Reports", description: "Books, issues, returns, overdue, fines", icon: <BookOpen size={24} />, color: "text-rose-600", bgColor: "bg-rose-50 dark:bg-rose-950", route: "/library" },
    { title: "HR Reports", description: "Staff list, payroll, leaves, attendance", icon: <Users size={24} />, color: "text-cyan-600", bgColor: "bg-cyan-50 dark:bg-cyan-950", route: "/hr/staff" },
    { title: "Hostel Reports", description: "Occupancy, fees, allocation, mess", icon: <BedDouble size={24} />, color: "text-indigo-600", bgColor: "bg-indigo-50 dark:bg-indigo-950", route: "/hostel/rooms" },
    { title: "Communication Reports", description: "SMS, WhatsApp, notices delivery stats", icon: <MessageSquare size={24} />, color: "text-pink-600", bgColor: "bg-pink-50 dark:bg-pink-950", route: "/communication/notices" },
    { title: "Admission Reports", description: "Applications, approved, pending, funnel", icon: <UserPlus size={24} />, color: "text-lime-600", bgColor: "bg-lime-50 dark:bg-lime-950", route: "/students/new-admission" },
    { title: "Custom Reports", description: "Build custom queries and export data", icon: <FileText size={24} />, color: "text-gray-600", bgColor: "bg-gray-50 dark:bg-gray-800", route: "/reports" },
  ];

  // ── Recent Reports Data ──
  const recentReports: RecentReport[] = apiReports.length > 0 
    ? apiReports.map((r: any, i: number) => ({ id: r.id || String(i), name: r.name || r.title || "Report", module: r.module || "General", generatedBy: r.createdBy || "Admin", date: r.createdAt?.split("T")[0] || "", format: r.format || "PDF", size: r.size || "-" }))
    : [
    { id: "1", name: "Class X Fee Collection - June 2026", module: "Fees", generatedBy: "Admin", date: "2026-06-27", format: "PDF", size: "2.1 MB" },
    { id: "2", name: "Monthly Attendance Summary", module: "Attendance", generatedBy: "Admin", date: "2026-06-26", format: "Excel", size: "854 KB" },
    { id: "3", name: "Mid-Term Results - All Classes", module: "Exams", generatedBy: "Principal", date: "2026-06-25", format: "PDF", size: "5.3 MB" },
    { id: "4", name: "Student Strength Report 2026-27", module: "Students", generatedBy: "Admin", date: "2026-06-24", format: "Excel", size: "412 KB" },
    { id: "5", name: "Teacher Salary Statement - June", module: "HR", generatedBy: "Accountant", date: "2026-06-23", format: "PDF", size: "1.8 MB" },
  ];

  const filteredReports = recentReports.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchModule = moduleFilter === "all" || r.module.toLowerCase() === moduleFilter.toLowerCase();
    const matchFormat = formatFilter === "all" || r.format.toLowerCase() === formatFilter.toLowerCase();
    return matchSearch && matchModule && matchFormat;
  });

  const filteredCategories = reportCategories.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate, view, and download reports across all modules</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            <button className="p-2 rounded-md bg-white dark:bg-slate-600 shadow-sm text-gray-700 dark:text-gray-200">
              <BarChart3 size={16} />
            </button>
            <button className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-600">
              <PieChart size={16} />
            </button>
            <button className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-600">
              <TrendingUp size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 outline-none"
          >
            <option value="all">All Modules</option>
            <option value="students">Students</option>
            <option value="fees">Fees</option>
            <option value="attendance">Attendance</option>
            <option value="exams">Exams</option>
            <option value="hr">HR</option>
            <option value="transport">Transport</option>
            <option value="library">Library</option>
          </select>
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 outline-none"
          >
            <option value="all">All Formats</option>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 outline-none"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Report Categories Grid ── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Report Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((category, idx) => (
            <div
              key={idx}
              onClick={() => navigate(category.route)}
              className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl ${category.bgColor} ${category.color} flex items-center justify-center`}>
                  {category.icon}
                </div>
                <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-4">{category.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{category.description}</p>
              <button className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
                <Printer size={12} /> Generate Report
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Reports Table ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recently Generated Reports</h3>
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">View All</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Report Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Module</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Generated By</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Format</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {report.format === "PDF" ? (
                        <FileDown size={16} className="text-red-500" />
                      ) : (
                        <FileSpreadsheet size={16} className="text-green-500" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{report.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300">
                      {report.module}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{report.generatedBy}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                    {new Date(report.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${report.format === "PDF" ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"}`}>
                      {report.format}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{report.size}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600" title="View">
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600" title="Download">
                        <Download size={14} />
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

        {filteredReports.length === 0 && (
          <div className="px-5 py-12 text-center">
            <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No reports found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
