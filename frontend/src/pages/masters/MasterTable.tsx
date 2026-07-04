// ═══════════════════════════════════════════════════════════════════
// MASTER TABLE - Reusable data table component for master entries
// ═══════════════════════════════════════════════════════════════════

import {
  Edit2, Trash2, ToggleLeft, ToggleRight, Copy,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreHorizontal, Loader2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface MasterTableProps {
  entries: any[];
  fields: FieldConfig[];
  loading: boolean;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onEdit: (entry: any) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onClone: (id: string) => void;
}

export default function MasterTable({
  entries, fields, loading, pagination,
  onPageChange, onEdit, onDelete, onToggle, onClone,
}: MasterTableProps) {
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Safely close interactive drop-down action grid menu maps outside container framework target hit bounds
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenuId(null);
      }
    };
    if (actionMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionMenuId]);

  const visibleFields = fields.slice(0, 6);

  const formatValue = (value: any, field: FieldConfig): string => {
    if (value === null || value === undefined) return "—";
    if (field.type === "boolean") return value ? "Yes" : "No";
    if (field.type === "date") {
      try { return new Date(value).toLocaleDateString("en-IN"); } catch { return String(value); }
    }
    if (field.type === "color") return value;
    if (field.type === "select" && field.options) {
      const opt = field.options.find(o => o.value === value);
      return opt ? opt.label : String(value);
    }
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Loading entries data matrix...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-center border border-dashed border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
        <div>
          <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <ChevronsLeft size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No synchronized master engine rows fetched</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-gray-200 dark:border-slate-700 overflow-hidden w-full flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm table-auto min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 select-none">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                #
              </th>
              {visibleFields.map((field) => (
                <th
                  key={field.name}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {entries.map((entry, index) => (
              <tr
                key={entry.id || index}
                className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {(pagination.page - 1) * pagination.limit + index + 1}
                </td>

                {visibleFields.map((field) => (
                  <td key={field.name} className="px-4 py-3">
                    {field.type === "color" && entry[field.name] ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-600 flex-shrink-0"
                          style={{ backgroundColor: entry[field.name] }}
                        />
                        <span className="text-gray-600 dark:text-gray-300 text-xs font-mono">
                          {entry[field.name]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-700 dark:text-gray-300 truncate block max-w-[180px]">
                        {formatValue(entry[field.name], field)}
                      </span>
                    )}
                  </td>
                ))}

                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onToggle(entry.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer select-none ${
                      entry.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    }`}
                  >
                    {entry.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                    {entry.isActive ? "Active" : "Inactive"}
                  </button>
                </td>

                <td className="px-4 py-3 text-center relative">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(entry)}
                      className="p-1.5 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Edit Entry Layout"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setActionMenuId(actionMenuId === entry.id ? null : entry.id)}
                      className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal size={13} />
                    </button>
                  </div>

                  {actionMenuId === entry.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-4 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-30 py-1 animate-fadeIn text-left"
                    >
                      <button
                        onClick={() => { onClone(entry.id); setActionMenuId(null); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                      >
                        <Copy size={13} /> Clone Entry
                      </button>
                      <button
                        onClick={() => { onToggle(entry.id); setActionMenuId(null); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                      >
                        {entry.isActive ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                        {entry.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <hr className="my-1 border-gray-100 dark:border-slate-700" />
                      <button
                        onClick={() => { onDelete(entry.id); setActionMenuId(null); }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 size={13} /> Purge Row
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Alignment Controls */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0 select-none">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={!pagination.hasPrev}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) pageNum = i + 1;
              else if (pagination.page <= 3) pageNum = i + 1;
              else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
              else pageNum = pagination.page - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors ${
                    pageNum === pagination.page
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} />
            </button>
            <button
              onClick={() => onPageChange(pagination.totalPages)}
              disabled={!pagination.hasNext}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
