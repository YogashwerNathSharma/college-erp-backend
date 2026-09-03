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
      const res = await axios.get(`${API}/teacher/${selectedTeacher}`, { ...auth(), params: { academicYearId: selectedYear } });
      if (!res.data?.success) return;
      const t = res.data.data || {};
      const existing: Assignment[] = (t.subjects || []).map((sub: any, i: number) => ({
        id: `existing-${i}`,
        classId: sub.classId || sub.class?.id || "",
        subjectId: sub.id || sub.subjectId || sub.subject?.id || "",
        subjectName: sub.name || sub.subject?.name,
        type: "Theory",
      })).filter((a: Assignment) => a.subjectId);
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
      if (res.data?.success) toast.success("Assignments saved successfully");
      else toast.error(res.data?.message || "Failed to save assignments");
    } catch (err: any) {
      console.error("Assignment save failed", err?.response?.data || err);
      toast.error(err?.response?.data?.message || "Failed to save assignments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Assign Subject to Teacher</h1>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher <span className="text-red-500">*</span></label>
            <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Select Teacher</option>
              {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year <span className="text-red-500">*</span></label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Select Year</option>
              {academicYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedTeacher && selectedYear && (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Class</th><th className="px-4 py-3 text-left">Subject</th><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-center">Action</th></tr></thead>
              <tbody>
                {assignments.map((row, index) => (
                  <tr key={row.id} className="border-b">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3"><select value={row.classId} onChange={(e) => updateRow(row.id, "classId", e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-sm"><option value="">Select Class</option>{classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></td>
                    <td className="px-4 py-3"><select value={row.subjectId} onChange={(e) => updateRow(row.id, "subjectId", e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-sm"><option value="">Select Subject</option>{getFilteredSubjects(row.classId).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
                    <td className="px-4 py-3"><select value={row.type} onChange={(e) => updateRow(row.id, "type", e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-sm"><option value="Theory">Theory</option><option value="Practical">Practical</option></select></td>
                    <td className="px-4 py-3 text-center"><button type="button" onClick={() => removeRow(row.id)} className="p-2 text-red-600 rounded-lg"><FiTrash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center p-4 border-t">
            <button type="button" onClick={addRow} className="flex items-center gap-2 px-4 py-2 text-primary-600 border border-primary-600 rounded-lg"><FiPlus size={16} /> Add More</button>
            <button type="button" onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"><FiSave size={16} /> {loading ? "Saving..." : "Save Assignment"}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignSubjectToTeacher;
