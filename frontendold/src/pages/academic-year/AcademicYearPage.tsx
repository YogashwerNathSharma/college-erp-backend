import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Calendar,
  Check,
  Plus,
  X,
  Loader2,
  AlertCircle,
  GraduationCap,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface FormData {
  name: string;
  startDate: string;
  endDate: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

const AcademicYearPage: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [settingActive, setSettingActive] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Fetch Academic Years ──────────────────────────────────────────────────

  const fetchAcademicYears = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<AcademicYear[]>>(
        "/api/academic"
      );
      if (response.data.success) {
        setAcademicYears(response.data.data);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch academic years. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  // ─── Auto-dismiss messages ─────────────────────────────────────────────────

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ─── Create Academic Year ──────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Academic year name is required.");
      return;
    }
    if (!formData.startDate) {
      setFormError("Start date is required.");
      return;
    }
    if (!formData.endDate) {
      setFormError("End date is required.");
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setFormError("End date must be after start date.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post<ApiResponse<AcademicYear>>(
        "/api/academic",
        {
          name: formData.name.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate,
        }
      );
      if (response.data.success) {
        setSuccessMsg(`Academic year "${formData.name}" created successfully!`);
        setShowModal(false);
        setFormData({ name: "", startDate: "", endDate: "" });
        fetchAcademicYears();
      }
    } catch (err: any) {
      setFormError(
        err.response?.data?.message ||
          "Failed to create academic year. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Set Active ────────────────────────────────────────────────────────────

  const handleSetActive = async (id: string, name: string) => {
    try {
      setSettingActive(id);
      setError(null);
      const response = await api.patch<ApiResponse<AcademicYear>>(
        `/api/academic/${id}/active`
      );
      if (response.data.success) {
        setSuccessMsg(`"${name}" is now the active academic year.`);
        fetchAcademicYears();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to set active year. Please try again."
      );
    } finally {
      setSettingActive(null);
    }
  };

  // ─── Loading Skeleton ──────────────────────────────────────────────────────

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-24 bg-gray-200 rounded-lg" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-40 bg-gray-100 rounded" />
            <div className="h-4 w-36 bg-gray-100 rounded" />
          </div>
          <div className="mt-5 h-9 w-full bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  );

  // ─── Empty State ───────────────────────────────────────────────────────────

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
        <GraduationCap className="w-10 h-10 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        No Academic Years Found
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
        Get started by creating your first academic year. This will be used
        across the ERP for organizing semesters, exams, and more.
      </p>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Add Academic Year
      </button>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Academic Year
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage academic years and set the currently active session.
          </p>
        </div>
        {!loading && academicYears.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Academic Year
          </button>
        )}
      </div>

      {/* ─── Toast Messages ─────────────────────────────────────────────────── */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton />
      ) : academicYears.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {academicYears
            .sort((a, b) => {
              // Active first, then by createdAt desc
              if (a.isActive && !b.isActive) return -1;
              if (!a.isActive && b.isActive) return 1;
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            })
            .map((year) => (
              <div
                key={year.id}
                className={`relative rounded-2xl border p-6 shadow-sm transition-all duration-200 ${
                  year.isActive
                    ? "bg-gradient-to-br from-indigo-50/80 to-white border-indigo-300 ring-1 ring-indigo-200"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                {/* Active indicator ribbon */}
                {year.isActive && (
                  <div className="absolute top-0 right-6 -translate-y-0">
                    <div className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-b-lg shadow-sm">
                      Current
                    </div>
                  </div>
                )}

                {/* Card Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        year.isActive
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {year.name}
                    </h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      year.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        year.isActive ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    {year.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Date Info */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Start Date</span>
                    <span className="font-medium text-gray-700">
                      {formatDate(year.startDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">End Date</span>
                    <span className="font-medium text-gray-700">
                      {formatDate(year.endDate)}
                    </span>
                  </div>
                </div>

                {/* Action */}
                {!year.isActive && (
                  <button
                    onClick={() => handleSetActive(year.id, year.name)}
                    disabled={settingActive === year.id}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {settingActive === year.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Setting Active…
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Set as Active
                      </>
                    )}
                  </button>
                )}

                {year.isActive && (
                  <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl cursor-default">
                    <Check className="w-4 h-4" />
                    Currently Active
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* ─── Modal ──────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!submitting) {
                setShowModal(false);
                setFormError(null);
              }
            }}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Add Academic Year
                </h2>
              </div>
              <button
                onClick={() => {
                  if (!submitting) {
                    setShowModal(false);
                    setFormError(null);
                  }
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Academic Year Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. 2025-26"
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow placeholder:text-gray-400"
                  disabled={submitting}
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  disabled={submitting}
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  disabled={submitting}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormError(null);
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicYearPage;