import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  ArrowLeft,
  RotateCcw,
  Trash2,
  CheckSquare,
  Square,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { Student, PaginatedResponse } from "./students.types";

const API_BASE = "http://localhost:5000";

interface RecycleBinProps {
  onBack: () => void;
}

const RecycleBin: React.FC<RecycleBinProps> = ({ onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token") || "";

  const fetchDeleted = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<PaginatedResponse<Student>>(
        `${API_BASE}/api/students/deleted`,
        {
          params: { page, limit },
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (res.data.success) {
        setStudents(res.data.data);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch deleted students:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  const handleRestore = async (id: string) => {
    setRestoring(id);
    try {
      await axios.patch(
        `${API_BASE}/api/students/${id}/restore`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      fetchDeleted();
    } catch (err) {
      console.error("Failed to restore student:", err);
      alert("Failed to restore student");
    } finally {
      setRestoring(null);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `Restore ${selectedIds.size} student(s)?`
    );
    if (!confirmed) return;

    setRestoring("bulk");
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          axios.patch(
            `${API_BASE}/api/students/${id}/restore`,
            {},
            { headers: { Authorization: `Bearer ${getToken()}` } }
          )
        )
      );
      setSelectedIds(new Set());
      fetchDeleted();
    } catch (err) {
      console.error("Bulk restore failed:", err);
      alert("Some students could not be restored");
    } finally {
      setRestoring(null);
    }
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

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Recycle Bin</h1>
            <p className="text-sm text-gray-500">
              {total} deleted student{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkRestore}
            disabled={restoring === "bulk"}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <RotateCcw size={16} />
            Restore Selected ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-4 animate-pulse"
              >
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              Recycle Bin is Empty
            </h3>
            <p className="text-sm text-gray-500">
              No deleted students found
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-4 py-3 text-left">
                  <button onClick={toggleSelectAll}>
                    {selectedIds.size === students.length ? (
                      <CheckSquare size={18} className="text-indigo-600" />
                    ) : (
                      <Square size={18} className="text-gray-400" />
                    )}
                  </button>
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
                  Deleted On
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student) => {
                const enrollment = student.enrollments?.[0];
                const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(student.id)}>
                        {selectedIds.has(student.id) ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} className="text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-red-600">
                            {initials}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 line-through opacity-70">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {student.email || student.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.admissionNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {enrollment
                        ? `${enrollment.class?.name} - ${enrollment.section?.name}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(student.deletedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRestore(student.id)}
                        disabled={restoring === student.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                      >
                        {restoring === student.id ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <RotateCcw size={13} />
                        )}
                        Restore
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecycleBin;
