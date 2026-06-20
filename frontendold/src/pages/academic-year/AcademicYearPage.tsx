
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
  Trash2,
  RotateCcw,
  Power,
  Edit3,
  Archive,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCurrent: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
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

const API_BASE = "";

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
  const [deletedYears, setDeletedYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRecycleBin, setShowRecycleBin] = useState<boolean>(false);
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

  const fetchDeletedYears = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<AcademicYear[]>>(
        "/api/academic/recycle-bin"
      );
      if (response.data.success) {
        setDeletedYears(response.data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch deleted years:", err);
    }
  }, []);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  useEffect(() => {
    if (showRecycleBin) {
      fetchDeletedYears();
    }
  }, [showRecycleBin, fetchDeletedYears]);

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

      if (editingYear) {
        const response = await api.put<ApiResponse<AcademicYear>>(
          `/api/academic/${editingYear.id}`,
          {
            name: formData.name.trim(),
            startDate: formData.startDate,
            endDate: formData.endDate,
          }
        );
        if (response.data.success) {
          setSuccessMsg(`Academic year "${formData.name}" updated successfully!`);
        }
      } else {
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
        }
      }

      setShowModal(false);
      setEditingYear(null);
      setFormData({ name: "", startDate: "", endDate: "" });
      fetchAcademicYears();
    } catch (err: any) {
      setFormError(
        err.response?.data?.message ||
          "Failed to save academic year. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Set Active ────────────────────────────────────────────────────────────

  /*const handleSetActive = async (id: string, name: string) => {
    try {
      setActionLoading(id);
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
      setActionLoading(null);
    }
  };*/

  // ─── Toggle Status ─────────────────────────────────────────────────────────

  const handleToggleStatus = async (id: string, name: string, currentlyActive: boolean) => {
    try {
      setActionLoading(id);
      setError(null);
      const response = await api.patch<ApiResponse<AcademicYear>>(
        `/api/academic/${id}/toggle-status`
      );
      if (response.data.success) {
        setSuccessMsg(
          currentlyActive
            ? `"${name}" has been deactivated.`
            : `"${name}" is now active.`
        );
        fetchAcademicYears();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to toggle status. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Soft Delete ───────────────────────────────────────────────────────────

  const handleSoftDelete = async (id: string, name: string) => {
    if (!confirm(`Move "${name}" to recycle bin?`)) return;

    try {
      setActionLoading(id);
      setError(null);
      const response = await api.delete<ApiResponse<AcademicYear>>(
        `/api/academic/${id}`
      );
      if (response.data.success) {
        setSuccessMsg(`"${name}" moved to recycle bin.`);
        fetchAcademicYears();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to delete. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Restore ──────────────────────────────────────────────────────────────

  const handleRestore = async (id: string, name: string) => {
    try {
      setActionLoading(id);
      const response = await api.patch<ApiResponse<AcademicYear>>(
        `/api/academic/${id}/restore`
      );
      if (response.data.success) {
        setSuccessMsg(`"${name}" restored successfully.`);
        fetchDeletedYears();
        fetchAcademicYears();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to restore. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Edit ──────────────────────────────────────────────────────────────────

  const handleEdit = (year: AcademicYear) => {
    setEditingYear(year);
    setFormData({
      name: year.name,
      startDate: year.startDate.split("T")[0],
      endDate: year.endDate.split("T")[0],
    });
    setShowModal(true);
  };

  // ─── Open Modal for New ────────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditingYear(null);
    setFormData({ name: "", startDate: "", endDate: "" });
    setFormError(null);
    setShowModal(true);
  };

  // ─── Loading Skeleton ──────────────────────────────────────────────────────

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
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
      <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-5">
        <GraduationCap className="w-10 h-10 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">No Academic Years Found</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
        Get started by creating your first academic year.
      </p>
      <button onClick={openCreateModal} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
        <Plus className="w-4 h-4" />
        Add Academic Year
      </button>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Academic Year</h1>
          <p className="text-sm text-gray-500 mt-1">Manage academic years and set the currently active session.</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setShowRecycleBin(!showRecycleBin)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
              showRecycleBin ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Archive className="w-4 h-4" />
            Recycle Bin
            {deletedYears.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">{deletedYears.length}</span>
            )}
          </button>

          {!loading && academicYears.length > 0 && !showRecycleBin && (
            <button onClick={openCreateModal} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Add Academic Year
            </button>
          )}
        </div>
      </div>

      {/* Toast Messages */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Recycle Bin View */}
      {showRecycleBin ? (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Archive className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-800">Recycle Bin</h2>
            <span className="text-sm text-gray-500">({deletedYears.length} items)</span>
          </div>

          {deletedYears.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Archive className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Recycle bin is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {deletedYears.map((year) => (
                <div key={year.id} className="rounded-2xl border border-orange-200 bg-orange-50/50 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-orange-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700">{year.name}</h3>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Deleted</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Start Date</span>
                      <span className="font-medium text-gray-600">{formatDate(year.startDate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">End Date</span>
                      <span className="font-medium text-gray-600">{formatDate(year.endDate)}</span>
                    </div>
                    {year.deletedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Deleted On</span>
                        <span className="font-medium text-red-600">{formatDate(year.deletedAt)}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRestore(year.id, year.name)}
                    disabled={actionLoading === year.id}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-60"
                  >
                    {actionLoading === year.id ? (<><Loader2 className="w-4 h-4 animate-spin" />Restoring…</>) : (<><RotateCcw className="w-4 h-4" />Restore</>)}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {loading ? (
            <LoadingSkeleton />
          ) : academicYears.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {academicYears
                .sort((a, b) => {
                  if (a.isCurrent && !b.isCurrent) return -1;
                  if (!a.isCurrent && b.isCurrent) return 1;
                  if (a.isActive && !b.isActive) return -1;
                  if (!a.isActive && b.isActive) return 1;
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .map((year) => (
                  <div
                    key={year.id}
                    className={`relative rounded-2xl border p-6 shadow-sm transition-all duration-200 ${
                      year.isCurrent || year.isActive
                        ? "bg-gradient-to-br from-indigo-50/80 to-white border-primary-300 ring-1 ring-indigo-200"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    {/* Current Year Ribbon */}
                    {(year.isCurrent || year.isActive) && (
                      <div className="absolute top-0 right-6 -translate-y-0">
                        <div className="bg-primary-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-b-lg shadow-sm">
                          {year.isCurrent ? "Current" : "Active"}
                        </div>
                      </div>
                    )}

                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          year.isCurrent || year.isActive ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{year.name}</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        year.isCurrent || year.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${year.isCurrent || year.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                        {year.isCurrent ? "Current" : year.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Date Info */}
                    <div className="space-y-2 mb-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Start Date</span>
                        <span className="font-medium text-gray-700">{formatDate(year.startDate)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">End Date</span>
                        <span className="font-medium text-gray-700">{formatDate(year.endDate)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(year.id, year.name, year.isActive)}
                        disabled={actionLoading === year.id}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                          year.isActive
                            ? "text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100"
                            : "text-primary-700 bg-primary-50 border-primary-200 hover:bg-primary-100"
                        }`}
                      >
                        {actionLoading === year.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                        {year.isActive ? "Deactivate" : "Set Current"}
                      </button>

                      <button
                        onClick={() => handleEdit(year)}
                        className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {!year.isActive && !year.isCurrent && (
                        <button
                          onClick={() => handleSoftDelete(year.id, year.name)}
                          disabled={actionLoading === year.id}
                          className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-60"
                          title="Move to Recycle Bin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* Modal (Create / Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { if (!submitting) { setShowModal(false); setEditingYear(null); setFormError(null); } }} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingYear ? "Edit Academic Year" : "Add Academic Year"}
                </h2>
              </div>
              <button onClick={() => { if (!submitting) { setShowModal(false); setEditingYear(null); setFormError(null); } }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. 2025-26" className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow placeholder:text-gray-400" disabled={submitting} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))} className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow" disabled={submitting} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                <input type="date" value={formData.endDate} onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))} className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow" disabled={submitting} />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingYear(null); setFormError(null); }} disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" />{editingYear ? "Updating…" : "Creating…"}</>) : (<>{editingYear ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{editingYear ? "Update" : "Create"}</>)}
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

