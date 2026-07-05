
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { getPrintSignatureHTML } from "../../components/PrintSignature";
import { API_BASE_URL } from "../../config/api";
import { toast } from "react-hot-toast";
import {
  Users, UserCheck, UserX, Clock, Search, Printer, Download, Eye,
  Calendar, CalendarDays, ArrowLeft, BarChart3, AlertTriangle, Award,
  Layers, Building2, Shield, ClipboardList, FileText, Percent,
  Timer, BookOpen, ListOrdered, Hash, TrendingUp, Zap
} from "lucide-react";

const API = `${API_BASE_URL}/api`;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ClassOption { id: string; name: string; }
interface SectionOption { id: string; name: string; }
interface ReportType { id: string; icon: any; title: string; description: string; category: string; }
interface ReportCategory { id: string; label: string; icon: any; color: string; }
interface TenantInfo { name?: string; address?: string; phone?: string; email?: string; logoUrl?: string; }

// ═══════════════════════════════════════════════════════════════════════════
// REPORT CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

const REPORT_CATEGORIES: ReportCategory[] = [
  { id: "daily", label: "Daily Reports", icon: CalendarDays, color: "blue" },
  { id: "monthly", label: "Monthly Reports", icon: Calendar, color: "purple" },
  { id: "yearly", label: "Yearly Reports", icon: TrendingUp, color: "teal" },
  { id: "summary", label: "Summary Reports", icon: BarChart3, color: "green" },
  { id: "special", label: "Special Reports", icon: AlertTriangle, color: "orange" },
];

// ═══════════════════════════════════════════════════════════════════════════
// REPORT TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const REPORT_TYPES: ReportType[] = [
  // ─── Daily Reports ────────────────────────────────────
  { id: "daily-attendance", icon: CalendarDays, title: "Daily Attendance", description: "Attendance for a specific date", category: "daily" },
  { id: "datewise-attendance", icon: Calendar, title: "Date-wise Attendance", description: "Detailed date-wise attendance", category: "daily" },
  { id: "period-wise", icon: Timer, title: "Period-wise Attendance", description: "Attendance by period/slot", category: "daily" },

  // ─── Monthly Reports ──────────────────────────────────
  { id: "monthly-attendance", icon: Calendar, title: "Monthly Attendance", description: "Month-wise attendance register", category: "monthly" },
  { id: "monthly-summary", icon: BarChart3, title: "Monthly Summary", description: "Monthly attendance summary", category: "monthly" },

  // ─── Yearly Reports ───────────────────────────────────
  { id: "yearly-attendance", icon: TrendingUp, title: "Yearly Attendance", description: "Year-wise attendance register", category: "yearly" },
  { id: "annual-summary", icon: BookOpen, title: "Annual Summary", description: "Annual attendance overview", category: "yearly" },

  // ─── Summary Reports ──────────────────────────────────
  { id: "class-summary", icon: Layers, title: "Class Summary", description: "Class-wise attendance summary", category: "summary" },
  { id: "section-summary", icon: ListOrdered, title: "Section Summary", description: "Section-wise attendance summary", category: "summary" },
  { id: "school-summary", icon: Building2, title: "School Attendance Summary", description: "Whole school attendance report", category: "summary" },

  // ─── Special Reports ──────────────────────────────────
  { id: "absent-students", icon: UserX, title: "Absent Students", description: "List of absent students", category: "special" },
  { id: "late-students", icon: Clock, title: "Late Students", description: "Students with late entry", category: "special" },
  { id: "leave-report", icon: FileText, title: "Leave Report", description: "Students on approved leave", category: "special" },
  { id: "low-attendance", icon: AlertTriangle, title: "Low Attendance (<75%)", description: "Students below 75% attendance", category: "special" },
  { id: "perfect-attendance", icon: Award, title: "Perfect Attendance", description: "Students with 100% attendance", category: "special" },
];

// ═══════════════════════════════════════════════════════════════════════════
// QUICK REPORT BUTTONS
// ═══════════════════════════════════════════════════════════════════════════

