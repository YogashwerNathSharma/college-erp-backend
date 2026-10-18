import { useState, useEffect } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  FileText, BarChart3, PieChart, Download, Plus, Clock,
  Calendar, Filter, Settings, Play, Trash2, Edit, Eye,
  Table, TrendingUp, RefreshCw, Send, ChevronDown,
  Search, FileSpreadsheet, File, Layers, X
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area, Legend
} from "recharts";

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────

interface ReportTemplate {
  id: string;
  name: string;
  module: string;
  description?: string;
  query: any;
  columns: ColumnDef[];
  filters?: FilterDef[];
  chartType?: string;
  chartConfig?: any;
  groupBy?: string;
  sortBy?: string;
  format: string;
  isPublic: boolean;
  createdAt: string;
  _count?: { generatedReports: number; scheduledReports: number };
}

interface ColumnDef {
  field: string;
  label: string;
  width?: number;
  format?: string;
  aggregate?: string;
}

interface FilterDef {
  field: string;
  label: string;
  type: string;
  options?: { label: string; value: string }[];
}

interface GeneratedReport {
  id: string;
  name: string;
  format: string;
  status: string;
  rowCount?: number;
  createdAt: string;
  template?: { name: string; module: string };
}

interface ScheduledReport {
  id: string;
  name: string;
  frequency: string;
  time: string;
  recipients: string[];
  isActive: boolean;
  nextRunAt?: string;
  template?: { name: string; module: string };
}

// ─────────────────────────────────────────────────────
// MODULE OPTIONS
// ─────────────────────────────────────────────────────

const MODULES = [
  { value: "STUDENT", label: "Students", icon: "👨‍🎓" },
  { value: "FEES", label: "Fees & Payments", icon: "💰" },
  { value: "ATTENDANCE", label: "Attendance", icon: "📋" },
  { value: "EXAM", label: "Examinations", icon: "📝" },
  { value: "TEACHER", label: "Teachers", icon: "👩‍🏫" },
  { value: "HR", label: "HR & Staff", icon: "👥" },
  { value: "TRANSPORT", label: "Transport", icon: "🚌" },
  { value: "LIBRARY", label: "Library", icon: "📚" },
  { value: "HOSTEL", label: "Hostel", icon: "🏠" },
  { value: "INVENTORY", label: "Inventory", icon: "📦" },
];

