
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

interface OldStudentRow {
  firstName: string; lastName: string; gender: string; dob: string;
  address: string; admissionNo: string; srNo: string;
  fatherName: string; motherName: string; parentPhone: string;
  classId: string; sectionId: string; rollNumber: string;
}

const emptyRow: OldStudentRow = {
  firstName: "", lastName: "", gender: "Male", dob: "", address: "",
  admissionNo: "", srNo: "", fatherName: "", motherName: "",
  parentPhone: "", classId: "", sectionId: "", rollNumber: "",
};

export default function OldStudentEntry() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<OldStudentRow[]>([{ ...emptyRow }]);
  const [academicYearId, setAcademicYearId] = useState("");

  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sectionsMap, setSectionsMap] = useState<Record<string, any[]>>({});

  useEffect(() => { fetchAcademicYears(); fetchClasses(); }, []);

  const fetchAcademicYears = async () => {
    try { const res = await axios.get("/api/academic"); setAcademicYears(res.data.data || []); } catch (err) { console.error(err); }
  };

  const fetchClasses = async () => {
    try { const res = await axios.get("/api/class"); setClasses(res.data.data || []); } catch (err) { console.error(err); }
  };

  const fetchSections = async (classId: string) => {
    if (sectionsMap[classId]) return;
    try {
      const res = await axios.get(`/api/section?classId=${classId}`);
      setSectionsMap((prev) => ({ ...prev, [classId]: res.data.data || [] }));
    } catch (err) { console.error(err); }
  };

  const addRow = () => { setStudents([...students, { ...emptyRow }]); };

  const removeRow = (index: number) => {
    if (students.length === 1) return;
    setStudents(students.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof OldStudentRow, value: string) => {
    const updated = [...students];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "classId" && value) { fetchSections(value); updated[index].sectionId = ""; }
    setStudents(updated);
  };

  const handleSubmit = async () => {
    if (!academicYearId) { toast.error("Please select academic year"); return; }
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (!s.firstName || !s.lastName || !s.dob || !s.admissionNo || !s.fatherName || !s.motherName || !s.parentPhone || !s.classId || !s.sectionId) {
        toast.error(`Row ${i + 1}: Please fill all required fields`); return;
      }
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/students/bulk-old-entry", { students, academicYearId });
      const { success, failed } = res.data.data;
      if (failed.length === 0) {
        toast.success(`All ${success.length} students created successfully!`);
        navigate("/students");
      } else {
        toast.error(`${success.length} created, ${failed.length} failed`);
        failed.forEach((f: any) => { toast.error(`Row ${f.index + 1}: ${f.error}`); });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bulk entry failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Old Student Entry</h1>
          <p className="text-sm text-gray-500 mt-1">Enter existing students with custom admission numbers. Counter will auto-sync after entry.</p>
        </div>
        <button onClick={() => navigate("/students")} className="text-gray-600 hover:text-gray-800">← Back to Students</button>
                <button onClick={() => navigate("/students")}className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="font-medium text-gray-700">Academic Year:</label>
          <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="border rounded-lg px-3 py-2 w-48">
            <option value="">Select Year</option>
            {academicYears.map((ay) => (<option key={ay.id} value={ay.id}>{ay.name}</option>))}
          </select>
          <button onClick={addRow} className="ml-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">+ Add Row</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">#</th>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">Adm No *</th>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">First Name *</th>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">Last Name *</th>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">Gender</th>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">DOB *</th>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">Father *</th>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">Mother *</th>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">Phone *</th>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">Class *</th>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">Section *</th>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">Roll</th>
              <th className="px-2 py-3 text-xs font-medium text-gray-500">Del</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((student, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-2 py-2 text-sm text-center">{index + 1}</td>
                <td className="px-1 py-2"><input type="text" value={student.admissionNo} onChange={(e) => updateRow(index, "admissionNo", e.target.value)} placeholder="ADM/2025/001" className="w-28 border rounded px-2 py-1 text-sm" /></td>
                <td className="px-1 py-2"><input type="text" value={student.firstName} onChange={(e) => updateRow(index, "firstName", e.target.value)} className="w-24 border rounded px-2 py-1 text-sm" /></td>
                <td className="px-1 py-2"><input type="text" value={student.lastName} onChange={(e) => updateRow(index, "lastName", e.target.value)} className="w-24 border rounded px-2 py-1 text-sm" /></td>
                <td className="px-1 py-2">
                  <select value={student.gender} onChange={(e) => updateRow(index, "gender", e.target.value)} className="w-20 border rounded px-1 py-1 text-sm">
                    <option value="Male">M</option><option value="Female">F</option><option value="Other">O</option>
                  </select>
                </td>
                <td className="px-1 py-2"><input type="date" value={student.dob} onChange={(e) => updateRow(index, "dob", e.target.value)} className="w-32 border rounded px-2 py-1 text-sm" /></td>
                <td className="px-1 py-2"><input type="text" value={student.fatherName} onChange={(e) => updateRow(index, "fatherName", e.target.value)} className="w-24 border rounded px-2 py-1 text-sm" /></td>
                <td className="px-1 py-2"><input type="text" value={student.motherName} onChange={(e) => updateRow(index, "motherName", e.target.value)} className="w-24 border rounded px-2 py-1 text-sm" /></td>
                <td className="px-1 py-2"><input type="tel" value={student.parentPhone} onChange={(e) => updateRow(index, "parentPhone", e.target.value)} className="w-24 border rounded px-2 py-1 text-sm" /></td>
                <td className="px-1 py-2">
                  <select value={student.classId} onChange={(e) => updateRow(index, "classId", e.target.value)} className="w-24 border rounded px-1 py-1 text-sm">
                    <option value="">Class</option>
                    {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </td>
                <td className="px-1 py-2">
                  <select value={student.sectionId} onChange={(e) => updateRow(index, "sectionId", e.target.value)} className="w-20 border rounded px-1 py-1 text-sm">
                    <option value="">Sec</option>
                    {(sectionsMap[student.classId] || []).map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </td>
                <td className="px-1 py-2"><input type="text" value={student.rollNumber} onChange={(e) => updateRow(index, "rollNumber", e.target.value)} className="w-12 border rounded px-2 py-1 text-sm" /></td>
                <td className="px-1 py-2"><button onClick={() => removeRow(index)} className="text-red-500 hover:text-red-700 text-lg">x</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-500">{students.length} student(s) to be entered.</p>
        <div className="flex gap-4">
          <button onClick={addRow} className="px-4 py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50">+ Add More</button>
          <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : `Save ${students.length} Students`}
          </button>
        </div>
      </div>
    </div>
  );
}
