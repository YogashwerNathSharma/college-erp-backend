
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiSave } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "/api";

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

  const token = localStorage.getItem("token");

  const fetchOptions = async () => {
    try {
      const [teacherRes, yearRes, classRes, subRes] = await Promise.all([
        axios.get(`${API}/teacher`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/academic`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/class`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setTeachers(teacherRes.data.data?.data || []);
      setAcademicYears(yearRes.data.data?.data || yearRes.data.data || []);
      setClasses(classRes.data.data?.data || classRes.data.data || []);
      setSubjects(subRes.data.data?.data || subRes.data.data || []);
    } catch (err) {
      toast.error("Failed to load options");
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  // Load existing assignments when teacher changes
  useEffect(() => {
    if (selectedTeacher) {
      loadExistingAssignments();
    }
  }, [selectedTeacher]);

  const loadExistingAssignments = async () => {
    try {
      const res = await axios.get(`${API}/teacher/${selectedTeacher}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const t = res.data.data;
        const existing: Assignment[] = t.subjects?.map((sub: any, i: number) => ({
          id: `existing-${i}`,
          classId: sub.classId || "",
          subjectId: sub.id,
          subjectName: sub.name,
          type: "Theory",
        })) || [];
        setAssignments(existing);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addRow = () => {
    setAssignments([
      ...assignments,
      { id: `new-${Date.now()}`, classId: "", subjectId: "", type: "Theory" },
    ]);
  };

  const removeRow = (id: string) => {
    setAssignments(assignments.filter((a) => a.id !== id));
  };

  const updateRow = (id: string, field: string, value: string) => {
    setAssignments(
      assignments.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const getFilteredSubjects = (classId: string) => {
    return subjects.filter((s: any) => s.classId === classId);
  };

  const handleSave = async () => {
    if (!selectedTeacher) return toast.error("Please select a teacher");
    if (assignments.length === 0) return toast.error("Please add at least one assignment");

    const invalidRows = assignments.filter((a) => !a.classId || !a.subjectId);
    if (invalidRows.length > 0) {
      return toast.error("Please fill all fields in each row");
    }

    setLoading(true);
    try {
      const subjectIds = assignments.map((a) => a.subjectId);
      const classIds = [...new Set(assignments.map((a) => a.classId))];

      const res = await axios.put(
        `${API}/teacher/${selectedTeacher}`,
        { subjectIds, classIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Assignments saved successfully");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Assign Subject to Teacher</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teacher <span className="text-red-500">*</span>
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Select Year</option>
              {academicYears.map((y: any) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignment Table */}
      {selectedTeacher && (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Class</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((row, index) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3">
                      <select
                        value={row.classId}
                        onChange={(e) => updateRow(row.id, "classId", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                      >
                        <option value="">Select Class</option>
                        {classes.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.subjectId}
                        onChange={(e) => updateRow(row.id, "subjectId", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                      >
                        <option value="">Select Subject</option>
                        {getFilteredSubjects(row.classId).map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.type}
                        onChange={(e) => updateRow(row.id, "type", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                      >
                        <option value="Theory">Theory</option>
                        <option value="Practical">Practical</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center p-4 border-t">
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition"
            >
              <FiPlus size={16} /> Add More
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              <FiSave size={16} /> {loading ? "Saving..." : "Save Assignment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignSubjectToTeacher;