const FIELD_OPTIONS: Record<string, { field: string; label: string; type: string }[]> = {
  STUDENT: [
    { field: "name", label: "Student Name", type: "string" },
    { field: "admissionNo", label: "Admission No", type: "string" },
    { field: "class", label: "Class", type: "string" },
    { field: "section", label: "Section", type: "string" },
    { field: "gender", label: "Gender", type: "string" },
    { field: "dob", label: "Date of Birth", type: "date" },
    { field: "phone", label: "Phone", type: "string" },
    { field: "email", label: "Email", type: "string" },
    { field: "fatherName", label: "Father Name", type: "string" },
    { field: "motherName", label: "Mother Name", type: "string" },
    { field: "address", label: "Address", type: "string" },
    { field: "status", label: "Status", type: "string" },
    { field: "createdAt", label: "Admission Date", type: "date" },
  ],
  FEES: [
    { field: "studentName", label: "Student Name", type: "string" },
    { field: "class", label: "Class", type: "string" },
    { field: "feeHead", label: "Fee Head", type: "string" },
    { field: "totalAmount", label: "Total Amount", type: "number" },
    { field: "paidAmount", label: "Paid Amount", type: "number" },
    { field: "pendingAmount", label: "Pending Amount", type: "number" },
    { field: "status", label: "Status", type: "string" },
    { field: "paymentDate", label: "Payment Date", type: "date" },
    { field: "paymentMode", label: "Payment Mode", type: "string" },
    { field: "receiptNo", label: "Receipt No", type: "string" },
  ],
  ATTENDANCE: [
    { field: "studentName", label: "Student Name", type: "string" },
    { field: "class", label: "Class", type: "string" },
    { field: "date", label: "Date", type: "date" },
    { field: "status", label: "Status", type: "string" },
    { field: "totalPresent", label: "Total Present", type: "number" },
    { field: "totalAbsent", label: "Total Absent", type: "number" },
    { field: "percentage", label: "Percentage", type: "number" },
  ],
  EXAM: [
    { field: "studentName", label: "Student Name", type: "string" },
    { field: "examName", label: "Exam Name", type: "string" },
    { field: "subject", label: "Subject", type: "string" },
    { field: "maxMarks", label: "Max Marks", type: "number" },
    { field: "obtainedMarks", label: "Obtained Marks", type: "number" },
    { field: "grade", label: "Grade", type: "string" },
    { field: "percentage", label: "Percentage", type: "number" },
    { field: "rank", label: "Rank", type: "number" },
    { field: "result", label: "Result", type: "string" },
  ],
  TEACHER: [
    { field: "name", label: "Teacher Name", type: "string" },
    { field: "employeeId", label: "Employee ID", type: "string" },
    { field: "department", label: "Department", type: "string" },
    { field: "designation", label: "Designation", type: "string" },
    { field: "qualification", label: "Qualification", type: "string" },
    { field: "experience", label: "Experience (Years)", type: "number" },
    { field: "phone", label: "Phone", type: "string" },
    { field: "email", label: "Email", type: "string" },
    { field: "joinDate", label: "Join Date", type: "date" },
    { field: "salary", label: "Salary", type: "number" },
  ],
  HR: [
    { field: "name", label: "Staff Name", type: "string" },
    { field: "department", label: "Department", type: "string" },
    { field: "designation", label: "Designation", type: "string" },
    { field: "leaveType", label: "Leave Type", type: "string" },
    { field: "leaveDays", label: "Leave Days", type: "number" },
    { field: "basicSalary", label: "Basic Salary", type: "number" },
    { field: "netSalary", label: "Net Salary", type: "number" },
    { field: "attendancePercentage", label: "Attendance %", type: "number" },
  ],
  TRANSPORT: [
    { field: "vehicleNo", label: "Vehicle No", type: "string" },
    { field: "routeName", label: "Route", type: "string" },
    { field: "driver", label: "Driver", type: "string" },
    { field: "capacity", label: "Capacity", type: "number" },
    { field: "assigned", label: "Assigned Students", type: "number" },
    { field: "feeAmount", label: "Fee Amount", type: "number" },
  ],
  LIBRARY: [
    { field: "title", label: "Book Title", type: "string" },
    { field: "author", label: "Author", type: "string" },
    { field: "isbn", label: "ISBN", type: "string" },
    { field: "category", label: "Category", type: "string" },
    { field: "issuedTo", label: "Issued To", type: "string" },
    { field: "issueDate", label: "Issue Date", type: "date" },
    { field: "dueDate", label: "Due Date", type: "date" },
    { field: "fine", label: "Fine", type: "number" },
  ],
  HOSTEL: [
    { field: "studentName", label: "Student Name", type: "string" },
    { field: "roomNo", label: "Room No", type: "string" },
    { field: "block", label: "Block", type: "string" },
    { field: "floor", label: "Floor", type: "string" },
    { field: "fee", label: "Hostel Fee", type: "number" },
    { field: "status", label: "Status", type: "string" },
  ],
  INVENTORY: [
    { field: "itemName", label: "Item Name", type: "string" },
    { field: "category", label: "Category", type: "string" },
    { field: "quantity", label: "Quantity", type: "number" },
    { field: "unitPrice", label: "Unit Price", type: "number" },
    { field: "totalValue", label: "Total Value", type: "number" },
    { field: "issuedTo", label: "Issued To", type: "string" },
    { field: "condition", label: "Condition", type: "string" },
  ],
};

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────

