import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getPrintSignatureHTML } from "../../components/PrintSignature";
import { API_BASE_URL } from "../../config/api";
import {
  Users, UserCheck, UserX, UserPlus, GraduationCap, ClipboardList,
  BarChart3, BookOpen, Search, Printer, Download, Eye,
  Calendar, CalendarDays, Cake, Phone, Briefcase, Building2,
  Globe, Shield, FileText, ArrowLeft,
  ChevronRight, TrendingUp, Award, AlertCircle, Clock,
  UserCog, Wallet, Star, BookMarked, ListOrdered,
  Layers, Hash, Home, Heart
} from "lucide-react";

const API = `${API_BASE_URL}/api`;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ReportType {
  id: string;
  icon: any;
  title: string;
  description: string;
  category: string;
}

interface ReportCategory {
  id: string;
  label: string;
  icon: any;
  color: string;
}

interface TenantInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

const REPORT_CATEGORIES: ReportCategory[] = [
  { id: "general", label: "General Reports", icon: ClipboardList, color: "blue" },
  { id: "attendance", label: "Attendance Reports", icon: Calendar, color: "purple" },
  { id: "leave", label: "Leave Reports", icon: Clock, color: "teal" },
  { id: "payroll", label: "Payroll Reports", icon: Wallet, color: "green" },
  { id: "academic", label: "Academic Reports", icon: BookOpen, color: "orange" },
  { id: "performance", label: "Performance Reports", icon: Star, color: "rose" },
  { id: "additional", label: "Additional Reports", icon: FileText, color: "amber" },
];

