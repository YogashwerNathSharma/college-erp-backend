import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Printer,
  BarChart3,
  FileText,
  Award,
  Users,
  CheckCircle,
  BookOpen,
  ClipboardList,
} from "lucide-react";

interface Exam {
  id: string;
  name: string;
  className?: string;
}

type ReportType =
  | "result_summary"
  | "subject_wise"
  | "topper_list"
  | "pass_fail"
  | "grade_report"
  | "attendance"
  | "marks";

interface ReportTab {
  key: ReportType;
  label: string;
  icon: React.ElementType;
}

const getFullUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `http://localhost:5000${path}`;
  return `http://localhost:5000/uploads/${path}`;
};

// ✅ Report type ke hisaab se specific columns
const reportColumns: Record<string, { key: string; label: string }[]> = {
  result_summary: [
    { key: "studentName", label: "Student Name" },
    { key: "admissionNo", label: "Admission No" },
    { key: "totalMarks", label: "Total Marks" },
    { key: "totalMaxMarks", label: "Max Marks" },
    { key: "percentage", label: "Percentage" },
    { key: "grade", label: "Grade" },
    { key: "rank", label: "Rank" },
    { key: "division", label: "Division" },
    { key: "status", label: "Status" },
  ],
  topper_list: [
    { key: "rank", label: "Rank" },
    { key: "studentName", label: "Student Name" },
    { key: "admissionNo", label: "Admission No" },
    { key: "totalMarks", label: "Total Marks" },
    { key: "totalMaxMarks", label: "Max Marks" },
    { key: "percentage", label: "%" },
    { key: "grade", label: "Grade" },
  ],
  subject_wise: [
    { key: "subjectName", label: "Subject" },
    { key: "maxMarks", label: "Max Marks" },
    { key: "totalStudents", label: "Students" },
    { key: "passed", label: "Passed" },
    { key: "failed", label: "Failed" },
    { key: "passPercentage", label: "Pass %" },
    { key: "highest", label: "Highest" },
    { key: "average", label: "Average" },
  ],
  grade_report: [
    { key: "grade", label: "Grade" },
    { key: "count", label: "Count" },
  ],
  attendance: [
    { key: "studentName", label: "Student" },
    { key: "admissionNo", label: "Adm. No" },
    { key: "totalSubjects", label: "Total Subjects" },
    { key: "present", label: "Present" },
    { key: "absent", label: "Absent" },
    { key: "attendancePercentage", label: "Attendance %" },
  ],
  marks: [
    { key: "studentName", label: "Student" },
    { key: "admissionNo", label: "Adm. No" },
    { key: "subjectName", label: "Subject" },
    { key: "marksObtained", label: "Marks" },
    { key: "isAbsent", label: "Absent" },
  ],
  pass_fail: [],
};