const QUICK_REPORTS = [
  { id: "daily-attendance", label: "Today's Attendance", icon: CalendarDays, color: "blue" },
  { id: "absent-students", label: "Today's Absent", icon: UserX, color: "red" },
  { id: "low-attendance", label: "Low Attendance", icon: AlertTriangle, color: "amber" },
  { id: "perfect-attendance", label: "Perfect Attendance", icon: Award, color: "green" },
  { id: "late-students", label: "Late Arrival", icon: Clock, color: "purple" },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const AttendanceReportPage = () => {
  const [searchParams] = useSearchParams();

  // ─── State ─────────────────────────────────────────────
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [generated, setGenerated] = useState(false);

  // ─── Report UI State ───────────────────────────────────
  const [selectedReport, setSelectedReport] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Summary Data ──────────────────────────────────────
  const [summaryData, setSummaryData] = useState({
    totalStudents: 0, presentToday: 0, absentToday: 0, lateEntry: 0, attendancePercent: 0, leaveStudents: 0,
  });

  // ─── Tenant & User ─────────────────────────────────────
  const tenant: TenantInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("tenant") || "{}"); } catch { return {}; }
  }, []);
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);

  // ─── Fetch Classes ─────────────────────────────────────
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API}/class`);
        setClasses(res.data.data || []);
      } catch (err) { console.error("Error fetching classes:", err); }
    };
    fetchClasses();
    fetchSummary();
  }, []);

  // ─── Fetch Sections ────────────────────────────────────
  useEffect(() => {
    if (selectedClass) {
      const fetchSections = async () => {
        try {
          const res = await axios.get(`${API}/section?classId=${selectedClass}`);
          setSections(res.data.data || []);
        } catch (err) { console.error("Error fetching sections:", err); }
      };
      fetchSections();
      setSelectedSection("");
    } else {
      setSections([]);
    }
  }, [selectedClass]);

  // ─── Fetch Summary (Today's dashboard) ─────────────────
  const fetchSummary = async () => {
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();

      // Fetch school report AND total students count in parallel
      const [schoolRes, studentsRes] = await Promise.allSettled([
        axios.get(`${API}/attendance/report/school`, { params: { month, year } }),
        axios.get(`${API}/students`, { params: { limit: 1 } }), // Just to get total count
      ]);

      const data = schoolRes.status === "fulfilled" ? (schoolRes.value.data?.data || schoolRes.value.data) : null;

      // Try to get total students from students API (more reliable)
      let totalFromStudents = 0;
      if (studentsRes.status === "fulfilled") {
        const sData = studentsRes.value.data;
        totalFromStudents = sData?.total || sData?.data?.total || sData?.data?.students?.length || sData?.data?.length || 0;
      }

      if (data) {
        const total = data.totalStudents || totalFromStudents || 0;
        // avgPresent is a percentage string like "94.3", not a count
        const avgPresentPercent = parseFloat(data.avgPresent) || 0;
        const avgAbsentPercent = parseFloat(data.avgAbsent) || 0;
        
        // Calculate approximate counts from classes array if available
        let presentCount = 0;
        let absentCount = 0;
        if (data.classes && data.classes.length > 0) {
          presentCount = data.classes.reduce((sum: number, c: any) => sum + (c.avgPresent || 0), 0);
          absentCount = data.classes.reduce((sum: number, c: any) => sum + (c.avgAbsent || 0), 0);
        }
        
        // If no class breakdown, estimate from total and percentage
        if (presentCount === 0 && total > 0) {
          presentCount = Math.round((avgPresentPercent / 100) * total);
          absentCount = Math.round((avgAbsentPercent / 100) * total);
        }
        
        setSummaryData({
          totalStudents: total,
          presentToday: presentCount,
          absentToday: absentCount,
          lateEntry: 0, // Late not tracked in current backend
          attendancePercent: avgPresentPercent,
          leaveStudents: 0, // Leave not tracked in attendance report
        });
      } else if (totalFromStudents > 0) {
        // School report failed but we have student count
        setSummaryData({
          totalStudents: totalFromStudents,
          presentToday: 0,
          absentToday: 0,
          lateEntry: 0,
          attendancePercent: 0,
          leaveStudents: 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  };

  // ─── URL tab param backward compatibility ──────────────
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      const mapping: Record<string, string> = {
        monthly: "monthly-attendance",
        datewise: "datewise-attendance",
        yearly: "yearly-attendance",
        classwise: "class-summary",
        school: "school-summary",
      };
      if (mapping[tab]) {
        handleReportSelect(mapping[tab]);
      }
    }
  }, [searchParams]);

  // ─── Filter Reports by Search ──────────────────────────
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return REPORT_TYPES;
    const q = searchQuery.toLowerCase();
    return REPORT_TYPES.filter(
      r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // ─── Group Reports by Category ─────────────────────────
  const groupedReports = useMemo(() => {
    const groups: Record<string, ReportType[]> = {};
    for (const cat of REPORT_CATEGORIES) {
      groups[cat.id] = filteredReports.filter(r => r.category === cat.id);
    }
    return groups;
  }, [filteredReports]);

  // ─── Handle Report Select ──────────────────────────────
  const handleReportSelect = (reportId: string) => {
    setSelectedReport(reportId);
    setShowFilterPanel(true);
    setGenerated(false);
    setReportData(null);
  };

  // ─── Get Relevant Filters ──────────────────────────────
  const getRelevantFilters = (reportId: string): string[] => {
    const dailyReports = ["daily-attendance", "datewise-attendance", "period-wise", "absent-students", "late-students", "leave-report"];
    const monthlyReports = ["monthly-attendance", "monthly-summary"];
    const yearlyReports = ["yearly-attendance", "annual-summary"];
    const summaryReports = ["class-summary", "section-summary", "school-summary"];
    const specialReports = ["low-attendance", "perfect-attendance"];

    if (dailyReports.includes(reportId)) return ["date", "class", "section"];
    if (monthlyReports.includes(reportId)) return ["month", "year", "class", "section"];
    if (yearlyReports.includes(reportId)) return ["year", "class", "section"];
    if (summaryReports.includes(reportId)) return ["month", "year", "class"];
    if (specialReports.includes(reportId)) return ["month", "year", "class", "section"];
    return ["class", "section"];
  };

  // ─── Get Report Title ──────────────────────────────────
  const getReportTitle = (): string => {
    return REPORT_TYPES.find(r => r.id === selectedReport)?.title || "Attendance Report";
  };

  // ─── Get Subtitle ──────────────────────────────────────
  const getSubtitle = (): string => {
    const cls = classes.find(c => c.id === selectedClass)?.name || "All Classes";
    const sec = sections.find(s => s.id === selectedSection)?.name || "";
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (getRelevantFilters(selectedReport).includes("date")) return `Date: ${selectedDate} | ${cls} ${sec}`;
    if (getRelevantFilters(selectedReport).includes("month")) return `${monthNames[selectedMonth - 1]} ${selectedYear} | ${cls} ${sec}`;
    return `${selectedYear} | ${cls} ${sec}`;
  };

  // ═══════════════════════════════════════════════════════════════════════
  // GENERATE REPORT
  // ═══════════════════════════════════════════════════════════════════════

  const handleGenerate = async () => {
    // School summary doesn't need class/section
    const schoolReports = ["school-summary"];
    if (!schoolReports.includes(selectedReport) && !selectedClass) {
      toast.error("Please select a class");
      return;
    }

    setLoading(true);
    setGenerated(false);
    setReportData(null);

    try {
      let res;
      const dailyReports = ["daily-attendance", "datewise-attendance", "period-wise", "absent-students", "late-students", "leave-report"];
      const monthlyReports = ["monthly-attendance", "monthly-summary"];
      const yearlyReports = ["yearly-attendance", "annual-summary"];
      const summaryReports = ["class-summary", "section-summary"];

      if (dailyReports.includes(selectedReport)) {
        res = await axios.get(`${API}/attendance/report/datewise`, {
          params: { classId: selectedClass, sectionId: selectedSection, date: selectedDate },
        });
      } else if (monthlyReports.includes(selectedReport)) {
        res = await axios.get(`${API}/attendance/report/monthly`, {
          params: { classId: selectedClass, sectionId: selectedSection, month: selectedMonth, year: selectedYear },
        });
      } else if (yearlyReports.includes(selectedReport)) {
        res = await axios.get(`${API}/attendance/report/yearly`, {
          params: { classId: selectedClass, sectionId: selectedSection, year: selectedYear },
        });
      } else if (summaryReports.includes(selectedReport)) {
        res = await axios.get(`${API}/attendance/report/classwise`, {
          params: { classId: selectedClass, sectionId: selectedSection, month: selectedMonth, year: selectedYear },
        });
      } else if (selectedReport === "school-summary") {
        res = await axios.get(`${API}/attendance/report/school`, {
          params: { month: selectedMonth, year: selectedYear },
        });
      } else {
        // Default fallback
        res = await axios.get(`${API}/attendance/report/datewise`, {
          params: { classId: selectedClass, sectionId: selectedSection, date: selectedDate },
        });
      }

      const data = res?.data?.data || res?.data;

      // Client-side filtering for special reports
      if (selectedReport === "absent-students" && data) {
        const students = Array.isArray(data) ? data : data.students || [];
        setReportData(students.filter((s: any) => (s.status || "").toUpperCase() === "ABSENT" || s.status === "A"));
      } else if (selectedReport === "late-students" && data) {
        const students = Array.isArray(data) ? data : data.students || [];
        setReportData(students.filter((s: any) => (s.status || "").toUpperCase() === "LATE" || s.status === "Lt" || s.isLate));
      } else if (selectedReport === "leave-report" && data) {
        const students = Array.isArray(data) ? data : data.students || [];
        setReportData(students.filter((s: any) => (s.status || "").toUpperCase() === "LEAVE" || s.status === "L"));
      } else if (selectedReport === "low-attendance" && Array.isArray(data)) {
        setReportData(data.filter((s: any) => (s.percentage || s.attendancePercent || 100) < 75));
      } else if (selectedReport === "perfect-attendance" && Array.isArray(data)) {
        setReportData(data.filter((s: any) => (s.percentage || s.attendancePercent || 0) === 100));
      } else {
        setReportData(data);
      }

      setGenerated(true);
      toast.success("Report generated successfully");
    } catch (err: any) {
      console.error("Error generating report:", err);
      toast.error(err?.response?.data?.message || "Error generating report");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER TABLE
  // ═══════════════════════════════════════════════════════════════════════

  const renderTable = () => {
    if (!reportData) return <div className="p-8 text-center text-gray-400">No data to display</div>;

    const data = Array.isArray(reportData) ? reportData : reportData.students || reportData.records || reportData.data || [];
    if (!Array.isArray(data) || data.length === 0) {
      return <div className="p-8 text-center text-gray-400 dark:text-gray-500">No records found for the selected filters</div>;
    }

    // Determine columns based on data shape
    const columns = Object.keys(data[0] || {}).filter(k => !["id", "_id", "studentId", "enrollmentId", "createdAt", "updatedAt", "isDeleted"].includes(k));

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">S.No</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap">
                  {col.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {data.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-gray-700 dark:text-gray-200 text-xs whitespace-nowrap">
                    {col === "status" || col === "Status" ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        (String(row[col]).toUpperCase() === "PRESENT" || row[col] === "P") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        (String(row[col]).toUpperCase() === "ABSENT" || row[col] === "A") ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        (String(row[col]).toUpperCase() === "LATE" || row[col] === "Lt") ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        (String(row[col]).toUpperCase() === "NOT_MARKED") ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {String(row[col] || "-").toUpperCase()}
                      </span>
                    ) : col.includes("percent") || col.includes("Percent") || col === "percentage" ? (
                      `${parseFloat(row[col] || 0).toFixed(1)}%`
                    ) : (
                      String(row[col] ?? "-")
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 flex flex-wrap gap-4">
          <span><strong>Total Records:</strong> {data.length}</span>
          {data[0]?.status && (
            <>
              <span><strong>Present:</strong> {data.filter((r: any) => (r.status || "").toUpperCase() === "PRESENT" || r.status === "P").length}</span>
              <span><strong>Absent:</strong> {data.filter((r: any) => (r.status || "").toUpperCase() === "ABSENT" || r.status === "A").length}</span>
              <span><strong>Leave:</strong> {data.filter((r: any) => (r.status || "").toUpperCase() === "LEAVE" || r.status === "L").length}</span>
            </>
          )}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PRINT
  // ═══════════════════════════════════════════════════════════════════════

  const handlePrint = async () => {
    if (!reportData) return;
    const data = Array.isArray(reportData) ? reportData : reportData.students || reportData.records || reportData.data || [];
    if (!Array.isArray(data) || data.length === 0) { toast.error("No data to print"); return; }

    const columns = Object.keys(data[0] || {}).filter(k => !["id", "_id", "studentId", "enrollmentId", "createdAt", "updatedAt", "isDeleted"].includes(k));
    const signatureHTML = await getPrintSignatureHTML();
    const logoUrl = tenant.logoUrl || "";
    const schoolName = tenant.name || "School Name";
    const address = tenant.address || "";
    const phone = tenant.phone || "";
    const userName = user.name || user.firstName || "Admin";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    const presentCount = data.filter((r: any) => r.status === "present" || r.status === "P").length;
    const absentCount = data.filter((r: any) => r.status === "absent" || r.status === "A").length;
    const attendPercent = data.length > 0 && data[0]?.status ? ((presentCount / data.length) * 100).toFixed(2) : "";

    const html = `
      <html><head><title>${getReportTitle()}</title>
      <style>
        @page { margin: 10mm; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #333; }
        .header { display: flex; align-items: center; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 10px; }
        .logo { width: 50px; height: 50px; object-fit: contain; margin-right: 12px; }
        .school-info { flex: 1; text-align: center; }
        .school-name { font-size: 16px; font-weight: bold; }
        .school-addr { font-size: 10px; color: #666; }
        .print-info { text-align: right; font-size: 9px; color: #666; }
        .report-title { text-align: center; font-size: 14px; font-weight: bold; margin: 10px 0 5px; }
        .report-sub { text-align: center; font-size: 10px; color: #666; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        th { background: #f0f0f0; border: 1px solid #ccc; padding: 4px 6px; text-align: left; font-size: 10px; text-transform: uppercase; }
        td { border: 1px solid #ddd; padding: 3px 6px; font-size: 10px; }
        tr:nth-child(even) { background: #fafafa; }
        .summary-footer { margin-top: 10px; padding: 8px; border-top: 2px solid #333; font-size: 11px; font-weight: bold; }
        .signature { margin-top: 30px; }
      </style></head><body>
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ""}
        <div class="school-info">
          <div class="school-name">${schoolName}</div>
          <div class="school-addr">${address}${phone ? " | " + phone : ""}</div>
        </div>
        <div class="print-info">
          Printed by: ${userName}<br/>Date: ${dateStr}<br/>Time: ${timeStr}
        </div>
      </div>
      <div class="report-title">${getReportTitle()}</div>
      <div class="report-sub">${getSubtitle()} | Total Records: ${data.length}</div>
      <table>
        <thead><tr><th>S.No</th>${columns.map(c => `<th>${c.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}</th>`).join("")}</tr></thead>
        <tbody>${data.map((row: any, i: number) => `<tr><td>${i + 1}</td>${columns.map(c => `<td>${row[c] ?? "-"}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
      ${data[0]?.status ? `<div class="summary-footer">Total Students: ${data.length} | Present: ${presentCount} | Absent: ${absentCount} | Attendance: ${attendPercent}%</div>` : ""}
      <div class="signature">${signatureHTML}</div>
      </body></html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
    }
  };

  // ─── Export CSV ────────────────────────────────────────
  const exportCSV = () => {
    if (!reportData) return;
    const data = Array.isArray(reportData) ? reportData : reportData.students || reportData.records || reportData.data || [];
    if (!Array.isArray(data) || data.length === 0) { toast.error("No data to export"); return; }

    const columns = Object.keys(data[0] || {}).filter(k => !["id", "_id", "studentId", "enrollmentId", "createdAt", "updatedAt", "isDeleted"].includes(k));
    const headers = ["S.No", ...columns.map(c => c.replace(/([A-Z])/g, " $1").trim())];
    const rows = data.map((row: any, i: number) => [i + 1, ...columns.map(c => row[c] ?? "")]);

    const csv = [headers.join(","), ...rows.map((r: any[]) => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getReportTitle().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Exported successfully!");
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* ─── Page Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-500" /> Attendance Reports
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Generate, Preview & Export Attendance Reports</p>
        </div>
      </div>

      {/* ─── Summary Dashboard Cards ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Students", value: summaryData.totalStudents, icon: Users, color: "blue" },
          { label: "Present Today", value: summaryData.presentToday, icon: UserCheck, color: "green" },
          { label: "Absent Today", value: summaryData.absentToday, icon: UserX, color: "red" },
          { label: "Late Entry", value: summaryData.lateEntry, icon: Clock, color: "amber" },
          { label: "Attendance %", value: `${summaryData.attendancePercent}%`, icon: Percent, color: "purple" },
          { label: "Leave Students", value: summaryData.leaveStudents, icon: FileText, color: "teal" },
        ].map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <card.icon className={`w-5 h-5 text-${card.color}-500`} />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-${card.color}-50 text-${card.color}-600 dark:bg-${card.color}-900/30 dark:text-${card.color}-400`}>
                {card.label}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{card.value}</div>
          </div>
        ))}
      </div>

      {/* ─── Report Selection View ─────────────────────────── */}
      {!showFilterPanel && (
        <>
          {/* Quick Report Buttons */}
          <div className="flex flex-wrap gap-2 mb-5">
            {QUICK_REPORTS.map((qr) => (
              <button
                key={qr.id}
                onClick={() => handleReportSelect(qr.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-${qr.color}-50 text-${qr.color}-700 dark:bg-${qr.color}-900/30 dark:text-${qr.color}-400 hover:bg-${qr.color}-100 dark:hover:bg-${qr.color}-900/50 transition-colors border border-${qr.color}-200 dark:border-${qr.color}-800`}
              >
                <qr.icon className="w-3.5 h-3.5" />
                {qr.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports by name or category..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Report Categories */}
          {REPORT_CATEGORIES.map((category) => {
            const reports = groupedReports[category.id] || [];
            if (reports.length === 0) return null;
            const CategoryIcon = category.icon;
            return (
              <div key={category.id} className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <CategoryIcon className={`w-5 h-5 text-${category.color}-500`} />
                  <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{category.label}</h2>
                  <span className="text-xs text-gray-400 dark:text-gray-500">({reports.length} reports)</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5">
                  {reports.map((report) => {
                    const ReportIcon = report.icon;
                    return (
                      <button
                        key={report.id}
                        onClick={() => handleReportSelect(report.id)}
                        className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-${category.color}-50 dark:bg-${category.color}-950/50 hover:scale-105 transition-all duration-200 group cursor-pointer`}
                      >
                        <div className={`w-7 h-7 rounded-md bg-${category.color}-500 flex items-center justify-center`}>
                          <ReportIcon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center leading-tight">{report.title.replace(" Report", "").replace(" Attendance", "")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ─── Filter Panel & Report Output ─────────────────── */}
      {showFilterPanel && (
        <>
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => { setShowFilterPanel(false); setGenerated(false); setSelectedReport(""); setReportData(null); }}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to all reports
            </button>
          </div>

          {/* Filter Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  {(() => { const r = REPORT_TYPES.find(r => r.id === selectedReport); const Icon = r?.icon || Calendar; return <Icon className="w-5 h-5 text-primary-500" />; })()}
                  {getReportTitle()}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Configure filters and generate the report</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date */}
              {getRelevantFilters(selectedReport).includes("date") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* Month */}
              {getRelevantFilters(selectedReport).includes("month") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  >
                    {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Year */}
              {getRelevantFilters(selectedReport).includes("year") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  >
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}

              {/* Class */}
              {getRelevantFilters(selectedReport).includes("class") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); }}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Section */}
              {getRelevantFilters(selectedReport).includes("section") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Sections</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                ) : (
                  <><Eye className="w-4 h-4" /> Preview Report</>
                )}
              </button>
              {generated && reportData && (
                <>
                  <button
                    onClick={handlePrint}
                    className="px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button
                    onClick={exportCSV}
                    className="px-5 py-2.5 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export Excel (CSV)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Report Output */}
          {generated && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Report Header Bar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{getReportTitle()}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{getSubtitle()} | Total Records: {(Array.isArray(reportData) ? reportData : reportData?.students || reportData?.records || reportData?.data || []).length}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportCSV} className="px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 text-xs font-medium border border-green-200 dark:border-green-700 flex items-center gap-1">
                    <Download className="w-3 h-3" /> CSV
                  </button>
                  <button onClick={handlePrint} className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 text-xs font-medium border border-primary-200 dark:border-primary-700 flex items-center gap-1">
                    <Printer className="w-3 h-3" /> Print
                  </button>
                </div>
              </div>

              {/* Report Table */}
              {renderTable()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceReportPage;
