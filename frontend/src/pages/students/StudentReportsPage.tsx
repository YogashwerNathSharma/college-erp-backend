import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getPrintSignatureHTML } from "../../components/PrintSignature";
import {
  Users, UserCheck, UserX, UserPlus, GraduationCap, ClipboardList,
  BarChart3, Hash, BookOpen, Search, Printer, Download, Eye,
  Calendar, CalendarDays, Cake, Heart, Phone, Briefcase, Building2,
  MapPin, Globe, Languages, Droplets, Shield, FileText, ArrowLeft,
  ChevronRight, TrendingUp, Award, AlertCircle, Clock, Home,
  UserCog, Baby, Wallet, BadgePercent, BookMarked, ListOrdered
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
  startDate?: string;
}

interface ClassItem {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
}

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  admissionNo: string;
  srNo?: string;
  phone?: string;
  email?: string;
  address?: string;
  fatherName: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherOccupation?: string;
  category?: string;
  religion?: string;
  caste?: string;
  bloodGroup?: string;
  nationality?: string;
  motherTongue?: string;
  house?: string;
  status: string;
  admissionDate?: string;
  enrollments: {
    class: { id: string; name: string };
    section: { id: string; name: string };
    academicYear?: { id: string; name: string };
    rollNumber?: string;
  }[];
}

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

// ═══════════════════════════════════════════════════════════════
// REPORT CATEGORIES
// ═══════════════════════════════════════════════════════════════

const REPORT_CATEGORIES: ReportCategory[] = [
  { id: "general", label: "General Reports", icon: ClipboardList, color: "blue" },
  { id: "demographic", label: "Demographic Reports", icon: Users, color: "purple" },
  { id: "parent", label: "Parent & Guardian Reports", icon: Home, color: "teal" },
  { id: "admission", label: "Admission Reports", icon: UserPlus, color: "green" },
  { id: "status", label: "Student Status Reports", icon: Shield, color: "orange" },
  { id: "fee", label: "Fee Related Reports", icon: Wallet, color: "rose" },
];

// ═══════════════════════════════════════════════════════════════
// REPORT TYPE DEFINITIONS (50+ Reports)
// ═══════════════════════════════════════════════════════════════

