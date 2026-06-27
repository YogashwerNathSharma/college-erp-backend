

import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Loader2,
  FileText,
  X,
  ExternalLink,
} from "lucide-react";

interface Exam {
  id: string;
  name: string;
  class?: { id: string; name: string };
}

interface Subject {
  id: string;
  name: string;
}

interface QuestionPaperItem {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  fileUrl: string;
  uploadedAt: string;
}

interface PaperForm {
  subjectId: string;
  title: string;
  fileUrl: string;
}

const QuestionPaper: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [papers, setPapers] = useState<QuestionPaperItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PaperForm>({
    subjectId: "",
    title: "",
    fileUrl: "",
  });

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchPapers();
      fetchSubjects();
    }
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await axios.get("/api/exam", { headers });
      setExams(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Failed to load exams");
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(
        `/api/exam/${selectedExam}/subjects`,
        { headers }
      );
      const data = res.data?.data || res.data || [];
      setSubjects(
        data.map((s: any) => ({
          id: s.subject?.id || s.subjectId || s.id,
          name: s.subject?.name || s.subjectName || s.name,
        }))
      );
    } catch (error) {
      toast.error("Failed to load subjects");
    }
  };

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/exam/${selectedExam}/question-papers`,
        { headers }
      );
      setPapers(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Failed to load question papers");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ subjectId: "", title: "", fileUrl: "" });
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.subjectId || !form.title || !form.fileUrl) {
      toast.error("Please fill all fields");
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        "/api/exam/question-papers",
        { ...form, examId: selectedExam },
        { headers }
      );
      toast.success("Question paper uploaded successfully");
      resetForm();
      fetchPapers();
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to upload question paper";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (paperId: string) => {
    if (!window.confirm("Are you sure you want to delete this question paper?"))
      return;
    setDeleting(paperId);
    try {
      await axios.delete(
        `/api/exam/question-papers/${paperId}`,
        { headers }
      );
      toast.success("Question paper deleted successfully");
      fetchPapers();
    } catch (error) {
      toast.error("Failed to delete question paper");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/exams")}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Question Papers
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload and manage exam question papers
            </p>
          </div>
        </div>

        {/* Exam Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Exam
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="">-- Select Exam --</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} {exam.class ? `(${exam.class.name})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedExam && (
          <>
            {/* Upload Form */}
            {showForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Upload Question Paper
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <select
                      value={form.subjectId}
                      onChange={(e) =>
                        setForm({ ...form, subjectId: e.target.value })
                      }
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      placeholder="e.g., Mid-Term Math Paper"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File URL
                    </label>
                    <input
                      type="text"
                      value={form.fileUrl}
                      onChange={(e) =>
                        setForm({ ...form, fileUrl: e.target.value })
                      }
                      placeholder="https://... or /uploads/..."
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="inline-flex items-center px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload Paper
                  </button>
                </div>
              </div>
            )}

            {/* Papers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Question Papers
                  </h2>
                </div>
                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Upload Paper
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                  <span className="ml-3 text-gray-500">
                    Loading question papers...
                  </span>
                </div>
              ) : papers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <FileText className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">
                    No question papers uploaded
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload question papers for this exam
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Paper
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded On
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {papers.map((paper) => (
                        <tr
                          key={paper.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {paper.subjectName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {paper.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <a
                              href={paper.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-primary-600 hover:text-primary-800 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 mr-1" />
                              View File
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {paper.uploadedAt
                              ? new Date(paper.uploadedAt).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDelete(paper.id)}
                              disabled={deleting === paper.id}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deleting === paper.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionPaper;

