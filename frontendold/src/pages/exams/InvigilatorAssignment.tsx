
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  UserCheck,
  X,
  Shield,
} from "lucide-react";

interface Exam {
  id: string;
  name: string;
  class?: { id: string; name: string };
}

interface ScheduleItem {
  id: string;
  subjectName: string;
  date: string;
  startTime: string;
  endTime: string;
  roomName: string;
}

interface Teacher {
  id: string;
  name: string;
  department?: string;
}

interface InvigilatorItem {
  id: string;
  scheduleId: string;
  subjectName: string;
  date: string;
  roomName: string;
  teacherId: string;
  teacherName: string;
  role: string;
}

interface AssignForm {
  scheduleId: string;
  teacherId: string;
  role: string;
}

const InvigilatorAssignment: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [invigilators, setInvigilators] = useState<InvigilatorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AssignForm>({
    scheduleId: "",
    teacherId: "",
    role: "Chief",
  });

  useEffect(() => {
    fetchExams();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchSchedules();
    }
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/exam", { headers });
      setExams(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Failed to load exams");
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/teacher", {
        headers,
      });
      setTeachers(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Failed to load teachers");
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/exam/${selectedExam}/schedule`,
        { headers }
      );
      const schedulesData = res.data?.data || res.data || [];
      setSchedules(schedulesData);

      // Fetch invigilators for all schedules
      const allInvigilators: InvigilatorItem[] = [];
      for (const sch of schedulesData) {
        try {
          const invRes = await axios.get(
            `http://localhost:5000/api/exam/invigilators/${sch.id}`,
            { headers }
          );
          const invData = invRes.data?.data || invRes.data || [];
          allInvigilators.push(...invData);
        } catch {
          // Skip if no invigilators
        }
      }
      setInvigilators(allInvigilators);
    } catch (error) {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ scheduleId: "", teacherId: "", role: "Chief" });
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.scheduleId || !form.teacherId || !form.role) {
      toast.error("Please fill all fields");
      return;
    }

    setSaving(true);
    try {
      await axios.post("http://localhost:5000/api/exam/invigilators", form, {
        headers,
      });
      toast.success("Invigilator assigned successfully");
      resetForm();
      fetchSchedules();
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to assign invigilator";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    if (!window.confirm("Remove this invigilator assignment?")) return;
    setDeleting(assignmentId);
    try {
      await axios.delete(
        `http://localhost:5000/api/exam/invigilators/${assignmentId}`,
        { headers }
      );
      toast.success("Invigilator removed successfully");
      fetchSchedules();
    } catch (error) {
      toast.error("Failed to remove invigilator");
    } finally {
      setDeleting(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const isChief = role?.toLowerCase() === "chief";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isChief
            ? "bg-indigo-100 text-indigo-800"
            : "bg-blue-100 text-blue-800"
        }`}
      >
        {role}
      </span>
    );
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
              Invigilator Assignment
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Assign teachers as invigilators for exam schedules
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
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
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
            {/* Assignment Form */}
            {showForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Assign Invigilator
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Schedule
                    </label>
                    <select
                      value={form.scheduleId}
                      onChange={(e) =>
                        setForm({ ...form, scheduleId: e.target.value })
                      }
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                      <option value="">Select Schedule</option>
                      {schedules.map((sch) => (
                        <option key={sch.id} value={sch.id}>
                          {sch.subjectName} -{" "}
                          {new Date(sch.date).toLocaleDateString()} ({sch.roomName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teacher
                    </label>
                    <select
                      value={form.teacherId}
                      onChange={(e) =>
                        setForm({ ...form, teacherId: e.target.value })
                      }
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}{" "}
                          {teacher.department ? `(${teacher.department})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                      <option value="Chief">Chief Invigilator</option>
                      <option value="Assistant">Assistant Invigilator</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Invigilators Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Assigned Invigilators
                  </h2>
                </div>
                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Assign Invigilator
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="ml-3 text-gray-500">Loading...</span>
                </div>
              ) : invigilators.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <UserCheck className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">
                    No invigilators assigned
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Assign teachers to exam schedules as invigilators
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Invigilator
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Schedule
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teacher
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invigilators.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {inv.subjectName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {inv.date
                                ? new Date(inv.date).toLocaleDateString()
                                : ""}{" "}
                              • {inv.roomName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {inv.teacherName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getRoleBadge(inv.role)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleRemove(inv.id)}
                              disabled={deleting === inv.id}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Remove"
                            >
                              {deleting === inv.id ? (
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

export default InvigilatorAssignment;

