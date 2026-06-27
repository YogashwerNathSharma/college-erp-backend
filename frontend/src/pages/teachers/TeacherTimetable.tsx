

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { FiCalendar, FiSave, FiX, FiEdit2 } from "react-icons/fi";

const API = `${API_BASE_URL}/api`;

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_SLOTS = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 01:00", // Break
  "01:00 - 02:00",
  "02:00 - 03:00",
  "03:00 - 04:00",
];

interface TimetableEntry {
  id?: string;
  day: string;
  period: number;
  subjectId?: string;
  classId?: string;
  sectionId?: string;
  subject?: { id: string; name: string };
  class?: { id: string; name: string };
  section?: { id: string; name: string };
}

interface EditingCell {
  day: string;
  period: number;
}

const TeacherTimetable = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [viewMode, setViewMode] = useState<"Weekly" | "Daily">("Weekly");
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Edit state
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [cellClassId, setCellClassId] = useState("");
  const [cellSectionId, setCellSectionId] = useState("");
  const [cellSubjectId, setCellSubjectId] = useState("");

  // Dropdown options
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);

  // Pending changes (unsaved)
  const [pendingChanges, setPendingChanges] = useState<TimetableEntry[]>([]);

  const token = localStorage.getItem("token");

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API}/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setTeachers(res.data.data?.data || []);
      }
    } catch (err) {
      toast.error("Failed to load teachers");
    }
  };

  const fetchOptions = async () => {
    try {
      const [classRes, sectionRes, subRes] = await Promise.all([
        axios.get(`${API}/class`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/section`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setClasses(classRes.data.data?.data || classRes.data.data || []);
      setSections(sectionRes.data.data?.data || sectionRes.data.data || []);
      setSubjects(subRes.data.data?.data || subRes.data.data || []);
    } catch (err) {
      console.error("Failed to load options");
    }
  };

  const fetchTimetable = async () => {
    if (!selectedTeacher) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/timetable?teacherId=${selectedTeacher}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setTimetable(res.data.data?.data || res.data.data || []);
        setPendingChanges([]);
      }
    } catch (err) {
      toast.error("Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchOptions();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      fetchTimetable();
      setEditMode(false);
    }
  }, [selectedTeacher]);

  // Filter sections when class changes
  useEffect(() => {
    if (cellClassId) {
      setFilteredSections(sections.filter((s: any) => s.classId === cellClassId));
      setFilteredSubjects(subjects.filter((s: any) => s.classId === cellClassId));
    } else {
      setFilteredSections([]);
      setFilteredSubjects([]);
    }
  }, [cellClassId, sections, subjects]);

  const getEntry = (day: string, period: number): TimetableEntry | undefined => {
    // Check pending changes first
    const pending = pendingChanges.find((t) => t.day === day && t.period === period);
    if (pending) return pending;
    return timetable.find((t) => t.day === day && t.period === period);
  };

  const handleCellClick = (day: string, period: number) => {
    if (!editMode) return;
    const isBreak = TIME_SLOTS[period - 1] === "12:00 - 01:00";
    if (isBreak) return;

    const existing = getEntry(day, period);
    setEditingCell({ day, period });
    setCellClassId(existing?.classId || existing?.class?.id || "");
    setCellSectionId(existing?.sectionId || existing?.section?.id || "");
    setCellSubjectId(existing?.subjectId || existing?.subject?.id || "");
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    if (!cellClassId || !cellSectionId || !cellSubjectId) {
      toast.error("Please select class, section, and subject");
      return;
    }

    const classObj = classes.find((c: any) => c.id === cellClassId);
    const sectionObj = filteredSections.find((s: any) => s.id === cellSectionId);
    const subjectObj = filteredSubjects.find((s: any) => s.id === cellSubjectId);

    const newEntry: TimetableEntry = {
      day: editingCell.day,
      period: editingCell.period,
      classId: cellClassId,
      sectionId: cellSectionId,
      subjectId: cellSubjectId,
      class: classObj ? { id: classObj.id, name: classObj.name } : undefined,
      section: sectionObj ? { id: sectionObj.id, name: sectionObj.name } : undefined,
      subject: subjectObj ? { id: subjectObj.id, name: subjectObj.name } : undefined,
    };

    // Add to pending changes (replace if same day+period exists)
    setPendingChanges((prev) => {
      const filtered = prev.filter(
        (p) => !(p.day === editingCell.day && p.period === editingCell.period)
      );
      return [...filtered, newEntry];
    });

    setEditingCell(null);
    setCellClassId("");
    setCellSectionId("");
    setCellSubjectId("");
  };

  const handleCellClear = () => {
    if (!editingCell) return;
    // Mark as cleared (empty entry)
    setPendingChanges((prev) => {
      const filtered = prev.filter(
        (p) => !(p.day === editingCell.day && p.period === editingCell.period)
      );
      return [...filtered, { day: editingCell.day, period: editingCell.period, classId: "", sectionId: "", subjectId: "" }];
    });
    setEditingCell(null);
  };

  const handleSaveAll = async () => {
    if (pendingChanges.length === 0) {
      toast.error("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const entries = pendingChanges
        .filter((p) => p.classId && p.sectionId && p.subjectId)
        .map((p) => ({
          classId: p.classId,
          sectionId: p.sectionId,
          subjectId: p.subjectId,
          teacherId: selectedTeacher,
          day: p.day,
          period: p.period,
        }));

      // Delete entries that were cleared
      const clearedEntries = pendingChanges
        .filter((p) => !p.classId || !p.sectionId || !p.subjectId)
        .map((p) => ({ day: p.day, period: p.period }));

      // Save via API
      const res = await axios.post(
        `${API}/timetable/bulk`,
        {
          teacherId: selectedTeacher,
          entries,
          clearedEntries,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Timetable saved successfully!");
        setPendingChanges([]);
        fetchTimetable();
        setEditMode(false);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save timetable");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setPendingChanges([]);
    setEditingCell(null);
  };

  const selectedTeacherName = teachers.find((t) => t.id === selectedTeacher)?.name || "";

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Timetable</h1>
        {selectedTeacher && (
          <div className="flex gap-2">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                <FiEdit2 size={16} />
                Edit Timetable
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveAll}
                  disabled={saving || pendingChanges.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  <FiSave size={16} />
                  {saving ? "Saving..." : `Save Changes (${pendingChanges.length})`}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <FiX size={16} />
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="Weekly">Weekly</option>
              <option value="Daily">Daily</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
            <input
              type="week"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {editMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <span className="text-yellow-600 font-medium text-sm">
            ✏️ Edit Mode — Click on any cell to assign subject. Click "Save Changes" when done.
          </span>
        </div>
      )}

      {/* Timetable Grid */}
      {selectedTeacher && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <FiCalendar className="text-primary-600" />
            <span className="font-medium text-gray-700">{selectedTeacherName}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 w-32">
                      Time
                    </th>
                    {DAYS.map((day, i) => (
                      <th
                        key={day}
                        className="px-3 py-3 text-center text-sm font-semibold text-gray-600"
                      >
                        {DAY_LABELS[i]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, periodIndex) => (
                    <tr key={periodIndex} className="border-b">
                      <td className="px-3 py-4 text-sm text-gray-600 font-medium">{slot}</td>
                      {DAYS.map((day) => {
                        const entry = getEntry(day, periodIndex + 1);
                        const isBreak = slot === "12:00 - 01:00";
                        const isEditing =
                          editingCell?.day === day && editingCell?.period === periodIndex + 1;
                        const isPending = pendingChanges.some(
                          (p) => p.day === day && p.period === periodIndex + 1
                        );

                        return (
                          <td key={day} className="px-2 py-2 text-center relative">
                            {isBreak ? (
                              <div className="bg-gray-100 rounded-lg p-2">
                                <span className="text-sm text-gray-500 font-medium">Break</span>
                              </div>
                            ) : isEditing ? (
                              /* ─── EDIT POPUP ─── */
                              <div className="absolute z-50 top-0 left-0 w-64 bg-white border-2 border-primary-500 rounded-lg shadow-xl p-3 space-y-2">
                                <select
                                  value={cellClassId}
                                  onChange={(e) => {
                                    setCellClassId(e.target.value);
                                    setCellSectionId("");
                                    setCellSubjectId("");
                                  }}
                                  className="w-full px-2 py-1.5 border rounded text-sm"
                                >
                                  <option value="">Select Class</option>
                                  {classes.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                                <select
                                  value={cellSectionId}
                                  onChange={(e) => setCellSectionId(e.target.value)}
                                  className="w-full px-2 py-1.5 border rounded text-sm"
                                >
                                  <option value="">Select Section</option>
                                  {filteredSections.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                                <select
                                  value={cellSubjectId}
                                  onChange={(e) => setCellSubjectId(e.target.value)}
                                  className="w-full px-2 py-1.5 border rounded text-sm"
                                >
                                  <option value="">Select Subject</option>
                                  {filteredSubjects.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                                <div className="flex gap-1">
                                  <button
                                    onClick={handleCellSave}
                                    className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                  >
                                    ✓ Assign
                                  </button>
                                  <button
                                    onClick={handleCellClear}
                                    className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200"
                                  >
                                    Clear
                                  </button>
                                  <button
                                    onClick={() => setEditingCell(null)}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : entry && entry.subject?.name ? (
                              /* ─── FILLED CELL ─── */
                              <div
                                onClick={() => handleCellClick(day, periodIndex + 1)}
                                className={`rounded-lg p-2 transition cursor-pointer ${
                                  isPending
                                    ? "bg-green-50 border-2 border-green-300"
                                    : "bg-primary-50 border border-primary-200"
                                } ${editMode ? "hover:ring-2 hover:ring-blue-400" : ""}`}
                              >
                                <p className="text-sm font-medium text-primary-700">
                                  {entry.subject?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {entry.class?.name}
                                  {entry.section ? ` - ${entry.section.name}` : ""}
                                </p>
                              </div>
                            ) : (
                              /* ─── EMPTY CELL ─── */
                              <div
                                onClick={() => handleCellClick(day, periodIndex + 1)}
                                className={`bg-gray-50 rounded-lg p-2 transition ${
                                  editMode
                                    ? "cursor-pointer hover:bg-primary-50 hover:border-primary-300 border-2 border-dashed border-gray-200"
                                    : ""
                                }`}
                              >
                                <span className="text-xs text-gray-400">
                                  {editMode ? "+ Assign" : "Free Period"}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedTeacher && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FiCalendar className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Select a teacher to view their timetable</p>
        </div>
      )}
    </div>
  );
};

export default TeacherTimetable;