const ExamReports: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // URL se tab param read karo — default "result_summary"
  const tabFromUrl = searchParams.get("tab") as ReportType | null;
  const validTabs: ReportType[] = ["result_summary", "subject_wise", "topper_list", "pass_fail", "grade_report", "attendance", "marks"];

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportType>(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "result_summary"
  );
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reportTabs: ReportTab[] = [
    { key: "result_summary", label: "Result Summary", icon: BarChart3 },
    { key: "subject_wise", label: "Subject Wise", icon: BookOpen },
    { key: "topper_list", label: "Topper List", icon: Award },
    { key: "pass_fail", label: "Pass/Fail", icon: CheckCircle },
    { key: "grade_report", label: "Grade Report", icon: FileText },
    { key: "attendance", label: "Attendance", icon: Users },
    { key: "marks", label: "Marks Report", icon: ClipboardList },
  ];

  // Tenant info from localStorage
  const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam && selectedReport) {
      fetchReport();
    }
  }, [selectedExam, selectedReport]);

  const fetchExams = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/exam", { headers });
      const raw = res.data?.data || res.data || [];
      setExams(Array.isArray(raw) ? raw : raw.exams || []);
    } catch (error) {
      toast.error("Failed to load exams");
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      const res = await axios.get("http://localhost:5000/api/exam/reports", {
        headers,
        params: {
          examId: selectedExam,
          reportType: selectedReport,
        },
      });
      const data = res.data?.data || res.data;
      setReportData(data);
    } catch (error) {
      toast.error("Failed to load report");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ✅ Check if data is array or object
  const isArrayData = Array.isArray(reportData);
  const columns = reportColumns[selectedReport] || [];
  const hasData = isArrayData ? reportData.length > 0 : reportData !== null;

  // ✅ Print Header Component (logo + school name + report title)
  const PrintHeader = () => {
    const logoUrl = getFullUrl(tenant?.logoUrl);
    const examName = exams.find((e) => e.id === selectedExam)?.name || "";
    const reportLabel = reportTabs.find((t) => t.key === selectedReport)?.label || "";

    return (
      <div className="hidden print:block px-6 pt-6 mb-4">
        <div className="flex items-start">
          {/* Logo */}
          <div className="w-16 flex-shrink-0">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
            )}
          </div>
          {/* Center — School Name */}
          <div className="flex-1 text-center leading-tight">
            <h1 className="text-xl font-bold uppercase tracking-wide">
              {tenant?.name || "School Name"}
            </h1>
            {tenant?.address && (
              <p className="text-xs text-gray-600">{tenant.address}</p>
            )}
            {tenant?.phone && (
              <p className="text-xs text-gray-600">Phone: {tenant.phone}</p>
            )}
            {tenant?.email && (
              <p className="text-xs text-gray-600">Email: {tenant.email}</p>
            )}
            <p className="text-sm font-semibold mt-2 border-t border-gray-300 pt-1">
              {reportLabel} — {examName}
            </p>
          </div>
          {/* Right — Date & Printed By */}
          <div className="w-32 text-xs text-right flex-shrink-0">
            <p>Date: {new Date().toLocaleDateString("en-IN")}</p>
            <p>Time: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
            {user?.name && <p className="mt-1">By: {user.name}</p>}
          </div>
        </div>
        <hr className="border-t-2 border-black mt-2 mb-1" />
      </div>
    );
  };

  // ✅ Render Pass/Fail as stat cards (object, not array)
  const renderPassFail = () => {
    if (!reportData || selectedReport !== "pass_fail") return null;
    const d = reportData;
    return (
      <div>
        <PrintHeader />
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-5 text-center border border-blue-100">
              <p className="text-3xl font-bold text-blue-700">{d.total || 0}</p>
              <p className="text-sm text-blue-600 mt-1">Total Students</p>
            </div>
            <div className="bg-green-50 rounded-xl p-5 text-center border border-green-100">
              <p className="text-3xl font-bold text-green-700">{d.passed || 0}</p>
              <p className="text-sm text-green-600 mt-1">Passed</p>
            </div>
            <div className="bg-red-50 rounded-xl p-5 text-center border border-red-100">
              <p className="text-3xl font-bold text-red-700">{d.failed || 0}</p>
              <p className="text-sm text-red-600 mt-1">Failed</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-5 text-center border border-purple-100">
              <p className="text-3xl font-bold text-purple-700">{d.passPercentage || 0}%</p>
              <p className="text-sm text-purple-600 mt-1">Pass Percentage</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Render table for array data
  const renderTable = () => {
    if (!isArrayData || reportData.length === 0 || columns.length === 0) return null;
    return (
      <div className="overflow-x-auto" id="report-print-area">
        {/* ✅ Print Header — sirf print mein dikhega */}
        <PrintHeader />

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.map((row: any, rowIndex: number) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {rowIndex + 1}
                </td>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                  >
                    {col.key === "isAbsent"
                      ? row[col.key]
                        ? "Yes"
                        : "No"
                      : col.key === "status"
                      ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              row[col.key]?.toUpperCase() === "PASS"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {row[col.key] || "—"}
                          </span>
                        )
                      : col.key === "percentage" || col.key === "passPercentage" || col.key === "attendancePercentage"
                      ? `${row[col.key] ?? 0}%`
                      : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-200 bg-gray-50 print:hidden">
          <p className="text-sm text-gray-500">
            Total rows: {reportData.length}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:p-0 print:min-h-0 print:bg-white">
      <div className="max-w-7xl mx-auto print:max-w-none">
        {/* Header — hidden on print */}
        <div className="flex items-center mb-6 print:hidden">
          <button
            onClick={() => navigate("/reports")}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Exam Reports</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and print detailed exam reports and analytics
            </p>
          </div>
        </div>

        {/* Exam Selection — hidden on print */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Exam
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="">-- Select Exam --</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} {exam.className ? `(${exam.className})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedExam && (
          <>
            {/* Report Type Tabs — hidden on print */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 print:hidden">
              <div className="flex flex-wrap gap-2">
                {reportTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = selectedReport === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setSelectedReport(tab.key);
                        setSearchParams({ tab: tab.key });
                      }}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-1.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Report Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {reportTabs.find((t) => t.key === selectedReport)?.label || "Report"}
                  </h2>
                </div>
                {hasData && (
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Print
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="ml-3 text-gray-500">Loading report...</span>
                </div>
              ) : !hasData ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <FileText className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No data available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No report data found for the selected exam and report type
                  </p>
                </div>
              ) : selectedReport === "pass_fail" ? (
                renderPassFail()
              ) : (
                renderTable()
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExamReports;