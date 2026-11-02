import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { getPrintSignatureHTML } from "../../components/PrintSignature";
import { getFullUrl } from "../../utils/url";
import { printAdmitCards, AdmitCardDetail } from "../../utils/admitCardPrint";
import {
  ClipboardList, Calendar, CalendarDays, BookOpen, Users, UserCheck, UserX,
  BarChart3, FileText, Award, Search, Printer, Download, Eye, ArrowLeft,
  TrendingUp, AlertCircle, Clock, Shield, Hash, Layers, Building2,
  Star, CheckCircle, BookMarked, ListOrdered, GraduationCap, Briefcase
} from "lucide-react";

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

interface Exam {
  id: string;
  name: string;
  classId?: string;
  className?: string;
  session?: string;
  status?: string;
}

interface TenantInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT CATEGORIES (8 categories)
// ═══════════════════════════════════════════════════════════════════════════

const REPORT_CATEGORIES: ReportCategory[] = [
  { id: "general", label: "General Reports", icon: ClipboardList, color: "blue" },
  { id: "marks", label: "Marks & Evaluation", icon: BookOpen, color: "green" },
  { id: "results", label: "Results", icon: Award, color: "yellow" },
  { id: "performance", label: "Performance Analysis", icon: BarChart3, color: "purple" },
  { id: "attendance", label: "Exam Attendance", icon: Calendar, color: "orange" },
  { id: "seating", label: "Seating & Admit Card", icon: Building2, color: "red" },
  { id: "practical", label: "Practical / Internal", icon: Star, color: "amber" },
  { id: "admin", label: "Administration", icon: Shield, color: "slate" },
];

// ═══════════════════════════════════════════════════════════════════════════
// REPORT TYPE DEFINITIONS (46 Reports)
// ═══════════════════════════════════════════════════════════════════════════

