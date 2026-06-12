import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
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
        axios.get("http://localhost:5000/api/class", { headers }),
        axios.get("http://localhost:5000/api/academic", { headers }),
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

      const res = await axios.get("http://localhost:5000/api/exam", {
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
      await axios.delete(`http://localhost:5000/api/exam/${id}`, { headers });
      toast.success("Exam deleted successfully");
      fetchExams();
    } catch (error) {
      toast.error("Failed to delete exam");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (isPublished: boolean) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isPublished
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {isPublished ? "Published" : "Draft"}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      TERM: "bg-blue-100 text-blue-800",
      UNIT_TEST: "bg-purple-100 text-purple-800",
      PRACTICAL: "bg-indigo-100 text-indigo-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[type] || "bg-gray-100 text-gray-800"
        }`}
      >
        {type?.replace("_", " ") || "N/A"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Examinations</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage exams, marks entry, and results
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
          </div>
        </div>

        {/* Exam Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-gray-500">Loading exams...</span>
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FileSpreadsheet className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No exams found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first exam
              </p>
              <button
                onClick={() => navigate("/exams/create")}
                className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Exam
              </button>
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
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {exam.name}
                        </div>
                        {exam.sectionName && (
                          <div className="text-xs text-gray-500">
                            Section: {exam.sectionName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(exam.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {exam.className || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {exam.startDate && (
                          <>
                            <div>{new Date(exam.startDate).toLocaleDateString("en-IN")}</div>
                            <div className="text-xs text-gray-500">
                              to {new Date(exam.endDate).toLocaleDateString("en-IN")}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(exam.isPublished)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => navigate(`/exams/edit/${exam.id}`)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Exam"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Subjects */}
                          <button
                            onClick={() => navigate(`/exams/${exam.id}/subjects`)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Subjects"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>

                          {/* Schedule */}
                          <button
                            onClick={() => navigate(`/exam-schedule/${exam.id}`)}
                            className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            title="Schedule"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          {/* Marks Entry */}
                          <button
                            onClick={() => navigate(`/exams/${exam.id}/marks`)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Marks Entry"
                          >
                            <ClipboardList className="w-4 h-4" />
                          </button>

                          {/* Results */}
                          <button
                            onClick={() => navigate(`/exams/${exam.id}/results`)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Results"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>

                          {/* Admit Card */}
                          <button
                            onClick={() => navigate(`/exam-admit-cards/${exam.id}`)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Admit Cards"
                          >
                            <IdCard className="w-4 h-4" />
                          </button>

                          {/* Question Papers */}
                          <button
                            onClick={() => navigate(`/exam-question-papers/${exam.id}`)}
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Question Papers"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Seating */}
                          <button
                            onClick={() => navigate(`/exam-seating/${exam.id}`)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Seating Arrangement"
                          >
                            <Users className="w-4 h-4" />
                          </button>

                          {/* Invigilators */}
                          <button
                            onClick={() => navigate(`/exam-invigilators/${exam.id}`)}
                            className="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="Invigilators"
                          >
                            <UserCog className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(exam.id)}
                            disabled={deleting === exam.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Exam"
                          >
                            {deleting === exam.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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