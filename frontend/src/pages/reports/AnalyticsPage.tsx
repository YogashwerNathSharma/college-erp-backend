import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Activity,
  Bus,
  BookOpen,
  Users,
  GraduationCap,
  IndianRupee,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BookMarked,
  Route,
  Calendar,
  Layers,
  Package,
} from "lucide-react";

const API = "/api";

type TabKey =
  | "admission"
  | "fee"
  | "attendance"
  | "exam"
  | "transport"
  | "library"
  | "income"
  | "expense";

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ElementType;
}

const tabs: TabItem[] = [
  { key: "admission", label: "Admission Analysis", icon: TrendingUp },
  { key: "fee", label: "Fee Analysis", icon: PieChart },
  { key: "attendance", label: "Attendance Analysis", icon: BarChart3 },
  { key: "exam", label: "Exam Analysis", icon: Activity },
  { key: "transport", label: "Transport Analysis", icon: Bus },
  { key: "library", label: "Library Analysis", icon: BookOpen },
  { key: "income", label: "Income Analysis", icon: TrendingUp },
  { key: "expense", label: "Expense Analysis", icon: TrendingDown },
];

// ─── Stat Card Component ────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ─── Data Table Component ───────────────────────────────────────────────────
interface DataTableProps {
  title: string;
  columns: { key: string; label: string }[];
  data: Record<string, any>[];
  emptyMessage?: string;
}

function DataTable({ title, columns, data, emptyMessage }: DataTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  {emptyMessage || "No data available"}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-700">
                      {row[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Format Helpers ─────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Tab Content Components ─────────────────────────────────────────────────

// 1. ADMISSION ANALYSIS
function AdmissionTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, statsRes] = await Promise.all([
        axios.get(`${API}/dashboard`),
        axios.get(`${API}/students/stats`).catch(() => ({ data: { data: null } })),
      ]);
      setData(dashRes.data?.data || dashRes.data);
      setStudentStats(statsRes.data?.data || statsRes.data);
    } catch (err: any) {
      toast.error("Failed to load admission data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  const totalStudents = data?.totalStudents || 0;
  const totalClasses = data?.totalClasses || 0;
  const monthlyData = data?.monthlyData || [];

  // Class-wise distribution from studentStats
  const classWise = studentStats?.classwiseCount || studentStats?.classWise || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={GraduationCap}
          color="#3b82f6"
        />
        <StatCard
          title="Total Classes"
          value={totalClasses}
          icon={Layers}
          color="#8b5cf6"
        />
        <StatCard
          title="Avg per Class"
          value={totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0}
          icon={Users}
          color="#06b6d4"
        />
        <StatCard
          title="This Month"
          value={monthlyData.length > 0 ? monthlyData[monthlyData.length - 1]?.admissions || 0 : 0}
          icon={TrendingUp}
          color="#22c55e"
        />
      </div>

      {/* Class-wise Distribution */}
      {classWise.length > 0 && (
        <DataTable
          title="Class-wise Student Distribution"
          columns={[
            { key: "className", label: "Class" },
            { key: "count", label: "Students" },
            { key: "percentage", label: "% of Total" },
          ]}
          data={classWise.map((c: any) => ({
            className: c.className || c.class || c.name,
            count: c.count || c.students || 0,
            percentage:
              totalStudents > 0
                ? `${(((c.count || c.students || 0) / totalStudents) * 100).toFixed(1)}%`
                : "0%",
          }))}
        />
      )}

      {/* Monthly Admissions */}
      {monthlyData.length > 0 && (
        <DataTable
          title="Month-wise Admissions"
          columns={[
            { key: "month", label: "Month" },
            { key: "admissions", label: "Admissions" },
            { key: "fees", label: "Fee Collected" },
          ]}
          data={monthlyData.map((m: any) => ({
            month: m.month || m.label,
            admissions: m.admissions || m.students || 0,
            fees: m.fees ? formatCurrency(m.fees) : "-",
          }))}
        />
      )}
    </div>
  );
}

// 2. FEE ANALYSIS
function FeeTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, reportsRes] = await Promise.all([
        axios.get(`${API}/fees/dashboard`),
        axios.get(`${API}/fees/reports`).catch(() => ({ data: { data: null } })),
      ]);
      setData(dashRes.data?.data || dashRes.data);
      setReports(reportsRes.data?.data || reportsRes.data);
    } catch (err: any) {
      toast.error("Failed to load fee data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  const summary = data?.summary || {};
  const monthlyCollection = data?.monthlyCollection || [];
  const classwiseOutstanding = data?.classwiseOutstanding || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Receivable"
          value={formatCurrency(summary.totalReceivable || 0)}
          icon={IndianRupee}
          color="#3b82f6"
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(summary.totalCollected || 0)}
          icon={CheckCircle}
          color="#22c55e"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(summary.outstanding || 0)}
          icon={AlertTriangle}
          color="#f97316"
        />
        <StatCard
          title="Collection %"
          value={
            summary.totalReceivable > 0
              ? `${((summary.totalCollected / summary.totalReceivable) * 100).toFixed(1)}%`
              : "0%"
          }
          icon={PieChart}
          color="#8b5cf6"
        />
      </div>

      {/* Class-wise Outstanding */}
      {classwiseOutstanding.length > 0 && (
        <DataTable
          title="Class-wise Outstanding"
          columns={[
            { key: "className", label: "Class" },
            { key: "outstanding", label: "Outstanding Amount" },
          ]}
          data={classwiseOutstanding.map((c: any) => ({
            className: c.className || c.class,
            outstanding: formatCurrency(c.outstanding || 0),
          }))}
        />
      )}

      {/* Monthly Collection Trend */}
      {monthlyCollection.length > 0 && (
        <DataTable
          title="Monthly Collection Trend"
          columns={[
            { key: "month", label: "Month" },
            { key: "receivable", label: "Receivable" },
            { key: "collected", label: "Collected" },
            { key: "percentage", label: "%" },
          ]}
          data={monthlyCollection.map((m: any) => ({
            month: m.month,
            receivable: formatCurrency(m.receivable || 0),
            collected: formatCurrency(m.collected || 0),
            percentage:
              m.receivable > 0
                ? `${((m.collected / m.receivable) * 100).toFixed(1)}%`
                : "0%",
          }))}
        />
      )}
    </div>
  );
}

