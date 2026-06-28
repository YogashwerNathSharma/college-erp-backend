import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import {
  FileText,
  Calendar,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  BarChart3,
  ClipboardList,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  ChevronRight,
  PenTool,
  Grid3X3,
  CreditCard,
  BookOpen,
  Target,
  Star,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const API = `${API_BASE_URL}/api`;

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

interface DashboardStats {
  totalExams: number;
  upcomingExams: number;
  completedExams: number;
  averagePassPercent: number;
  totalStudents: number;
  resultsPublished: number;
}

interface UpcomingExam {
  id: string;
  name: string;
  className: string;
  startDate: string;
  subjects: number;
  status: string;
}

interface RecentResult {
  id: string;
  examName: string;
  className: string;
  passPercent: number;
  topScorer: string;
  avgMarks: number;
}

interface ExamResultData {
  name: string;
  pass: number;
  fail: number;
}

interface GradeData {
  name: string;
  value: number;
  color: string;
}

interface SubjectPerformance {
  subject: string;
  avgScore: number;
  fullMark: number;
}

interface ClassItem {
  id: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent?: boolean;
}

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────

const getToken = () => localStorage.getItem("token");
const getHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const GRADE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

// ─────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: { value: number; isPositive: boolean };
  onClick?: () => void;
  delay?: number;
}