const REPORT_TYPES: ReportType[] = [
  // ─── General Reports (5) ─────────────────────────────────────
  { id: "exam-list", icon: ClipboardList, title: "Exam List", description: "All exams list", category: "general" },
  { id: "exam-schedule", icon: Calendar, title: "Exam Schedule", description: "Exam schedule with dates", category: "general" },
  { id: "date-sheet", icon: CalendarDays, title: "Date Sheet", description: "Subject-wise exam dates", category: "general" },
  { id: "subject-schedule", icon: BookOpen, title: "Subject-wise Schedule", description: "Schedule grouped by subject", category: "general" },
  { id: "invigilator-duty", icon: Users, title: "Invigilator Duty", description: "Invigilator duty assignment", category: "general" },

  // ─── Marks & Evaluation (8) ──────────────────────────────────
  { id: "marks-register", icon: BookMarked, title: "Marks Register", description: "Complete marks register", category: "marks" },
  { id: "marks-entry", icon: FileText, title: "Marks Entry Report", description: "Marks entry status report", category: "marks" },
  { id: "subject-marks", icon: BookOpen, title: "Subject-wise Marks", description: "Marks grouped by subject", category: "marks" },
  { id: "class-marks", icon: Layers, title: "Class-wise Marks", description: "Marks grouped by class", category: "marks" },
  { id: "section-marks", icon: ListOrdered, title: "Section-wise Marks", description: "Marks grouped by section", category: "marks" },
  { id: "student-marks", icon: Users, title: "Student Marks List", description: "Individual student marks", category: "marks" },
  { id: "marks-pending", icon: Clock, title: "Marks Entry Pending", description: "Subjects with pending marks", category: "marks" },
  { id: "marks-correction", icon: AlertCircle, title: "Marks Correction Log", description: "Marks correction history", category: "marks" },

  // ─── Results (8) ─────────────────────────────────────────────
  { id: "result-register", icon: BookMarked, title: "Result Register", description: "Complete result register", category: "results" },
  { id: "class-result", icon: Layers, title: "Class Result", description: "Class-wise result", category: "results" },
  { id: "section-result", icon: ListOrdered, title: "Section Result", description: "Section-wise result", category: "results" },
  { id: "report-card", icon: FileText, title: "Student Report Card", description: "Individual report card", category: "results" },
  { id: "merit-list", icon: Award, title: "Merit List", description: "Merit/rank list", category: "results" },
  { id: "rank-list", icon: Hash, title: "Rank List", description: "Position-wise ranking", category: "results" },
  { id: "topper-list", icon: Star, title: "Topper List", description: "Top performers", category: "results" },
  { id: "failed-students", icon: UserX, title: "Failed Students", description: "Students who failed", category: "results" },

  // ─── Performance Analysis (8) ────────────────────────────────
  { id: "pass-percentage", icon: TrendingUp, title: "Pass Percentage", description: "Overall pass percentage", category: "performance" },
  { id: "subject-analysis", icon: BookOpen, title: "Subject Analysis", description: "Subject-wise analysis", category: "performance" },
  { id: "class-performance", icon: BarChart3, title: "Class Performance", description: "Class-wise performance", category: "performance" },
  { id: "section-comparison", icon: Layers, title: "Section Comparison", description: "Section-wise comparison", category: "performance" },
  { id: "gender-performance", icon: Users, title: "Gender-wise Performance", description: "Performance by gender", category: "performance" },
  { id: "category-performance", icon: Shield, title: "Category-wise Performance", description: "Performance by category", category: "performance" },
  { id: "grade-distribution", icon: BarChart3, title: "Grade Distribution", description: "Grade-wise student count", category: "performance" },
  { id: "improvement-report", icon: TrendingUp, title: "Improvement Report", description: "Students who improved", category: "performance" },

  // ─── Exam Attendance (4) ─────────────────────────────────────
  { id: "exam-attendance", icon: Calendar, title: "Attendance Register", description: "Exam attendance register", category: "attendance" },
  { id: "exam-present", icon: UserCheck, title: "Present Students", description: "Students present in exam", category: "attendance" },
  { id: "exam-absent", icon: UserX, title: "Absent Students", description: "Students absent from exam", category: "attendance" },
  { id: "exam-attendance-summary", icon: BarChart3, title: "Attendance Summary", description: "Exam attendance summary", category: "attendance" },

  // ─── Seating & Admit Card (5) ────────────────────────────────
  { id: "admit-card", icon: FileText, title: "Admit Card Register", description: "Admit card register", category: "seating" },
  { id: "hall-ticket", icon: FileText, title: "Hall Ticket Register", description: "Hall ticket register", category: "seating" },
  { id: "seating-plan", icon: Building2, title: "Seating Plan", description: "Exam seating arrangement", category: "seating" },
  { id: "room-seating", icon: Layers, title: "Room-wise Seating", description: "Room-wise seating plan", category: "seating" },
  { id: "room-occupancy", icon: Hash, title: "Room Occupancy", description: "Room occupancy report", category: "seating" },

  // ─── Practical / Internal (4) ────────────────────────────────
  { id: "practical-marks", icon: Star, title: "Practical Marks", description: "Practical exam marks", category: "practical" },
  { id: "internal-assessment", icon: BookOpen, title: "Internal Assessment", description: "Internal assessment marks", category: "practical" },
  { id: "viva-marks", icon: Users, title: "Viva Marks", description: "Viva voce marks", category: "practical" },
  { id: "project-marks", icon: Briefcase, title: "Project Marks", description: "Project marks", category: "practical" },

  // ─── Administration (4) ──────────────────────────────────────
  { id: "result-published", icon: CheckCircle, title: "Result Published", description: "Result publishing log", category: "admin" },
  { id: "re-evaluation", icon: AlertCircle, title: "Re-evaluation", description: "Re-evaluation requests", category: "admin" },
  { id: "grace-marks", icon: GraduationCap, title: "Grace Marks", description: "Grace marks report", category: "admin" },
  { id: "result-revision", icon: Clock, title: "Result Revision Log", description: "Result revision history", category: "admin" },
];

