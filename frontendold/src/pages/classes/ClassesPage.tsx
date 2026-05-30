import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  School,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  GraduationCap,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
}

interface Class {
  id: string;
  name: string;
  tenantId: string;
  academicYearId: string;
  createdAt: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

type ModalMode = "add" | "edit";

// ─── API Config ──────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:5000";

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// ─── Main Component ──────────────────────────────────────────────────────────

const ClassesPage: React.FC = () => {
  // State
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYearId, setFilterYearId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formName, setFormName] = useState("");
  const [formAcademicYearId, setFormAcademicYearId] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastIdRef = React.useRef(0);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const showToast = useCallback((type: "success" | "error", message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const getActiveYear = useCallback((): AcademicYear | undefined => {
    return academicYears.find((y) => y.isActive);
  }, [academicYears]);

  const getYearName = useCallback(
    (yearId: string): string => {
      const year = academicYears.find((y) => y.id === yearId);
      return year ? year.name : "—";
    },
    [academicYears]
  );

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // ─── Data Fetching ───────────────────────────────────────────────────────────

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/academic`, getAuthHeaders());
      const data = res.data;
      if (data.success) {
        const years: AcademicYear[] = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.data?.data)
          ? data.data.data
          : [];
        setAcademicYears(years);
        return years;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch academic years:", err);
      return [];
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/class`, getAuthHeaders());
      const data = res.data;
      if (data.success) {
        // Normalize: handle { data: { data: [...] } } or { data: [...] }
        const classList: Class[] = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.data?.data)
          ? data.data.data
          : [];
        setClasses(classList);
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
      showToast("error", "Failed to load classes. Please try again.");
    }
  }, [showToast]);

const loadData = useCallback(async () => {
  setLoading(true);
  const years = await fetchAcademicYears();
  await fetchClasses();
  // ✅ Auto-select active year as default filter
  const active = years.find((y: AcademicYear) => y.isActive);
  if (active) {
    setFilterYearId(active.id);
  }
  setLoading(false);
}, [fetchAcademicYears, fetchClasses]);