// 3. ATTENDANCE ANALYSIS
function AttendanceTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/attendance/dashboard`);
      setData(res.data?.data || res.data);
    } catch (err: any) {
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  const overall = data?.overall || data?.summary || {};
  const classWise = data?.classwiseAttendance || data?.classWise || [];
  const totalPresent = overall.totalPresent || overall.present || 0;
  const totalAbsent = overall.totalAbsent || overall.absent || 0;
  const totalDays = overall.totalDays || overall.workingDays || 0;
  const overallPercentage = overall.percentage || overall.attendancePercentage || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${Number(overallPercentage).toFixed(1)}%`}
          icon={BarChart3}
          color="#22c55e"
        />
        <StatCard
          title="Total Present"
          value={totalPresent}
          icon={CheckCircle}
          color="#3b82f6"
        />
        <StatCard
          title="Total Absent"
          value={totalAbsent}
          icon={XCircle}
          color="#ef4444"
        />
        <StatCard
          title="Working Days"
          value={totalDays}
          icon={Calendar}
          color="#8b5cf6"
        />
      </div>

      {/* Class-wise Attendance */}
      {classWise.length > 0 && (
        <DataTable
          title="Class-wise Attendance"
          columns={[
            { key: "className", label: "Class" },
            { key: "present", label: "Present" },
            { key: "absent", label: "Absent" },
            { key: "percentage", label: "Attendance %" },
          ]}
          data={classWise.map((c: any) => ({
            className: c.className || c.class || c.name,
            present: c.present || c.totalPresent || 0,
            absent: c.absent || c.totalAbsent || 0,
            percentage: `${Number(c.percentage || c.attendancePercentage || 0).toFixed(1)}%`,
          }))}
        />
      )}

      {/* Present/Absent Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Attendance Distribution
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Present</span>
              <span>
                {totalPresent + totalAbsent > 0
                  ? `${((totalPresent / (totalPresent + totalAbsent)) * 100).toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{
                  width:
                    totalPresent + totalAbsent > 0
                      ? `${(totalPresent / (totalPresent + totalAbsent)) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Absent</span>
              <span>
                {totalPresent + totalAbsent > 0
                  ? `${((totalAbsent / (totalPresent + totalAbsent)) * 100).toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all"
                style={{
                  width:
                    totalPresent + totalAbsent > 0
                      ? `${(totalAbsent / (totalPresent + totalAbsent)) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. EXAM ANALYSIS
function ExamTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try to get exam reports - pass/fail
      const res = await axios.get(`${API}/exam/reports`, {
        params: { reportType: "pass_fail" },
      });
      setData(res.data?.data || res.data);
    } catch (err: any) {
      // Silently handle - exam data might not be available without examId
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  const summary = data?.summary || {};
  const classWise = data?.classwiseResults || data?.classWise || [];
  const gradeDistribution = data?.gradeDistribution || [];
  const subjectWise = data?.subjectWise || [];

  const totalPass = summary.pass || summary.totalPass || 0;
  const totalFail = summary.fail || summary.totalFail || 0;
  const totalStudents = summary.total || totalPass + totalFail;
  const passPercentage =
    totalStudents > 0 ? ((totalPass / totalStudents) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          color="#3b82f6"
        />
        <StatCard
          title="Pass"
          value={totalPass}
          icon={CheckCircle}
          color="#22c55e"
        />
        <StatCard
          title="Fail"
          value={totalFail}
          icon={XCircle}
          color="#ef4444"
        />
        <StatCard
          title="Pass %"
          value={`${passPercentage}%`}
          icon={Activity}
          color="#8b5cf6"
        />
      </div>

      {/* Grade Distribution */}
      {gradeDistribution.length > 0 && (
        <DataTable
          title="Grade Distribution"
          columns={[
            { key: "grade", label: "Grade" },
            { key: "count", label: "Students" },
            { key: "percentage", label: "%" },
          ]}
          data={gradeDistribution.map((g: any) => ({
            grade: g.grade || g.name,
            count: g.count || g.students || 0,
            percentage:
              totalStudents > 0
                ? `${(((g.count || g.students || 0) / totalStudents) * 100).toFixed(1)}%`
                : "0%",
          }))}
        />
      )}

      {/* Class-wise Results */}
      {classWise.length > 0 && (
        <DataTable
          title="Class-wise Results"
          columns={[
            { key: "className", label: "Class" },
            { key: "total", label: "Total" },
            { key: "pass", label: "Pass" },
            { key: "fail", label: "Fail" },
            { key: "percentage", label: "Pass %" },
          ]}
          data={classWise.map((c: any) => ({
            className: c.className || c.class || c.name,
            total: c.total || (c.pass || 0) + (c.fail || 0),
            pass: c.pass || 0,
            fail: c.fail || 0,
            percentage: `${Number(c.passPercentage || c.percentage || 0).toFixed(1)}%`,
          }))}
        />
      )}

      {/* Subject-wise Averages */}
      {subjectWise.length > 0 && (
        <DataTable
          title="Subject-wise Averages"
          columns={[
            { key: "subject", label: "Subject" },
            { key: "average", label: "Average Marks" },
            { key: "highest", label: "Highest" },
            { key: "lowest", label: "Lowest" },
          ]}
          data={subjectWise.map((s: any) => ({
            subject: s.subject || s.name,
            average: Number(s.average || s.avgMarks || 0).toFixed(1),
            highest: s.highest || s.maxMarks || "-",
            lowest: s.lowest || s.minMarks || "-",
          }))}
        />
      )}

      {!data && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Activity size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">
            No exam data available. Create and publish exam results to see analysis here.
          </p>
        </div>
      )}
    </div>
  );
}

