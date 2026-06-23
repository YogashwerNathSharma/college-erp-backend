

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import axios from "axios";
import { toast } from "react-hot-toast";
import PrintSignature from "../../components/PrintSignature";
import { useSearchParams } from "react-router-dom";

const API = `${API_BASE_URL}/api`;

interface ClassOption {
  id: string;
  name: string;
}

interface SectionOption {
  id: string;
  name: string;
}

type ReportType = "monthly" | "datewise" | "yearly" | "classwise" | "school";

const AttendanceReportPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL se tab param read karo — default "monthly"
  const tabFromUrl = searchParams.get("tab") as ReportType | null;
  const validTabs: ReportType[] = ["monthly", "datewise", "yearly", "classwise", "school"];
  const hideTabsBar = tabFromUrl && validTabs.includes(tabFromUrl);

  const [reportType, setReportType] = useState<ReportType>(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "monthly"
  );
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
      setSelectedSection("");
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/class`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(res.data.data || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/section?classId=${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSections(res.data.data || []);
    } catch (err) {
      console.error("Error fetching sections:", err);
    }
  };

  const generateReport = async () => {
    if (reportType !== "school" && (!selectedClass || !selectedSection)) {
      toast.error("Please select class and section");
      return;
    }

    setLoading(true);
    setReportData(null);

    try {
      const token = localStorage.getItem("token");
      let res;

      switch (reportType) {
        case "monthly":
          res = await axios.get(`${API}/attendance/report/monthly`, {
            params: {
              classId: selectedClass,
              sectionId: selectedSection,
              month: selectedMonth,
              year: selectedYear,
            },
            headers: { Authorization: `Bearer ${token}` },
          });
          break;

        case "datewise":
          res = await axios.get(`${API}/attendance/report/datewise`, {
            params: {
              classId: selectedClass,
              sectionId: selectedSection,
              date: selectedDate,
            },
            headers: { Authorization: `Bearer ${token}` },
          });
          break;

        case "yearly":
          res = await axios.get(`${API}/attendance/report/yearly`, {
            params: {
              classId: selectedClass,
              sectionId: selectedSection,
              year: selectedYear,
            },
            headers: { Authorization: `Bearer ${token}` },
          });
          break;

        case "classwise":
          res = await axios.get(`${API}/attendance/report/classwise`, {
            params: {
              classId: selectedClass,
              sectionId: selectedSection,
            },
            headers: { Authorization: `Bearer ${token}` },
          });
          break;

        case "school":
          res = await axios.get(`${API}/attendance/report/school`, {
            params: { month: selectedMonth, year: selectedYear },
            headers: { Authorization: `Bearer ${token}` },
          });
          break;
      }

      setReportData(res?.data || null);
    } catch (err) {
      console.error("Error generating report:", err);
      toast.error("Error generating report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getClassName = () => {
    return classes.find((c) => c.id === selectedClass)?.name || "";
  };

  const getSectionName = () => {
    return sections.find((s) => s.id === selectedSection)?.name || "";
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header — hide on print */}
      <div className="mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-gray-800">📊 Attendance Reports</h1>
        <p className="text-gray-500 mt-1">Generate & print class-wise attendance reports</p>
      </div>

      {/* Filters — hide on print */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 print:hidden">
        {/* Report Type Tabs */}
        {!hideTabsBar && <div className="flex flex-wrap gap-2 mb-4 border-b pb-3">
          {[
            { value: "monthly", label: "Monthly" },
            { value: "datewise", label: "Date-wise" },
            { value: "yearly", label: "Yearly" },
            { value: "classwise", label: "Class Summary" },
            { value: "school", label: "Full School" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setReportType(tab.value as ReportType);
                setReportData(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                reportType === tab.value
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>}

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Class */}
          {reportType !== "school" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Section */}
          {reportType !== "school" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!selectedClass}
              >
                <option value="">Select Section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Month (for monthly, school) */}
          {(reportType === "monthly" || reportType === "school") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {monthNames.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Year */}
          {(reportType === "monthly" || reportType === "yearly" || reportType === "school") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date (for datewise) */}
          {reportType === "datewise" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Generate Button */}
          <div>
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Print Button */}
      {reportData && (
        <div className="flex justify-end mb-4 print:hidden">
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            🖨️ Print Report
          </button>
        </div>
      )}

      {/* ==================== REPORT OUTPUT ==================== */}

      {/* Print Header — only visible on print */}
      {reportData && (
        <div className="hidden print:block mb-4">
          <div className="flex items-start justify-between">
            <img
              src={(() => {
                const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");
                const logo = tenant?.logoUrl;
                if (!logo) return "";
                return logo.startsWith("http") ? logo : `${logo}`;
              })()}
              alt="logo"
              className="w-12 h-12 object-contain"
            />
            <div className="text-center flex-1 leading-tight">
              <h1 className="text-lg font-bold uppercase leading-tight">
                {JSON.parse(localStorage.getItem("tenant") || "{}").name || "SCHOOL NAME"}
              </h1>
              <p className="text-xs text-gray-600 leading-tight">
                {JSON.parse(localStorage.getItem("tenant") || "{}").address || ""}
              </p>
              <p className="text-xs text-gray-600 leading-tight">
                Ph: {JSON.parse(localStorage.getItem("tenant") || "{}").phone || ""} | Email: {JSON.parse(localStorage.getItem("tenant") || "{}").email || ""}
              </p>
              <p className="font-bold text-sm mt-1 underline leading-tight">
                {reportType === "monthly" && "Monthly Attendance Report"}
                {reportType === "datewise" && "Date-wise Attendance Report"}
                {reportType === "yearly" && "Yearly Attendance Report"}
                {reportType === "classwise" && "Class-wise Attendance Summary"}
                {reportType === "school" && "Full School Attendance Report"}
              </p>
              <p className="text-xs text-gray-600 leading-tight">
                {reportType !== "school" && `Class: ${getClassName()} ${getSectionName()} | `}
                {reportType === "monthly" && `Month: ${monthNames[selectedMonth - 1]} ${selectedYear}`}
                {reportType === "datewise" && `Date: ${new Date(selectedDate).toLocaleDateString("en-IN")}`}
                {reportType === "yearly" && `Year: ${selectedYear}`}
                {reportType === "classwise" && "Overall Summary"}
                {reportType === "school" && `Month: ${monthNames[selectedMonth - 1]} ${selectedYear}`}
              </p>
            </div>
            <div className="text-right text-[10px] text-gray-500">
              <p><strong>Print By:</strong> {JSON.parse(localStorage.getItem("user") || "{}").name || "Admin"}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString("en-IN")}</p>
              <p><strong>Time:</strong> {new Date().toLocaleTimeString("en-IN")}</p>
            </div>
          </div>
          <hr className="border-t-2 border-black mt-1 mb-2" />
        </div>
      )}

      {/* MONTHLY REPORT — Day-wise Grid */}
      {reportType === "monthly" && reportData && (
        <div className="bg-white rounded-lg shadow-sm border p-6 print:shadow-none print:border-none print:p-0">
          <div className="text-center mb-1 print:hidden">
            <h2 className="text-lg font-bold">Monthly Attendance Report</h2>
            <p className="text-sm text-gray-600">
              Class: {getClassName()} {getSectionName()} | Month: {monthNames[selectedMonth - 1]} {selectedYear}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-2 py-1.5 text-left">#</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left">Roll No</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left min-w-[120px]">Student Name</th>
                  {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => (
                    <th key={i} className="border border-gray-400 px-1 py-1.5 text-center w-6">
                      {i + 1}
                    </th>
                  ))}
                  <th className="border border-gray-400 px-2 py-1.5 text-center bg-green-50">P</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-center bg-red-50">A</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-center bg-primary-50">%</th>
                </tr>
              </thead>
              <tbody>
                {reportData.students?.map((student: any, index: number) => (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-2 py-1 text-center">{index + 1}</td>
                    <td className="border border-gray-400 px-2 py-1">{student.rollNumber || "—"}</td>
                    <td className="border border-gray-400 px-2 py-1 font-medium">{student.name}</td>
                    {student.days?.map((day: any, i: number) => (
                      <td
                        key={i}
                        className={`border border-gray-400 px-1 py-1 text-center font-bold ${
                          day === "P"
                            ? "text-green-600"
                            : day === "A"
                            ? "text-red-600"
                            : "text-gray-300"
                        }`}
                      >
                        {day || "—"}
                      </td>
                    ))}
                    <td className="border border-gray-400 px-2 py-1 text-center font-bold text-green-600 bg-green-50">
                      {student.presentDays}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-center font-bold text-red-600 bg-red-50">
                      {student.absentDays}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-center font-bold text-primary-600 bg-primary-50">
                      {student.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={3} className="border border-gray-400 px-2 py-1.5 text-right">
                    Total Present per Day:
                  </td>
                  {reportData.dailyTotals?.map((total: any, i: number) => (
                    <td key={i} className="border border-gray-400 px-1 py-1.5 text-center text-xs">
                      {total}
                    </td>
                  ))}
                  <td colSpan={3} className="border border-gray-400 px-2 py-1.5 text-center">
                    Avg: {reportData.classAverage}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* DATE-WISE REPORT */}
      {reportType === "datewise" && reportData && (
        <div className="bg-white rounded-lg shadow-sm border p-6 print:shadow-none print:border-none print:p-0">
          <div className="text-center mb-4 print:hidden">
            <h2 className="text-lg font-bold">Date-wise Attendance Report</h2>
            <p className="text-sm text-gray-600">
              Class: {getClassName()} {getSectionName()} | Date: {new Date(selectedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-4 print:hidden">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold">{reportData.total}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-500">Present</p>
              <p className="text-xl font-bold text-green-600">{reportData.present}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-500">Absent</p>
              <p className="text-xl font-bold text-red-600">{reportData.absent}</p>
            </div>
            <div className="text-center p-3 bg-primary-50 rounded-lg">
              <p className="text-xs text-gray-500">Percentage</p>
              <p className="text-xl font-bold text-primary-600">{reportData.percentage}%</p>
            </div>
          </div>

          <div className="hidden print:flex print:justify-between print:text-xs print:mb-2">
            <span>Total: {reportData.total}</span>
            <span>Present: {reportData.present}</span>
            <span>Absent: {reportData.absent}</span>
            <span>Percentage: {reportData.percentage}%</span>
          </div>

          <table className="w-full text-sm border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-3 py-2 text-left">#</th>
                <th className="border border-gray-400 px-3 py-2 text-left">Roll No</th>
                <th className="border border-gray-400 px-3 py-2 text-left">Student Name</th>
                <th className="border border-gray-400 px-3 py-2 text-left">Adm. No</th>
                <th className="border border-gray-400 px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.students?.map((student: any, index: number) => (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="border border-gray-400 px-3 py-2">{index + 1}</td>
                  <td className="border border-gray-400 px-3 py-2">{student.rollNumber || "—"}</td>
                  <td className="border border-gray-400 px-3 py-2 font-medium">{student.name}</td>
                  <td className="border border-gray-400 px-3 py-2">{student.admissionNo || "—"}</td>
                  <td className={`border border-gray-400 px-3 py-2 text-center font-bold ${
                    student.status === "PRESENT" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                  }`}>
                    {student.status === "PRESENT" ? "P" : "A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* YEARLY REPORT */}
      {reportType === "yearly" && reportData && (
        <div className="bg-white rounded-lg shadow-sm border p-6 print:shadow-none print:border-none print:p-0">
          <div className="text-center mb-4 print:hidden">
            <h2 className="text-lg font-bold">Yearly Attendance Report</h2>
            <p className="text-sm text-gray-600">
              Class: {getClassName()} {getSectionName()} | Year: {selectedYear}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-3 py-2 text-left">#</th>
                  <th className="border border-gray-400 px-3 py-2 text-left">Roll No</th>
                  <th className="border border-gray-400 px-3 py-2 text-left">Student Name</th>
                  {monthNames.map((m, i) => (
                    <th key={i} className="border border-gray-400 px-2 py-2 text-center text-xs">
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="border border-gray-400 px-2 py-2 text-center bg-green-50">Total P</th>
                  <th className="border border-gray-400 px-2 py-2 text-center bg-red-50">Total A</th>
                  <th className="border border-gray-400 px-2 py-2 text-center bg-primary-50">%</th>
                </tr>
              </thead>
              <tbody>
                {reportData.students?.map((student: any, index: number) => (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-3 py-1.5">{index + 1}</td>
                    <td className="border border-gray-400 px-3 py-1.5">{student.rollNumber || "—"}</td>
                    <td className="border border-gray-400 px-3 py-1.5 font-medium">{student.name}</td>
                    {student.months?.map((m: any, i: number) => (
                      <td key={i} className="border border-gray-400 px-2 py-1.5 text-center text-xs">
                        {m.total > 0 ? `${m.present}/${m.total}` : "—"}
                      </td>
                    ))}
                    <td className="border border-gray-400 px-2 py-1.5 text-center font-bold text-green-600 bg-green-50">
                      {student.totalPresent}
                    </td>
                    <td className="border border-gray-400 px-2 py-1.5 text-center font-bold text-red-600 bg-red-50">
                      {student.totalAbsent}
                    </td>
                    <td className="border border-gray-400 px-2 py-1.5 text-center font-bold text-primary-600 bg-primary-50">
                      {student.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLASS-WISE SUMMARY */}
      {reportType === "classwise" && reportData && (
        <div className="bg-white rounded-lg shadow-sm border p-6 print:shadow-none print:border-none print:p-0">
          <div className="text-center mb-4 print:hidden">
            <h2 className="text-lg font-bold">Class-wise Attendance Summary</h2>
            <p className="text-sm text-gray-600">
              Class: {getClassName()} {getSectionName()} | Overall Summary
            </p>
          </div>

          <table className="w-full text-sm border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-3 py-2 text-left">#</th>
                <th className="border border-gray-400 px-3 py-2 text-left">Roll No</th>
                <th className="border border-gray-400 px-3 py-2 text-left">Student Name</th>
                <th className="border border-gray-400 px-3 py-2 text-left">Father Name</th>
                <th className="border border-gray-400 px-3 py-2 text-center">Total Days</th>
                <th className="border border-gray-400 px-3 py-2 text-center">Present</th>
                <th className="border border-gray-400 px-3 py-2 text-center">Absent</th>
                <th className="border border-gray-400 px-3 py-2 text-center">Percentage</th>
                <th className="border border-gray-400 px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.students?.map((student: any, index: number) => (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="border border-gray-400 px-3 py-2">{index + 1}</td>
                  <td className="border border-gray-400 px-3 py-2">{student.rollNumber || "—"}</td>
                  <td className="border border-gray-400 px-3 py-2 font-medium">{student.name}</td>
                  <td className="border border-gray-400 px-3 py-2">{student.fatherName || "—"}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center">{student.totalDays}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center text-green-600 font-bold">
                    {student.presentDays}
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center text-red-600 font-bold">
                    {student.absentDays}
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center font-bold">
                    {student.percentage}%
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      parseFloat(student.percentage) >= 75
                        ? "bg-green-100 text-green-700"
                        : parseFloat(student.percentage) >= 50
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {parseFloat(student.percentage) >= 75 ? "Good" : parseFloat(student.percentage) >= 50 ? "Average" : "Poor"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FULL SCHOOL REPORT */}
      {reportType === "school" && reportData && (
        <div className="bg-white rounded-lg shadow-sm border p-6 print:shadow-none print:border-none print:p-0">
          <div className="text-center mb-4 print:hidden">
            <h2 className="text-lg font-bold">Full School Attendance Report</h2>
            <p className="text-sm text-gray-600">
              Month: {monthNames[selectedMonth - 1]} {selectedYear}
            </p>
          </div>

          {/* School Summary — hide on print */}
          <div className="grid grid-cols-4 gap-4 mb-6 print:hidden">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Total Students</p>
              <p className="text-xl font-bold">{reportData.totalStudents}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-500">Avg. Present</p>
              <p className="text-xl font-bold text-green-600">{reportData.avgPresent}%</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-500">Avg. Absent</p>
              <p className="text-xl font-bold text-red-600">{reportData.avgAbsent}%</p>
            </div>
            <div className="text-center p-3 bg-primary-50 rounded-lg">
              <p className="text-xs text-gray-500">Working Days</p>
              <p className="text-xl font-bold text-primary-600">{reportData.workingDays}</p>
            </div>
          </div>

          <div className="hidden print:flex print:justify-between print:text-xs print:mb-2">
            <span>Total Students: {reportData.totalStudents}</span>
            <span>Avg Present: {reportData.avgPresent}%</span>
            <span>Avg Absent: {reportData.avgAbsent}%</span>
            <span>Working Days: {reportData.workingDays}</span>
          </div>

          <table className="w-full text-sm border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-3 py-2 text-left">#</th>
                <th className="border border-gray-400 px-3 py-2 text-left">Class</th>
                <th className="border border-gray-400 px-3 py-2 text-left">Section</th>
                <th className="border border-gray-400 px-3 py-2 text-center">Total Students</th>
                <th className="border border-gray-400 px-3 py-2 text-center">Avg Present</th>
                <th className="border border-gray-400 px-3 py-2 text-center">Avg Absent</th>
                <th className="border border-gray-400 px-3 py-2 text-center">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {reportData.classes?.map((cls: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-400 px-3 py-2">{index + 1}</td>
                  <td className="border border-gray-400 px-3 py-2 font-medium">{cls.className}</td>
                  <td className="border border-gray-400 px-3 py-2">{cls.sectionName}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center">{cls.totalStudents}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center text-green-600 font-bold">
                    {cls.avgPresent}
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center text-red-600 font-bold">
                    {cls.avgAbsent}
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      parseFloat(cls.percentage) >= 75
                        ? "bg-green-100 text-green-700"
                        : parseFloat(cls.percentage) >= 50
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {cls.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Principal Signature — visible only on print */}
      {reportData && <PrintSignature />}

      {/* Empty State */}
      {!reportData && !loading && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center print:hidden">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500">Select filters and click "Generate Report" to view attendance data</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceReportPage;

