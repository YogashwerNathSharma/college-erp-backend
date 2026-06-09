
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  FileText,
  RefreshCw,
} from "lucide-react";

interface ResultItem {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  division: string;
  rank: number;
  status: string;
  
}

interface Exam {
  _id: string;
  name: string;
  type: string;
  classId?: string;
  class?: { _id: string; name: string };
  academicYearId?: string;
}

const Results: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [id]);

const fetchResults = async () => {
  setLoading(true);
  try {
    // First fetch exam details
    const examRes = await axios.get(
      `http://localhost:5000/api/exam/${id}`,
      { headers }
    );
    const examData = examRes.data?.data || examRes.data;
    setExam(examData);

    // Then fetch results
    const res = await axios.get(
      `http://localhost:5000/api/exam/${id}/results`,
      { headers }
    );
    // ✅ Backend returns array directly OR { data: [...] }
    const data = res.data?.data || res.data;
    const resultsList = Array.isArray(data) ? data : (data.results || data || []);
    setResults(resultsList);
  } catch (error) {
    console.error("Fetch results error:", error);
    setResults([]);
  } finally {
    setLoading(false);
  }
};

  const generateResults = async () => {
  setGenerating(true);
  try {
    const res = await axios.post(
      `http://localhost:5000/api/exam/${id}/generate-results`,
      {},
      { headers }
    );
    console.log("Generate response:", res.data);
    toast.success(res.data?.message || res.data?.data?.message || "Results generated!");
    await fetchResults(); // Reload results
  } catch (error: any) {
    console.error("Generate error:", error.response?.data || error);
    const msg = error.response?.data?.message || "Failed to generate results";
    toast.error(msg);
  } finally {
    setGenerating(false);
  }
};

  // Summary stats
  const totalStudents = results.length;
  const passed = results.filter(
    (r) => r.status?.toLowerCase() === "pass"
  ).length;
  const failed = totalStudents - passed;
  const highestPercentage =
    results.length > 0 ? Math.max(...results.map((r) => r.percentage)) : 0;
  const averagePercentage =
    results.length > 0
      ? results.reduce((acc, r) => acc + r.percentage, 0) / results.length
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-gray-600">Loading results...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/exams")}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Exam Results
              </h1>
              {exam && (
                <p className="mt-1 text-sm text-gray-500">
                  {exam.name} • {exam.class?.name || ""} •{" "}
                  {exam.type?.replace("_", " ")}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={generateResults}
            disabled={generating}
            className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {results.length > 0 ? "Regenerate Results" : "Generate Results"}
          </button>
        </div>

        {/* Summary Cards */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">
                    Total Students
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {totalStudents}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">
                    Passed
                  </p>
                  <p className="text-xl font-bold text-green-600">{passed}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">
                    Failed
                  </p>
                  <p className="text-xl font-bold text-red-600">{failed}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">
                    Highest %
                  </p>
                  <p className="text-xl font-bold text-purple-600">
                    {highestPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">
                    Average %
                  </p>
                  <p className="text-xl font-bold text-amber-600">
                    {averagePercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No results generated yet
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
                Make sure marks have been entered for all students, then click
                "Generate Results" to calculate grades and rankings.
              </p>
              <button
                onClick={generateResults}
                disabled={generating}
                className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Generate Results
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admission No
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Marks
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Division
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr
                      key={result.id || result.studentId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">
                          {result.rank}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {result.studentName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {result.admissionNo}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        <span className="font-semibold">
                          {result.totalMarks}
                        </span>
                        <span className="text-gray-400">
                          /{result.totalMaxMarks}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {result.percentage?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {result.division || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.status?.toLowerCase() === "pass"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {result.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
{/* Report Card — print route (no sidebar) */}
                      <button
                        onClick={() =>
                          window.open(
                            `/print/report-card/${id}/${result.studentId}`,
                            '_blank'
                          )
                        }
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                        title="View Report Card"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Report Card
                      </button>

                      {/* Consolidated — print route (no sidebar) */}
                      <button
                        onClick={() =>
                          window.open(
                            `/print/consolidated/${result.studentId}?academicYearId=${(exam as any)?.academicYearId || ""}&classId=${(exam as any)?.classId || ""}`,
                            '_blank'
                          )
                        }
                        className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-100 transition-colors ml-2"
                        title="Consolidated Report"
                      >
                        📊 Consolidated
                      </button>
                        
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

export default Results;