// 5. TRANSPORT ANALYSIS
function TransportTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/transport/dashboard`);
      setData(res.data?.data || res.data);
    } catch (err: any) {
      toast.error("Failed to load transport data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  const stats = data?.stats || data || {};
  const routes = data?.routes || data?.routeWise || [];
  const vehicles = data?.vehicles || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Vehicles"
          value={stats.totalVehicles || vehicles.length || 0}
          icon={Bus}
          color="#06b6d4"
        />
        <StatCard
          title="Total Routes"
          value={stats.totalRoutes || routes.length || 0}
          icon={Route}
          color="#8b5cf6"
        />
        <StatCard
          title="Assigned Students"
          value={stats.assignedStudents || stats.totalStudents || 0}
          icon={Users}
          color="#3b82f6"
        />
        <StatCard
          title="Active Vehicles"
          value={stats.activeVehicles || stats.totalVehicles || 0}
          icon={CheckCircle}
          color="#22c55e"
        />
      </div>

      {/* Route-wise Distribution */}
      {routes.length > 0 && (
        <DataTable
          title="Route-wise Student Distribution"
          columns={[
            { key: "routeName", label: "Route" },
            { key: "students", label: "Students" },
            { key: "stops", label: "Stops" },
            { key: "vehicle", label: "Vehicle" },
          ]}
          data={routes.map((r: any) => ({
            routeName: r.routeName || r.name || r.route,
            students: r.students || r.studentCount || 0,
            stops: r.stops || r.stopCount || "-",
            vehicle: r.vehicleNumber || r.vehicle || "-",
          }))}
        />
      )}

      {/* Vehicle List */}
      {vehicles.length > 0 && (
        <DataTable
          title="Vehicle Details"
          columns={[
            { key: "number", label: "Vehicle No." },
            { key: "type", label: "Type" },
            { key: "capacity", label: "Capacity" },
            { key: "driver", label: "Driver" },
          ]}
          data={vehicles.map((v: any) => ({
            number: v.vehicleNumber || v.number,
            type: v.type || v.vehicleType || "-",
            capacity: v.capacity || v.seatingCapacity || "-",
            driver: v.driverName || v.driver || "-",
          }))}
        />
      )}
    </div>
  );
}

// 6. LIBRARY ANALYSIS
function LibraryTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/library/dashboard`);
      setData(res.data?.data || res.data);
    } catch (err: any) {
      toast.error("Failed to load library data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  const stats = data?.stats || data || {};
  const categories = data?.categories || data?.categoryWise || [];
  const overdue = data?.overdueBooks || data?.overdue || [];

  const totalBooks = stats.totalBooks || 0;
  const issued = stats.issuedBooks || stats.issued || 0;
  const available = stats.availableBooks || stats.available || totalBooks - issued;
  const overdueCount = stats.overdueBooks || stats.overdue || overdue.length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Books"
          value={totalBooks}
          icon={BookOpen}
          color="#3b82f6"
        />
        <StatCard
          title="Issued"
          value={issued}
          icon={BookMarked}
          color="#8b5cf6"
        />
        <StatCard
          title="Available"
          value={available}
          icon={CheckCircle}
          color="#22c55e"
        />
        <StatCard
          title="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          color="#ef4444"
        />
      </div>

      {/* Category-wise Books */}
      {categories.length > 0 && (
        <DataTable
          title="Category-wise Books"
          columns={[
            { key: "category", label: "Category" },
            { key: "total", label: "Total" },
            { key: "issued", label: "Issued" },
            { key: "available", label: "Available" },
          ]}
          data={categories.map((c: any) => ({
            category: c.category || c.name,
            total: c.total || c.count || 0,
            issued: c.issued || 0,
            available: c.available || (c.total || c.count || 0) - (c.issued || 0),
          }))}
        />
      )}

      {/* Overdue Books */}
      {overdue.length > 0 && (
        <DataTable
          title="Overdue Books"
          columns={[
            { key: "title", label: "Book Title" },
            { key: "student", label: "Issued To" },
            { key: "issueDate", label: "Issue Date" },
            { key: "dueDate", label: "Due Date" },
          ]}
          data={overdue.slice(0, 10).map((b: any) => ({
            title: b.title || b.bookTitle || "-",
            student: b.studentName || b.memberName || "-",
            issueDate: b.issueDate
              ? new Date(b.issueDate).toLocaleDateString("en-IN")
              : "-",
            dueDate: b.dueDate
              ? new Date(b.dueDate).toLocaleDateString("en-IN")
              : "-",
          }))}
        />
      )}
    </div>
  );
}