export default function ReportBuilder() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "builder" | "generated" | "scheduled">("dashboard");
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Builder state
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderModule, setBuilderModule] = useState("");
  const [builderName, setBuilderName] = useState("");
  const [builderDescription, setBuilderDescription] = useState("");
  const [builderColumns, setBuilderColumns] = useState<ColumnDef[]>([]);
  const [builderChartType, setBuilderChartType] = useState("");
  const [builderFormat, setBuilderFormat] = useState("PDF");
  const [builderSortBy, setBuilderSortBy] = useState("");
  const [builderGroupBy, setBuilderGroupBy] = useState("");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Filters for generation
  const [genTemplateId, setGenTemplateId] = useState("");
  const [genDateFrom, setGenDateFrom] = useState("");
  const [genDateTo, setGenDateTo] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, templatesRes, generatedRes, schedulesRes] = await Promise.all([
        axios.get(getFullUrl("/api/report-builder/dashboard")),
        axios.get(getFullUrl("/api/report-builder/templates")),
        axios.get(getFullUrl("/api/report-builder/generated?limit=20")),
        axios.get(getFullUrl("/api/report-builder/schedules")),
      ]);
      setDashboardStats(statsRes.data.data);
      setTemplates(templatesRes.data.data);
      setGeneratedReports(generatedRes.data.data);
      setSchedules(schedulesRes.data.data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!builderName || !builderModule || builderColumns.length === 0) {
      alert("Please provide name, module, and at least one column");
      return;
    }
    setSaving(true);
    try {
      await axios.post(getFullUrl("/api/report-builder/templates"), {
        name: builderName,
        module: builderModule,
        description: builderDescription,
        query: { collection: builderModule.toLowerCase(), fields: builderColumns.map(c => c.field), conditions: [] },
        columns: builderColumns,
        chartType: builderChartType || undefined,
        groupBy: builderGroupBy || undefined,
        sortBy: builderSortBy || undefined,
        format: builderFormat,
      });
      setShowBuilder(false);
      resetBuilder();
      fetchAll();
    } catch (err) {
      console.error("Save template error:", err);
      alert("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (templateId: string) => {
    setGenerating(true);
    try {
      const res = await axios.post(getFullUrl("/api/report-builder/generate"), {
        templateId,
        parameters: {
          dateFrom: genDateFrom || undefined,
          dateTo: genDateTo || undefined,
        },
      });
      alert(`Report generated: ${res.data.data.totalRows} rows`);
      fetchAll();
    } catch (err) {
      console.error("Generate error:", err);
      alert("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await axios.delete(getFullUrl(`/api/report-builder/templates/${id}`));
      fetchAll();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const resetBuilder = () => {
    setBuilderModule("");
    setBuilderName("");
    setBuilderDescription("");
    setBuilderColumns([]);
    setBuilderChartType("");
    setBuilderFormat("PDF");
    setBuilderSortBy("");
    setBuilderGroupBy("");
    setPreviewData([]);
  };

  const addColumn = (field: string, label: string) => {
    if (builderColumns.find(c => c.field === field)) return;
    setBuilderColumns([...builderColumns, { field, label }]);
  };

  const removeColumn = (field: string) => {
    setBuilderColumns(builderColumns.filter(c => c.field !== field));
  };

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Report Builder</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create, generate, and schedule custom reports</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          New Template
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
        {[
          { key: "dashboard", label: "Dashboard", icon: BarChart3 },
          { key: "builder", label: "Templates", icon: Layers },
          { key: "generated", label: "Generated", icon: FileText },
          { key: "scheduled", label: "Scheduled", icon: Clock },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && dashboardStats && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Templates"
              value={dashboardStats.totalTemplates}
              icon={<Layers size={22} />}
              color="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
            />
            <StatCard
              title="Reports Generated"
              value={dashboardStats.totalGenerated}
              icon={<FileText size={22} />}
              color="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
            />
            <StatCard
              title="Generated Today"
              value={dashboardStats.generatedToday}
              icon={<TrendingUp size={22} />}
              color="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
            />
            <StatCard
              title="Active Schedules"
              value={dashboardStats.activeSchedules}
              icon={<Clock size={22} />}
              color="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Module Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Templates by Module</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dashboardStats.moduleDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="module" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Reports */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Reports</h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {(dashboardStats.recentReports || []).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        r.status === "COMPLETED" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                      }`}>
                        <FileText size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.name}</p>
                        <p className="text-xs text-gray-500">{r.template?.module} • {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
                {(!dashboardStats.recentReports || dashboardStats.recentReports.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-8">No reports generated yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "builder" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div key={template.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{template.name}</h3>
                      <p className="text-xs text-gray-500">{template.module}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                    {template.format}
                  </span>
                </div>
                {template.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{template.description}</p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
                  <span className="text-xs text-gray-400">
                    {template._count?.generatedReports || 0} generated
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleGenerate(template.id)}
                      disabled={generating}
                      className="p-1.5 rounded-md hover:bg-green-50 text-green-600 transition-colors"
                      title="Generate"
                    >
                      <Play size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {templates.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              <FileText className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
              <p className="text-gray-500 dark:text-gray-400">No report templates yet</p>
              <button
                onClick={() => setShowBuilder(true)}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Create your first template →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Generated Tab */}
      {activeTab === "generated" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Generated Reports</h3>
            <button onClick={fetchAll} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50">
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Report</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Module</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Format</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Rows</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {generatedReports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{report.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded">
                        {report.template?.module || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        {report.format === "PDF" && <File size={12} />}
                        {report.format === "EXCEL" && <FileSpreadsheet size={12} />}
                        {report.format === "CSV" && <Table size={12} />}
                        {report.format}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {report.rowCount || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        report.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                        report.status === "GENERATING" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      {report.status === "COMPLETED" && (
                        <button className="p-1.5 rounded-md hover:bg-indigo-50 text-indigo-600 transition-colors">
                          <Download size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {generatedReports.length === 0 && (
              <div className="text-center py-12 text-gray-400">No reports generated yet</div>
            )}
          </div>
        </div>
      )}

      {/* Scheduled Tab */}
      {activeTab === "scheduled" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map(schedule => (
              <div key={schedule.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      schedule.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{schedule.name}</h3>
                      <p className="text-xs text-gray-500">{schedule.template?.module}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    schedule.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {schedule.isActive ? "Active" : "Paused"}
                  </span>
                </div>
                <div className="space-y-2 text-xs text-gray-500">
                  <p className="flex items-center gap-2">
                    <RefreshCw size={12} /> {schedule.frequency} at {schedule.time}
                  </p>
                  <p className="flex items-center gap-2">
                    <Send size={12} /> {schedule.recipients.length} recipient(s)
                  </p>
                  {schedule.nextRunAt && (
                    <p className="flex items-center gap-2">
                      <Calendar size={12} /> Next: {new Date(schedule.nextRunAt).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {schedules.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              <Clock className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
              <p className="text-gray-500 dark:text-gray-400">No scheduled reports</p>
            </div>
          )}
        </div>
      )}

      {/* Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Create Report Template</h2>
              <button onClick={() => { setShowBuilder(false); resetBuilder(); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Configuration */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Name *</label>
                    <input
                      type="text"
                      value={builderName}
                      onChange={e => setBuilderName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g. Student List Report"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Module *</label>
                    <select
                      value={builderModule}
                      onChange={e => { setBuilderModule(e.target.value); setBuilderColumns([]); }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                    >
                      <option value="">Select module</option>
                      {MODULES.map(m => (
                        <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={builderDescription}
                      onChange={e => setBuilderDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                      placeholder="Describe what this report shows..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
                      <select
                        value={builderFormat}
                        onChange={e => setBuilderFormat(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                      >
                        <option value="PDF">PDF</option>
                        <option value="EXCEL">Excel</option>
                        <option value="CSV">CSV</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chart Type</label>
                      <select
                        value={builderChartType}
                        onChange={e => setBuilderChartType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                      >
                        <option value="">No Chart</option>
                        <option value="BAR">Bar Chart</option>
                        <option value="LINE">Line Chart</option>
                        <option value="PIE">Pie Chart</option>
                        <option value="AREA">Area Chart</option>
                      </select>
                    </div>
                  </div>

                  {/* Available Fields */}
                  {builderModule && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available Fields (click to add)</label>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                        {(FIELD_OPTIONS[builderModule] || []).map(field => {
                          const isSelected = builderColumns.some(c => c.field === field.field);
                          return (
                            <button
                              key={field.field}
                              onClick={() => isSelected ? removeColumn(field.field) : addColumn(field.field, field.label)}
                              className={`text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                                isSelected
                                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 ring-1 ring-indigo-300"
                                  : "bg-white dark:bg-slate-600 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                              }`}
                            >
                              {field.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Center + Right: Preview */}
                <div className="lg:col-span-2">
                  <div className="bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-gray-200 dark:border-slate-600 p-4 h-full">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Eye size={14} /> Preview
                    </h3>
                    {builderColumns.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-white dark:bg-slate-800">
                              {builderColumns.map(col => (
                                <th key={col.field} className="text-left text-xs font-medium text-gray-600 dark:text-gray-400 px-3 py-2.5 border border-gray-200 dark:border-slate-600">
                                  <div className="flex items-center justify-between">
                                    {col.label}
                                    <button
                                      onClick={() => removeColumn(col.field)}
                                      className="text-red-400 hover:text-red-600 ml-1"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3, 4, 5].map(i => (
                              <tr key={i} className="bg-white/50 dark:bg-slate-800/50">
                                {builderColumns.map(col => (
                                  <td key={col.field} className="text-xs text-gray-400 px-3 py-2 border border-gray-200 dark:border-slate-600 italic">
                                    sample data
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Table size={32} className="mb-2" />
                        <p className="text-sm">Select a module and add fields to preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => { setShowBuilder(false); resetBuilder(); }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving || !builderName || !builderModule || builderColumns.length === 0}
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <><RefreshCw size={14} className="animate-spin" /> Saving...</>
                ) : (
                  <><Plus size={14} /> Save Template</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}
