

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { FiUpload, FiTrash2, FiEye, FiX, FiFile } from "react-icons/fi";

const API = `${API_BASE_URL}/api`;

interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  uploadDate: string;
  createdAt: string;
  teacher?: { name: string };
}

const TeacherDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Upload form
  const [uploadData, setUploadData] = useState({
    teacherId: "",
    name: "",
    type: "PERSONAL",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchDocuments = async () => {
    try {
      const url = selectedTeacher
        ? `${API}/teacher-document?teacherId=${selectedTeacher}`
        : `${API}/teacher-document`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setDocuments(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API}/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setTeachers(res.data.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [selectedTeacher]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.teacherId) return toast.error("Select a teacher");
    if (!uploadData.name.trim()) return toast.error("Document name required");
    if (!file) return toast.error("Select a file");

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("teacherId", uploadData.teacherId);
    formData.append("name", uploadData.name);
    formData.append("type", uploadData.type);

    try {
      const res = await axios.post(`${API}/teacher-document`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data.success) {
        toast.success("Document uploaded successfully");
        setShowModal(false);
        setUploadData({ teacherId: "", name: "", type: "PERSONAL" });
        setFile(null);
        fetchDocuments();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      const res = await axios.delete(`${API}/teacher-document/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        toast.success("Document deleted");
        fetchDocuments();
      }
    } catch (err: any) {
      toast.error("Failed to delete");
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "PERSONAL": return "bg-primary-100 text-primary-700";
      case "IDENTITY": return "bg-purple-100 text-purple-700";
      case "ACADEMIC": return "bg-green-100 text-green-700";
      case "EXPERIENCE": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          <FiUpload size={18} /> Upload Document
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Teacher</label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Document Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Teacher</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Upload Date</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, index) => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 flex items-center gap-2">
                      <FiFile className="text-gray-400" size={16} />
                      {doc.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.teacher?.name || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeBadge(doc.type)}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="View"
                        >
                          <FiEye size={16} />
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No documents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Upload Document</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                <select
                  value={uploadData.teacherId}
                  onChange={(e) => setUploadData({ ...uploadData, teacherId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                <input
                  type="text"
                  value={uploadData.name}
                  onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                  placeholder="e.g., Resume, Aadhar Card"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={uploadData.type}
                  onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="PERSONAL">Personal</option>
                  <option value="IDENTITY">Identity</option>
                  <option value="ACADEMIC">Academic</option>
                  <option value="EXPERIENCE">Experience</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Allowed: PDF, JPG, PNG, DOC (Max 5MB)
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDocuments;

