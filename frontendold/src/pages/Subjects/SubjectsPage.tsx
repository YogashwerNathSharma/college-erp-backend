import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  BookOpen,
  Plus,
  Edit3,
  Calendar,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  School,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
}

interface Class {
  id: string;
  name: string;
  academicYearId: string;
}

interface Subject {
  id: string;
  name: string;
  classId: string;
  tenantId: string;
  academicYearId: string;
  isActive: boolean;
  createdAt: string;
  class: { id: string; name: string };
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

type ModalMode = "add" | "edit";

// ─── API Config ────────────────────────────────────────────────────────────────

const API_BASE = "";

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// ─── Main Component ────────────────────────────────────────────────────────────

const SubjectsPage: React.FC = () => {
  // State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYearId, setFilterYearId] = useState<string>("all");
  const [filterClassId, setFilterClassId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Classes for filter (dependent on filterYearId)
  const [filterClasses, setFilterClasses] = useState<Class[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formName, setFormName] = useState("");
  const [formAcademicYearId, setFormAcademicYearId] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formClasses, setFormClasses] = useState<Class[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = React.useRef(0);

  // ─── Helpers ───────────────────────────────────────────────────────────────────

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

  const getClassName = useCallback(
    (classId: string): string => {
      const cls = classes.find((c) => c.id === classId);
      return cls ? cls.name : "—";
    },
    [classes]
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

  // ─── Data Fetching ─────────────────────────────────────────────────────────────

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

  const fetchClassesForYear = useCallback(async (yearId: string): Promise<Class[]> => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/class?academicYearId=${yearId}`,
        getAuthHeaders()
      );
      const data = res.data;
      if (data.success) {
        const classList: Class[] = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.data?.data)
          ? data.data.data
          : [];
        return classList;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch classes for year:", err);
      return [];
    }
  }, []);

  const fetchAllClasses = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/class`, getAuthHeaders());
      const data = res.data;
      if (data.success) {
        const classList: Class[] = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.data?.data)
          ? data.data.data
          : [];
        setClasses(classList);
        return classList;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch classes:", err);
      return [];
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/subjects`, getAuthHeaders());
      const data = res.data;
      if (data.success) {
        const subjectList: Subject[] = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.data?.data)
          ? data.data.data
          : [];
        setSubjects(subjectList);
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      showToast("error", "Failed to load subjects. Please try again.");
    }
  }, [showToast]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [years] = await Promise.all([
      fetchAcademicYears(),
      fetchAllClasses(),
      fetchSubjects(),
    ]);

    // Auto-select active year as default filter
    if (years && years.length > 0) {
      const activeYear = years.find((y) => y.isActive);
      if (activeYear) {
        setFilterYearId(activeYear.id);
        const yearClasses = await fetchClassesForYear(activeYear.id);
        setFilterClasses(yearClasses);
      }
    }

    setLoading(false);
  }, [fetchAcademicYears, fetchAllClasses, fetchSubjects, fetchClassesForYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update filter classes when filterYearId changes
  useEffect(() => {
    if (filterYearId === "all") {
      setFilterClasses(classes);
      setFilterClassId("all");
    } else {
      const loadFilterClasses = async () => {
        const yearClasses = await fetchClassesForYear(filterYearId);
        setFilterClasses(yearClasses);
        setFilterClassId("all");
      };
      loadFilterClasses();
    }
  }, [filterYearId, classes, fetchClassesForYear]);

  // ─── Filtered Subjects ────────────────────────────────────────────────────────

  const filteredSubjects = subjects.filter((subject) => {
    const matchesYear =
      filterYearId === "all" || subject.academicYearId === filterYearId;
    const matchesClass =
      filterClassId === "all" || subject.classId === filterClassId;
    const matchesSearch =
      searchQuery === "" ||
      subject.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesClass && matchesSearch;
  });

  // ─── Modal Actions ─────────────────────────────────────────────────────────────

  const openAddModal = () => {
    setModalMode("add");
    setEditingSubject(null);
    setFormName("");
    const active = getActiveYear();
    const yearId = active?.id || academicYears[0]?.id || "";
    setFormAcademicYearId(yearId);
    setFormClassId("");
    setFormClasses([]);
    if (yearId) {
      fetchClassesForYear(yearId).then((cls) => setFormClasses(cls));
    }
    setModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setModalMode("edit");
    setEditingSubject(subject);
    setFormName(subject.name);
    setFormAcademicYearId(subject.academicYearId);
    setFormClassId(subject.classId);
    fetchClassesForYear(subject.academicYearId).then((cls) => setFormClasses(cls));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSubject(null);
    setFormName("");
    setFormAcademicYearId("");
    setFormClassId("");
    setFormClasses([]);
  };

  const handleFormYearChange = async (yearId: string) => {
    setFormAcademicYearId(yearId);
    setFormClassId("");
    if (yearId) {
      const cls = await fetchClassesForYear(yearId);
      setFormClasses(cls);
    } else {
      setFormClasses([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("error", "Subject name is required.");
      return;
    }
    if (!formAcademicYearId) {
      showToast("error", "Please select an academic year.");
      return;
    }
    if (!formClassId) {
      showToast("error", "Please select a class.");
      return;
    }

    const duplicate = subjects.find(
      (s) =>
        s.classId === formClassId &&
        s.name.toLowerCase() === formName.trim().toLowerCase() &&
        (modalMode === "add" || s.id !== editingSubject?.id)
    );
    if (duplicate) {
      showToast("error", `Subject "${formName.trim()}" already exists for this class.`);
      return;
    }

    setFormSubmitting(true);

    try {
      if (modalMode === "add") {
        const res = await axios.post(
          `${API_BASE}/api/subjects`,
          {
            name: formName.trim(),
            classId: formClassId,
            academicYearId: formAcademicYearId,
          },
          getAuthHeaders()
        );
        if (res.data.success) {
          showToast("success", `Subject "${formName.trim()}" created successfully.`);
          await fetchSubjects();
          closeModal();
        } else {
          showToast("error", res.data.message || "Failed to create subject.");
        }
      } else {
        const res = await axios.put(
          `${API_BASE}/api/subjects/${editingSubject!.id}`,
          { name: formName.trim() },
          getAuthHeaders()
        );
        if (res.data.success) {
          showToast("success", `Subject updated to "${formName.trim()}" successfully.`);
          await fetchSubjects();
          closeModal();
        } else {
          showToast("error", res.data.message || "Failed to update subject.");
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (modalMode === "add"
          ? "Failed to create subject."
          : "Failed to update subject.");
      showToast("error", msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ─── Toggle Active/Inactive ─────────────────────────────────────────────────────

  const handleToggle = async (subject: Subject) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/api/subjects/${subject.id}/toggle`,
        {},
        getAuthHeaders()
      );
      if (res.data.success) {
        showToast(
          "success",
          subject.isActive ? "Subject deactivated" : "Subject activated"
        );
        await fetchSubjects();
      } else {
        showToast("error", res.data.message || "Failed to update status");
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to update status");
    }
  };

  // ─── Render: Loading Skeleton ──────────────────────────────────────────────────

  const renderSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-gray-200 rounded-lg" />
          <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-8 bg-gray-100 rounded" />
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Render: Empty State ───────────────────────────────────────────────────────

  const renderEmptyState = () => (
    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
      <div className="mx-auto w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
        <BookOpen className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">No Subjects Found</h3>
      <p className="text-gray-500 text-sm mb-6">
        {searchQuery || filterYearId !== "all" || filterClassId !== "all"
          ? "No subjects match your current filters. Try adjusting your search or filter."
          : "Get started by adding your first subject for a class."}
      </p>
      {!searchQuery && filterYearId === "all" && filterClassId === "all" && (
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add First Subject
        </button>
      )}
    </div>
  );

  // ─── Render: Table ─────────────────────────────────────────────────────────────

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
                Subject Name
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Academic Year
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
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
            {filteredSubjects.map((subject, index) => (
              <tr
                key={subject.id}
                className="hover:bg-gray-50/50 transition-colors group"
              >
                <td className="px-6 py-4 text-sm text-gray-400 font-medium">
                  {index + 1}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-primary-500" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {subject.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium">
                    <School className="w-3 h-3" />
                    {subject.class?.name || getClassName(subject.classId)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">
                    <Calendar className="w-3 h-3" />
                    {getYearName(subject.academicYearId)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                      subject.isActive !== false
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {subject.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(subject.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(subject)}
                      className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                      title="Edit subject"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggle(subject)}
                      className={`p-2 rounded-lg transition-colors ${
                        subject.isActive !== false
                          ? "hover:bg-red-50 text-gray-400 hover:text-red-600"
                          : "hover:bg-green-50 text-gray-400 hover:text-green-600"
                      }`}
                      title={subject.isActive !== false ? "Deactivate" : "Activate"}
                    >
                      {subject.isActive !== false ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
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
            {filteredSubjects.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-gray-700">{subjects.length}</span>{" "}
          subjects
        </p>
      </div>
    </div>
  );

  // ─── Render: Modal ─────────────────────────────────────────────────────────────

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
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                {modalMode === "add" ? "Add New Subject" : "Edit Subject"}
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
            {/* Subject Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Mathematics, English, Science"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-indigo-400 transition-all placeholder:text-gray-400"
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
                onChange={(e) => handleFormYearChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-indigo-400 transition-all appearance-none bg-white"
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

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={formClassId}
                onChange={(e) => setFormClassId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-indigo-400 transition-all appearance-none bg-white"
                disabled={modalMode === "edit" || !formAcademicYearId}
              >
                <option value="">
                  {!formAcademicYearId
                    ? "Select academic year first"
                    : formClasses.length === 0
                    ? "No classes available"
                    : "Select class"}
                </option>
                {formClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              {modalMode === "edit" && (
                <p className="text-xs text-gray-400 mt-1">
                  Class cannot be changed after creation.
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {formSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {modalMode === "add" ? "Create Subject" : "Update Subject"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ─── Render: Toast Messages ────────────────────────────────────────────────────

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

  // ─── Main Render ───────────────────────────────────────────────────────────────

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
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-600" />
            </div>
            Subjects
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">
            Manage subjects for classes across academic years
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 shadow-sm shadow-indigo-200 transition-all hover:shadow-md hover:shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Active Year Badge */}
          {activeYear && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-medium text-primary-700">
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
              placeholder="Search subjects..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-indigo-400 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Year Filter */}
          <select
            value={filterYearId}
            onChange={(e) => setFilterYearId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-indigo-400 transition-all bg-white appearance-none pr-8"
          >
            <option value="all">All Years</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name} {year.isActive ? "(Active)" : ""}
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-indigo-400 transition-all bg-white appearance-none pr-8"
          >
            <option value="all">All Classes</option>
            {filterClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredSubjects.length === 0 ? renderEmptyState() : renderTable()}

      {/* Modals */}
      {renderModal()}
      {renderToasts()}

      {/* Animation keyframes */}
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

export default SubjectsPage;
