
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Loader2, BookOpen } from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface ExamSubject {
  id?: string;
  subjectId: string;
  subjectName?: string;
  maxMarks: number;
  passingMarks: number;
}

interface Exam {
  id: string;
  name: string;
  type: string;
  class?: { id: string; name: string };
}

const ExamSubjects: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [exam, setExam] = useState<Exam | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examRes, subjectRes, examSubjectsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/exam/${id}`, { headers }),
        axios.get("http://localhost:5000/api/subjects", { headers }),
        axios
          .get(`http://localhost:5000/api/exam/${id}/subjects`, { headers })
          .catch(() => ({ data: { data: [] } })),
      ]);

      setExam(examRes.data?.data || examRes.data);
      setSubjects(subjectRes.data?.data || subjectRes.data || []);

      const existingSubjects =
        examSubjectsRes.data?.data || examSubjectsRes.data || [];
      if (existingSubjects.length > 0) {
        setExamSubjects(
          existingSubjects.map((s: any) => ({
            id: s.id,
            subjectId: s.subject?.id || s.subjectId,
            subjectName: s.subject?.name || s.subjectName,
            maxMarks: s.maxMarks,
            passingMarks: s.passingMarks,
          }))
        );
      } else {
        setExamSubjects([{ subjectId: "", maxMarks: 100, passingMarks: 33 }]);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    setExamSubjects((prev) => [
      ...prev,
      { subjectId: "", maxMarks: 100, passingMarks: 33 },
    ]);
  };

  const removeRow = (index: number) => {
    if (examSubjects.length === 1) {
      toast.error("At least one subject is required");
      return;
    }
    setExamSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (
    index: number,
    field: keyof ExamSubject,
    value: string | number
  ) => {
    setExamSubjects((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSave = async () => {
    // Validation
    for (let i = 0; i < examSubjects.length; i++) {
      const sub = examSubjects[i];
      if (!sub.subjectId) {
        toast.error(`Row ${i + 1}: Please select a subject`);
        return;
      }
      if (!sub.maxMarks || sub.maxMarks <= 0) {
        toast.error(`Row ${i + 1}: Max marks must be greater than 0`);
        return;
      }
      if (!sub.passingMarks || sub.passingMarks <= 0) {
        toast.error(`Row ${i + 1}: Passing marks must be greater than 0`);
        return;
      }
      if (sub.passingMarks > sub.maxMarks) {
        toast.error(`Row ${i + 1}: Passing marks cannot exceed max marks`);
        return;
      }
    }

    // Check duplicates
    const subjectIds = examSubjects.map((s) => s.subjectId);
    const hasDuplicates = new Set(subjectIds).size !== subjectIds.length;
    if (hasDuplicates) {
      toast.error("Duplicate subjects found. Each subject can only be added once.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        examId: id,
        subjects: examSubjects.map((s) => ({
          subjectId: s.subjectId,
          maxMarks: Number(s.maxMarks),
          passingMarks: Number(s.passingMarks),
        })),
      };

      await axios.post("http://localhost:5000/api/exam/subjects", payload, {
        headers,
      });
      toast.success("Subjects saved successfully");
      fetchData();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to save subjects";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-gray-600">Loading subjects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/exams")}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Exam Subjects</h1>
            {exam && (
              <p className="mt-1 text-sm text-gray-500">
                {exam.name} • {exam.class?.name || ""} •{" "}
                {exam.type?.replace("_", " ")}
              </p>
            )}
          </div>
        </div>

        {/* Subjects Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Subject Configuration
              </h2>
            </div>
            <button
              onClick={addRow}
              className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Subject
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Max Marks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Passing Marks
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examSubjects.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={row.subjectId}
                        onChange={(e) =>
                          updateRow(index, "subjectId", e.target.value)
                        }
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        value={row.maxMarks}
                        onChange={(e) =>
                          updateRow(index, "maxMarks", Number(e.target.value))
                        }
                        min={1}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        placeholder="100"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        value={row.passingMarks}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "passingMarks",
                            Number(e.target.value)
                          )
                        }
                        min={1}
                        max={row.maxMarks}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        placeholder="33"
                      />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => removeRow(index)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-500">
              {examSubjects.length} subject(s) configured
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save All Subjects
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSubjects;

