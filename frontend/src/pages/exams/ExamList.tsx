import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getFullUrl } from "../../utils/url";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  ClipboardList,
  BarChart3,
  Loader2,
  FileSpreadsheet,
  Calendar,
  Users,
  IdCard,
  FileText,
  UserCog,
} from "lucide-react";

interface Exam {
  id: string;
  name: string;
  type: string;
  className?: string;
  sectionName?: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  resultType: string;
}

interface ClassItem {
  id: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

const ExamList: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchDropdowns();
    fetchExams();
  }, []);

  useEffect(() => {
    fetchExams();
  }, [selectedClass, selectedYear]);

  const fetchDropdowns = async () => {
    try {
      const [classRes, yearRes] = await Promise.all([
        axios.get(getFullUrl("/api/class"), { headers }),
        axios.get(getFullUrl("/api/academic"), { headers }),
      ]);
      setClasses(classRes.data?.data || classRes.data || []);
      setAcademicYears(yearRes.data?.data || yearRes.data || []);
    } catch (error) {
      toast.error("Failed to load filter options");
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedClass) params.classId = selectedClass;
      if (selectedYear) params.academicYearId = selectedYear;

      const res = await axios.get(getFullUrl("/api/exam"), {
        headers,
        params,
      });
      const raw = res.data?.data || res.data || [];
      setExams(Array.isArray(raw) ? raw : raw.exams || []);
    } catch (error) {
      toast.error("Failed to fetch exams");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    setDeleting(id);
    try {
      await axios.delete(getFullUrl(`/api/exam/${id}`), { headers });
      toast.success("Exam deleted successfully");
      fetchExams();
    } catch (error) {
      toast.error("Failed to delete exam");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (isPublished: boolean) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isPublished
        ? "bg-green-500/20 text-green-400"
        : "bg-yellow-500/20 text-yellow-400"
    }`}>
      {isPublished ? "Published" : "Draft"}
    </span>
  );

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      TERM:        "bg-blue-500/20 text-blue-400",
      UNIT_TEST:   "bg-purple-500/20 text-purple-400",
      HALF_YEARLY: "bg-indigo-500/20 text-indigo-400",
      ANNUAL:      "bg-rose-500/20 text-rose-400",
      PRACTICAL:   "bg-cyan-500/20 text-cyan-400",
      QUARTERLY:   "bg-amber-500/20 text-amber-400",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[type] ?? "bg-gray-500/20 text-gray-400"
      }`}>
        {type?.replace(/_/g, " ") || "N/A"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Examinations</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage exams, marks entry, and results
            </p>
          </div>
          <button
            onClick={() => navigate("/exams/create")}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Exam
          </button>
          <button
            onClick={() => navigate("/exam-schedule-print")}
            className="mt-4 sm:mt-0 ml-2 inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Print Schedule
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="">All Years</option>
                {academicYears.map((yr) => (
                  <option key={yr.id} value={yr.id}>{yr.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Exam Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-500 dark:text-gray-400">Loading exams...</span>
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FileSpreadsheet className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No exams found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first exam</p>
              <button
                onClick={() => navigate("/exams/create")}
                className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Exam
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {["Exam Name", "Type", "Class", "Date", "Status", "Actions"].map(h => (
                      <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${h === "Actions" ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{exam.name}</div>
                        {exam.sectionName && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">Section: {exam.sectionName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(exam.type)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {exam.className || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {exam.startDate && (
                          <>
                            <div>{new Date(exam.startDate).toLocaleDateString("en-IN")}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              to {new Date(exam.endDate).toLocaleDateString("en-IN")}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(exam.isPublished)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`/exams/edit/${exam.id}`)}
                            className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Edit Exam">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/exams/${exam.id}/subjects`)}
                            className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Subjects">
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/exam-schedule/${exam.id}`)}
                            className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors" title="Schedule">
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/exams/${exam.id}/marks`)}
                            className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="Marks Entry">
                            <ClipboardList className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/exams/${exam.id}/results`)}
                            className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors" title="Results">
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/exam-admit-card`)}
                            className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors" title="Admit Cards">
                            <IdCard className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/exam-question-papers/${exam.id}`)}
                            className="p-1.5 text-gray-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors" title="Question Papers">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/exam-seating/${exam.id}`)}
                            className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Seating Arrangement">
                            <Users className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/exam-invigilators/${exam.id}`)}
                            className="p-1.5 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors" title="Invigilators">
                            <UserCog className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(exam.id)} disabled={deleting === exam.id}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50" title="Delete Exam">
                            {deleting === exam.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamList;