const StatCard = ({ title, value, subtitle, icon, iconBg, trend, onClick, delay = 0 }: StatCardProps) => (
  <div
    className={`bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 animate-fade-in-up ${onClick ? "cursor-pointer" : ""}`}
    style={{ animationDelay: `${delay}ms` }}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.isPositive ? "text-green-600" : "text-red-500"}`}>
            {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trend.isPositive ? "+" : ""}{trend.value}% vs last term</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────

const ExamDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [stats, setStats] = useState<DashboardStats>({
    totalExams: 0,
    upcomingExams: 0,
    completedExams: 0,
    averagePassPercent: 0,
    totalStudents: 0,
    resultsPublished: 0,
  });

  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [examResults, setExamResults] = useState<ExamResultData[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeData[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedClass, selectedYear]);

  const fetchDropdowns = async () => {
    try {
      const [classRes, yearRes] = await Promise.all([
        axios.get(`${API}/classes`, { headers: getHeaders() }),
        axios.get(`${API}/academic`, { headers: getHeaders() }),
      ]);
      const classList = classRes.data.data || classRes.data || [];
      const yearList = yearRes.data.data || yearRes.data || [];
      setClasses(classList);
      setAcademicYears(yearList);
      const current = yearList.find((y: AcademicYear) => y.isCurrent);
      if (current) setSelectedYear(current.id);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedClass) params.classId = selectedClass;
      if (selectedYear) params.academicYearId = selectedYear;

      const res = await axios.get(`${API}/exams/dashboard`, {
        params,
        headers: getHeaders(),
      });

      const data = res.data;
      setStats({
        totalExams: data.totalExams || data.stats?.totalExams || 0,
        upcomingExams: data.upcomingExams?.length || data.stats?.upcomingExams || 0,
        completedExams: data.completedExams || data.stats?.completedExams || 0,
        averagePassPercent: data.averagePassPercent || data.stats?.averagePassPercent || 0,
        totalStudents: data.totalStudents || data.stats?.totalStudents || 0,
        resultsPublished: data.resultsPublished || data.stats?.resultsPublished || 0,
      });

      setUpcomingExams(data.upcomingExams || []);
      setRecentResults(data.recentResults || []);
      setExamResults(data.examResults || []);
      setGradeDistribution(data.gradeDistribution || []);
      setSubjectPerformance(data.subjectPerformance || []);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts if API returns empty
  const sampleExamResults: ExamResultData[] = examResults.length > 0 ? examResults : [
    { name: "Unit Test 1", pass: 85, fail: 15 },
    { name: "Mid Term", pass: 78, fail: 22 },
    { name: "Unit Test 2", pass: 88, fail: 12 },
    { name: "Final Exam", pass: 82, fail: 18 },
    { name: "Practical", pass: 92, fail: 8 },
  ];

  const sampleGrades: GradeData[] = gradeDistribution.length > 0 ? gradeDistribution : [
    { name: "A+", value: 15, color: "#6366f1" },
    { name: "A", value: 25, color: "#8b5cf6" },
    { name: "B+", value: 22, color: "#06b6d4" },
    { name: "B", value: 18, color: "#10b981" },
    { name: "C", value: 12, color: "#f59e0b" },
    { name: "F", value: 8, color: "#ef4444" },
  ];

  const sampleSubjects: SubjectPerformance[] = subjectPerformance.length > 0 ? subjectPerformance : [
    { subject: "Math", avgScore: 78, fullMark: 100 },
    { subject: "Science", avgScore: 82, fullMark: 100 },
    { subject: "English", avgScore: 85, fullMark: 100 },
    { subject: "Hindi", avgScore: 80, fullMark: 100 },
    { subject: "SST", avgScore: 75, fullMark: 100 },
    { subject: "Computer", avgScore: 88, fullMark: 100 },
  ];

  const sampleUpcoming: UpcomingExam[] = upcomingExams.length > 0 ? upcomingExams : [
    { id: "1", name: "Unit Test 3", className: "All Classes", startDate: "2026-07-10", subjects: 5, status: "SCHEDULED" },
    { id: "2", name: "Mid Term Exam", className: "Class 6-10", startDate: "2026-08-15", subjects: 8, status: "SCHEDULED" },
    { id: "3", name: "Practical Exam", className: "Class 9-10", startDate: "2026-08-20", subjects: 3, status: "UPCOMING" },
  ];

  const sampleResults: RecentResult[] = recentResults.length > 0 ? recentResults : [
    { id: "1", examName: "Unit Test 2", className: "Class 10-A", passPercent: 88, topScorer: "Ananya Sharma", avgMarks: 76 },
    { id: "2", examName: "Unit Test 2", className: "Class 9-B", passPercent: 82, topScorer: "Rahul Verma", avgMarks: 72 },
    { id: "3", examName: "Mid Term", className: "Class 8-A", passPercent: 91, topScorer: "Priya Patel", avgMarks: 81 },
    { id: "4", examName: "Unit Test 2", className: "Class 7-C", passPercent: 78, topScorer: "Amit Kumar", avgMarks: 68 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-slate-700" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading exam data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* CSS Animation */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span className="text-gray-700 dark:text-gray-200">Examinations</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Exam Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of examination performance and schedules
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Years</option>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={fetchDashboard}
            className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* ─── STAT CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Exams"
          value={stats.totalExams}
          subtitle="This academic year"
          icon={<FileText size={22} className="text-indigo-600" />}
          iconBg="bg-indigo-50 dark:bg-indigo-950"
          delay={0}
        />
        <StatCard
          title="Upcoming"
          value={stats.upcomingExams}
          subtitle="Scheduled exams"
          icon={<Calendar size={22} className="text-amber-600" />}
          iconBg="bg-amber-50 dark:bg-amber-950"
          onClick={() => navigate("/exams")}
          delay={50}
        />
        <StatCard
          title="Completed"
          value={stats.completedExams}
          subtitle="Results published"
          icon={<CheckCircle size={22} className="text-green-600" />}
          iconBg="bg-green-50 dark:bg-green-950"
          delay={100}
        />
        <StatCard
          title="Avg. Pass %"
          value={`${stats.averagePassPercent}%`}
          subtitle="Overall performance"
          icon={<Target size={22} className="text-cyan-600" />}
          iconBg="bg-cyan-50 dark:bg-cyan-950"
          trend={{ value: 4.2, isPositive: stats.averagePassPercent >= 70 }}
          delay={150}
        />
        <StatCard
          title="Top Scorer"
          value="98.5%"
          subtitle="Best performance"
          icon={<Award size={22} className="text-purple-600" />}
          iconBg="bg-purple-50 dark:bg-purple-950"
          delay={200}
        />
      </div>

      {/* ─── CHARTS ROW 1 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam Results Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Exam Results Overview</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pass vs Fail percentage per exam</p>
            </div>
            <button
              onClick={() => navigate("/exam-reports")}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
            >
              Detailed Report <ArrowRight size={12} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sampleExamResults} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                formatter={(value: any, name: any) => [`${value}%`, name === "pass" ? "Pass" : "Fail"]}
              />
              <Legend
                wrapperStyle={{ paddingTop: 12 }}
                formatter={(value) => <span className="text-xs text-gray-600 capitalize">{value}</span>}
              />
              <Bar dataKey="pass" name="Pass" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="fail" name="Fail" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Grade Distribution</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Overall grade breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={sampleGrades}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {sampleGrades.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                formatter={(value: any, name: any) => [`${value}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {sampleGrades.map((g, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="text-[10px] text-gray-600 dark:text-gray-300">{g.name}: {g.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CHARTS ROW 2: Subject Performance Radar ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Performance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Subject-wise Performance</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Average scores by subject</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={sampleSubjects}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#9ca3af" }} />
              <Radar
                name="Avg Score"
                dataKey="avgScore"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                formatter={(value: any) => [`${value}%`, "Avg Score"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Exams */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Upcoming Exams</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Scheduled examinations</p>
            </div>
            <button
              onClick={() => navigate("/exams")}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exam</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subjects</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {sampleUpcoming.map((exam, i) => (
                  <tr
                    key={exam.id || i}
                    className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                          <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{exam.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{exam.className}</td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                      {new Date(exam.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        {exam.subjects} subjects
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        exam.status === "SCHEDULED"
                          ? "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                          : "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"
                      }`}>
                        {exam.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── RECENT RESULTS TABLE ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Results</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Latest published exam results</p>
          </div>
          <button
            onClick={() => navigate("/exam-reports")}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
          >
            All Results <ArrowRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exam</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pass %</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Scorer</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Marks</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {sampleResults.map((result, i) => (
                <tr
                  key={result.id || i}
                  className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-3 px-3 font-medium text-gray-800 dark:text-gray-200">{result.examName}</td>
                  <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{result.className}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      result.passPercent >= 85
                        ? "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"
                        : result.passPercent >= 70
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                        : "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400"
                    }`}>
                      {result.passPercent}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-gray-700 dark:text-gray-200">{result.topScorer}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-600 dark:text-gray-300">{result.avgMarks}/100</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => navigate("/exam-reports")}
                      className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 transition-colors"
                      title="View Details"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── QUICK ACTIONS ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Create Exam", icon: <Plus size={20} />, color: "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400", route: "/exams" },
            { label: "Enter Marks", icon: <PenTool size={20} />, color: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400", route: "/exams" },
            { label: "Report Card", icon: <BookOpen size={20} />, color: "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400", route: "/report-card-select" },
            { label: "Seating Plan", icon: <Grid3X3 size={20} />, color: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400", route: "/exam-seating-plan" },
            { label: "Admit Card", icon: <CreditCard size={20} />, color: "bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400", route: "/exam-admit-card" },
            { label: "Grade Settings", icon: <BarChart3 size={20} />, color: "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400", route: "/grade-settings" },
            { label: "Exam Schedule", icon: <Clock size={20} />, color: "bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400", route: "/exams" },
            { label: "Exam Reports", icon: <ClipboardList size={20} />, color: "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400", route: "/exam-reports" },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.route)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200 text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamDashboard;
