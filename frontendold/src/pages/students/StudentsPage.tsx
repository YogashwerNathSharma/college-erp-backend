

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  srNo: string;
  gender: string;
  dob: string;
  fatherName: string;
  fatherPhone: string;
  motherPhone?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  photoUrl?: string;
  enrollments: {
    class: { id: string; name: string };
    section: { id: string; name: string };
    academicYear: { id: string; name: string };
  }[];
}

interface Filters {
  academicYearId: string;
  classId: string;
  sectionId: string;
  status: string;
  search: string;
  page: number;
}

export default function StudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // View Modal
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    academicYearId: "",
    classId: "",
    sectionId: "",
    status: "active",
    search: "",
    page: 1,
  });

  useEffect(() => {
    fetchAcademicYears();
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [filters.academicYearId, filters.classId, filters.sectionId, filters.status, filters.page]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchStudents(); }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    if (filters.classId) fetchSections(filters.classId);
    else setSections([]);
  }, [filters.classId]);

  const fetchAcademicYears = async () => {
    try { const res = await axios.get("/api/academic"); setAcademicYears(res.data.data || []); } catch (err) { console.error(err); }
  };

  const fetchClasses = async () => {
    try { const res = await axios.get("/api/class"); setClasses(res.data.data || []); } catch (err) { console.error(err); }
  };

  const fetchSections = async (classId: string) => {
    try { const res = await axios.get(`/api/section?classId=${classId}`); setSections(res.data.data || []); } catch (err) { console.error(err); }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = { page: filters.page, limit: 50 };
      if (filters.classId) params.classId = filters.classId;
      if (filters.sectionId) params.sectionId = filters.sectionId;
      if (filters.academicYearId) params.academicYearId = filters.academicYearId;
      if (filters.search) params.search = filters.search;
      if (filters.status && filters.status !== "all") params.status = filters.status;

      const res = await axios.get("/api/students", { params });
      const result = res.data?.data;
      setStudents(result?.students || []);
      setPagination({ total: result?.total || 0, page: result?.page || filters.page, totalPages: result?.totalPages || 1 });
    } catch (err: any) {
      console.error("Fetch students error:", err);
      setStudents([]);
      setPagination({ total: 0, page: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  // Toggle Active/Inactive
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const confirmMsg = currentStatus === "active"
      ? "Deactivate this student?"
      : "Reactivate this student?";
    if (!window.confirm(confirmMsg)) return;

    try {
      await axios.put(`/api/students/${id}`, { status: newStatus });
      toast.success(`Student ${newStatus === "active" ? "activated" : "deactivated"}`);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  // Move to Recycle Bin (soft delete)
  const handleMoveToRecycleBin = async (id: string) => {
    if (!window.confirm("Move this student to Recycle Bin? This can be undone.")) return;
    try {
      await axios.delete(`/api/students/${id}`);
      toast.success("Student moved to Recycle Bin");
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  // View Student Details
  const handleView = async (id: string) => {
    try {
      const res = await axios.get(`/api/students/${id}`);
      setViewStudent(res.data.data);
      setShowViewModal(true);
    } catch (err: any) {
      toast.error("Failed to load student details");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      inactive: "bg-gray-100 text-gray-700",
      left: "bg-red-100 text-red-700",
      tc_issued: "bg-amber-100 text-amber-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate("/students/new-admission")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
            + New Admission
          </button>
          <button onClick={() => navigate("/students/old-entry")} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium transition-colors">
            Old Student Entry
          </button>
          <button onClick={() => navigate("/students/promotion")} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors">
            🎓 Promotion
          </button>
          <button onClick={() => navigate("/students/print")} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
            🖨️ Print List
          </button>
          <button onClick={() => navigate("/students/age-settings")} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors">
            Age Settings
          </button>
          <button onClick={() => navigate("/students/recycle-bin")} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors">
            🗑️ Recycle Bin
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select value={filters.academicYearId} onChange={(e) => setFilters({ ...filters, academicYearId: e.target.value, page: 1 })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Academic Years</option>
            {academicYears.map((ay) => (<option key={ay.id} value={ay.id}>{ay.name}</option>))}
          </select>
          <select value={filters.classId} onChange={(e) => setFilters({ ...filters, classId: e.target.value, sectionId: "", page: 1 })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Classes</option>
            {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <select value={filters.sectionId} onChange={(e) => setFilters({ ...filters, sectionId: e.target.value, page: 1 })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={!filters.classId}>
            <option value="">All Sections</option>
            {sections.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="left">Left</option>
            <option value="tc_issued">TC Issued</option>
          </select>
          <input type="text" placeholder="Search name, adm no, SR, father..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4 text-sm text-gray-600">
        <span>Total: <strong>{pagination.total}</strong></span>
        <span>Page: <strong>{pagination.page}/{pagination.totalPages}</strong></span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Adm No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SR No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Father</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                </td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                  <p className="text-lg">No students found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or add a new student</p>
                </td></tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">{(filters.page - 1) * 50 + index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-sm overflow-hidden">
                          {student.photoUrl ? (
                            <img
                              src={`http://localhost:5000/uploads/${student.photoUrl}`}
                              alt={`${student.firstName} ${student.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>{student.firstName?.[0]}{student.lastName?.[0]}</>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-gray-400">{student.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{student.admissionNo}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">{student.srNo || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      {student.enrollments?.[0] ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                          {student.enrollments[0].class.name} - {student.enrollments[0].section.name}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.fatherName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.fatherPhone || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${getStatusBadge(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleView(student.id)} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium transition-colors">
                          View
                        </button>
                        <button onClick={() => navigate(`/students/${student.id}/edit`)} className="px-2 py-1 text-xs bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 font-medium transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleToggleStatus(student.id, student.status)} className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                          student.status === "active"
                            ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}>
                          {student.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => handleMoveToRecycleBin(student.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium transition-colors">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
            ← Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page <strong>{filters.page}</strong> of <strong>{pagination.totalPages}</strong>
          </span>
          <button disabled={filters.page >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
            Next →
          </button>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && viewStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xl font-bold text-white shadow-lg overflow-hidden">
                  {viewStudent.photoUrl ? (
                    <img
                      src={`http://localhost:5000/uploads/${viewStudent.photoUrl}`}
                      alt={`${viewStudent.firstName} ${viewStudent.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>{viewStudent.firstName?.[0]}{viewStudent.lastName?.[0]}</>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{viewStudent.firstName} {viewStudent.lastName}</h2>
                  <p className="text-sm text-gray-500">Adm No: {viewStudent.admissionNo} • SR: {viewStudent.srNo || "N/A"}</p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-400">Gender</p><p className="text-sm font-medium">{viewStudent.gender}</p></div>
                  <div><p className="text-xs text-gray-400">Date of Birth</p><p className="text-sm font-medium">{new Date(viewStudent.dob).toLocaleDateString("en-IN")}</p></div>
                  <div><p className="text-xs text-gray-400">Email</p><p className="text-sm font-medium">{(viewStudent as any).email || "-"}</p></div>
                  <div><p className="text-xs text-gray-400">Phone</p><p className="text-sm font-medium">{(viewStudent as any).phone || "-"}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-400">Address</p><p className="text-sm font-medium">{(viewStudent as any).address || "-"}</p></div>
                </div>
              </div>

              {/* Class Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Academic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-400">Class</p><p className="text-sm font-medium">{viewStudent.enrollments?.[0]?.class?.name || "-"}</p></div>
                  <div><p className="text-xs text-gray-400">Section</p><p className="text-sm font-medium">{viewStudent.enrollments?.[0]?.section?.name || "-"}</p></div>
                  <div><p className="text-xs text-gray-400">Academic Year</p><p className="text-sm font-medium">{viewStudent.enrollments?.[0]?.academicYear?.name || "-"}</p></div>
                  <div><p className="text-xs text-gray-400">Status</p><p className="text-sm font-medium"><span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(viewStudent.status)}`}>{viewStudent.status}</span></p></div>
                </div>
              </div>

              {/* Parent Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Parent / Guardian</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-400">Father's Name</p><p className="text-sm font-medium">{viewStudent.fatherName}</p></div>
                  <div><p className="text-xs text-gray-400">Father's Phone</p><p className="text-sm font-medium">{viewStudent.fatherPhone || "-"}</p></div>
                  <div><p className="text-xs text-gray-400">Mother's Phone</p><p className="text-sm font-medium">{(viewStudent as any).motherPhone || "-"}</p></div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => { setShowViewModal(false); navigate(`/students/${viewStudent.id}/edit`); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Edit Student
              </button>
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


