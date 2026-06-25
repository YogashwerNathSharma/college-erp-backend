
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
  X,
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

  // Modal states
  const [examModal, setExamModal] = useState<{ open: boolean; type: string }>({
    open: false,
    type: "",
  });
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedClass, selectedYear]);

  const fetchDropdowns = async () => {
    try {
      const [classRes, yearRes] = await Promise.all([
        axios.get("/api/class", { headers }),
        axios.get("/api/academic", { headers }),
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

      const res = await axios.get("/api/exam/dashboard", {
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

  // Handle card click to fetch and display modal data
  const handleCardClick = async (type: string) => {
    setExamModal({ open: true, type });
    setModalLoading(true);
    setModalData([]);

    try {
      let response;
      const params: Record<string, string> = {};
      if (selectedYear) params.academicYearId = selectedYear;
      if (selectedClass) params.classId = selectedClass;

      switch (type) {
        case "exams":
          response = await axios.get("/api/exams", { headers, params });
          setModalData(response.data?.data || response.data || []);
          break;
        case "students":
          response = await axios.get("/api/students?limit=1000", {
            headers,
            params,
          });
          setModalData(response.data?.data || response.data || []);
          break;
        case "subjects":
          response = await axios.get("/api/subjects", { headers, params });
          setModalData(response.data?.data || response.data || []);
          break;
        case "published":
          response = await axios.get("/api/exams?status=published", {
            headers,
            params,
          });
          setModalData(response.data?.data || response.data || []);
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error(`Failed to load ${type} data`);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  // Get modal title based on type
  const getModalTitle = () => {
    switch (examModal.type) {
      case "exams":
        return "All Exams";
      case "students":
        return "All Students";
      case "subjects":
        return "All Subjects";
      case "published":
        return "Published Results";
      default:
        return "";
    }
  };

  // Render modal content based on type
  const renderModalContent = () => {
    if (modalLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="text-gray-600">Loading data...</span>
          </div>
        </div>
      );
    }

    if (modalData.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      );
    }

    // Table for exams
    if (examModal.type === "exams" || examModal.type === "published") {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Exam Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {modalData.map((exam) => (
                <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {exam.name || exam.examName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {exam.className || exam.class?.name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {exam.startDate
                      ? new Date(exam.startDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        exam.status === "published"
                          ? "bg-green-100 text-green-800"
                          : exam.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {exam.status || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Table for students
    if (examModal.type === "students") {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Roll No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {modalData.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.name || student.firstName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.rollNo || student.roll || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.className || student.class?.name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.email || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Table for subjects
    if (examModal.type === "subjects") {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Subject Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Class
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {modalData.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {subject.name || subject.subjectName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {subject.code || subject.subjectCode || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {subject.className || subject.class?.name || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  const statCards = [
    {
      title: "Total Exams",
      value: stats.totalExams,
      icon: FileSpreadsheet,
      gradient: "linear-gradient(135deg, #4338CA, #6366F1)",
      subtextColor: "#C7D2FE",
      type: "exams",
    },
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      gradient: "linear-gradient(135deg, #059669, #10B981)",
      subtextColor: "#A7F3D0",
      type: "students",
    },
    {
      title: "Total Subjects",
      value: stats.totalSubjects,
      icon: BookOpen,
      gradient: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
      subtextColor: "#BFDBFE",
      type: "subjects",
    },
    {
      title: "Results Published",
      value: stats.resultsPublished,
      icon: CheckCircle,
      gradient: "linear-gradient(135deg, #7C3AED, #A855F7)",
      subtextColor: "#E9D5FF",
      type: "published",
    },
  ];

  const quickActions = [
    {
      title: "Create Exam",
      description: "Set up a new examination",
      icon: Plus,
      path: "/exams/create",
      color: "bg-primary-50 text-primary-700 hover:bg-primary-100",
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
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
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
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
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
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
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
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
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

        {/* Stat Cards — COLORFUL & CLICKABLE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <div
              key={card.title}
              onClick={() => handleCardClick(card.type)}
              className="rounded-xl shadow-lg p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
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
                  <p
                    className="text-xs font-medium"
                    style={{ color: card.subtextColor }}
                  >
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
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
                <Calendar className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Exams
                </h2>
              </div>
              <button
                onClick={() => navigate("/exams")}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1 transition-colors"
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
              <TrendingUp className="w-5 h-5 text-primary-600" />
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

      {/* Inline ExamDetailModal */}
      {examModal.open && (
        <div
          className="fixed inset-0 bg-black/60 z-[9000] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setExamModal({ open: false, type: "" })}
        >
          <div
            className="bg-white w-full max-w-4xl h-[100vh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-none sm:rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-bold text-gray-900">
                {getModalTitle()}
              </h2>
              <button
                onClick={() => setExamModal({ open: false, type: "" })}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content — Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4">
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamDashboard;