// 7. INCOME ANALYSIS
function IncomeTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, feesRes] = await Promise.all([
        axios.get(`${API}/dashboard`),
        axios.get(`${API}/fees/dashboard`).catch(() => ({ data: { data: null } })),
      ]);
      setDashboard(dashRes.data?.data || dashRes.data);
      setData(feesRes.data?.data || feesRes.data);
    } catch (err: any) {
      toast.error("Failed to load income data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  const fees = dashboard?.fees || {};
  const monthlyCollection = data?.monthlyCollection || dashboard?.monthlyData || [];
  const recentPayments = dashboard?.recentPayments || [];

  const totalIncome = fees.totalPaid || data?.summary?.totalCollected || 0;
  const totalPending = fees.totalPending || data?.summary?.outstanding || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          icon={IndianRupee}
          color="#22c55e"
        />
        <StatCard
          title="Pending Amount"
          value={formatCurrency(totalPending)}
          icon={Clock}
          color="#f97316"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(
            monthlyCollection.length > 0
              ? monthlyCollection[monthlyCollection.length - 1]?.collected ||
                  monthlyCollection[monthlyCollection.length - 1]?.fees ||
                  0
              : 0
          )}
          icon={TrendingUp}
          color="#3b82f6"
        />
        <StatCard
          title="Recent Payments"
          value={recentPayments.length}
          icon={CheckCircle}
          color="#8b5cf6"
        />
      </div>

      {/* Monthly Income Trend */}
      {monthlyCollection.length > 0 && (
        <DataTable
          title="Monthly Income Trend"
          columns={[
            { key: "month", label: "Month" },
            { key: "amount", label: "Amount Collected" },
          ]}
          data={monthlyCollection.map((m: any) => ({
            month: m.month || m.label,
            amount: formatCurrency(m.collected || m.fees || m.amount || 0),
          }))}
        />
      )}

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <DataTable
          title="Recent Payments"
          columns={[
            { key: "student", label: "Student" },
            { key: "amount", label: "Amount" },
            { key: "date", label: "Date" },
            { key: "method", label: "Method" },
          ]}
          data={recentPayments.slice(0, 10).map((p: any) => ({
            student: p.studentName || p.student || "-",
            amount: formatCurrency(p.amount || p.paidAmount || 0),
            date: p.date || p.paidDate
              ? new Date(p.date || p.paidDate).toLocaleDateString("en-IN")
              : "-",
            method: p.method || p.paymentMethod || "-",
          }))}
        />
      )}
    </div>
  );
}