useEffect(() => {
  loadData();
}, [loadData]);

  // ─── Filtered Classes ────────────────────────────────────────────────────────

  const filteredClasses = classes.filter((cls) => {
    const matchesYear =
      filterYearId === "all" || cls.academicYearId === filterYearId;
    const matchesSearch =
      searchQuery === "" ||
      cls.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesSearch;
  });

  // ─── Modal Actions ───────────────────────────────────────────────────────────

  const openAddModal = () => {
    setModalMode("add");
    setEditingClass(null);
    setFormName("");
    const active = getActiveYear();
    setFormAcademicYearId(active?.id || academicYears[0]?.id || "");
    setModalOpen(true);
  };

  const openEditModal = (cls: Class) => {
    setModalMode("edit");
    setEditingClass(cls);
    setFormName(cls.name);
    setFormAcademicYearId(cls.academicYearId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingClass(null);
    setFormName("");
    setFormAcademicYearId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("error", "Class name is required.");
      return;
    }
    if (!formAcademicYearId) {
      showToast("error", "Please select an academic year.");
      return;
    }

    setFormSubmitting(true);

    try {
      if (modalMode === "add") {
        const res = await axios.post(
          `${API_BASE}/api/class`,
          { name: formName.trim(), academicYearId: formAcademicYearId },
          getAuthHeaders()
        );
        if (res.data.success) {
          showToast("success", `Class "${formName.trim()}" created successfully.`);
          await fetchClasses();
          closeModal();
        } else {
          showToast("error", res.data.message || "Failed to create class.");
        }
      } else {
        // Edit mode
        const res = await axios.put(
          `${API_BASE}/api/class/${editingClass!.id}`,
          { name: formName.trim() },
          getAuthHeaders()
        );
        if (res.data.success) {
          showToast("success", `Class updated to "${formName.trim()}" successfully.`);
          await fetchClasses();
          closeModal();
        } else {
          showToast("error", res.data.message || "Failed to update class.");
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (modalMode === "add"
          ? "Failed to create class. Please try again."
          : "Failed to update class. Please try again.");
      showToast("error", msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ─── Delete Actions ──────────────────────────────────────────────────────────

  const openDeleteDialog = (cls: Class) => {
    setDeletingClass(cls);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingClass(null);
  };

  const handleDelete = async () => {
    if (!deletingClass) return;
    setDeleteSubmitting(true);

    try {
      const res = await axios.delete(
        `${API_BASE}/api/class/${deletingClass.id}`,
        getAuthHeaders()
      );
      if (res.data.success) {
        showToast("success", `Class "${deletingClass.name}" deleted successfully.`);
        await fetchClasses();
        closeDeleteDialog();
      } else {
        showToast("error", res.data.message || "Failed to delete class.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Failed to delete class. Please try again.";
      showToast("error", msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // ─── Render: Loading Skeleton ────────────────────────────────────────────────

  const renderSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-gray-200 rounded-lg" />
          <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-8 bg-gray-100 rounded" />
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Render: Empty State ─────────────────────────────────────────────────────

  const renderEmptyState = () => (
    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
      <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
        <School className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">No Classes Found</h3>
      <p className="text-gray-500 text-sm mb-6">
        {searchQuery || filterYearId !== "all"
          ? "No classes match your current filters. Try adjusting your search or filter."
          : "Get started by adding your first class for this academic year."}
      </p>
      {!searchQuery && filterYearId === "all" && (
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add First Class
        </button>
      )}
    </div>
  );

  // ─── Render: Table ───────────────────────────────────────────────────────────

  const renderTable = () => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Class Name
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Academic Year
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredClasses.map((cls, index) => (
              <tr
                key={cls.id}
                className="hover:bg-gray-50/50 transition-colors group"
              >
                <td className="px-6 py-4 text-sm text-gray-400 font-medium">
                  {index + 1}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {cls.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">
                    <Calendar className="w-3 h-3" />
                    {getYearName(cls.academicYearId)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(cls.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(cls)}
                      className="p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Edit class"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(cls)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Table footer with count */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/40">
        <p className="text-xs text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-700">
            {filteredClasses.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-gray-700">{classes.length}</span>{" "}
          classes
        </p>
      </div>
    </div>
  );

  // ─── Render: Modal ───────────────────────────────────────────────────────────

  const renderModal = () => {
    if (!modalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeModal}
        />
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <School className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                {modalMode === "add" ? "Add New Class" : "Edit Class"}
              </h2>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Class Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Class Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Class 1, Class 10, Section A"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-gray-400"
                autoFocus
              />
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                value={formAcademicYearId}
                onChange={(e) => setFormAcademicYearId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all appearance-none bg-white"
                disabled={modalMode === "edit"}
              >
                <option value="">Select academic year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
              {modalMode === "edit" && (
                <p className="text-xs text-gray-400 mt-1">
                  Academic year cannot be changed after creation.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {formSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {modalMode === "add" ? "Create Class" : "Update Class"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ─── Render: Delete Dialog ───────────────────────────────────────────────────

  const renderDeleteDialog = () => {
    if (!deleteDialogOpen || !deletingClass) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeDeleteDialog}
        />
        {/* Dialog */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Delete Class
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700">
                "{deletingClass.name}"
              </span>
              ? This action cannot be undone and may affect related data.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={closeDeleteDialog}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render: Toast Messages ──────────────────────────────────────────────────

  const renderToasts = () => (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-[slideIn_0.3s_ease-out] ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );

  // ─── Main Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {renderSkeleton()}
      </div>
    );
  }

  const activeYear = getActiveYear();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <School className="w-5 h-5 text-indigo-600" />
            </div>
            Classes
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">
            Manage classes across academic years
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all hover:shadow-md hover:shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Active Year Badge */}
          {activeYear && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-medium text-indigo-700">
                Active Year: {activeYear.name}
              </span>
            </div>
          )}

          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search classes..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Year Filter */}
          <select
            value={filterYearId}
            onChange={(e) => setFilterYearId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-white appearance-none pr-8"
          >
            <option value="all">All Years</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name} {year.isActive ? "(Active)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredClasses.length === 0 ? renderEmptyState() : renderTable()}

      {/* Modals */}
      {renderModal()}
      {renderDeleteDialog()}
      {renderToasts()}

      {/* Animation keyframes via style tag */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ClassesPage;
