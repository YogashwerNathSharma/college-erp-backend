import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import {
  FileText,
  Users,
  TrendingUp,
  Award,
  BarChart3,
  BookOpen,
  AlertCircle,
} from "lucide-react";

// ─── Types ───
interface Child {
  id: string;
  firstName: string;
  lastName: string;
  className: string;
  sectionName: string;
}

interface ResultSummary {
  id: string;
  examId: string;
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  grade?: string;
  rank?: number;
  division?: string;
  status: string;
  totalSubjects: number;
  passedSubjects: number;
  failedSubjects: number;
  exam?: {
    id: string;
    name: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  };
}

interface MarksEntry {
  id: string;
  studentId: string;
  obtainedMarks: number;
  examSubject?: {
    maxMarks?: number;
    subject?: { id: string; name: string };
    exam?: { id: string; name: string };
  };
}

function ParentResultsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [marks, setMarks] = useState<MarksEntry[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchResults(selectedChild.id);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/parent/my-children"));
      if (res.data?.success && res.data.data?.length > 0) {
        setChildren(res.data.data);
        setSelectedChild(res.data.data[0]);
      }
    } catch {
      toast.error("Failed to load children");
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (studentId: string) => {
    try {
      const res = await axios.get(getFullUrl(`/api/parent/child/${studentId}/results`));
      if (res.data?.success) {
        setResults(res.data.data.results || []);
        setMarks(res.data.data.marks || []);
        if (res.data.data.results?.length > 0) {
          setSelectedExamId(res.data.data.results[0].examId);
        }
      }
    } catch {
      toast.error("Failed to load results");
    }
  };

  // Get marks for selected exam
  const examMarks = marks.filter(
    (m) => m.examSubject?.exam?.id === selectedExamId
  );

  const selectedResult = results.find((r) => r.examId === selectedExamId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <FileText className="text-teal-600" size={24} />
        Exam Results
      </h1>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                selectedChild?.id === child.id
                  ? "bg-teal-50 border-teal-500 text-teal-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Users size={16} />
              {child.firstName} {child.lastName}
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {results.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-3" size={40} />
          <p className="text-gray-500 text-sm">No exam results published yet.</p>
        </div>
      )}

      {/* Exam Tabs */}
      {results.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {results.map((r) => (
            <button
              key={r.examId}
              onClick={() => setSelectedExamId(r.examId)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                selectedExamId === r.examId
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {r.exam?.name || "Exam"}
            </button>
          ))}
        </div>
      )}

      {/* Result Summary Card */}
      {selectedResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-teal-600" size={20} />
            <h3 className="text-base font-semibold text-gray-800">
              {selectedResult.exam?.name} — Result Summary
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-teal-50 text-center">
              <p className="text-xs text-teal-600 mb-1">Percentage</p>
              <p className="text-xl font-bold text-teal-700">
                {selectedResult.percentage?.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-center">
              <p className="text-xs text-blue-600 mb-1">Total Marks</p>
              <p className="text-xl font-bold text-blue-700">
                {selectedResult.totalMarks}/{selectedResult.totalMaxMarks}
              </p>
            </div>
            {selectedResult.grade && (
              <div className="p-3 rounded-lg bg-purple-50 text-center">
                <p className="text-xs text-purple-600 mb-1">Grade</p>
                <p className="text-xl font-bold text-purple-700">
                  {selectedResult.grade}
                </p>
              </div>
            )}
            {selectedResult.rank && (
              <div className="p-3 rounded-lg bg-amber-50 text-center">
                <p className="text-xs text-amber-600 mb-1">Rank</p>
                <p className="text-xl font-bold text-amber-700">
                  #{selectedResult.rank}
                </p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-green-50 text-center">
              <p className="text-xs text-green-600 mb-1">Passed</p>
              <p className="text-xl font-bold text-green-700">
                {selectedResult.passedSubjects}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 text-center">
              <p className="text-xs text-red-600 mb-1">Failed</p>
              <p className="text-xl font-bold text-red-700">
                {selectedResult.failedSubjects}
              </p>
            </div>
            <div className={`p-3 rounded-lg text-center ${
              selectedResult.status === "PASS" ? "bg-green-50" : "bg-red-50"
            }`}>
              <p className={`text-xs mb-1 ${selectedResult.status === "PASS" ? "text-green-600" : "text-red-600"}`}>Status</p>
              <p className={`text-xl font-bold ${selectedResult.status === "PASS" ? "text-green-700" : "text-red-700"}`}>
                {selectedResult.status}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subject-wise Marks */}
      {examMarks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="text-teal-600" size={20} />
            <h3 className="text-base font-semibold text-gray-800">Subject-wise Marks</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Subject</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Max Marks</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Obtained</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {examMarks.map((m) => {
                  const maxMarks = m.examSubject?.maxMarks || 100;
                  const pct = maxMarks > 0 ? (m.obtainedMarks / maxMarks) * 100 : 0;
                  return (
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {m.examSubject?.subject?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{maxMarks}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-800">
                        {m.obtainedMarks}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            pct >= 60
                              ? "bg-green-100 text-green-700"
                              : pct >= 33
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentResultsPage;
