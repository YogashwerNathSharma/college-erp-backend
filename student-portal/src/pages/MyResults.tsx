import { useState, useEffect } from "react";
import { portalService } from "../services/portal.service";

//////////////////////////////////////////////////////
// 📝 MY RESULTS PAGE
//////////////////////////////////////////////////////

interface ExamResult {
  examId: string;
  examName: string;
  examType: string;
  date: string;
  subjects: Array<{
    name: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
    status: "PASS" | "FAIL";
  }>;
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string;
  rank?: number;
  status: "PASS" | "FAIL" | "COMPARTMENT";
}

export default function MyResults() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await portalService.getResults();
        setResults(data || []);
      } catch (error) {
        console.error("Results fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Results</h1>

      {!selectedExam ? (
        /* Exam List */
        <div className="grid gap-4">
          {results.length ? (
            results.map((exam) => (
              <div
                key={exam.examId}
                onClick={() => setSelectedExam(exam)}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer hover:border-primary-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{exam.examName}</h3>
                    <p className="text-sm text-gray-500 mt-1">{exam.examType} • {exam.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">{exam.percentage}%</p>
                    <p className={`text-sm font-medium ${exam.status === "PASS" ? "text-green-600" : "text-red-600"}`}>
                      {exam.status} {exam.rank && `• Rank #${exam.rank}`}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
              <p className="text-gray-500">No results published yet</p>
            </div>
          )}
        </div>
      ) : (
        /* Exam Detail */
        <div className="space-y-4">
          <button
            onClick={() => setSelectedExam(null)}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            ← Back to all results
          </button>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedExam.examName}</h2>
                <p className="text-gray-500">{selectedExam.date}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-600">{selectedExam.percentage}%</p>
                <p className="text-sm text-gray-500">Grade: {selectedExam.grade}</p>
              </div>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Marks</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedExam.subjects.map((sub, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sub.name}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                      {sub.marksObtained}/{sub.maxMarks}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium">{sub.grade}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sub.status === "PASS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-sm text-center font-bold">
                    {selectedExam.totalMarks}/{selectedExam.maxTotalMarks}
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-bold">{selectedExam.grade}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      selectedExam.status === "PASS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {selectedExam.status}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
