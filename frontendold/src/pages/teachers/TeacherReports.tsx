
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiFileText, FiDownload, FiEye } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL;

const REPORT_TYPES = [
  { id: "teacher-list", name: "Teacher List Report", icon: "📋" },
  { id: "attendance", name: "Attendance Report", icon: "✅" },
  { id: "leave", name: "Leave Report", icon: "🏖️" },
  { id: "salary", name: "Salary Report", icon: "💰" },
  { id: "performance", name: "Performance Report", icon: "⭐" },
  { id: "subject-assignment", name: "Subject Assignment Report", icon: "📚" },
];

const TeacherReports = () => {
  const [selectedReport, setSelectedReport] = useState("teacher-list");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const token = localStorage.getItem("token");

  const generateReport = async () => {
    setLoading(true);
    setGenerated(false);

    try {
      let url = `${API}/teacher-report/${selectedReport}`;
      const params: any = {};

      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data.success) {
        const data = res.data.data;
        setReportData(Array.isArray(data) ? data : data.salaries || data.data || []);
        setGenerated(true);
        toast.success("Report generated successfully");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getColumns = () => {
    switch (selectedReport) {
      case "teacher-list":
        return ["Name", "Email", "Phone", "Subjects", "Classes"];
      case "attendance":
        return ["Teacher", "Total Periods", "Subjects", "Classes"];
      case "leave":
        return ["Teacher", "Leave Type", "From", "To", "Days", "Status"];
      case "salary":
        return ["Teacher", "Basic", "Allowances", "Deductions", "Net Salary", "Status"];
      case "performance":
        return ["Teacher", "Academic Year", "Overall Rating", "Remarks"];
      case "subject-assignment":
        return ["Teacher", "Subject", "Class"];
      default:
        return [];
    }
  };

  const getRowData = (item: any) => {
    switch (selectedReport) {
      case "teacher-list":
        return [item.name, item.email, item.phone, item.subjects, item.classes];
      case "attendance":
        return [item.teacherName, item.totalPeriods, item.subjects, item.classes];
      case "leave":
        return [
          item.teacher?.name,
          item.leaveType,
          new Date(item.fromDate).toLocaleDateString(),
          new Date(item.toDate).toLocaleDateString(),
          item.days,
          item.status,
        ];
      case "salary":
        return [
          item.teacher?.name,
          `₹${item.basicSalary?.toLocaleString()}`,
          `₹${item.totalAllowances?.toLocaleString()}`,
          `₹${item.totalDeductions?.toLocaleString()}`,
          `₹${item.netSalary?.toLocaleString()}`,
          item.status,
        ];
      case "performance":
        return [
          item.teacher?.name,
          item.academicYear?.name,
          `${item.overallRating}/5`,
          item.remarks || "N/A",
        ];
      case "subject-assignment":
        return [item.teacherName, item.subjectName, item.className];
      default:
        return [];
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

      {/* Report Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Report Type
            </label>
            <select
              value={selectedReport}
              onChange={(e) => {
                setSelectedReport(e.target.value);
                setGenerated(false);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {REPORT_TYPES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.icon} {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <FiFileText size={16} /> {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Report Types Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {REPORT_TYPES.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setSelectedReport(r.id);
              setGenerated(false);
            }}
            className={`bg-white rounded-lg shadow p-4 text-center hover:shadow-md transition ${
              selectedReport === r.id ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <span className="text-2xl">{r.icon}</span>
            <p className="text-xs text-gray-600 mt-2">{r.name}</p>
            <a
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReport(r.id);
                generateReport();
              }}
              className="text-xs text-blue-600 hover:underline mt-1 block cursor-pointer"
            >
              View Report
            </a>
          </button>
        ))}
      </div>

      {/* Report Results */}
      {generated && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {REPORT_TYPES.find((r) => r.id === selectedReport)?.name}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <FiDownload size={16} /> Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                  {getColumns().map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                    {getRowData(item).map((cell, i) => (
                      <td key={i} className="px-4 py-3 text-sm text-gray-600">
                        {cell || "N/A"}
                      </td>
                    ))}
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td
                      colSpan={getColumns().length + 1}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No data found for this report
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t text-sm text-gray-500">
            Total Records: {reportData.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherReports;

