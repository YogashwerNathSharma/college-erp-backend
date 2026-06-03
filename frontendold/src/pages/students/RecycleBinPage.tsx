import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function RecycleBinPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchDeletedStudents(); }, []);

  const fetchDeletedStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/students/recycle-bin");
      setStudents(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!window.confirm("Restore this student?")) return;
    try {
      await axios.patch(`/api/students/${id}/restore`);
      toast.success("Student restored!");
      fetchDeletedStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to restore");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🗑️ Recycle Bin</h1>
          <p className="text-sm text-gray-500 mt-1">Students moved to recycle bin can be restored</p>
        </div>
        <button onClick={() => navigate("/students")} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
          ← Back to Students
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-red-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Adm No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Deleted On</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Recycle bin is empty</td></tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{student.firstName} {student.lastName}</td>
                  <td className="px-4 py-3 text-sm font-mono">{student.admissionNo}</td>
                  <td className="px-4 py-3 text-sm">
                    {student.enrollments?.[0] ? `${student.enrollments[0].class.name} - ${student.enrollments[0].section.name}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {student.deletedAt ? new Date(student.deletedAt).toLocaleDateString("en-IN") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleRestore(student.id)} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-xs font-medium">
                      ♻️ Restore
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}