// ═══════════════════════════════════════════════════════════════════════════
// REPORT TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const REPORT_TYPES: ReportType[] = [
  // ─── General Reports ──────────────────────────────────────
  { id: "teacher-directory", icon: BookOpen, title: "Teacher Directory", description: "Complete teacher list with contact details", category: "general" },
  { id: "department-wise", icon: Building2, title: "Department-wise", description: "Teachers grouped by department", category: "general" },
  { id: "subject-wise", icon: BookMarked, title: "Subject-wise", description: "Teachers grouped by subjects they teach", category: "general" },
  { id: "designation-wise", icon: Shield, title: "Designation-wise", description: "Teachers grouped by designation / role", category: "general" },
  { id: "qualification-wise", icon: GraduationCap, title: "Qualification-wise", description: "Teachers grouped by academic qualification", category: "general" },
  { id: "experience-wise", icon: TrendingUp, title: "Experience-wise", description: "Teachers grouped by years of experience", category: "general" },
  { id: "joining-register", icon: ListOrdered, title: "Joining Register", description: "Official joining register with dates", category: "general" },
  { id: "active-teachers", icon: UserCheck, title: "Active Teachers", description: "All currently active teachers", category: "general" },
  { id: "inactive-teachers", icon: UserX, title: "Inactive Teachers", description: "Teachers marked as inactive", category: "general" },

  // ─── Attendance Reports ───────────────────────────────────
  { id: "daily-attendance", icon: CalendarDays, title: "Daily Attendance", description: "Teacher attendance for a specific date", category: "attendance" },
  { id: "monthly-attendance", icon: Calendar, title: "Monthly Attendance", description: "Month-wise attendance summary", category: "attendance" },
  { id: "late-arrival", icon: Clock, title: "Late Arrival", description: "Teachers who arrived late", category: "attendance" },
  { id: "early-exit", icon: ArrowLeft, title: "Early Exit", description: "Teachers who left early", category: "attendance" },
  { id: "attendance-summary", icon: BarChart3, title: "Attendance Summary", description: "Overall attendance percentage report", category: "attendance" },

  // ─── Leave Reports ────────────────────────────────────────
  { id: "leave-register", icon: ClipboardList, title: "Leave Register", description: "Complete leave register of all teachers", category: "leave" },
  { id: "pending-leave", icon: Clock, title: "Pending Leave", description: "Leave applications awaiting approval", category: "leave" },
  { id: "approved-leave", icon: UserCheck, title: "Approved Leave", description: "Approved leave applications", category: "leave" },
  { id: "leave-balance", icon: Layers, title: "Leave Balance", description: "Remaining leave balance per teacher", category: "leave" },
  { id: "leave-history", icon: FileText, title: "Leave History", description: "Historical leave data per teacher", category: "leave" },

  // ─── Payroll Reports ──────────────────────────────────────
  { id: "salary-register", icon: Wallet, title: "Salary Register", description: "Complete salary register with breakup", category: "payroll" },
  { id: "salary-slip", icon: FileText, title: "Salary Slip", description: "Individual salary slip generation", category: "payroll" },
  { id: "bank-transfer", icon: Building2, title: "Bank Transfer", description: "Bank-wise salary transfer report", category: "payroll" },
  { id: "pf-report", icon: Shield, title: "PF Report", description: "Provident Fund contribution report", category: "payroll" },
  { id: "esi-report", icon: Heart, title: "ESI Report", description: "ESI contribution report", category: "payroll" },
  { id: "tds-report", icon: Hash, title: "TDS Report", description: "Tax deducted at source report", category: "payroll" },

  // ─── Academic Reports ─────────────────────────────────────
  { id: "subject-assignment", icon: BookOpen, title: "Subject Assignment", description: "Teacher-subject-class mapping", category: "academic" },
  { id: "class-teacher", icon: Users, title: "Class Teacher", description: "Class teacher allocation report", category: "academic" },
  { id: "timetable-report", icon: Calendar, title: "Timetable", description: "Teacher-wise timetable summary", category: "academic" },
  { id: "workload-report", icon: BarChart3, title: "Workload Report", description: "Periods/lectures per teacher analysis", category: "academic" },

  // ─── Performance Reports ──────────────────────────────────
  { id: "performance-report", icon: Star, title: "Performance", description: "Overall performance rating summary", category: "performance" },
  { id: "appraisal-report", icon: Award, title: "Appraisal", description: "Yearly appraisal report of teachers", category: "performance" },
  { id: "training-report", icon: GraduationCap, title: "Training", description: "Training & workshops attended", category: "performance" },
  { id: "awards-report", icon: Award, title: "Awards", description: "Awards & recognitions received", category: "performance" },

  // ─── Additional Reports ───────────────────────────────────
  { id: "birthday-report", icon: Cake, title: "Birthday Report", description: "Month-wise teacher birthday list", category: "additional" },
  { id: "retired-teachers", icon: Home, title: "Retired Teachers", description: "Teachers who have retired", category: "additional" },
  { id: "resigned-teachers", icon: UserX, title: "Resigned Teachers", description: "Teachers who have resigned", category: "additional" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const getLogoUrl = (path: string | undefined | null): string | null => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${path}`;
  return `/uploads/${path}`;
};

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatCurrency = (amount: number | undefined): string => {
  if (!amount && amount !== 0) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function TeacherReports() {
  const navigate = useNavigate();

  // ─── Data State ─────────────────────────────────────────────
  const [reportData, setReportData] = useState<any[] | null>(null);

  // ─── Filter State ───────────────────────────────────────────
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [designationFilter, setDesignationFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<string>("");

  // ─── UI State ───────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    total: number; male: number; female: number; active: number; onLeave: number; resigned: number;
  }>({ total: 0, male: 0, female: 0, active: 0, onLeave: 0, resigned: 0 });

  // ─── Tenant & User ─────────────────────────────────────────
  const tenant: TenantInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("tenant") || "{}"); } catch { return {}; }
  }, []);
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);

  // ─── Fetch Summary on Mount ─────────────────────────────────
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${API}/teacher-report/teacher-list`);
        const teachers = res.data?.data || [];
        const total = teachers.length;
        const male = teachers.filter((t: any) => t.gender?.toLowerCase() === "male").length;
        const female = teachers.filter((t: any) => t.gender?.toLowerCase() === "female").length;
        const active = teachers.filter((t: any) => t.status === "active" || !t.status).length;
        const onLeave = teachers.filter((t: any) => t.status === "on_leave").length;
        const resigned = teachers.filter((t: any) => t.status === "resigned" || t.status === "inactive").length;
        setSummaryData({ total, male, female, active, onLeave, resigned });
      } catch (err) {
        console.error("Failed to fetch summary:", err);
      }
    };
    fetchSummary();
  }, []);

  // ─── Filter Report Cards by Search ─────────────────────────
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return REPORT_TYPES;
    const q = searchQuery.toLowerCase();
    return REPORT_TYPES.filter(
      r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // ─── Group Reports by Category ─────────────────────────────
  const groupedReports = useMemo(() => {
    const groups: Record<string, ReportType[]> = {};
    for (const cat of REPORT_CATEGORIES) {
      groups[cat.id] = filteredReports.filter(r => r.category === cat.id);
    }
    return groups;
  }, [filteredReports]);

  // ─── Handle Report Card Click ──────────────────────────────
  const handleReportSelect = (reportId: string) => {
    setSelectedReport(reportId);
    setShowFilterPanel(true);
    setGenerated(false);
    setReportData(null);
    setDepartmentFilter("");
    setDesignationFilter("");
    setGenderFilter("");
    setStatusFilter("active");
    setLeaveTypeFilter("");
    setLeaveStatusFilter("");
    setDateFrom("");
    setDateTo("");
  };

  // ─── Determine which filters are relevant ──────────────────
  const getRelevantFilters = (reportId: string): string[] => {
    const generalReports = ["teacher-directory", "department-wise", "subject-wise", "designation-wise", "qualification-wise", "experience-wise", "joining-register", "active-teachers", "inactive-teachers"];
    const attendanceReports = ["daily-attendance", "monthly-attendance", "late-arrival", "early-exit", "attendance-summary"];
    const leaveReports = ["leave-register", "pending-leave", "approved-leave", "leave-balance", "leave-history"];
    const payrollReports = ["salary-register", "salary-slip", "bank-transfer", "pf-report", "esi-report", "tds-report"];
    const birthdayReport = ["birthday-report"];

    const filters: string[] = [];

    if (generalReports.includes(reportId)) {
      filters.push("department", "designation", "gender", "status");
      if (reportId === "joining-register") filters.push("dateRange");
    } else if (attendanceReports.includes(reportId)) {
      filters.push("department", "month", "year");
      if (reportId === "daily-attendance") filters.push("dateRange");
    } else if (leaveReports.includes(reportId)) {
      filters.push("department", "leaveType", "leaveStatus", "dateRange");
    } else if (payrollReports.includes(reportId)) {
      filters.push("department", "month", "year");
    } else if (birthdayReport.includes(reportId)) {
      filters.push("month");
    } else {
      filters.push("department", "gender");
    }

    return filters;
  };

  // ─── Get Report Title ──────────────────────────────────────
  const getReportTitle = (): string => {
    const r = REPORT_TYPES.find(r => r.id === selectedReport);
    return r ? r.title : "Teacher Report";
  };

  const getSubtitle = (): string => {
    const parts: string[] = [];
    if (departmentFilter) parts.push(`Dept: ${departmentFilter}`);
    if (genderFilter) parts.push(`Gender: ${genderFilter}`);
    if (statusFilter && statusFilter !== "all") parts.push(`Status: ${statusFilter}`);
    if (reportData) parts.push(`Total Records: ${reportData.length}`);
    return parts.join(" | ") || "All filters applied";
  };

  // ═══════════════════════════════════════════════════════════════
  // GENERATE REPORT
  // ═══════════════════════════════════════════════════════════════

  const handleGenerate = async () => {
    if (!selectedReport) return;
    setLoading(true);
    setGenerated(false);

    try {
      let endpoint = "";
      const params: any = {};

      // Map report IDs to API endpoints
      const generalIds = ["teacher-directory", "department-wise", "subject-wise", "designation-wise", "qualification-wise", "experience-wise", "joining-register", "active-teachers", "inactive-teachers", "birthday-report", "retired-teachers", "resigned-teachers"];
      const attendanceIds = ["daily-attendance", "monthly-attendance", "late-arrival", "early-exit", "attendance-summary"];
      const leaveIds = ["leave-register", "pending-leave", "approved-leave", "leave-balance", "leave-history"];
      const payrollIds = ["salary-register", "salary-slip", "bank-transfer", "pf-report", "esi-report", "tds-report"];
      const academicIds = ["subject-assignment", "class-teacher", "timetable-report", "workload-report"];
      const performanceIds = ["performance-report", "appraisal-report", "training-report", "awards-report"];

      if (generalIds.includes(selectedReport)) endpoint = "/teacher-report/teacher-list";
      else if (attendanceIds.includes(selectedReport)) endpoint = "/teacher-report/attendance";
      else if (leaveIds.includes(selectedReport)) endpoint = "/teacher-report/leave";
      else if (payrollIds.includes(selectedReport)) endpoint = "/teacher-report/salary";
      else if (academicIds.includes(selectedReport)) endpoint = "/teacher-report/subject-assignment";
      else if (performanceIds.includes(selectedReport)) endpoint = "/teacher-report/performance";
      else endpoint = "/teacher-report/teacher-list";

      if (dateFrom) params.fromDate = dateFrom;
      if (dateTo) params.toDate = dateTo;

      const res = await axios.get(`${API}${endpoint}`, { params });
      let data = res.data?.data || [];
      if (!Array.isArray(data)) data = data.salaries || data.teachers || data.data || [];

      // Client-side filtering
      if (genderFilter) data = data.filter((t: any) => (t.gender || "").toLowerCase() === genderFilter.toLowerCase());
      if (departmentFilter) data = data.filter((t: any) => (t.department || "").toLowerCase().includes(departmentFilter.toLowerCase()));
      if (designationFilter) data = data.filter((t: any) => (t.designation || "").toLowerCase().includes(designationFilter.toLowerCase()));

      // Status filtering
      if (selectedReport === "active-teachers") data = data.filter((t: any) => t.status === "active" || !t.status);
      else if (selectedReport === "inactive-teachers") data = data.filter((t: any) => t.status === "inactive");
      else if (selectedReport === "resigned-teachers") data = data.filter((t: any) => t.status === "resigned");
      else if (selectedReport === "retired-teachers") data = data.filter((t: any) => t.status === "retired");
      else if (statusFilter && statusFilter !== "all") {
        data = data.filter((t: any) => (t.status || "active") === statusFilter);
      }

      // Leave status filter
      if (leaveStatusFilter && leaveIds.includes(selectedReport)) {
        if (selectedReport === "pending-leave") data = data.filter((l: any) => l.status === "PENDING");
        else if (selectedReport === "approved-leave") data = data.filter((l: any) => l.status === "APPROVED");
        else if (leaveStatusFilter) data = data.filter((l: any) => l.status === leaveStatusFilter);
      }

      // Birthday filter
      if (selectedReport === "birthday-report") {
        data = data.filter((t: any) => {
          if (!t.dob && !t.dateOfBirth) return false;
          const dob = new Date(t.dob || t.dateOfBirth);
          return dob.getMonth() === selectedMonth;
        });
      }

      // Process report data based on report type
      const processed = processReportData(selectedReport, data);
      setReportData(processed);
      setGenerated(true);
    } catch (err) {
      console.error("Failed to generate report:", err);
      setReportData([]);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // REPORT DATA PROCESSING
  // ═══════════════════════════════════════════════════════════════

  const processReportData = (reportId: string, data: any[]): any[] => {
    switch (reportId) {
      case "teacher-directory":
        return data.map((t, i) => ({
          sno: i + 1,
          name: t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          email: t.email || "-",
          phone: t.phone || "-",
          gender: t.gender || "-",
          department: t.department || "-",
          designation: t.designation || "-",
          subjects: t.subjects || "-",
          classes: t.classes || "-",
        }));

      case "department-wise":
        return data.map((t, i) => ({
          sno: i + 1,
          department: t.department || "Not Assigned",
          name: t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          designation: t.designation || "-",
          subjects: t.subjects || "-",
          phone: t.phone || "-",
        }));

      case "subject-wise":
        return data.map((t, i) => ({
          sno: i + 1,
          name: t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          subjects: t.subjects || "-",
          classes: t.classes || "-",
          department: t.department || "-",
        }));

      case "designation-wise":
        return data.map((t, i) => ({
          sno: i + 1,
          designation: t.designation || "Not Assigned",
          name: t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          department: t.department || "-",
          phone: t.phone || "-",
        }));

      case "qualification-wise":
        return data.map((t, i) => ({
          sno: i + 1,
          name: t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          qualification: t.qualification || "-",
          specialization: t.specialization || "-",
          department: t.department || "-",
        }));

      case "experience-wise":
        return data.map((t, i) => ({
          sno: i + 1,
          name: t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          experience: t.experience || "-",
          joiningDate: formatDate(t.joiningDate),
          department: t.department || "-",
          designation: t.designation || "-",
        }));

      case "joining-register":
        return data
          .sort((a: any, b: any) => new Date(a.joiningDate || 0).getTime() - new Date(b.joiningDate || 0).getTime())
          .map((t, i) => ({
            sno: i + 1,
            joiningDate: formatDate(t.joiningDate),
            name: t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
            designation: t.designation || "-",
            department: t.department || "-",
            phone: t.phone || "-",
            qualification: t.qualification || "-",
          }));

      case "active-teachers":
      case "inactive-teachers":
      case "resigned-teachers":
      case "retired-teachers":
        return data.map((t, i) => ({
          sno: i + 1,
          name: t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          department: t.department || "-",
          designation: t.designation || "-",
          phone: t.phone || "-",
          status: t.status || "active",
        }));

      // Attendance
      case "daily-attendance":
      case "monthly-attendance":
      case "attendance-summary":
      case "late-arrival":
      case "early-exit":
        return data.map((t, i) => ({
          sno: i + 1,
          teacherName: t.teacherName || t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          totalPeriods: t.totalPeriods || t.present || "-",
          subjects: t.subjects || "-",
          classes: t.classes || "-",
        }));

      // Leave
      case "leave-register":
      case "pending-leave":
      case "approved-leave":
      case "leave-balance":
      case "leave-history":
        return data.map((t, i) => ({
          sno: i + 1,
          teacher: t.teacher?.name || t.teacherName || t.name || "-",
          leaveType: t.leaveType || "-",
          fromDate: formatDate(t.fromDate),
          toDate: formatDate(t.toDate),
          days: t.days || "-",
          status: t.status || "-",
          reason: t.reason || "-",
        }));

      // Payroll
      case "salary-register":
      case "salary-slip":
      case "bank-transfer":
      case "pf-report":
      case "esi-report":
      case "tds-report":
        return data.map((t, i) => ({
          sno: i + 1,
          teacher: t.teacher?.name || t.teacherName || t.name || "-",
          basicSalary: formatCurrency(t.basicSalary),
          allowances: formatCurrency(t.totalAllowances),
          deductions: formatCurrency(t.totalDeductions),
          netSalary: formatCurrency(t.netSalary),
          status: t.status || "-",
        }));

      // Academic
      case "subject-assignment":
        return data.map((t, i) => ({
          sno: i + 1,
          teacherName: t.teacherName || t.name || "-",
          subjectName: t.subjectName || t.subject || "-",
          className: t.className || t.class || "-",
        }));

      case "class-teacher":
        return data.map((t, i) => ({
          sno: i + 1,
          name: t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          classTeacherOf: t.classTeacherOf || t.classes || "-",
          department: t.department || "-",
          phone: t.phone || "-",
        }));

      case "timetable-report":
      case "workload-report":
        return data.map((t, i) => ({
          sno: i + 1,
          name: t.name || t.teacherName || "-",
          totalPeriods: t.totalPeriods || "-",
          subjects: t.subjects || "-",
          classes: t.classes || "-",
        }));

      // Performance
      case "performance-report":
      case "appraisal-report":
      case "training-report":
      case "awards-report":
        return data.map((t, i) => ({
          sno: i + 1,
          teacher: t.teacher?.name || t.name || "-",
          academicYear: t.academicYear?.name || "-",
          overallRating: t.overallRating ? `${t.overallRating}/5` : "-",
          remarks: t.remarks || "-",
        }));

      // Birthday
      case "birthday-report":
        return data.map((t, i) => ({
          sno: i + 1,
          name: t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          dob: formatDate(t.dob || t.dateOfBirth),
          department: t.department || "-",
          phone: t.phone || "-",
        }));

      default:
        return data.map((t, i) => ({
          sno: i + 1,
          name: t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          department: t.department || "-",
          designation: t.designation || "-",
          phone: t.phone || "-",
        }));
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // PRINT
  // ═══════════════════════════════════════════════════════════════

  const handlePrint = async () => {
    if (!reportData || reportData.length === 0) return;

    const signatureHTML = await getPrintSignatureHTML();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const schoolName = tenant?.name || "School Name";
    const schoolAddress = tenant?.address || "";
    const schoolPhone = tenant?.phone || "";
    const schoolEmail = tenant?.email || "";
    const logoUrl = getLogoUrl(tenant?.logoUrl);
    const printDate = new Date().toLocaleDateString("en-IN");
    const printTime = new Date().toLocaleTimeString("en-IN");
    const reportTitle = getReportTitle();
    const userName = user?.name || "Admin";
    const totalRecords = reportData.length;

    // Build table headers + rows
    const headers = Object.keys(reportData[0]);
    const labelMap: Record<string, string> = {
      sno: "S.No", name: "Name", email: "Email", phone: "Phone", gender: "Gender",
      department: "Department", designation: "Designation", subjects: "Subjects",
      classes: "Classes", qualification: "Qualification", specialization: "Specialization",
      experience: "Experience", joiningDate: "Joining Date", status: "Status",
      teacherName: "Teacher", teacher: "Teacher", leaveType: "Leave Type",
      fromDate: "From", toDate: "To", days: "Days", reason: "Reason",
      basicSalary: "Basic", allowances: "Allowances", deductions: "Deductions",
      netSalary: "Net Salary", subjectName: "Subject", className: "Class",
      classTeacherOf: "Class Teacher Of", totalPeriods: "Total Periods",
      academicYear: "Academic Year", overallRating: "Rating", remarks: "Remarks",
      dob: "Date of Birth",
    };

    const headerCells = headers.map(h =>
      `<th style="border:1px solid #333;padding:6px 10px;background:#f0f0f0;font-weight:bold;font-size:11px;white-space:nowrap;">${labelMap[h] || h}</th>`
    ).join("");

    const bodyRows = reportData.map(row =>
      `<tr>${headers.map(h => `<td style="border:1px solid #ddd;padding:5px 10px;font-size:11px;">${row[h] || "-"}</td>`).join("")}</tr>`
    ).join("");

    const tableHTML = `<table style="width:100%;border-collapse:collapse;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${reportTitle}</title>
  <style>
    @page { margin: 10mm; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <!-- LOCKED PRINT HEADER -->
  <div style="display:flex;align-items:center;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:6px;">
    ${logoUrl ? `<img src="${logoUrl}" style="width:50px;height:50px;object-fit:contain;margin-right:12px;" />` : ""}
    <div style="flex:1;text-align:center;">
      <div style="font-size:16px;font-weight:bold;">${schoolName}</div>
      <div style="font-size:10px;color:#555;">${schoolAddress}</div>
      <div style="font-size:10px;color:#555;">${schoolPhone}${schoolEmail ? " | " + schoolEmail : ""}</div>
    </div>
    <div style="text-align:right;font-size:9px;color:#666;">
      <div>Printed by: ${userName}</div>
      <div>Date: ${printDate}</div>
      <div>Time: ${printTime}</div>
    </div>
  </div>

  <!-- Report Title -->
  <div style="text-align:center;margin-bottom:10px;">
    <div style="font-size:14px;font-weight:bold;">${reportTitle}</div>
    <div style="font-size:10px;color:#666;">Total Records: ${totalRecords}</div>
  </div>

  <!-- Table -->
  ${tableHTML}

  <!-- Signature -->
  <div style="margin-top:40px;">
    ${signatureHTML}
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ═══════════════════════════════════════════════════════════════
  // EXPORT CSV
  // ═══════════════════════════════════════════════════════════════

  const exportCSV = () => {
    if (!reportData || reportData.length === 0) return;

    const headers = Object.keys(reportData[0]);
    let csvContent = headers.join(",") + "\n";
    for (const row of reportData) {
      const values = headers.map(h => {
        const val = String(row[h] || "").replace(/,/g, " ").replace(/"/g, "'");
        return `"${val}"`;
      });
      csvContent += values.join(",") + "\n";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedReport}-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER TABLE
  // ═══════════════════════════════════════════════════════════════

  const renderTable = () => {
    if (!generated) return null;
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading...</span>
        </div>
      );
    }

    if (!reportData || reportData.length === 0) {
      return (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No data found</p>
          <p className="text-sm">Try changing filters or select a different report type</p>
        </div>
      );
    }

    const rows = reportData;
    const headers = Object.keys(rows[0]);

    const labelMap: Record<string, string> = {
      sno: "S.No", name: "Name", email: "Email", phone: "Phone", gender: "Gender",
      department: "Department", designation: "Designation", subjects: "Subjects",
      classes: "Classes", qualification: "Qualification", specialization: "Specialization",
      experience: "Experience", joiningDate: "Joining Date", status: "Status",
      teacherName: "Teacher", teacher: "Teacher", leaveType: "Leave Type",
      fromDate: "From", toDate: "To", days: "Days", reason: "Reason",
      basicSalary: "Basic", allowances: "Allowances", deductions: "Deductions",
      netSalary: "Net Salary", subjectName: "Subject", className: "Class",
      classTeacherOf: "Class Teacher Of", totalPeriods: "Total Periods",
      academicYear: "Academic Year", overallRating: "Rating", remarks: "Remarks",
      dob: "Date of Birth",
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              {headers.map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap">
                  {labelMap[h] || h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {rows.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {headers.map(h => (
                  <td key={h} className="px-3 py-2 whitespace-nowrap text-sm dark:text-gray-300">
                    {h === "status" ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row[h] === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        row[h] === "resigned" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        row[h] === "on_leave" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        row[h] === "inactive" ? "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300" :
                        row[h] === "APPROVED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        row[h] === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        row[h] === "REJECTED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                      }`}>
                        {row[h]}
                      </span>
                    ) : (
                      row[h] || "-"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-600" />
            Teacher Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate, preview & export comprehensive teacher reports</p>
        </div>
        <button
          onClick={() => navigate("/teacher-dashboard")}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Teachers
        </button>
      </div>

      {/* ─── Summary Dashboard Cards ──────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Teachers", value: summaryData.total, icon: Users, color: "blue" },
          { label: "Male Teachers", value: summaryData.male, icon: UserCheck, color: "sky" },
          { label: "Female Teachers", value: summaryData.female, icon: UserCheck, color: "pink" },
          { label: "Active", value: summaryData.active, icon: Shield, color: "emerald" },
          { label: "On Leave", value: summaryData.onLeave, icon: Clock, color: "amber" },
          { label: "Resigned", value: summaryData.resigned, icon: UserX, color: "red" },
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

      {/* ─── Report Selection View ─── */}
      {!showFilterPanel && (
        <>
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
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center leading-tight">{report.title.replace(" Report", "")}</span>
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
              onClick={() => { setShowFilterPanel(false); setGenerated(false); setSelectedReport(""); }}
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
                  {(() => { const r = REPORT_TYPES.find(r => r.id === selectedReport); const Icon = r?.icon || ClipboardList; return <Icon className="w-5 h-5 text-primary-500" />; })()}
                  {getReportTitle()}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Configure filters and generate the report</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Department */}
              {getRelevantFilters(selectedReport).includes("department") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Department</label>
                  <input
                    type="text"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    placeholder="Filter by department"
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* Designation */}
              {getRelevantFilters(selectedReport).includes("designation") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designationFilter}
                    onChange={(e) => setDesignationFilter(e.target.value)}
                    placeholder="Filter by designation"
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* Gender */}
              {getRelevantFilters(selectedReport).includes("gender") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Gender</label>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              )}

              {/* Status */}
              {getRelevantFilters(selectedReport).includes("status") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                    <option value="resigned">Resigned</option>
                  </select>
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
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
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

              {/* Leave Type */}
              {getRelevantFilters(selectedReport).includes("leaveType") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Leave Type</label>
                  <select
                    value={leaveTypeFilter}
                    onChange={(e) => setLeaveTypeFilter(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Types</option>
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="EARNED">Earned Leave</option>
                    <option value="MATERNITY">Maternity Leave</option>
                    <option value="PATERNITY">Paternity Leave</option>
                  </select>
                </div>
              )}

              {/* Leave Status */}
              {getRelevantFilters(selectedReport).includes("leaveStatus") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Leave Status</label>
                  <select
                    value={leaveStatusFilter}
                    onChange={(e) => setLeaveStatusFilter(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              )}

              {/* Date Range */}
              {getRelevantFilters(selectedReport).includes("dateRange") && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-wrap gap-3">
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
              {generated && reportData && reportData.length > 0 && (
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
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{getSubtitle()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportCSV}
                    className="px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 text-xs font-medium border border-green-200 dark:border-green-700 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> CSV
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 text-xs font-medium border border-primary-200 dark:border-primary-700 flex items-center gap-1"
                  >
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
}
