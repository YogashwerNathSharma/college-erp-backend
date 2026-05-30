import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Trash2,
  Download,
  Edit3,
  MoreVertical,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Filter,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type {
  Student,
  StudentFilters,
  StudentStats,
  Class,
  PaginatedResponse,
  ApiResponse,
} from "./students.types";
import { exportStudentsCSV } from "./exportCSV";
import AddStudentModal from "./AddStudentModal";
import RecycleBin from "./RecycleBin";

const API_BASE = "http://localhost:5000";

const StudentsPage: React.FC = () => {
  // ---- State ----
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<StudentStats>({
    total: 0,
    male: 0,
    female: 0,
    newThisMonth: 0,
  });

  const [filters, setFilters] = useState<StudentFilters>({
    search: "",
    classId: "",
    sectionId: "",
    gender: "",
    page: 1,
    limit: 10,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token") || "";

  // ---- Fetch Students ----
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.classId) params.classId = filters.classId;
      if (filters.sectionId) params.sectionId = filters.sectionId;
      if (filters.gender) params.gender = filters.gender;
      if (filters.search) params.search = filters.search;

      const res = await axios.get<PaginatedResponse<Student>>(
        `${API_BASE}/api/students`,
        {
          params,
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      if (res.data.success) {
        setStudents(res.data.data);
        setTotal(res.data.total || 0);

        // Compute stats from total data
        const allStudents = res.data.data;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        setStats({
          total: res.data.total || 0,
          male: allStudents.filter((s) => s.gender === "MALE").length,
          female: allStudents.filter((s) => s.gender === "FEMALE").length,
          newThisMonth: allStudents.filter(
            (s) => new Date(s.createdAt) >= startOfMonth
          ).length,
        });
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ---- Fetch Classes ----
  const fetchClasses = useCallback(async () => {
    try {
      const res = await axios.get<ApiResponse<Class[]>>(
        `${API_BASE}/api/class`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (res.data.success) {
        setClasses(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // ---- Handlers ----
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleFilterChange = (key: keyof StudentFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
      ...(key === "classId" ? { sectionId: "" } : {}),
    }));
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this student?");
    if (!confirmed) return;

    setDeleteLoading(id);
    try {
      await axios.delete(`${API_BASE}/api/students/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      fetchStudents();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error("Failed to delete student:", err);
      alert("Failed to delete student");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedIds.size} selected student(s)?`
    );
    if (!confirmed) return;

    setDeleteLoading("bulk");
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          axios.delete(`${API_BASE}/api/students/${id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          })
        )
      );
      setSelectedIds(new Set());
      fetchStudents();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Some deletions failed");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleExportCSV = () => {
    exportStudentsCSV(students);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    fetchStudents();
  };

  // ---- Derived ----
  const selectedClass = classes.find((c) => c.id === filters.classId);
  const sections = selectedClass?.sections || [];
  const totalPages = Math.ceil(total / filters.limit);

  // ---- Recycle Bin View ----
  if (showRecycleBin) {
    return <RecycleBin onBack={() => { setShowRecycleBin(false); fetchStudents(); }} />;
  }

  // ---- Main Render ----
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage all enrolled students across classes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRecycleBin(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Trash2 size={16} />
            Recycle Bin
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Student
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={20} />}
          label="Total Students"
          value={stats.total}
          gradient="from-indigo-500 to-indigo-600"
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <StatCard
          icon={<UserCheck size={20} />}
          label="Male Students"
          value={stats.male}
          gradient="from-blue-500 to-blue-600"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<UserX size={20} />}
          label="Female Students"
          value={stats.female}
          gradient="from-pink-500 to-pink-600"
          iconBg="bg-pink-100"
          iconColor="text-pink-600"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="New This Month"
          value={stats.newThisMonth}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by name, admission no, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.classId}
              onChange={(e) => handleFilterChange("classId", e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[140px]"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            <select
              value={filters.sectionId}
              onChange={(e) => handleFilterChange("sectionId", e.target.value)}
              disabled={!filters.classId}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Sections</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>

            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange("gender", e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[130px]"
            >
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>

            <button
              onClick={handleSearch}
              className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="mt-3 flex items-center gap-3 py-2.5 px-4 bg-indigo-50 rounded-xl">
            <span className="text-sm font-medium text-indigo-700">
              {selectedIds.size} selected
            </span>
            <div className="h-4 w-px bg-indigo-200" />
            <button
              onClick={handleBulkDelete}
              disabled={deleteLoading === "bulk"}
              className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSkeleton />
        ) : students.length === 0 ? (
          <EmptyState onAdd={handleAddNew} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-4 py-3 text-left w-10">
                      <button onClick={toggleSelectAll}>
                        {selectedIds.size === students.length && students.length > 0 ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} className="text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Admission No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Class / Section
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((student, index) => {
                    const enrollment = student.enrollments?.[0];
                    const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
                    const rowNumber =
                      (filters.page - 1) * filters.limit + index + 1;

                    const avatarColors: Record<string, string> = {
                      MALE: "bg-blue-100 text-blue-600",
                      FEMALE: "bg-pink-100 text-pink-600",
                      OTHER: "bg-purple-100 text-purple-600",
                    };

                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-gray-50/50 transition-colors ${
                          selectedIds.has(student.id) ? "bg-indigo-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button onClick={() => toggleSelect(student.id)}>
                            {selectedIds.has(student.id) ? (
                              <CheckSquare
                                size={18}
                                className="text-indigo-600"
                              />
                            ) : (
                              <Square size={18} className="text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                          {rowNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                                avatarColors[student.gender] ||
                                "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <span className="text-xs font-semibold">
                                {initials}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {student.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                          {student.admissionNo}
                        </td>
                        <td className="px-4 py-3">
                          {enrollment ? (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg">
                              {enrollment.class?.name} - {enrollment.section?.name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <GenderBadge gender={student.gender} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {student.phone || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded-full">
                            Active
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(student)}
                              className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Edit"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(student.id)}
                              disabled={deleteLoading === student.id}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deleteLoading === student.id ? (
                                <RefreshCw size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 gap-3">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium">
                    {(filters.page - 1) * filters.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(filters.page * filters.limit, total)}
                  </span>{" "}
                  of <span className="font-medium">{total}</span> students
                </p>
                <select
                  value={filters.limit}
                  onChange={(e) =>
                    handleFilterChange("limit", Number(e.target.value))
                  }
                  className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={filters.page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page Numbers */}
                {generatePageNumbers(filters.page, totalPages).map((pn, i) =>
                  pn === "..." ? (
                    <span key={`dots-${i}`} className="px-2 text-gray-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={pn}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, page: pn as number }))
                      }
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        filters.page === pn
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      {pn}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={filters.page === totalPages || totalPages === 0}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddStudentModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingStudent(null);
        }}
        onSuccess={handleModalSuccess}
        student={editingStudent}
      />
    </div>
  );
};

// ============================================================
// Sub-components
// ============================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  gradient,
  iconBg,
  iconColor,
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  </div>
);

const GenderBadge: React.FC<{ gender: string }> = ({ gender }) => {
  const styles: Record<string, string> = {
    MALE: "bg-blue-50 text-blue-700",
    FEMALE: "bg-pink-50 text-pink-700",
    OTHER: "bg-purple-50 text-purple-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
        styles[gender] || "bg-gray-50 text-gray-700"
      }`}
    >
      {gender.charAt(0) + gender.slice(1).toLowerCase()}
    </span>
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="p-6 space-y-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 animate-pulse">
        <div className="w-5 h-5 bg-gray-100 rounded" />
        <div className="w-6 h-4 bg-gray-100 rounded" />
        <div className="w-9 h-9 bg-gray-100 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 bg-gray-100 rounded w-36" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
        <div className="h-4 bg-gray-100 rounded w-20" />
        <div className="h-6 bg-gray-100 rounded-lg w-24" />
        <div className="h-4 bg-gray-100 rounded w-12" />
        <div className="h-4 bg-gray-100 rounded w-24" />
        <div className="h-5 bg-gray-100 rounded-full w-14" />
        <div className="flex gap-1">
          <div className="w-8 h-8 bg-gray-100 rounded-lg" />
          <div className="w-8 h-8 bg-gray-100 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4">
    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5">
      <Users size={36} className="text-indigo-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-700 mb-1">No Students Found</h3>
    <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
      No students match your current filters. Try adjusting your search or add a new student.
    </p>
    <button
      onClick={onAdd}
      className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
    >
      <Plus size={16} />
      Add First Student
    </button>
  </div>
);

// ---- Pagination Helper ----
function generatePageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  if (current <= 3) {
    pages.push(1, 2, 3, 4, "...", total);
  } else if (current >= total - 2) {
    pages.push(1, "...", total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }

  return pages;
}

export default StudentsPage;


