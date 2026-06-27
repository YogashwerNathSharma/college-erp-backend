
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiX, FiAlertTriangle } from "react-icons/fi";

const DAYS = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface TimetableEntry {
  id: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  day: string;
  period: number;
  subject: { id: string; name: string };
  teacher: { id: string; name: string };
}

interface Props {
  classId: string;
  sectionId: string;
  editEntry: TimetableEntry | null;
  prefillDay: string;
  prefillPeriod: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface SubjectItem {
  id: string;
  name: string;
  classId: string;
}

interface TeacherItem {
  id: string;
  name: string;
}

const TimetableForm = ({
  classId,
  sectionId,
  editEntry,
  prefillDay,
  prefillPeriod,
  onClose,
  onSuccess,
}: Props) => {
  const [day, setDay] = useState(editEntry?.day || prefillDay || "");
  const [period, setPeriod] = useState<number>(
    editEntry?.period || prefillPeriod || 0
  );
  const [subjectId, setSubjectId] = useState(editEntry?.subjectId || "");
  const [teacherId, setTeacherId] = useState(editEntry?.teacherId || "");

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState("");

  // ✅ Fetch subjects for the selected class
  useEffect(() => {
    if (!classId) return;
    axios
      .get("/api/subjects")
      .then((res) => {
        const allSubjects = res.data?.data || res.data?.subjects || res.data;
        const arr = Array.isArray(allSubjects) ? allSubjects : [];
        const filtered = arr.filter(
          (s: SubjectItem) => s.classId === classId
        );
        setSubjects(filtered);
      })
      .catch(() => toast.error("Failed to load subjects"));
  }, [classId]);

  // 🆕 Fetch teachers ONLY for selected subject (cascading dropdown)
  useEffect(() => {
    if (!subjectId) {
      setTeachers([]);
      setTeacherId("");
      return;
    }

    setLoadingTeachers(true);
    setTeacherId(""); // Reset teacher when subject changes

    axios
      .get(`/api/timetable/teachers-by-subject/${subjectId}`)
      .then((res) => {
        const data = res.data?.data || res.data;
        const list: TeacherItem[] = Array.isArray(data)
          ? data.map((t: any) => ({
              id: t.id || t._id || "",
              name: t.name || "No Name",
            }))
          : [];
        setTeachers(list);

        // If editing and teacher was previously selected, keep it
        if (editEntry && editEntry.subjectId === subjectId) {
          setTeacherId(editEntry.teacherId);
        }
      })
      .catch(() => {
        toast.error("Failed to load teachers for this subject");
        setTeachers([]);
      })
      .finally(() => setLoadingTeachers(false));
  }, [subjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!day || !period || !subjectId || !teacherId) {
      toast.error("Please fill all fields");
      return;
    }

    setSaving(true);
    setConflict("");

    try {
      if (editEntry) {
        await axios.delete(`/api/timetable/${editEntry.id}`);
        await axios.post("/api/timetable", {
          classId,
          sectionId,
          subjectId,
          teacherId,
          day,
          period,
        });
        toast.success("Timetable entry updated");
      } else {
        await axios.post("/api/timetable", {
          classId,
          sectionId,
          subjectId,
          teacherId,
          day,
          period,
        });
        toast.success("Timetable entry added");
      }
      onSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Failed to save timetable entry";
      if (
        msg.includes("already") ||
        msg.includes("conflict") ||
        msg.includes("assigned")
      ) {
        setConflict(msg);
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {editEntry ? "Edit Entry" : "Add Timetable Entry"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day <span className="text-red-500">*</span>
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Day</option>
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period <span className="text-red-500">*</span>
            </label>
            <select
              value={period || ""}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Period</option>
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  Period {p}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {subjects.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No subjects found for this class
              </p>
            )}
          </div>

          {/* Teacher — Now depends on Subject selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teacher <span className="text-red-500">*</span>
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={!subjectId || loadingTeachers}
            >
              <option value="">
                {!subjectId
                  ? "Select subject first"
                  : loadingTeachers
                  ? "Loading teachers..."
                  : "Select Teacher"}
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {subjectId && !loadingTeachers && teachers.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No teacher assigned to this subject. Assign in Teachers section.
              </p>
            )}
          </div>

          {/* Conflict Warning */}
          {conflict && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <FiAlertTriangle className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">{conflict}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : editEntry ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimetableForm;
