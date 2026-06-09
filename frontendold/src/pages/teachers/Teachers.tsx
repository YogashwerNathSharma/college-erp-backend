
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL;

interface Subject {
  id: string;
  name: string;
}

interface ClassItem {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: Subject[];
  classes: ClassItem[];
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const Teachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const token = localStorage.getItem("token");

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 10, search },
      });

      if (res.data.success) {
        setTeachers(res.data.data.data);
        setMeta(res.data.data.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTeachers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;

    try {
      const res = await axios.delete(`${API}/teacher/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        toast.success("Teacher deleted successfully");
        fetchTeachers();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete teacher");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
        <button
          onClick={() => navigate("/teachers/add")}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus size={18} />
          Add Teacher
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </form>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No teachers found</p>
          <p className="text-sm mt-1">Click "Add Teacher" to create one</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  #
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Subjects
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Classes
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher, index) => (
                <tr
                  key={teacher.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {(page - 1) * 10 + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {teacher.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {teacher.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {teacher.phone}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects?.map((sub) => (
                        <span
                          key={sub.id}
                          className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs"
                        >
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {teacher.classes?.map((cls) => (
                        <span
                          key={cls.id}
                          className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs"
                        >
                          {cls.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => navigate(`/teachers/edit/${teacher.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * 10 + 1} to{" "}
                {Math.min(page * 10, meta.total)} of {meta.total} teachers
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Teachers;

