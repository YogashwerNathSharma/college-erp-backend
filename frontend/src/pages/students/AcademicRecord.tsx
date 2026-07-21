import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  CalendarDays,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PageHeader,
  LoadingSkeleton,
  EmptyState,
  StatusBadge,
  ChartCard,
  StatsCard,
} from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type ExamResult = {
  _id: string;
  examName: string;
  subject: string;
  maxMarks: number;
  marksObtained: number;
  grade: string;
  rank?: number;
  date: string;
};

type AttendanceMonth = {
  month: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
};

type FeeRecord = {
  _id: string;
  feeType: string;
  amount: number;
  paid: number;
  pending: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "partial";
};

type AcademicData = {
  exams: ExamResult[];
  attendance: {
    monthly: AttendanceMonth[];
    overall: { present: number; absent: number; total: number; percentage: number };
  };
  fees: {
    records: FeeRecord[];
    summary: { total: number; paid: number; pending: number };
  };
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AcademicRecord() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AcademicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"exams" | "attendance" | "fees">("exams");

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  // ─── Load Data ───────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/students/${id}/academic-record`, authHeaders);
        setData(response.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load academic record");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  // ─── Helpers ─────────────────────────────────────────────────

  const getGradeVariant = (grade: string): "success" | "warning" | "danger" | "info" | "neutral" => {
    const g = grade?.toUpperCase();
    if (["A+", "A", "O"].includes(g)) return "success";
    if (["B+", "B"].includes(g)) return "info";
    if (["C+", "C"].includes(g)) return "warning";
    if (["D", "E", "F"].includes(g)) return "danger";
    return "neutral";
  };

  const getFeeStatusVariant = (status: string): "success" | "warning" | "danger" | "neutral" => {
    if (status === "paid") return "success";
    if (status === "pending") return "warning";
    if (status === "overdue") return "danger";
    return "neutral";
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <LoadingSkeleton variant="stats" count={3} />
        <div className="mt-6">
          <LoadingSkeleton variant="table" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <EmptyState
          title="No academic records"
          description="Academic records for this student are not available yet."
          icon={<GraduationCap className="w-8 h-8" />}
        />
      </div>
    );
  }

  const TABS = [
    { key: "exams" as const, label: "Exam Results", icon: <BookOpen className="w-4 h-4" /> },
    { key: "attendance" as const, label: "Attendance Summary", icon: <CalendarDays className="w-4 h-4" /> },
    { key: "fees" as const, label: "Fee Summary", icon: <IndianRupee className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Academic Record"
        subtitle="Complete academic history, attendance, and fee information"
        icon={<GraduationCap className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Students", path: "/students" },
          { label: "Profile", path: `/students/${id}` },
          { label: "Academic Record" },
        ]}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.key
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Exam Results Tab */}
      {activeTab === "exams" && (
        <div className="space-y-6">
          {data.exams.length === 0 ? (
            <EmptyState
              title="No exam results"
              description="No exam records found for this student."
              icon={<BookOpen className="w-8 h-8" />}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Examination Results
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {data.exams.length} exam records
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Exam
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Marks
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Grade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {data.exams.map((exam) => (
                      <tr key={exam._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                          {exam.examName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                          {exam.subject}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {exam.marksObtained}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            /{exam.maxMarks}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge label={exam.grade} variant={getGradeVariant(exam.grade)} />
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-700 dark:text-slate-300">
                          {exam.rank || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(exam.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Days</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {data.attendance.overall.total}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Present</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {data.attendance.overall.present}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Absent</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {data.attendance.overall.absent}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Percentage</p>
              <p className={`text-2xl font-bold ${
                data.attendance.overall.percentage >= 75
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
                {data.attendance.overall.percentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Monthly Chart */}
          {data.attendance.monthly.length > 0 && (
            <ChartCard title="Monthly Attendance" subtitle="Attendance percentage by month">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.attendance.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#f8fafc",
                    }}
                  />
                  <Bar
                    dataKey="percentage"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    name="Attendance %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {data.attendance.monthly.length === 0 && (
            <EmptyState
              title="No attendance data"
              description="Attendance records are not available yet."
              icon={<CalendarDays className="w-8 h-8" />}
            />
          )}
        </div>
      )}

      {/* Fees Tab */}
      {activeTab === "fees" && (
        <div className="space-y-6">
          {/* Fee Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Fees</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{data.fees.summary.total.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Paid</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ₹{data.fees.summary.paid.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                ₹{data.fees.summary.pending.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Fee Progress */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
              Payment Progress
            </h3>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 mb-2">
              <div
                className="h-4 bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${data.fees.summary.total > 0 ? (data.fees.summary.paid / data.fees.summary.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {data.fees.summary.total > 0
                ? `${((data.fees.summary.paid / data.fees.summary.total) * 100).toFixed(1)}% paid`
                : "No fees recorded"}
            </p>
          </div>

          {/* Fee Records Table */}
          {data.fees.records.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Fee Breakdown
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Fee Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Paid
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Pending
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {data.fees.records.map((fee) => (
                      <tr key={fee._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                          {fee.feeType}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-300">
                          ₹{fee.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-emerald-600 dark:text-emerald-400 font-medium">
                          ₹{fee.paid.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-amber-600 dark:text-amber-400 font-medium">
                          ₹{fee.pending.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(fee.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge
                            label={fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                            variant={getFeeStatusVariant(fee.status)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No fee records"
              description="Fee records are not available for this student."
              icon={<IndianRupee className="w-8 h-8" />}
            />
          )}
        </div>
      )}
    </div>
  );
}
