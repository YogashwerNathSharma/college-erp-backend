import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiSave } from "react-icons/fi";

const API = `${API_BASE_URL}/api`;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } });
const unwrap = (value: any): any[] => {
  const candidates = [value?.data?.data, value?.data, value];
  return candidates.find(Array.isArray) || [];
};

interface Assignment {
  id: string;
  classId: string;
  subjectId: string;
  className?: string;
  subjectName?: string;
  type: string;
}

const AssignSubjectToTeacher = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchYearsAndTeachers = async () => {
    try {
      const [teacherRes, yearRes] = await Promise.all([
        axios.get(`${API}/teacher`, auth()),
        axios.get(`${API}/academic`, auth()),
      ]);
      setTeachers(unwrap(teacherRes.data));
      const years = unwrap(yearRes.data);
      setAcademicYears(years);
      if (!selectedYear && years.length) {
        const current = years.find((y: any) => y.isCurrent) || years.find((y: any) => y.isActive) || years[0];
        if (current?.id) setSelectedYear(current.id);
      }
    } catch (err) {
      console.error("Failed to load teacher/year options", err);
      toast.error("Failed to load teachers or academic years");
    }
  };

  const fetchYearResources = async (yearId: string) => {
    if (!yearId) {
      setClasses([]);
      setSubjects([]);
      return;
    }
    try {
      const params = { academicYearId: yearId };
      const [classRes, subjectRes, teacherRes] = await Promise.all([
        axios.get(`${API}/class`, { ...auth(), params }),
        axios.get(`${API}/subject`, { ...auth(), params }),
        axios.get(`${API}/teacher`, { ...auth(), params }),
      ]);
      setClasses(unwrap(classRes.data));
      setSubjects(unwrap(subjectRes.data));
      setTeachers(unwrap(teacherRes.data));
    } catch (err) {
      console.error("Failed to load academic-year resources", err);
      setClasses([]);
      setSubjects([]);
      toast.error("Failed to load classes or subjects for selected year");
    }
  };

  useEffect(() => { fetchYearsAndTeachers(); }, []);
  useEffect(() => { if (selectedYear) fetchYearResources(selectedYear); }, [selectedYear]);

  useEffect(() => {
    if (selectedTeacher && selectedYear) loadExistingAssignments();
    else setAssignments([]);
  }, [selectedTeacher, selectedYear]);

  const loadExistingAssignments = async () => {
    try {
      const [teacherRes, subjectRes] = await Promise.all([
        axios.get(`${API}/teacher/${selectedTeacher}`, { ...auth(), params: { academicYearId: selectedYear } }),
        axios.get(`${API}/subject`, { ...auth(), params: { academicYearId: selectedYear } }),
      ]);

      if (!teacherRes.data?.success) {
        setAssignments([]);
        return;
      }

      const teacher = teacherRes.data.data || {};
      const yearSubjects = unwrap(subjectRes.data);
      const teacherSubjects = Array.isArray(teacher.subjects) ? teacher.subjects : [];
      const subjectById = new Map(yearSubjects.map((s: any) => [s.id, s]));

      // A teacher subject is stored by subjectId. The class must therefore be
      // resolved from the subject's classId; do not expect classId on the
      // flattened teacher.subjects response.
      const existing: Assignment[] = teacherSubjects
        .map((sub: any, i: number) => {
          const subjectId = sub.id || sub.subjectId || sub.subject?.id || "";
          const resource = subjectById.get(subjectId) || sub.subject || sub;
          const classId = resource?.classId || resource?.class?.id || sub.classId || sub.class?.id || "";
          return {
            id: `existing-${subjectId || i}`,
            classId,
            subjectId,
            className: resource?.class?.name || "",
            subjectName: resource?.name || sub.name || "",
            type: "Theory",
          };
        })
        .filter((a: Assignment) => a.subjectId && a.classId);

      // Keep one row per actual teacher-subject assignment. This is important
      // for class-specific subjects such as Science (VII), Science (VIII) and
      // S.St (VIII); classIds must never be paired by array position.
      setAssignments(existing);
    } catch (err) {
      console.error("Failed to load teacher assignments", err);
      setAssignments([]);
    }
  };

  const addRow = () => setAssignments((prev) => [...prev, { id: `new-${Date.now()}`, classId: "", subjectId: "", type: "Theory" }]);
  const removeRow = (id: string) => setAssignments((prev) => prev.filter((a) => a.id !== id));

  const updateRow = (id: string, field: keyof Assignment, value: string) => {
    setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, [field]: value, ...(field === "classId" ? { subjectId: "" } : {}) } : a));
  };

  const getFilteredSubjects = (classId: string) => subjects.filter((s: any) => s.classId === classId);

  const handleSave = async () => {
    if (!selectedTeacher) return toast.error("Please select a teacher");
    if (!selectedYear) return toast.error("Please select an academic year");
    if (assignments.length === 0) return toast.error("Please add at least one assignment");
    if (assignments.some((a) => !a.classId || !a.subjectId)) return toast.error("Please fill all fields in each row");

    setLoading(true);
    try {
      const subjectIds = [...new Set(assignments.map((a) => a.subjectId))];
      const classIds = [...new Set(assignments.map((a) => a.classId))];
      const res = await axios.put(`${API}/teacher/${selectedTeacher}`, { subjectIds, classIds, academicYearId: selectedYear }, auth());
      if (res.data?.success) {
        toast.success("Assignments saved successfully");
        await loadExistingAssignments();
      } else {
        toast.error(res.data?.message || "Failed to save assignments");
      }
    } catch (err: any) {
      console.error("Assignment save failed", err?.response?.data || err);
      toast.error(err?.response?.data?.message || "Failed to save assignments");
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full min-w-0 h-11 px-3 bg-transparent border border-slate-500 rounded-lg text-sm text-inherit outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

  return (
    <div className="w-full min-w-0 p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Assign Subject to Teacher</h1>

      <div className="w-full min-w-0 rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-1">Teacher <span className="text-red-500">*</span></label>
            <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className={selectClass}>
              <option value="">Select Teacher</option>
              {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim()}</option>)}
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-1">Academic Year <span className="text-red-500">*</span></label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={selectClass}>
              <option value="">Select Year</option>
              {academicYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedTeacher && selectedYear && (
        <div className="w-full min-w-0 rounded-lg shadow overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="border-b"><tr><th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Class</th><th className="px-4 py-3 text-left">Subject</th><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-center">Action</th></tr></thead>
              <tbody>{assignments.map((row, index) => (
                <tr key={row.id} className="border-b">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3"><select value={row.classId} onChange={(e) => updateRow(row.id, "classId", e.target.value)} className={selectClass}><option value="">Select Class</option>{classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></td>
                  <td className="px-4 py-3"><select value={row.subjectId} onChange={(e) => updateRow(row.id, "subjectId", e.target.value)} className={selectClass}><option value="">Select Subject</option>{getFilteredSubjects(row.classId).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
                  <td className="px-4 py-3"><select value={row.type} onChange={(e) => updateRow(row.id, "type", e.target.value)} className={selectClass}><option value="Theory">Theory</option><option value="Practical">Practical</option></select></td>
                  <td className="px-4 py-3 text-center"><button type="button" onClick={() => removeRow(row.id)} className="p-2 text-red-500 rounded-lg"><FiTrash2 size={18} /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div className="md:hidden p-3 space-y-3">
            {assignments.length === 0 && <div className="rounded-lg border border-slate-600 p-4 text-center text-sm opacity-80">No assignments yet. Tap “Add More” to create one.</div>}
            {assignments.map((row, index) => (
              <div key={row.id} className="rounded-xl border border-slate-600 p-3 space-y-3 overflow-hidden">
                <div className="flex items-center justify-between"><span className="text-sm font-semibold">Assignment {index + 1}</span><button type="button" onClick={() => removeRow(row.id)} aria-label={`Remove assignment ${index + 1}`} className="p-2 text-red-500 rounded-lg"><FiTrash2 size={18} /></button></div>
                <div><label className="block text-xs font-medium mb-1">Class</label><select value={row.classId} onChange={(e) => updateRow(row.id, "classId", e.target.value)} className={selectClass}><option value="">Select Class</option>{classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="block text-xs font-medium mb-1">Subject</label><select value={row.subjectId} onChange={(e) => updateRow(row.id, "subjectId", e.target.value)} className={selectClass}><option value="">Select Subject</option>{getFilteredSubjects(row.classId).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="block text-xs font-medium mb-1">Type</label><select value={row.type} onChange={(e) => updateRow(row.id, "type", e.target.value)} className={selectClass}><option value="Theory">Theory</option><option value="Practical">Practical</option></select></div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-between p-3 sm:p-4 border-t">
            <button type="button" onClick={addRow} className="w-full sm:w-auto min-h-11 flex items-center justify-center gap-2 px-4 py-2 text-primary-600 border border-primary-600 rounded-lg"><FiPlus size={18} /> Add More</button>
            <button type="button" onClick={handleSave} disabled={loading} className="w-full sm:w-auto min-h-11 flex items-center justify-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg"><FiSave size={18} /> {loading ? "Saving..." : "Save Assignment"}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignSubjectToTeacher;