// Report type → API reportType mapping
const REPORT_API_MAP: Record<string, string> = {
  "result-register": "result_summary",
  "class-result": "result_summary",
  "section-result": "result_summary",
  "merit-list": "topper_list",
  "rank-list": "topper_list",
  "topper-list": "topper_list",
  "failed-students": "pass_fail",
  "pass-percentage": "pass_fail",
  "subject-analysis": "subject_wise",
  "subject-marks": "subject_wise",
  "class-performance": "result_summary",
  "section-comparison": "result_summary",
  "gender-performance": "result_summary",
  "category-performance": "result_summary",
  "grade-distribution": "grade_report",
  "marks-register": "marks",
  "marks-entry": "marks",
  "class-marks": "marks",
  "section-marks": "marks",
  "student-marks": "marks",
  "exam-attendance": "attendance",
  "exam-present": "attendance",
  "exam-absent": "attendance",
  "exam-attendance-summary": "attendance",
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

// Columns that must NEVER appear in Preview / Print / CSV output — these are
// raw database identifiers and internal flags. Users should see resolved
// values (className, session) instead of IDs like classId / academicYearId.
const HIDDEN_COLUMNS = [
  "id", "_id", "studentId", "enrollmentId", "examId", "tenantId",
  "classId", "sectionId", "academicYearId", "subjectIds",
  "createdAt", "updatedAt", "deletedAt", "isDeleted", "isActive",
];

const getVisibleColumns = (row: any): string[] =>
  Object.keys(row || {}).filter((k) => !HIDDEN_COLUMNS.includes(k));

const ExamReports = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ─── State ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // ─── Column customization (which columns to show + their order) ──────────
  // availableColumns = every non-ID column present in the loaded report.
  // reportColumns    = the user's chosen columns IN DISPLAY ORDER. A column
  //                    not present here is hidden from Preview / Print / CSV.
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [reportColumns, setReportColumns] = useState<string[]>([]);
  const [showColumnPanel, setShowColumnPanel] = useState(false);

  // Filters
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [selectedSection, setSelectedSection] = useState("");

  // Summary
  const [summaryData, setSummaryData] = useState({
    totalExams: 0, completedExams: 0, resultsPublished: 0,
    studentsAppeared: 0, overallPass: 0, pendingMarks: 0,
  });

  // Tenant & User
  const tenant: TenantInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("tenant") || "{}"); } catch { return {}; }
  }, []);
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);

  // ─── Fetch Initial Data ────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examRes, classRes] = await Promise.all([
          axios.get(getFullUrl("/api/exam")),
          axios.get(getFullUrl("/api/class")),
        ]);
        const examList = examRes.data?.data || examRes.data || [];
        setExams(Array.isArray(examList) ? examList : []);
        setClasses(classRes.data?.data || []);

        // Summary from exam list
        const total = Array.isArray(examList) ? examList.length : 0;
        const completed = Array.isArray(examList) ? examList.filter((e: any) => e.status === "COMPLETED" || e.isCompleted).length : 0;
        const published = Array.isArray(examList) ? examList.filter((e: any) => e.resultPublished || e.status === "PUBLISHED").length : 0;
        setSummaryData((prev) => ({ ...prev, totalExams: total, completedExams: completed, resultsPublished: published }));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // When an exam is selected, auto-select that exam's class so the Section
  // dropdown lists only that class's sections. Clearing the exam leaves the
  // class filter as-is (user can still pick "All Classes" manually).
  useEffect(() => {
    if (!selectedExam) return;
    const ex = exams.find((e) => e.id === selectedExam);
    const examClassId = ex?.classId || "";
    if (examClassId && examClassId !== selectedClass) {
      setSelectedClass(examClassId);
    }
  }, [selectedExam, exams]);

  // Fetch sections when class changes
  useEffect(() => {
    if (selectedClass) {
      axios.get(getFullUrl(`/api/section?classId=${selectedClass}`))
        .then((res) => setSections(res.data?.data || []))
        .catch(() => setSections([]));
      setSelectedSection("");
    } else {
      setSections([]);
    }
  }, [selectedClass]);

  // Initialise column selection whenever a fresh report is generated.
  useEffect(() => {
    if (!reportData) { setAvailableColumns([]); setReportColumns([]); return; }
    const d = Array.isArray(reportData)
      ? reportData
      : reportData.students || reportData.records || reportData.data || [];
    if (!Array.isArray(d) || d.length === 0) { setAvailableColumns([]); setReportColumns([]); return; }
    const cols = getVisibleColumns(d[0]);
    setAvailableColumns(cols);
    setReportColumns(cols); // default: show all, natural order
    setShowColumnPanel(false);
  }, [reportData]);

  // ─── Column helpers ──────────────────────────────────────────────────────
  // Active columns = user's chosen order, limited to what actually exists in
  // the data. Falls back to all visible columns if nothing is selected yet.
  const getActiveColumns = (data: any[]): string[] => {
    const all = getVisibleColumns(data[0]);
    const chosen = reportColumns.filter((c) => all.includes(c));
    return chosen.length ? chosen : all;
  };

  const toggleColumn = (col: string) => {
    setReportColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const moveColumn = (col: string, dir: -1 | 1) => {
    setReportColumns((prev) => {
      const i = prev.indexOf(col);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const arr = [...prev];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  };

  const selectAllColumns = () => setReportColumns(availableColumns);
  const clearAllColumns = () => setReportColumns([]);

  // Pretty label for a raw column key (e.g. "totalMaxMarks" -> "Total Max Marks")
  const prettyCol = (c: string) =>
    c.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/\s+/g, " ").trim();

  // ─── Search & Group ────────────────────────────────────────────
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return REPORT_TYPES;
    const q = searchQuery.toLowerCase();
    return REPORT_TYPES.filter(
      (r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const groupedReports = useMemo(() => {
    const groups: Record<string, ReportType[]> = {};
    for (const cat of REPORT_CATEGORIES) {
      groups[cat.id] = filteredReports.filter((r) => r.category === cat.id);
    }
    return groups;
  }, [filteredReports]);

  // ─── Handle Report Select ──────────────────────────────────────
  const handleReportSelect = (reportId: string) => {
    setSelectedReport(reportId);
    setShowFilterPanel(true);
    setGenerated(false);
    setReportData(null);
  };

  // ─── Quick Report ──────────────────────────────────────────────
  const handleQuickReport = (reportId: string) => {
    setSelectedReport(reportId);
    setShowFilterPanel(true);
    setGenerated(false);
    setReportData(null);
  };

  // ─── Generate Report ───────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true);
    setGenerated(false);
    setReportData(null);

    try {
      // Reports that DON'T need a specific exam — they list all exams
      const examListReports = ["exam-list", "exam-schedule", "date-sheet", "subject-schedule", "invigilator-duty"];

      let res;
      let data: any;

      if (selectedReport === "admit-card") {
        // Admit Card Register → fetch real admit-card data (not the generic
        // result API, which is empty until results are generated). We flatten
        // each admit card into a table row for the preview; Print uses the
        // shared admit-card printer.
        if (!selectedExam) {
          toast.error("Please select an exam");
          setLoading(false);
          return;
        }
        const examName = exams.find((e) => e.id === selectedExam)?.name || "";
        const bulkRes = await axios.get(getFullUrl("/api/exam/admit-cards/bulk"), {
          params: { examName, ...(selectedClass ? { classId: selectedClass } : {}) },
        });
        const cards = bulkRes.data?.data || bulkRes.data || [];
        data = (Array.isArray(cards) ? cards : []).map((c: any) => ({
          studentId: c.student?.id || c.studentId || "",
          studentName: c.student?.name || "",
          admissionNo: c.student?.admissionNo || "",
          rollNo: c.student?.rollNo || "",
          className: c.student?.class?.name || c.exam?.class?.name || "",
          sectionId: c.student?.section?.id || null,
          sectionName: c.student?.section?.name || "",
          fatherName: c.student?.fatherName || "",
          subjects: Array.isArray(c.schedule) ? c.schedule.length : 0,
          room: c.allottedRoom || "",
        }));
      } else if (examListReports.includes(selectedReport)) {
        // Fetch all exams directly
        res = await axios.get(getFullUrl("/api/exam"), {
          params: { ...(selectedClass ? { classId: selectedClass } : {}) },
        });
        data = res.data?.data || res.data?.exams || res.data;
      } else {
        // These reports need a specific exam selected
        if (!selectedExam) {
          toast.error("Please select an exam");
          setLoading(false);
          return;
        }
        const reportType = REPORT_API_MAP[selectedReport] || "result_summary";
        res = await axios.get(getFullUrl("/api/exam/reports"), {
          params: { examId: selectedExam, reportType },
        });
        data = res.data?.data || res.data?.exams || res.data;
      }

      if (!data) data = [];

      // Debug: surface what the API returned + section matching (helps diagnose
      // "blank report" issues). Remove once section filtering is confirmed.
      if (Array.isArray(data)) {
        const selSecName = sections.find((sec) => sec.id === selectedSection)?.name || "";
        console.log("[ExamReports] fetched records:", data.length,
          "| selectedSection:", selectedSection, `(${selSecName})`,
          "| sample record sectionId/sectionName:",
          data[0]?.sectionId, "/", data[0]?.sectionName);
      }

      // Section filter — report records carry sectionId / sectionName (resolved
      // from the student's enrollment on the backend). When a section is
      // chosen, keep only that section's students.
      // IMPORTANT: this is a *non-destructive* filter — if it would match
      // nothing (e.g. the backend hasn't been rebuilt and records carry no
      // section info, or no student is mapped to this section), we fall back
      // to the full list so the report is never silently blank.
      if (Array.isArray(data) && selectedSection) {
        const selSecName =
          sections.find((sec) => sec.id === selectedSection)?.name || "";
        const filtered = data.filter(
          (r: any) =>
            r.sectionId === selectedSection ||
            (selSecName &&
              String(r.sectionName || "").toLowerCase() ===
                selSecName.toLowerCase())
        );
        if (filtered.length > 0) {
          data = filtered;
        }
      }

      // Client-side filtering for specific reports
      if (Array.isArray(data)) {
        if (selectedReport === "failed-students") {
          data = data.filter((s: any) => s.status === "FAIL" || s.status === "Failed" || (s.percentage && parseFloat(s.percentage) < 33));
        } else if (selectedReport === "topper-list" || selectedReport === "merit-list" || selectedReport === "rank-list") {
          data = data.sort((a: any, b: any) => (b.percentage || 0) - (a.percentage || 0)).slice(0, 20);
        } else if (selectedReport === "exam-present") {
          data = data.filter((s: any) => (s.status || "").toUpperCase() === "PRESENT" || s.isPresent);
        } else if (selectedReport === "exam-absent") {
          data = data.filter((s: any) => (s.status || "").toUpperCase() === "ABSENT" || s.isAbsent);
        }
      }

      setReportData(data);
      setGenerated(true);
      toast.success("Report generated successfully");
    } catch (err: any) {
      console.error("Error generating report:", err);
      toast.error(err?.response?.data?.message || "Error generating report");
    } finally {
      setLoading(false);
    }
  };

  // ─── Report Title ──────────────────────────────────────────────
  const getReportTitle = () => {
    const report = REPORT_TYPES.find((r) => r.id === selectedReport);
    return report?.title || "Report";
  };

  // ─── Render Table ──────────────────────────────────────────────
  const renderTable = () => {
    if (!reportData) return <div className="p-8 text-center text-gray-400">No data to display</div>;

    const data = Array.isArray(reportData) ? reportData : reportData.students || reportData.records || reportData.data || [];
    if (!Array.isArray(data) || data.length === 0) {
      return <div className="p-8 text-center text-gray-400 dark:text-gray-500">No records found for the selected filters</div>;
    }

    const columns = getActiveColumns(data);

    if (reportColumns.length === 0 && availableColumns.length > 0) {
      return (
        <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
          No columns selected. Open <strong>Columns</strong> and tick the fields you want to show.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">S.No</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap">
                  {prettyCol(col)}
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
                    {col === "status" ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        (String(row[col]).toUpperCase() === "PASS" || String(row[col]).toUpperCase() === "PASSED") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        (String(row[col]).toUpperCase() === "FAIL" || String(row[col]).toUpperCase() === "FAILED") ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {String(row[col] || "-")}
                      </span>
                    ) : col.includes("percent") || col.includes("Percent") || col === "percentage" || col === "passPercentage" ? (
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
              <span><strong>Pass:</strong> {data.filter((r: any) => (r.status || "").toUpperCase() === "PASS" || (r.status || "").toUpperCase() === "PASSED").length}</span>
              <span><strong>Fail:</strong> {data.filter((r: any) => (r.status || "").toUpperCase() === "FAIL" || (r.status || "").toUpperCase() === "FAILED").length}</span>
            </>
          )}
        </div>
      </div>
    );
  };

  // ─── Print ─────────────────────────────────────────────────────
  // ─── Admit Card Register → real admit-card print (shared with Admit Card page) ──
  // Fetches full admit-card data for the selected exam (and class/section if
  // chosen) via the bulk API, then prints using the SHARED printer so the
  // layout matches the Admit Card page exactly. Falls back to per-student
  // fetches if the bulk endpoint fails.
  const printAdmitCardRegister = async () => {
    const examName = exams.find((e) => e.id === selectedExam)?.name || "";
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const loadingToast = toast.loading("Loading admit cards…");
    try {
      let allCards: AdmitCardDetail[] = [];
      try {
        const res = await axios.get(getFullUrl("/api/exam/admit-cards/bulk"), {
          headers,
          params: {
            examName,
            ...(selectedClass ? { classId: selectedClass } : {}),
          },
          timeout: 30000,
        });
        allCards = res.data?.data || res.data || [];
      } catch (bulkErr: any) {
        // Fallback: fetch each student's admit card individually from the
        // currently-loaded report rows (they carry studentId).
        const rows = Array.isArray(reportData)
          ? reportData
          : reportData?.students || reportData?.records || reportData?.data || [];
        const toFetch = (Array.isArray(rows) ? rows : []).slice(0, 50);
        const results = await Promise.allSettled(
          toFetch.map((r: any) =>
            axios
              .get(getFullUrl(`/api/exam/${selectedExam}/admit-card/${r.studentId || r.id}`), { headers })
              .then((x) => x.data?.data || x.data)
          )
        );
        allCards = results
          .filter((r): r is PromiseFulfilledResult<AdmitCardDetail> => r.status === "fulfilled" && !!r.value)
          .map((r) => r.value);
      }

      // Section filter (non-destructive — only applied if it matches something).
      if (selectedSection) {
        const selSecName = sections.find((sec) => sec.id === selectedSection)?.name || "";
        const filtered = allCards.filter(
          (c: any) =>
            c.student?.section?.id === selectedSection ||
            (selSecName &&
              String(c.student?.section?.name || "").toLowerCase() === selSecName.toLowerCase())
        );
        if (filtered.length > 0) allCards = filtered;
      }

      toast.dismiss(loadingToast);
      if (allCards.length === 0) {
        toast.error("No admit card data found. Generate admit cards first.");
        return;
      }
      printAdmitCards(allCards, `Admit Cards — ${examName}`, (msg) => toast.error(msg));
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err?.response?.data?.message || err?.message || "Failed to load admit cards");
    }
  };

  const handlePrint = async () => {
    if (!reportData) return;
    const data = Array.isArray(reportData) ? reportData : reportData.students || reportData.records || reportData.data || [];
    if (!Array.isArray(data) || data.length === 0) { toast.error("No data to print"); return; }

    // Admit Card Register → print real admit cards using the SHARED printer so
    // the output is identical to the Admit Card page (single / class / bulk).
    if (selectedReport === "admit-card") {
      await printAdmitCardRegister();
      return;
    }

    if (reportColumns.length === 0 && availableColumns.length > 0) { toast.error("Select at least one column to print"); return; }

    const columns = getActiveColumns(data);
    const signatureHTML = await getPrintSignatureHTML();
    const logoUrl = tenant.logoUrl || "";
    const schoolName = tenant.name || "School Name";
    const address = tenant.address || "";
    const userName = user.name || user.firstName || "Admin";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    const selEx = exams.find((e) => e.id === selectedExam);
    const examName = selEx?.name || "";
    const sessionLabel = selEx?.session || "";
    // Exam line, e.g. "FA 1 EXAMINATION (2026-27)"
    const examLine = (examName ? `${examName} EXAMINATION` : getReportTitle())
      + (sessionLabel ? ` (${sessionLabel})` : "");
    // Class / Section / Students line
    const className =
      (selEx?.className && selEx.className !== "N/A" ? selEx.className : "")
      || classes.find((c) => c.id === selectedClass)?.name || "";
    const sectionName = selectedSection
      ? (sections.find((s) => s.id === selectedSection)?.name || "")
      : "All Sections";

    const html = `
      <html><head><title>${getReportTitle()}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; font-size: 10px; }
        th { background: #f5f5f5; font-weight: 600; }
        /* Centered school header with logo on the left and print-meta on the right.
           The school name + address + exam + class line are all truly page-centered. */
        .ph { position: relative; text-align: center; padding-bottom: 10px; margin-bottom: 12px; border-bottom: 2px solid #000; }
        .ph .logo { position: absolute; left: 0; top: 0; width: 56px; height: 56px; object-fit: contain; }
        .ph .meta { position: absolute; right: 0; top: 0; text-align: right; font-size: 9px; color: #666; line-height: 1.5; }
        .ph .school { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: .5px; }
        .ph .addr { font-size: 10px; color: #444; margin-top: 2px; }
        .ph .exam { font-size: 13px; font-weight: 600; margin-top: 8px; text-transform: uppercase; }
        .ph .cls { font-size: 11px; color: #333; margin-top: 4px; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <div class="ph">
        ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ""}
        <div class="meta">Printed by: ${userName}<br/>Date: ${dateStr}<br/>Time: ${timeStr}</div>
        <div class="school">${schoolName}</div>
        ${address ? `<div class="addr">${address}</div>` : ""}
        <div class="exam">${examLine}</div>
        <div class="cls">Class: ${className || "—"} &nbsp;|&nbsp; Section: ${sectionName} &nbsp;|&nbsp; Total Students: ${data.length}</div>
      </div>
      <table>
        <thead><tr><th>S.No</th>${columns.map((c) => `<th>${prettyCol(c)}</th>`).join("")}</tr></thead>
        <tbody>${data.map((row: any, idx: number) =>
          `<tr><td>${idx + 1}</td>${columns.map((c) => `<td>${row[c] ?? "-"}</td>`).join("")}</tr>`
        ).join("")}</tbody>
      </table>
      ${signatureHTML || ""}
      </body></html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  // ─── Export CSV ────────────────────────────────────────────────
  const exportCSV = () => {
    if (!reportData) return;
    const data = Array.isArray(reportData) ? reportData : reportData.students || reportData.records || reportData.data || [];
    if (!Array.isArray(data) || data.length === 0) { toast.error("No data to export"); return; }
    if (reportColumns.length === 0 && availableColumns.length > 0) { toast.error("Select at least one column to export"); return; }

    const columns = getActiveColumns(data);
    const headers = ["S.No", ...columns.map((c) => prettyCol(c))];
    const rows = data.map((row: any, idx: number) => [idx + 1, ...columns.map((c) => row[c] ?? "")]);

    const csv = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getReportTitle().replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported!");
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary-600" /> Exam Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate, Preview & Export Exam Reports</p>
        </div>
        <button
          onClick={() => navigate("/exams")}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Exams
        </button>
      </div>

      {/* ─── Summary Dashboard Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Exams", value: summaryData.totalExams, icon: ClipboardList, color: "blue" },
          { label: "Completed", value: summaryData.completedExams, icon: CheckCircle, color: "green" },
          { label: "Published", value: summaryData.resultsPublished, icon: Award, color: "purple" },
          { label: "Appeared", value: summaryData.studentsAppeared, icon: Users, color: "sky" },
          { label: "Pass %", value: `${summaryData.overallPass}%`, icon: TrendingUp, color: "emerald" },
          { label: "Pending Entry", value: summaryData.pendingMarks, icon: Clock, color: "amber" },
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

      {/* ─── Quick Report Buttons ─── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: "Report Card", icon: FileText, id: "report-card" },
          { label: "Merit List", icon: Award, id: "merit-list" },
          { label: "Result Summary", icon: BarChart3, id: "result-register" },
          { label: "Date Sheet", icon: CalendarDays, id: "date-sheet" },
          { label: "Admit Card", icon: FileText, id: "admit-card" },
          { label: "Seating Plan", icon: Building2, id: "seating-plan" },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => handleQuickReport(btn.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <btn.icon className="w-3.5 h-3.5" /> {btn.label}
          </button>
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

      {/* ─── Filter Panel & Report Output ─── */}
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
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary-500" />
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">{getReportTitle()}</h3>
              </div>
              <span className="text-xs text-gray-400">Configure filters and generate the report</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Exam Select */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Exam *</label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Exam</option>
                  {exams.map((exam) => {
                    const cls = exam.className && exam.className !== "N/A" ? exam.className : "";
                    const label =
                      exam.name +
                      (cls ? ` — ${cls}` : "") +
                      (exam.session ? ` (${exam.session})` : "");
                    return (
                      <option key={exam.id} value={exam.id}>{label}</option>
                    );
                  })}
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                  disabled={!selectedClass}
                >
                  <option value="">All Sections</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !selectedExam}
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
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{getReportTitle()}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Exam: {exams.find((e) => e.id === selectedExam)?.name || ""} | Total Records: {Array.isArray(reportData) ? reportData.length : "—"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowColumnPanel((v) => !v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${showColumnPanel ? "bg-primary-600 text-white border-primary-600" : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100"}`}>
                    <Layers className="w-3 h-3" /> Columns
                    {reportColumns.length > 0 && availableColumns.length > 0 && (
                      <span className="ml-0.5 opacity-80">({reportColumns.length}/{availableColumns.length})</span>
                    )}
                  </button>
                  <button onClick={exportCSV} className="px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 text-xs font-medium border border-green-200 dark:border-green-700 flex items-center gap-1">
                    <Download className="w-3 h-3" /> CSV
                  </button>
                  <button onClick={handlePrint} className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-100 text-xs font-medium border border-primary-200 dark:border-primary-700 flex items-center gap-1">
                    <Printer className="w-3 h-3" /> Print
                  </button>
                </div>
              </div>
              {/* ─── Column customization panel ─── */}
              {showColumnPanel && availableColumns.length > 0 && (
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/60">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Customize Columns</h4>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Tick the columns to include, then use ▲ ▼ to set their order. Applies to Preview, Print & CSV.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={selectAllColumns} className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700">
                        Select all
                      </button>
                      <button onClick={clearAllColumns} className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700">
                        Clear all
                      </button>
                    </div>
                  </div>

                  {/* Selected columns — in display order, reorderable */}
                  <div className="mb-3">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">Selected (in order)</div>
                    {reportColumns.length === 0 ? (
                      <div className="text-xs text-gray-400 italic">No columns selected — nothing will be shown. Tick columns below.</div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {reportColumns.filter((c) => availableColumns.includes(c)).map((col, idx, arr) => (
                          <div key={col} className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2.5 py-1.5">
                            <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}</span>
                            <span className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-200">{prettyCol(col)}</span>
                            <button onClick={() => moveColumn(col, -1)} disabled={idx === 0} className="px-1.5 py-0.5 text-xs rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30" title="Move up">▲</button>
                            <button onClick={() => moveColumn(col, 1)} disabled={idx === arr.length - 1} className="px-1.5 py-0.5 text-xs rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30" title="Move down">▼</button>
                            <button onClick={() => toggleColumn(col)} className="px-1.5 py-0.5 text-xs rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30" title="Remove">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hidden / available columns to add back */}
                  {availableColumns.some((c) => !reportColumns.includes(c)) && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">Available to add</div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableColumns.filter((c) => !reportColumns.includes(c)).map((col) => (
                          <button key={col} onClick={() => toggleColumn(col)} className="px-2.5 py-1 text-xs rounded-md border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400">
                            + {prettyCol(col)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {renderTable()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExamReports;