// 8. EXPENSE ANALYSIS (Coming Soon)
function ExpenseTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <TrendingDown size={36} className="text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        Expense Analysis
      </h3>
      <p className="text-gray-400 text-sm text-center max-w-md">
        Expense tracking and analysis is coming soon. This feature will allow you to
        track school expenses, categorize spending, and view expense reports.
      </p>
      <div className="mt-6 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700 font-medium flex items-center gap-2">
          <Clock size={14} />
          Coming Soon
        </p>
      </div>
    </div>
  );
}

// ─── Loading State ──────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-primary-600" />
      <span className="ml-3 text-gray-500 text-sm">Loading data...</span>
    </div>
  );
}

// ─── Main Analytics Page ────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(tabFromUrl || "admission");

  // If tab param changes externally
  useEffect(() => {
    if (tabFromUrl && tabs.find((t) => t.key === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "admission":
        return <AdmissionTab />;
      case "fee":
        return <FeeTab />;
      case "attendance":
        return <AttendanceTab />;
      case "exam":
        return <ExamTab />;
      case "transport":
        return <TransportTab />;
      case "library":
        return <LibraryTab />;
      case "income":
        return <IncomeTab />;
      case "expense":
        return <ExpenseTab />;
      default:
        return <AdmissionTab />;
    }
  };

  const showTabsBar = !tabFromUrl;

  return (
    <div className="p-4 h-[calc(100vh-80px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate("/reports")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Analytics Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Comprehensive analysis and insights
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      {showTabsBar && (
        <div className="print:hidden mb-6 overflow-x-auto">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-white text-primary-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden lg:inline">{tab.label}</span>
                  <span className="lg:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div>{renderTabContent()}</div>
    </div>
  );
}
