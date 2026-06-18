
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  FileSpreadsheet,
  Users,
  BookOpen,
  CheckCircle,
  Plus,
  Settings,
  BarChart3,
  Calendar,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface DashboardStats {
  totalExams: number;
  totalStudents: number;
  totalSubjects: number;
  resultsPublished: number;
}

interface UpcomingExam {
  id: string;
  name: string;
  className: string;
  startDate: string;
}

interface ClassItem {
  id: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

const ExamDashboard: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [stats, setStats] = useState<DashboardStats>({
    totalExams: 0,
    totalStudents: 0,
    totalSubjects: 0,
    resultsPublished: 0,
  });
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedClass, selectedYear]);

  const fetchDropdowns = async () => {
    try {
      const [classRes, yearRes] = await Promise.all([
        axios.get("http://localhost:5000/api/class", { headers }),
        axios.get("http://localhost:5000/api/academic", { headers }),
      ]);
      setClasses(classRes.data?.data || classRes.data || []);
      setAcademicYears(yearRes.data?.data || yearRes.data || []);
    } catch (error) {
      toast.error("Failed to load filter options");
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedYear) params.academicYearId = selectedYear;
      if (selectedClass) params.classId = selectedClass;

      const res = await axios.get("http://localhost:5000/api/exam/dashboard", {
        headers,
        params,
      });
      const data = res.data?.data || res.data || {};
      setStats({
        totalExams: data.totalExams || 0,
        totalStudents: data.totalStudents || 0,
        totalSubjects: data.totalSubjects || 0,
        resultsPublished: data.resultsPublished || 0,
      });
      setUpcomingExams(data.upcomingExams || []);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Exams",
      value: stats.totalExams,
      icon: FileSpreadsheet,
      gradient: "linear-gradient(135deg, #4338CA, #6366F1)",
      subtextColor: "#C7D2FE",
    },
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      gradient: "linear-gradient(135deg, #059669, #10B981)",
      subtextColor: "#A7F3D0",
    },
    {
      title: "Total Subjects",
      value: stats.totalSubjects,
      icon: BookOpen,
      gradient: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
      subtextColor: "#BFDBFE",
    },
    {
      title: "Results Published",
      value: stats.resultsPublished,
      icon: CheckCircle,
      gradient: "linear-gradient(135deg, #7C3AED, #A855F7)",
      subtextColor: "#E9D5FF",
    },
  ];

  const quickActions = [
    {
      title: "Create Exam",
      description: "Set up a new examination",
      icon: Plus,
      path: "/exams/create",
      color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    },
    {
      title: "Grade Settings",
      description: "Configure grading scales",
      icon: Settings,
      path: "/grade-settings",
      color: "bg-green-50 text-green-700 hover:bg-green-100",
    },
    {
      title: "Reports",
      description: "View exam reports and analytics",
      icon: BarChart3,
      path: "/exam-reports",
      color: "bg-purple-50 text-purple-700 hover:bg-purple-100",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Exam Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of examinations and results
            </p>
          </div>
          <button
            onClick={() => navigate("/exams/create")}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Exam
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Years</option>
                {academicYears.map((yr) => (
                  <option key={yr.id} value={yr.id}>
                    {yr.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stat Cards — COLORFUL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl shadow-lg p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ background: card.gradient }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: card.subtextColor }}>
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Exams */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Exams
                </h2>
              </div>
              <button
                onClick={() => navigate("/exams")}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {upcomingExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-sm font-medium text-gray-900">
                  No upcoming exams
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Create an exam to see it listed here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upcomingExams.map((exam) => (
                      <tr
                        key={exam.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/exam-schedule/${exam.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {exam.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {exam.className}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(exam.startDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${action.color}`}
                >
                  <action.icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-sm font-medium">{action.title}</div>
                    <div className="text-xs opacity-75">
                      {action.description}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamDashboard;

