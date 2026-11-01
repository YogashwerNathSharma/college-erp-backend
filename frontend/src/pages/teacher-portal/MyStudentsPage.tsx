import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import { FiBook, FiUsers, FiSearch } from "react-icons/fi";

interface ClassItem { id: string; name: string; section?: string; students?: string[]; }
interface Student { id: string; firstName: string; lastName: string; rollNumber?: string; phone?: string; guardianName?: string; guardianPhone?: string; classId?: string; className?: string; email?: string; address?: string; }

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function normalizeId(item: any): string {
  return item?.id || item?._id || "";
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

export default function MyStudentsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ phone: "", address: "", guardianName: "", guardianPhone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(getFullUrl("/api/class"), { headers: getAuthHeaders() })
      .then((res) => {
        const data = res.data?.data?.data || res.data?.data || [];
        setClasses(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to load classes"));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    axios.get(getFullUrl("/api/students"), { headers: getAuthHeaders(), params: { classId: selectedClass } })
      .then((res) => {
        const data = res.data?.data?.data || res.data?.data || [];
        setStudents(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const lower = searchTerm.toLowerCase();
    return students.filter((s) =>
      s.firstName?.toLowerCase().includes(lower) || s.lastName?.toLowerCase().includes(lower) || s.rollNumber?.toLowerCase().includes(lower)
    );
  }, [students, searchTerm]);

  function openEdit(student: Student) {
    setEditingStudent(student);
    setEditForm({ phone: student.phone || "", address: student.address || "", guardianName: student.guardianName || "", guardianPhone: student.guardianPhone || "" });
  }

  async function saveEdit() {
    if (!editingStudent) return;
    setSaving(true);
    try {
      await axios.put(getFullUrl(`/api/students/${normalizeId(editingStudent)}`), editForm, { headers: getAuthHeaders() });
      toast.success("Student updated successfully!");
      setStudents((prev) => prev.map((s) => (normalizeId(s) === normalizeId(editingStudent) ? { ...s, ...editForm } : s)));
      setEditingStudent(null);
    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to update student"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">My Students</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
            <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">-- All Classes --</option>
              {classes.map((cls) => (<option key={normalizeId(cls)} value={normalizeId(cls)}>{cls.name} {cls.section ? `(${cls.section})` : ""}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by name or roll number..." className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : filteredStudents.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">Roll No</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">Guardian</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => {
                  const sid = normalizeId(student);
                  return (
                    <tr key={sid} className="hover:bg-gray-50">
                      <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">{student.firstName?.[0] || "S"}</div><span className="font-medium text-gray-800">{student.firstName} {student.lastName}</span></div></td>
                      <td className="px-5 py-3 text-gray-600 hidden sm:table-cell">{student.rollNumber || "-"}</td>
                      <td className="px-5 py-3 text-gray-600 hidden md:table-cell">{student.phone || "-"}</td>
                      <td className="px-5 py-3 text-gray-600 hidden lg:table-cell">{student.guardianName || "-"}</td>
                      <td className="px-5 py-3 text-right"><button onClick={() => openEdit(student)} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium">Edit</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedClass ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200"><FiUsers className="mx-auto text-4xl mb-3 text-gray-300" /><p>No students found.</p></div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200"><FiSearch className="mx-auto text-4xl mb-3 text-gray-300" /><p>Select a class to view students.</p></div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Student: {editingStudent.firstName} {editingStudent.lastName}</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" rows={2} value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label><input type="text" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={editForm.guardianName} onChange={(e) => setEditForm((p) => ({ ...p, guardianName: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label><input type="tel" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={editForm.guardianPhone} onChange={(e) => setEditForm((p) => ({ ...p, guardianPhone: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingStudent(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
