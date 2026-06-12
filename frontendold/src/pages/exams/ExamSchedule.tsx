

import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  Calendar,
  Clock,
} from "lucide-react";

interface Exam {
  id: string;
  name: string;
  class?: { id: string; name: string };
}

interface Room {
  id: string;
  name: string;
  capacity?: number;
}

interface ScheduleItem {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string;
  startTime: string;
  endTime: string;
  roomId: string;
  roomName: string;
}

interface ScheduleForm {
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  roomId: string;
}

const ExamSchedule: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>({
    subjectId: "",
    date: "",
    startTime: "",
    endTime: "",
    roomId: "",
  });

  useEffect(() => {
    fetchExams();
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchSchedules();
      fetchSubjects();
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

  const fetchRooms = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/room", { headers });
      setRooms(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Failed to load rooms");
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/exam/${selectedExam}/subjects`,
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

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/exam/${selectedExam}/schedule`,
        { headers }
      );
      setSchedules(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ subjectId: "", date: "", startTime: "", endTime: "", roomId: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (schedule: ScheduleItem) => {
    setForm({
      subjectId: schedule.subjectId,
      date: schedule.date?.split("T")[0] || schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      roomId: schedule.roomId,
    });
    setEditingId(schedule.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.subjectId || !form.date || !form.startTime || !form.endTime || !form.roomId) {
      toast.error("Please fill all fields");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, examId: selectedExam };

      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/exam/schedule/${editingId}`,
          payload,
          { headers }
        );
        toast.success("Schedule updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/exam/schedule", payload, {
          headers,
        });
        toast.success("Schedule added successfully");
      }
      resetForm();
      fetchSchedules();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to save schedule";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;
    setDeleting(scheduleId);
    try {
      await axios.delete(
        `http://localhost:5000/api/exam/schedule/${scheduleId}`,
        { headers }
      );
      toast.success("Schedule deleted successfully");
      fetchSchedules();
    } catch (error) {
      toast.error("Failed to delete schedule");
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
            <h1 className="text-2xl font-bold text-gray-900">Exam Schedule</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage exam timetable and room assignments
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
            {/* Add Schedule Form */}
            {showForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingId ? "Edit Schedule" : "Add Schedule"}
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
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
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
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) =>
                        setForm({ ...form, startTime: e.target.value })
                      }
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) =>
                        setForm({ ...form, endTime: e.target.value })
                      }
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room
                    </label>
                    <select
                      value={form.roomId}
                      onChange={(e) =>
                        setForm({ ...form, roomId: e.target.value })
                      }
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                      <option value="">Select Room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} {room.capacity ? `(${room.capacity})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="inline-flex items-center px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {editingId ? "Update" : "Add Schedule"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Schedule List
                  </h2>
                </div>
                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Schedule
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="ml-3 text-gray-500">Loading schedules...</span>
                </div>
              ) : schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Clock className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">
                    No schedules yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add exam schedules with subjects, dates, and rooms
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Schedule
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
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Room
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schedules.map((schedule) => (
                        <tr
                          key={schedule.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {schedule.subjectName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {new Date(schedule.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {schedule.startTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {schedule.endTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {schedule.roomName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEdit(schedule)}
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(schedule.id)}
                                disabled={deleting === schedule.id}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                {deleting === schedule.id ? (
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
          </>
        )}
      </div>
    </div>
  );
};

export default ExamSchedule;