const REPORT_TYPES: ReportType[] = [
  // ─── General Reports ───────────────────────────────────────
  { id: "student-directory", icon: BookOpen, title: "Student Directory", description: "Complete directory with contact details", category: "general" },
  { id: "class-wise", icon: ClipboardList, title: "Class-wise Student List", description: "Student list grouped by class & section", category: "general" },
  { id: "section-wise", icon: ListOrdered, title: "Section-wise Student List", description: "Students organized by section within a class", category: "general" },
  { id: "house-wise", icon: Home, title: "House-wise Student List", description: "Students grouped by house allocation", category: "general" },
  { id: "roll-number-list", icon: Hash, title: "Roll Number List", description: "Roll number wise student list", category: "general" },
  { id: "admission-register", icon: BookMarked, title: "Admission Register", description: "Official admission register with SR numbers", category: "general" },
  { id: "strength-summary", icon: BarChart3, title: "Student Strength Summary", description: "Class × Section strength matrix", category: "general" },
  { id: "active-students", icon: UserCheck, title: "Active Students", description: "All currently active students", category: "general" },
  { id: "inactive-students", icon: UserX, title: "Inactive Students", description: "Students marked as inactive", category: "general" },
  { id: "alumni-students", icon: GraduationCap, title: "Alumni Students", description: "Students who have passed out / alumni", category: "general" },

  // ─── Demographic Reports ───────────────────────────────────
  { id: "gender-wise", icon: Users, title: "Gender-wise Report", description: "Boys & Girls distribution per class", category: "demographic" },
  { id: "category-wise", icon: Shield, title: "Category-wise Report", description: "General/OBC/SC/ST/EWS distribution", category: "demographic" },
  { id: "religion-wise", icon: Heart, title: "Religion-wise Report", description: "Student distribution by religion", category: "demographic" },
  { id: "caste-wise", icon: BookOpen, title: "Caste-wise Report", description: "Student distribution by caste", category: "demographic" },
  { id: "blood-group-wise", icon: Droplets, title: "Blood Group-wise Report", description: "Students grouped by blood group", category: "demographic" },
  { id: "nationality-wise", icon: Globe, title: "Nationality-wise Report", description: "Students grouped by nationality", category: "demographic" },
  { id: "mother-tongue-wise", icon: Languages, title: "Mother Tongue-wise Report", description: "Students by mother tongue / language", category: "demographic" },
  { id: "age-wise", icon: Baby, title: "Age-wise Report", description: "Students grouped by age range", category: "demographic" },
  { id: "dob-wise", icon: CalendarDays, title: "DOB-wise Report", description: "Students sorted by date of birth", category: "demographic" },
  { id: "birthday", icon: Cake, title: "Birthday List", description: "Month-wise student birthday calendar", category: "demographic" },

  // ─── Parent & Guardian Reports ─────────────────────────────
  { id: "father-occupation", icon: Briefcase, title: "Father's Occupation Report", description: "Occupation-wise summary of fathers", category: "parent" },
  { id: "mother-occupation", icon: Briefcase, title: "Mother's Occupation Report", description: "Occupation-wise summary of mothers", category: "parent" },
  { id: "parent-contact", icon: Phone, title: "Parent Contact List", description: "Father & Mother phone numbers", category: "parent" },
  { id: "emergency-contact", icon: AlertCircle, title: "Emergency Contact List", description: "Emergency contact details of students", category: "parent" },
  { id: "parent-email", icon: FileText, title: "Parent Email List", description: "Parent email addresses for communication", category: "parent" },
  { id: "guardian-summary", icon: UserCog, title: "Guardian Summary", description: "Students with non-parent guardians", category: "parent" },

  // ─── Admission Reports ─────────────────────────────────────
  { id: "new-admissions", icon: UserPlus, title: "New Admissions", description: "Recently admitted students", category: "admission" },
  { id: "admission-register-full", icon: BookMarked, title: "Admission Register (Full)", description: "Complete admission register with all details", category: "admission" },
  { id: "month-wise-admission", icon: Calendar, title: "Month-wise Admissions", description: "Admission count grouped by month", category: "admission" },
  { id: "session-wise-admission", icon: CalendarDays, title: "Session-wise Admissions", description: "Admissions per academic session", category: "admission" },
  { id: "admission-date-range", icon: Clock, title: "Admissions by Date Range", description: "Admissions within a specific period", category: "admission" },
  { id: "admission-source", icon: MapPin, title: "Admission Source Report", description: "Where students came from", category: "admission" },

  // ─── Student Status Reports ────────────────────────────────
  { id: "status-active", icon: UserCheck, title: "Active Students", description: "All currently enrolled students", category: "status" },
  { id: "status-inactive", icon: UserX, title: "Inactive Students", description: "Students marked as inactive", category: "status" },
  { id: "tc-issued", icon: FileText, title: "TC Issued Students", description: "Students with Transfer Certificate issued", category: "status" },
  { id: "left-students", icon: ArrowLeft, title: "Left Students", description: "Students who have left the institution", category: "status" },
  { id: "status-summary", icon: TrendingUp, title: "Status-wise Summary", description: "Student count by each status type", category: "status" },
  { id: "recent-left", icon: Clock, title: "Recently Left Students", description: "Students who left in last 3 months", category: "status" },

  // ─── Fee Related Reports (Shortcuts) ───────────────────────
  { id: "fee-defaulters", icon: AlertCircle, title: "Fee Defaulters List", description: "Students with pending fee payments", category: "fee" },
  { id: "scholarship-students", icon: Award, title: "Scholarship Students", description: "Students receiving scholarships", category: "fee" },
  { id: "concession-students", icon: BadgePercent, title: "Concession Students", description: "Students with fee concession", category: "fee" },
  { id: "fee-category-wise", icon: Wallet, title: "Fee Category-wise Report", description: "Students grouped by fee category", category: "fee" },

  // ─── Additional Reports ────────────────────────────────────
  { id: "address-wise", icon: MapPin, title: "Address-wise Report", description: "Students grouped by locality / area", category: "general" },
  { id: "email-directory", icon: FileText, title: "Email Directory", description: "Student email addresses list", category: "general" },
  { id: "phone-directory", icon: Phone, title: "Phone Directory", description: "Student & parent phone numbers", category: "general" },
  { id: "gender-class-matrix", icon: BarChart3, title: "Gender × Class Matrix", description: "Boys/Girls count in each class section", category: "demographic" },
  { id: "category-gender-cross", icon: TrendingUp, title: "Category × Gender Cross Report", description: "Category distribution by gender", category: "demographic" },
  { id: "sibling-report", icon: Users, title: "Sibling Report", description: "Students with siblings in same school", category: "parent" },
  { id: "single-parent", icon: UserCog, title: "Single Parent Students", description: "Students with single parent details", category: "parent" },
  { id: "admission-trend", icon: TrendingUp, title: "Admission Trend Report", description: "Year-over-year admission comparison", category: "admission" },
  { id: "withdrawal-report", icon: UserX, title: "Withdrawal Report", description: "Detailed withdrawal / TC report", category: "status" },
  { id: "transport-wise", icon: Building2, title: "Transport-wise Report", description: "Students using school transport", category: "general" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

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

const calculateAge = (dob: string, referenceDate?: Date): number => {
  const birthDate = new Date(dob);
  const ref = referenceDate || new Date();
  let age = ref.getFullYear() - birthDate.getFullYear();
  const m = ref.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const sortByClassName = (a: string, b: string): number => {
  const numA = parseInt(a.replace(/\D/g, "")) || 0;
  const numB = parseInt(b.replace(/\D/g, "")) || 0;
  return numA - numB;
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function StudentReportsPage() {
  const navigate = useNavigate();

  // ─── Data State ────────────────────────────────────────────
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);

  // ─── Filter State ──────────────────────────────────────────
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [academicYearId, setAcademicYearId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // ─── UI State ──────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    total: number; boys: number; girls: number; newAdmissions: number; tcIssued: number; active: number;
  }>({ total: 0, boys: 0, girls: 0, newAdmissions: 0, tcIssued: 0, active: 0 });

  // ─── Tenant & User ─────────────────────────────────────────
  const tenant: TenantInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("tenant") || "{}"); } catch { return {}; }
  }, []);
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);

  // ─── Fetch Dropdowns ───────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [yearRes, classRes] = await Promise.all([
          axios.get("/api/academic"),
          axios.get("/api/class"),
        ]);
        const years = yearRes.data?.data || [];
        const cls = classRes.data?.data || [];
        setAcademicYears(years);
        setClasses(cls);
        const current = years.find((y: any) => y.isCurrent) || years[0];
        if (current) setAcademicYearId(current.id);
      } catch (err) {
        console.error("Failed to load dropdowns:", err);
      }
    };
    fetchData();
  }, []);

  // ─── Fetch Summary Data on Mount ───────────────────────────
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get("/api/students/stats");
        const d = res.data?.data || {};
        setSummaryData({
          total: d.totalStudents || d.total || 0,
          boys: d.boys || 0,
          girls: d.girls || 0,
          newAdmissions: d.newAdmissions || 0,
          tcIssued: d.left || 0,
          active: d.active || 0,
        });
      } catch (err) {
        console.error("Failed to fetch summary:", err);
      }
    };
    fetchSummary();
  }, []);

  // ─── Fetch Sections on Class Change ────────────────────────
  useEffect(() => {
    if (!classId) { setSections([]); return; }
    axios.get(`/api/section?classId=${classId}`)
      .then((res) => setSections(res.data?.data || []))
      .catch(() => setSections([]));
  }, [classId]);

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
    setStudents([]);
    // Reset filters
    setStatusFilter("active");
    setGenderFilter("");
    setCategoryFilter("");
    setDateFrom("");
    setDateTo("");
    setSelectedMonth(new Date().getMonth());
  };

  // ─── Determine which filters are relevant for a report ─────
  const getRelevantFilters = (reportId: string): string[] => {
    const base = ["academicYear", "class", "section"];
    const statusReports = ["status-active", "status-inactive", "tc-issued", "left-students", "status-summary", "recent-left", "withdrawal-report", "active-students", "inactive-students", "alumni-students"];
    const dateReports = ["admission-register", "admission-register-full", "new-admissions", "admission-date-range", "month-wise-admission", "session-wise-admission", "admission-trend", "recent-left"];
    const monthReports = ["birthday"];
    const genderReports = ["gender-wise", "gender-class-matrix", "category-gender-cross"];
    const categoryReports = ["category-wise", "category-gender-cross"];
    const summaryReports = ["strength-summary", "status-summary", "gender-wise", "category-wise", "religion-wise", "caste-wise", "blood-group-wise", "nationality-wise", "mother-tongue-wise", "age-wise", "father-occupation", "mother-occupation", "month-wise-admission", "session-wise-admission", "admission-trend", "gender-class-matrix", "category-gender-cross", "fee-category-wise"];

    const filters: string[] = ["academicYear"];
    if (!summaryReports.includes(reportId)) {
      filters.push("class", "section");
    } else {
      filters.push("class");
    }
    if (statusReports.includes(reportId)) filters.push("status");
    if (dateReports.includes(reportId)) filters.push("dateRange");
    if (monthReports.includes(reportId)) filters.push("month");
    if (!genderReports.includes(reportId)) filters.push("gender");
    if (!categoryReports.includes(reportId) && !summaryReports.includes(reportId)) filters.push("category");
    return filters;
  };

  // ═══════════════════════════════════════════════════════════
  // GENERATE REPORT
  // ═══════════════════════════════════════════════════════════

  const handleGenerate = async () => {
    if (!selectedReport) return;
    setLoading(true);
    setGenerated(false);

    try {
      const params: any = { limit: 9999 };
      if (academicYearId) params.academicYearId = academicYearId;

      // Apply class/section filters
      if (classId) params.classId = classId;
      if (sectionId) params.sectionId = sectionId;

      // Status handling
      const statusReports = ["tc-issued", "left-students", "status-inactive", "inactive-students", "status-summary", "recent-left", "withdrawal-report", "alumni-students"];
      if (statusReports.includes(selectedReport) || statusFilter === "all") {
        params.status = "all";
      } else if (statusFilter === "inactive") {
        params.status = "all";
      }

      const res = await axios.get("/api/students", { params });
      const result = res.data?.data;
      let studentList: StudentData[] = result?.students || [];

      // Apply client-side filters
      if (genderFilter) {
        studentList = studentList.filter(s => s.gender === genderFilter);
      }
      if (categoryFilter) {
        studentList = studentList.filter(s => (s.category || "General") === categoryFilter);
      }
      if (statusFilter === "inactive") {
        studentList = studentList.filter(s => s.status === "inactive");
      }

      setStudents(studentList);
      setGenerated(true);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // REPORT DATA PROCESSING
  // ═══════════════════════════════════════════════════════════

  const reportData = useMemo(() => {
    if (!generated || students.length === 0) return null;

    switch (selectedReport) {
      // ─── General Reports ─────────────────────────────────
      case "student-directory": {
        return students.map((s, i) => ({
          sno: i + 1,
          admNo: s.admissionNo,
          srNo: s.srNo || "-",
          name: `${s.firstName} ${s.lastName}`,
          class: s.enrollments?.[0]?.class?.name || "-",
          section: s.enrollments?.[0]?.section?.name || "-",
          gender: s.gender,
          dob: formatDate(s.dob),
          phone: s.phone || s.fatherPhone || "-",
          email: s.email || "-",
          address: s.address || "-",
        }));
      }

      case "class-wise": {
        return students.map((s, i) => ({
          sno: i + 1,
          admNo: s.admissionNo,
          name: `${s.firstName} ${s.lastName}`,
          fatherName: s.fatherName,
          gender: s.gender,
          class: s.enrollments?.[0]?.class?.name || "-",
          section: s.enrollments?.[0]?.section?.name || "-",
          rollNo: s.enrollments?.[0]?.rollNumber || "-",
          dob: formatDate(s.dob),
          phone: s.fatherPhone || s.phone || "-",
        }));
      }

      case "section-wise": {
        const grouped = students.reduce((acc, s) => {
          const sec = s.enrollments?.[0]?.section?.name || "Unassigned";
          if (!acc[sec]) acc[sec] = [];
          acc[sec].push(s);
          return acc;
        }, {} as Record<string, StudentData[]>);
        const result: any[] = [];
        Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0])).forEach(([sec, sts]) => {
          sts.forEach((s, i) => result.push({
            sno: i + 1,
            section: sec,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            rollNo: s.enrollments?.[0]?.rollNumber || "-",
            gender: s.gender,
            fatherName: s.fatherName,
            phone: s.fatherPhone || s.phone || "-",
          }));
        });
        return result;
      }

      case "house-wise": {
        return students.map((s, i) => ({
          sno: i + 1,
          admNo: s.admissionNo,
          name: `${s.firstName} ${s.lastName}`,
          class: s.enrollments?.[0]?.class?.name || "-",
          section: s.enrollments?.[0]?.section?.name || "-",
          house: s.house || "Not Assigned",
          gender: s.gender,
          phone: s.fatherPhone || s.phone || "-",
        })).sort((a, b) => a.house.localeCompare(b.house));
      }

      case "roll-number-list": {
        return students
          .filter(s => s.enrollments?.[0]?.rollNumber)
          .sort((a, b) => {
            const rA = parseInt(a.enrollments?.[0]?.rollNumber || "0");
            const rB = parseInt(b.enrollments?.[0]?.rollNumber || "0");
            return rA - rB;
          })
          .map((s, i) => ({
            sno: i + 1,
            rollNo: s.enrollments?.[0]?.rollNumber || "-",
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            class: s.enrollments?.[0]?.class?.name || "-",
            section: s.enrollments?.[0]?.section?.name || "-",
            gender: s.gender,
            fatherName: s.fatherName,
          }));
      }

      case "admission-register": {
        let filtered = students;
        if (dateFrom) filtered = filtered.filter(s => s.admissionDate && new Date(s.admissionDate) >= new Date(dateFrom));
        if (dateTo) filtered = filtered.filter(s => s.admissionDate && new Date(s.admissionDate) <= new Date(dateTo));
        return filtered
          .sort((a, b) => new Date(b.admissionDate || "").getTime() - new Date(a.admissionDate || "").getTime())
          .map((s, i) => ({
            sno: i + 1,
            srNo: s.srNo || "-",
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            fatherName: s.fatherName,
            dob: formatDate(s.dob),
            class: s.enrollments?.[0]?.class?.name || "-",
            admissionDate: formatDate(s.admissionDate),
            category: s.category || "-",
          }));
      }

      case "strength-summary": {
        const matrix: Record<string, Record<string, number>> = {};
        const allSections = new Set<string>();
        for (const s of students) {
          const cls = s.enrollments?.[0]?.class?.name || "Unassigned";
          const sec = s.enrollments?.[0]?.section?.name || "N/A";
          allSections.add(sec);
          if (!matrix[cls]) matrix[cls] = {};
          matrix[cls][sec] = (matrix[cls][sec] || 0) + 1;
        }
        const sectionList = Array.from(allSections).sort();
        const rows = Object.entries(matrix)
          .sort((a, b) => sortByClassName(a[0], b[0]))
          .map(([cls, secs]) => {
            const row: any = { class: cls };
            let total = 0;
            for (const sec of sectionList) {
              row[sec] = secs[sec] || 0;
              total += secs[sec] || 0;
            }
            row.total = total;
            return row;
          });
        return { rows, sections: sectionList };
      }

      case "active-students":
      case "status-active": {
        return students
          .filter(s => s.status === "active")
          .map((s, i) => ({
            sno: i + 1,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            class: s.enrollments?.[0]?.class?.name || "-",
            section: s.enrollments?.[0]?.section?.name || "-",
            gender: s.gender,
            fatherName: s.fatherName,
            phone: s.fatherPhone || s.phone || "-",
          }));
      }

      case "inactive-students":
      case "status-inactive": {
        return students
          .filter(s => s.status === "inactive")
          .map((s, i) => ({
            sno: i + 1,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            class: s.enrollments?.[0]?.class?.name || "-",
            section: s.enrollments?.[0]?.section?.name || "-",
            gender: s.gender,
            status: s.status,
            fatherName: s.fatherName,
          }));
      }

      case "alumni-students": {
        return students
          .filter(s => s.status === "alumni" || s.status === "passed_out")
          .map((s, i) => ({
            sno: i + 1,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            class: s.enrollments?.[0]?.class?.name || "-",
            gender: s.gender,
            fatherName: s.fatherName,
            phone: s.fatherPhone || s.phone || "-",
          }));
      }

      // ─── Demographic Reports ─────────────────────────────
      case "gender-wise": {
        const classMap: Record<string, { boys: number; girls: number }> = {};
        for (const s of students) {
          const cls = s.enrollments?.[0]?.class?.name || "Unassigned";
          if (!classMap[cls]) classMap[cls] = { boys: 0, girls: 0 };
          if (s.gender === "Male") classMap[cls].boys++;
          else classMap[cls].girls++;
        }
        return Object.entries(classMap)
          .sort((a, b) => sortByClassName(a[0], b[0]))
          .map(([cls, data]) => ({
            class: cls,
            boys: data.boys,
            girls: data.girls,
            total: data.boys + data.girls,
          }));
      }

      case "category-wise": {
        const classMap: Record<string, Record<string, number>> = {};
        for (const s of students) {
          const cls = s.enrollments?.[0]?.class?.name || "Unassigned";
          const cat = s.category || "General";
          if (!classMap[cls]) classMap[cls] = {};
          classMap[cls][cat] = (classMap[cls][cat] || 0) + 1;
        }
        return Object.entries(classMap)
          .sort((a, b) => sortByClassName(a[0], b[0]))
          .map(([cls, cats]) => ({
            class: cls,
            General: cats["General"] || 0,
            OBC: cats["OBC"] || 0,
            SC: cats["SC"] || 0,
            ST: cats["ST"] || 0,
            EWS: cats["EWS"] || 0,
            total: Object.values(cats).reduce((a, b) => a + b, 0),
          }));
      }

      case "religion-wise": {
        const map: Record<string, number> = {};
        for (const s of students) {
          const r = s.religion || "Not Specified";
          map[r] = (map[r] || 0) + 1;
        }
        const total = students.length;
        return Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .map(([religion, count]) => ({
            religion,
            count,
            percentage: total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0%",
          }));
      }

      case "caste-wise": {
        const map: Record<string, number> = {};
        for (const s of students) {
          const c = s.caste || "Not Specified";
          map[c] = (map[c] || 0) + 1;
        }
        const total = students.length;
        return Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .map(([caste, count]) => ({
            caste,
            count,
            percentage: total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0%",
          }));
      }

      case "blood-group-wise": {
        const map: Record<string, { boys: number; girls: number }> = {};
        for (const s of students) {
          const bg = s.bloodGroup || "Not Specified";
          if (!map[bg]) map[bg] = { boys: 0, girls: 0 };
          if (s.gender === "Male") map[bg].boys++;
          else map[bg].girls++;
        }
        return Object.entries(map)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([bloodGroup, data]) => ({
            bloodGroup,
            boys: data.boys,
            girls: data.girls,
            total: data.boys + data.girls,
          }));
      }

      case "nationality-wise": {
        const map: Record<string, number> = {};
        for (const s of students) {
          const n = s.nationality || "Indian";
          map[n] = (map[n] || 0) + 1;
        }
        return Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .map(([nationality, count]) => ({
            nationality,
            count,
            percentage: students.length > 0 ? ((count / students.length) * 100).toFixed(1) + "%" : "0%",
          }));
      }

      case "mother-tongue-wise": {
        const map: Record<string, number> = {};
        for (const s of students) {
          const mt = s.motherTongue || "Not Specified";
          map[mt] = (map[mt] || 0) + 1;
        }
        return Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .map(([motherTongue, count]) => ({
            motherTongue,
            count,
            percentage: students.length > 0 ? ((count / students.length) * 100).toFixed(1) + "%" : "0%",
          }));
      }

      case "age-wise": {
        const ageMap: Record<string, { boys: number; girls: number }> = {};
        for (const s of students) {
          if (!s.dob) continue;
          const age = calculateAge(s.dob);
          const range = `${age}-${age + 1}`;
          if (!ageMap[range]) ageMap[range] = { boys: 0, girls: 0 };
          if (s.gender === "Male") ageMap[range].boys++;
          else ageMap[range].girls++;
        }
        return Object.entries(ageMap)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([range, data]) => ({
            ageRange: `${range} years`,
            boys: data.boys,
            girls: data.girls,
            total: data.boys + data.girls,
          }));
      }

      case "dob-wise": {
        return students
          .filter(s => s.dob)
          .sort((a, b) => new Date(a.dob).getTime() - new Date(b.dob).getTime())
          .map((s, i) => ({
            sno: i + 1,
            name: `${s.firstName} ${s.lastName}`,
            dob: formatDate(s.dob),
            age: calculateAge(s.dob),
            class: s.enrollments?.[0]?.class?.name || "-",
            section: s.enrollments?.[0]?.section?.name || "-",
            gender: s.gender,
          }));
      }

      case "birthday": {
        return students
          .filter(s => {
            if (!s.dob) return false;
            return new Date(s.dob).getMonth() === selectedMonth;
          })
          .sort((a, b) => new Date(a.dob).getDate() - new Date(b.dob).getDate())
          .map((s, i) => ({
            sno: i + 1,
            name: `${s.firstName} ${s.lastName}`,
            dob: formatDate(s.dob),
            day: new Date(s.dob).getDate(),
            class: s.enrollments?.[0]?.class?.name || "-",
            section: s.enrollments?.[0]?.section?.name || "-",
            fatherName: s.fatherName,
            phone: s.fatherPhone || s.phone || "-",
          }));
      }

      case "gender-class-matrix": {
        const matrix: Record<string, Record<string, { boys: number; girls: number }>> = {};
        const allSections = new Set<string>();
        for (const s of students) {
          const cls = s.enrollments?.[0]?.class?.name || "Unassigned";
          const sec = s.enrollments?.[0]?.section?.name || "N/A";
          allSections.add(sec);
          if (!matrix[cls]) matrix[cls] = {};
          if (!matrix[cls][sec]) matrix[cls][sec] = { boys: 0, girls: 0 };
          if (s.gender === "Male") matrix[cls][sec].boys++;
          else matrix[cls][sec].girls++;
        }
        const sectionList = Array.from(allSections).sort();
        const rows = Object.entries(matrix)
          .sort((a, b) => sortByClassName(a[0], b[0]))
          .map(([cls, secs]) => {
            const row: any = { class: cls };
            let totalB = 0, totalG = 0;
            for (const sec of sectionList) {
              const d = secs[sec] || { boys: 0, girls: 0 };
              row[`${sec}_B`] = d.boys;
              row[`${sec}_G`] = d.girls;
              totalB += d.boys;
              totalG += d.girls;
            }
            row.totalBoys = totalB;
            row.totalGirls = totalG;
            row.total = totalB + totalG;
            return row;
          });
        return { rows, sections: sectionList, type: "gender-class-matrix" };
      }

      case "category-gender-cross": {
        const map: Record<string, { boys: number; girls: number }> = {};
        for (const s of students) {
          const cat = s.category || "General";
          if (!map[cat]) map[cat] = { boys: 0, girls: 0 };
          if (s.gender === "Male") map[cat].boys++;
          else map[cat].girls++;
        }
        return Object.entries(map)
          .sort((a, b) => (b[1].boys + b[1].girls) - (a[1].boys + a[1].girls))
          .map(([category, data]) => ({
            category,
            boys: data.boys,
            girls: data.girls,
            total: data.boys + data.girls,
          }));
      }

      // ─── Parent Reports ──────────────────────────────────
      case "father-occupation": {
        const occMap: Record<string, number> = {};
        for (const s of students) {
          const occ = s.fatherOccupation || "Not Specified";
          occMap[occ] = (occMap[occ] || 0) + 1;
        }
        const total = students.length;
        return Object.entries(occMap)
          .sort((a, b) => b[1] - a[1])
          .map(([occupation, count]) => ({
            occupation,
            count,
            percentage: total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0%",
          }));
      }

      case "mother-occupation": {
        const occMap: Record<string, number> = {};
        for (const s of students) {
          const occ = s.motherOccupation || "Homemaker";
          occMap[occ] = (occMap[occ] || 0) + 1;
        }
        const total = students.length;
        return Object.entries(occMap)
          .sort((a, b) => b[1] - a[1])
          .map(([occupation, count]) => ({
            occupation,
            count,
            percentage: total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0%",
          }));
      }

      case "parent-contact": {
        return students.map((s, i) => ({
          sno: i + 1,
          admNo: s.admissionNo,
          studentName: `${s.firstName} ${s.lastName}`,
          class: s.enrollments?.[0]?.class?.name || "-",
          fatherName: s.fatherName,
          fatherPhone: s.fatherPhone || "-",
          motherName: s.motherName || "-",
          motherPhone: s.motherPhone || "-",
        }));
      }

      case "emergency-contact": {
        return students.map((s, i) => ({
          sno: i + 1,
          admNo: s.admissionNo,
          studentName: `${s.firstName} ${s.lastName}`,
          class: s.enrollments?.[0]?.class?.name || "-",
          fatherName: s.fatherName,
          fatherPhone: s.fatherPhone || "-",
          motherPhone: s.motherPhone || "-",
          studentPhone: s.phone || "-",
          address: s.address || "-",
        }));
      }

      case "parent-email": {
        return students
          .filter(s => s.email)
          .map((s, i) => ({
            sno: i + 1,
            studentName: `${s.firstName} ${s.lastName}`,
            class: s.enrollments?.[0]?.class?.name || "-",
            fatherName: s.fatherName,
            email: s.email || "-",
            phone: s.fatherPhone || s.phone || "-",
          }));
      }

      case "guardian-summary": {
        return students.map((s, i) => ({
          sno: i + 1,
          admNo: s.admissionNo,
          studentName: `${s.firstName} ${s.lastName}`,
          class: s.enrollments?.[0]?.class?.name || "-",
          fatherName: s.fatherName,
          motherName: s.motherName || "-",
          fatherOccupation: s.fatherOccupation || "-",
          fatherPhone: s.fatherPhone || "-",
        }));
      }

      case "sibling-report": {
        const familyMap: Record<string, StudentData[]> = {};
        for (const s of students) {
          const key = `${s.fatherName}_${s.fatherPhone || ""}`.toLowerCase();
          if (!familyMap[key]) familyMap[key] = [];
          familyMap[key].push(s);
        }
        const result: any[] = [];
        let idx = 0;
        Object.values(familyMap)
          .filter(group => group.length > 1)
          .forEach(group => {
            group.forEach(s => {
              idx++;
              result.push({
                sno: idx,
                admNo: s.admissionNo,
                name: `${s.firstName} ${s.lastName}`,
                class: s.enrollments?.[0]?.class?.name || "-",
                fatherName: s.fatherName,
                siblings: group.length - 1,
                phone: s.fatherPhone || "-",
              });
            });
          });
        return result;
      }

      case "single-parent": {
        return students
          .filter(s => !s.motherName || !s.fatherName)
          .map((s, i) => ({
            sno: i + 1,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            class: s.enrollments?.[0]?.class?.name || "-",
            fatherName: s.fatherName || "N/A",
            motherName: s.motherName || "N/A",
            phone: s.fatherPhone || s.motherPhone || s.phone || "-",
          }));
      }

      // ─── Admission Reports ───────────────────────────────
      case "new-admissions": {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        let filtered = students.filter(s => {
          if (!s.admissionDate) return false;
          if (dateFrom) return new Date(s.admissionDate) >= new Date(dateFrom);
          return new Date(s.admissionDate) >= monthStart;
        });
        if (dateTo) filtered = filtered.filter(s => s.admissionDate && new Date(s.admissionDate) <= new Date(dateTo));
        return filtered
          .sort((a, b) => new Date(b.admissionDate || "").getTime() - new Date(a.admissionDate || "").getTime())
          .map((s, i) => ({
            sno: i + 1,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            fatherName: s.fatherName,
            class: s.enrollments?.[0]?.class?.name || "-",
            section: s.enrollments?.[0]?.section?.name || "-",
            admissionDate: formatDate(s.admissionDate),
            phone: s.fatherPhone || s.phone || "-",
          }));
      }

      case "admission-register-full": {
        let filtered = students;
        if (dateFrom) filtered = filtered.filter(s => s.admissionDate && new Date(s.admissionDate) >= new Date(dateFrom));
        if (dateTo) filtered = filtered.filter(s => s.admissionDate && new Date(s.admissionDate) <= new Date(dateTo));
        return filtered
          .sort((a, b) => new Date(b.admissionDate || "").getTime() - new Date(a.admissionDate || "").getTime())
          .map((s, i) => ({
            sno: i + 1,
            srNo: s.srNo || "-",
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            fatherName: s.fatherName,
            dob: formatDate(s.dob),
            gender: s.gender,
            category: s.category || "-",
            class: s.enrollments?.[0]?.class?.name || "-",
            admissionDate: formatDate(s.admissionDate),
            address: s.address || "-",
          }));
      }

      case "month-wise-admission": {
        const monthMap: Record<string, number> = {};
        for (const s of students) {
          if (!s.admissionDate) continue;
          const d = new Date(s.admissionDate);
          const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
          monthMap[key] = (monthMap[key] || 0) + 1;
        }
        return Object.entries(monthMap)
          .sort((a, b) => {
            const [mA, yA] = a[0].split(" ");
            const [mB, yB] = b[0].split(" ");
            return parseInt(yB) - parseInt(yA) || MONTHS.indexOf(mB) - MONTHS.indexOf(mA);
          })
          .map(([month, count]) => ({ month, count }));
      }

      case "session-wise-admission": {
        const sessionMap: Record<string, number> = {};
        for (const s of students) {
          const session = s.enrollments?.[0]?.academicYear?.name || "Unknown";
          sessionMap[session] = (sessionMap[session] || 0) + 1;
        }
        return Object.entries(sessionMap)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([session, count]) => ({ session, count }));
      }

      case "admission-date-range": {
        let filtered = students;
        if (dateFrom) filtered = filtered.filter(s => s.admissionDate && new Date(s.admissionDate) >= new Date(dateFrom));
        if (dateTo) filtered = filtered.filter(s => s.admissionDate && new Date(s.admissionDate) <= new Date(dateTo));
        return filtered
          .sort((a, b) => new Date(b.admissionDate || "").getTime() - new Date(a.admissionDate || "").getTime())
          .map((s, i) => ({
            sno: i + 1,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            class: s.enrollments?.[0]?.class?.name || "-",
            admissionDate: formatDate(s.admissionDate),
            fatherName: s.fatherName,
            phone: s.fatherPhone || s.phone || "-",
          }));
      }

      case "admission-source":
      case "admission-trend": {
        const yearMap: Record<string, number> = {};
        for (const s of students) {
          if (!s.admissionDate) continue;
          const year = new Date(s.admissionDate).getFullYear().toString();
          yearMap[year] = (yearMap[year] || 0) + 1;
        }
        return Object.entries(yearMap)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([year, count]) => ({ year, admissions: count }));
      }

      // ─── Status Reports ──────────────────────────────────
      case "tc-issued": {
        return students
          .filter(s => s.status === "tc_issued")
          .map((s, i) => ({
            sno: i + 1,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            class: s.enrollments?.[0]?.class?.name || "-",
            fatherName: s.fatherName,
            status: "TC Issued",
            phone: s.fatherPhone || s.phone || "-",
          }));
      }

      case "left-students": {
        return students
          .filter(s => s.status === "left" || s.status === "tc_issued" || s.status === "inactive")
          .map((s, i) => ({
            sno: i + 1,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            class: s.enrollments?.[0]?.class?.name || "-",
            fatherName: s.fatherName,
            status: s.status,
            phone: s.fatherPhone || s.phone || "-",
          }));
      }

      case "status-summary": {
        const statusMap: Record<string, number> = {};
        for (const s of students) {
          const st = s.status || "unknown";
          statusMap[st] = (statusMap[st] || 0) + 1;
        }
        const total = students.length;
        return Object.entries(statusMap)
          .sort((a, b) => b[1] - a[1])
          .map(([status, count]) => ({
            status,
            count,
            percentage: total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0%",
          }));
      }

      case "recent-left": {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return students
          .filter(s => (s.status === "left" || s.status === "tc_issued"))
          .map((s, i) => ({
            sno: i + 1,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            class: s.enrollments?.[0]?.class?.name || "-",
            fatherName: s.fatherName,
            status: s.status,
            phone: s.fatherPhone || s.phone || "-",
          }));
      }

      case "withdrawal-report": {
        return students
          .filter(s => s.status === "left" || s.status === "tc_issued" || s.status === "withdrawn")
          .map((s, i) => ({
            sno: i + 1,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            class: s.enrollments?.[0]?.class?.name || "-",
            fatherName: s.fatherName,
            status: s.status,
            admissionDate: formatDate(s.admissionDate),
            phone: s.fatherPhone || "-",
          }));
      }

      // ─── Fee Reports (Shortcut - show relevant student data) ─
      case "fee-defaulters":
      case "scholarship-students":
      case "concession-students":
      case "fee-category-wise": {
        return students.map((s, i) => ({
          sno: i + 1,
          admNo: s.admissionNo,
          name: `${s.firstName} ${s.lastName}`,
          class: s.enrollments?.[0]?.class?.name || "-",
          section: s.enrollments?.[0]?.section?.name || "-",
          fatherName: s.fatherName,
          phone: s.fatherPhone || s.phone || "-",
          category: s.category || "-",
        }));
      }

      // ─── Additional Reports ──────────────────────────────
      case "address-wise": {
        return students.map((s, i) => ({
          sno: i + 1,
          admNo: s.admissionNo,
          name: `${s.firstName} ${s.lastName}`,
          class: s.enrollments?.[0]?.class?.name || "-",
          address: s.address || "Not Provided",
          phone: s.fatherPhone || s.phone || "-",
        })).sort((a, b) => a.address.localeCompare(b.address));
      }

      case "email-directory": {
        return students
          .filter(s => s.email)
          .map((s, i) => ({
            sno: i + 1,
            name: `${s.firstName} ${s.lastName}`,
            class: s.enrollments?.[0]?.class?.name || "-",
            email: s.email || "-",
            phone: s.phone || s.fatherPhone || "-",
          }));
      }

      case "phone-directory": {
        return students.map((s, i) => ({
          sno: i + 1,
          name: `${s.firstName} ${s.lastName}`,
          class: s.enrollments?.[0]?.class?.name || "-",
          studentPhone: s.phone || "-",
          fatherPhone: s.fatherPhone || "-",
          motherPhone: s.motherPhone || "-",
        }));
      }

      case "transport-wise": {
        return students.map((s, i) => ({
          sno: i + 1,
          admNo: s.admissionNo,
          name: `${s.firstName} ${s.lastName}`,
          class: s.enrollments?.[0]?.class?.name || "-",
          section: s.enrollments?.[0]?.section?.name || "-",
          address: s.address || "-",
          phone: s.fatherPhone || s.phone || "-",
        }));
      }

      default: {
        // Fallback: show basic student list
        return students.map((s, i) => ({
          sno: i + 1,
          admNo: s.admissionNo,
          name: `${s.firstName} ${s.lastName}`,
          class: s.enrollments?.[0]?.class?.name || "-",
          section: s.enrollments?.[0]?.section?.name || "-",
          gender: s.gender,
          fatherName: s.fatherName,
          phone: s.fatherPhone || s.phone || "-",
        }));
      }
    }
  }, [students, generated, selectedReport, selectedMonth, dateFrom, dateTo]);

  // ═══════════════════════════════════════════════════════════
  // REPORT TITLE & SUBTITLE
  // ═══════════════════════════════════════════════════════════

  const getReportTitle = (): string => {
    const report = REPORT_TYPES.find(r => r.id === selectedReport);
    return report?.title || "Student Report";
  };

  const getSubtitle = (): string => {
    const parts: string[] = [];
    const year = academicYears.find(y => y.id === academicYearId);
    if (year) parts.push(`Year: ${year.name}`);
    const cls = classes.find(c => c.id === classId);
    if (cls) parts.push(`Class: ${cls.name}`);
    const sec = sections.find(s => s.id === sectionId);
    if (sec) parts.push(`Section: ${sec.name}`);
    if (selectedReport === "birthday") parts.push(`Month: ${MONTHS[selectedMonth]}`);
    if (genderFilter) parts.push(`Gender: ${genderFilter}`);
    if (categoryFilter) parts.push(`Category: ${categoryFilter}`);
    if (dateFrom) parts.push(`From: ${formatDate(dateFrom)}`);
    if (dateTo) parts.push(`To: ${formatDate(dateTo)}`);
    return parts.join(" | ");
  };

  // ═══════════════════════════════════════════════════════════
  // CSV EXPORT
  // ═══════════════════════════════════════════════════════════

  const exportCSV = () => {
    if (!reportData) return;

    let csvContent = "";

    if (selectedReport === "strength-summary" || (reportData as any)?.type === "gender-class-matrix") {
      const data = reportData as { rows: any[]; sections: string[] };
      if (selectedReport === "strength-summary") {
        const headers = ["Class", ...data.sections, "Total"];
        csvContent += headers.join(",") + "\n";
        for (const row of data.rows) {
          const values = [row.class, ...data.sections.map(s => row[s] || 0), row.total];
          csvContent += values.join(",") + "\n";
        }
      } else {
        const headers = ["Class", ...data.sections.flatMap(s => [`${s} Boys`, `${s} Girls`]), "Total Boys", "Total Girls", "Total"];
        csvContent += headers.join(",") + "\n";
        for (const row of data.rows) {
          const values = [row.class, ...data.sections.flatMap(s => [row[`${s}_B`] || 0, row[`${s}_G`] || 0]), row.totalBoys, row.totalGirls, row.total];
          csvContent += values.join(",") + "\n";
        }
      }
    } else {
      const rows = Array.isArray(reportData) ? reportData : [];
      if (rows.length === 0) return;
      const headers = Object.keys(rows[0]);
      csvContent += headers.join(",") + "\n";
      for (const row of rows) {
        const values = headers.map(h => {
          const val = String(row[h] || "").replace(/,/g, " ").replace(/"/g, "'");
          return `"${val}"`;
        });
        csvContent += values.join(",") + "\n";
      }
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedReport}-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // ═══════════════════════════════════════════════════════════
  // PRINT HANDLER
  // ═══════════════════════════════════════════════════════════

  const handlePrint = async () => {
    if (!reportData) return;

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
    const subtitle = getSubtitle();
    const userName = user?.name || "Admin";

    // Build table HTML
    let tableHTML = "";

    if (selectedReport === "strength-summary") {
      const data = reportData as { rows: any[]; sections: string[] };
      let headerCells = '<th style="border:1px solid #333;padding:6px 10px;background:#f0f0f0;font-weight:bold;">Class</th>';
      for (const sec of data.sections) {
        headerCells += `<th style="border:1px solid #333;padding:6px 10px;background:#f0f0f0;font-weight:bold;">${sec}</th>`;
      }
      headerCells += '<th style="border:1px solid #333;padding:6px 10px;background:#f0f0f0;font-weight:bold;">Total</th>';

      let bodyRows = "";
      let grandTotal = 0;
      const sectionTotals: Record<string, number> = {};
      for (const row of data.rows) {
        let cells = `<td style="border:1px solid #333;padding:5px 10px;font-weight:600;">${row.class}</td>`;
        for (const sec of data.sections) {
          const val = row[sec] || 0;
          sectionTotals[sec] = (sectionTotals[sec] || 0) + val;
          cells += `<td style="border:1px solid #333;padding:5px 10px;text-align:center;">${val}</td>`;
        }
        grandTotal += row.total;
        cells += `<td style="border:1px solid #333;padding:5px 10px;text-align:center;font-weight:bold;">${row.total}</td>`;
        bodyRows += `<tr>${cells}</tr>`;
      }
      let totalCells = '<td style="border:1px solid #333;padding:5px 10px;font-weight:bold;background:#f0f0f0;">TOTAL</td>';
      for (const sec of data.sections) {
        totalCells += `<td style="border:1px solid #333;padding:5px 10px;text-align:center;font-weight:bold;background:#f0f0f0;">${sectionTotals[sec] || 0}</td>`;
      }
      totalCells += `<td style="border:1px solid #333;padding:5px 10px;text-align:center;font-weight:bold;background:#f0f0f0;">${grandTotal}</td>`;
      bodyRows += `<tr>${totalCells}</tr>`;

      tableHTML = `<table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    } else if ((reportData as any)?.type === "gender-class-matrix") {
      const data = reportData as { rows: any[]; sections: string[] };
      let headerCells = '<th style="border:1px solid #333;padding:6px 8px;background:#f0f0f0;font-weight:bold;">Class</th>';
      for (const sec of data.sections) {
        headerCells += `<th style="border:1px solid #333;padding:6px 8px;background:#f0f0f0;font-weight:bold;" colspan="2">${sec}</th>`;
      }
      headerCells += '<th style="border:1px solid #333;padding:6px 8px;background:#f0f0f0;font-weight:bold;">Total</th>';

      let bodyRows = "";
      for (const row of data.rows) {
        let cells = `<td style="border:1px solid #333;padding:5px 8px;font-weight:600;">${row.class}</td>`;
        for (const sec of data.sections) {
          cells += `<td style="border:1px solid #333;padding:5px 8px;text-align:center;">${row[`${sec}_B`] || 0}B</td>`;
          cells += `<td style="border:1px solid #333;padding:5px 8px;text-align:center;">${row[`${sec}_G`] || 0}G</td>`;
        }
        cells += `<td style="border:1px solid #333;padding:5px 8px;text-align:center;font-weight:bold;">${row.total}</td>`;
        bodyRows += `<tr>${cells}</tr>`;
      }
      tableHTML = `<table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    } else {
      const rows = Array.isArray(reportData) ? reportData : [];
      if (rows.length === 0) return;

      const headers = Object.keys(rows[0]);
      const labelMap: Record<string, string> = {
        sno: "S.No", admNo: "Adm No", srNo: "SR No", name: "Name", studentName: "Student Name",
        fatherName: "Father Name", motherName: "Mother Name", gender: "Gender", dob: "DOB",
        phone: "Phone", address: "Address", class: "Class", section: "Section",
        boys: "Boys", girls: "Girls", total: "Total", rollNo: "Roll No", house: "House",
        General: "General", OBC: "OBC", SC: "SC", ST: "ST", EWS: "EWS",
        admissionDate: "Adm Date", status: "Status", date: "Date", email: "Email",
        occupation: "Occupation", count: "Count", percentage: "%", ageRange: "Age Range",
        religion: "Religion", caste: "Caste", bloodGroup: "Blood Group", day: "Day",
        nationality: "Nationality", motherTongue: "Mother Tongue", category: "Category",
        fatherPhone: "Father Ph.", motherPhone: "Mother Ph.", studentPhone: "Student Ph.",
        fatherOccupation: "Father Occ.", siblings: "Siblings", month: "Month",
        session: "Session", admissions: "Admissions", year: "Year", age: "Age",
        totalBoys: "Total Boys", totalGirls: "Total Girls",
      };

      let headerCells = "";
      for (const h of headers) {
        headerCells += `<th style="border:1px solid #333;padding:5px 8px;background:#f0f0f0;font-weight:bold;text-align:left;font-size:11px;">${labelMap[h] || h}</th>`;
      }

      let bodyRows = "";
      rows.forEach((row: any, idx: number) => {
        const bg = idx % 2 === 0 ? "#fff" : "#f9f9f9";
        let cells = "";
        for (const h of headers) {
          cells += `<td style="border:1px solid #333;padding:4px 8px;font-size:11px;">${row[h] ?? "-"}</td>`;
        }
        bodyRows += `<tr style="background:${bg};">${cells}</tr>`;
      });

      tableHTML = `<table style="width:100%;border-collapse:collapse;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    }

    const totalCount = selectedReport === "strength-summary" || (reportData as any)?.type === "gender-class-matrix"
      ? (reportData as any).rows?.length || 0
      : (Array.isArray(reportData) ? reportData.length : 0);

    const logoHTML = logoUrl ? `<img src="${logoUrl}" style="width:50px;height:50px;object-fit:contain;" />` : "";

    const html = `<!DOCTYPE html>
<html>
<head><title>${reportTitle}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  @media print { body { margin: 10px; } }
  @page { margin: 15mm; }
</style>
</head>
<body>
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:5px;">
    <div style="width:60px;">${logoHTML}</div>
    <div style="flex:1;text-align:center;">
      <div style="font-size:18px;font-weight:bold;line-height:1.2;">${schoolName}</div>
      ${schoolAddress ? `<div style="font-size:11px;color:#555;">${schoolAddress}</div>` : ""}
      ${schoolPhone || schoolEmail ? `<div style="font-size:10px;color:#777;">${schoolPhone ? "Ph: " + schoolPhone : ""}${schoolPhone && schoolEmail ? " | " : ""}${schoolEmail ? "Email: " + schoolEmail : ""}</div>` : ""}
    </div>
    <div style="width:140px;text-align:right;font-size:9px;color:#555;">
      <div><strong>Printed by:</strong> ${userName}</div>
      <div style="margin-top:2px;"><strong>Date:</strong> ${printDate}</div>
      <div style="margin-top:2px;"><strong>Time:</strong> ${printTime}</div>
    </div>
  </div>
  <hr style="border:none;border-top:2px solid #333;margin:5px 0 10px;" />
  <div style="text-align:center;margin-bottom:5px;">
    <div style="font-size:15px;font-weight:bold;">${reportTitle}</div>
    ${subtitle ? `<div style="font-size:11px;color:#555;">${subtitle}</div>` : ""}
    <div style="font-size:10px;color:#888;">Total Records: ${totalCount}</div>
  </div>
  ${tableHTML}
  <div style="margin-top:30px;display:flex;justify-content:flex-end;">
    ${signatureHTML}
  </div>
  <div style="margin-top:20px;display:flex;justify-content:space-between;font-size:9px;color:#888;border-top:1px solid #ccc;padding-top:8px;">
    <span>Generated by: ${userName}</span>
    <span>Printed: ${printDate} ${printTime}</span>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER TABLE
  // ═══════════════════════════════════════════════════════════

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

    if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
      return (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No data found</p>
          <p className="text-sm">Try changing filters or select a different report type</p>
        </div>
      );
    }

    // Strength Summary (special matrix layout)
    if (selectedReport === "strength-summary") {
      const data = reportData as { rows: any[]; sections: string[] };
      const sectionTotals: Record<string, number> = {};
      let grandTotal = 0;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Class</th>
                {data.sections.map(sec => (
                  <th key={sec} className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{sec}</th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {data.rows.map((row, i) => {
                grandTotal += row.total;
                return (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 font-medium dark:text-gray-200">{row.class}</td>
                    {data.sections.map(sec => {
                      const val = row[sec] || 0;
                      sectionTotals[sec] = (sectionTotals[sec] || 0) + val;
                      return <td key={sec} className="px-4 py-2 text-center dark:text-gray-300">{val}</td>;
                    })}
                    <td className="px-4 py-2 text-center font-bold dark:text-gray-200">{row.total}</td>
                  </tr>
                );
              })}
              <tr className="bg-primary-50 dark:bg-primary-900/30 font-bold">
                <td className="px-4 py-2 dark:text-gray-200">TOTAL</td>
                {data.sections.map(sec => (
                  <td key={sec} className="px-4 py-2 text-center dark:text-gray-200">{sectionTotals[sec] || 0}</td>
                ))}
                <td className="px-4 py-2 text-center dark:text-gray-200">{grandTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // Gender × Class Matrix
    if ((reportData as any)?.type === "gender-class-matrix") {
      const data = reportData as { rows: any[]; sections: string[] };
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Class</th>
                {data.sections.map(sec => (
                  <th key={sec} colSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase border-x dark:border-gray-600">{sec}</th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Total</th>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-600">
                <th className="px-3 py-1"></th>
                {data.sections.map(sec => (
                  <><th key={`${sec}_b`} className="px-2 py-1 text-center text-[10px] text-blue-600 dark:text-blue-400">B</th><th key={`${sec}_g`} className="px-2 py-1 text-center text-[10px] text-pink-600 dark:text-pink-400">G</th></>
                ))}
                <th className="px-3 py-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {data.rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-3 py-2 font-medium dark:text-gray-200">{row.class}</td>
                  {data.sections.map(sec => (
                    <><td key={`${sec}_b_${i}`} className="px-2 py-2 text-center text-blue-700 dark:text-blue-400">{row[`${sec}_B`] || 0}</td><td key={`${sec}_g_${i}`} className="px-2 py-2 text-center text-pink-700 dark:text-pink-400">{row[`${sec}_G`] || 0}</td></>
                  ))}
                  <td className="px-3 py-2 text-center font-bold dark:text-gray-200">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // All other reports (array-based)
    const rows = Array.isArray(reportData) ? reportData : [];
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    const labelMap: Record<string, string> = {
      sno: "S.No", admNo: "Adm No", srNo: "SR No", name: "Student Name", studentName: "Student Name",
      fatherName: "Father Name", motherName: "Mother Name", gender: "Gender", dob: "DOB",
      phone: "Phone", address: "Address", class: "Class", section: "Section",
      boys: "Boys", girls: "Girls", total: "Total", rollNo: "Roll No", house: "House",
      General: "General", OBC: "OBC", SC: "SC", ST: "ST", EWS: "EWS",
      admissionDate: "Adm Date", status: "Status", date: "Date", email: "Email",
      occupation: "Occupation", count: "Count", percentage: "%", ageRange: "Age Range",
      religion: "Religion", caste: "Caste", bloodGroup: "Blood Group", day: "Day",
      nationality: "Nationality", motherTongue: "Mother Tongue", category: "Category",
      fatherPhone: "Father Ph.", motherPhone: "Mother Ph.", studentPhone: "Student Ph.",
      fatherOccupation: "Father Occ.", siblings: "Siblings", month: "Month",
      session: "Session", admissions: "Admissions", year: "Year", age: "Age",
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
                        row[h] === "left" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        row[h] === "tc_issued" || row[h] === "TC Issued" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        row[h] === "inactive" ? "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300" :
                        "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                      }`}>
                        {row[h]}
                      </span>
                    ) : h === "percentage" ? (
                      row[h]
                    ) : (
                      row[h] ?? "-"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 border-t dark:border-gray-700">
          Total Records: <strong>{rows.length}</strong>
          {(selectedReport === "gender-wise" || selectedReport === "blood-group-wise" || selectedReport === "age-wise" || selectedReport === "category-gender-cross") && (
            <span className="ml-4">
              Total Boys: <strong>{rows.reduce((a: number, r: any) => a + (r.boys || 0), 0)}</strong> |
              Total Girls: <strong>{rows.reduce((a: number, r: any) => a + (r.girls || 0), 0)}</strong>
            </span>
          )}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER - MAIN JSX
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-600" />
            Student Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate, preview & export comprehensive student reports</p>
        </div>
        <button
          onClick={() => navigate("/students")}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </button>
      </div>

      {/* ─── Summary Dashboard Cards ──────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Students", value: summaryData.total, icon: Users, color: "blue" },
          { label: "Boys", value: summaryData.boys, icon: UserCheck, color: "sky" },
          { label: "Girls", value: summaryData.girls, icon: UserCheck, color: "pink" },
          { label: "New Admissions", value: summaryData.newAdmissions, icon: UserPlus, color: "green" },
          { label: "TC Issued", value: summaryData.tcIssued, icon: FileText, color: "amber" },
          { label: "Active", value: summaryData.active, icon: Shield, color: "emerald" },
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

      {/* ─── Report Selection View (when no report is actively being generated) ─── */}
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
                        className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-${category.color}-50 dark:bg-${category.color}-950/50 hover:scale-105 transition-all duration-200 group`}
                      >
                        <div className={`w-7 h-7 rounded-md bg-${category.color}-500 flex items-center justify-center`}>
                          <ReportIcon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center leading-tight">{report.title.replace(" Report", "").replace(" List", "")}</span>
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
          {/* Back to Reports Button */}
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
              {/* Academic Year */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Academic Year</label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Years</option>
                  {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>

              {/* Class */}
              {getRelevantFilters(selectedReport).includes("class") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Class</label>
                  <select
                    value={classId}
                    onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Section */}
              {getRelevantFilters(selectedReport).includes("section") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Section</label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                    disabled={!classId}
                  >
                    <option value="">All Sections</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                  </select>
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

              {/* Category */}
              {getRelevantFilters(selectedReport).includes("category") && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Categories</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
              )}

              {/* Month - for birthday report */}
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
