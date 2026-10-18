import { useState, useMemo, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  Trash2,
  CheckSquare,
  Square,
  Filter,
  MoreVertical,
  RefreshCw,
} from "lucide-react";

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

export type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  hidden?: boolean;
};

export type BulkAction = {
  label: string;
  icon?: React.ReactNode;
  variant?: "danger" | "warning" | "primary" | "default";
  onClick: (selectedIds: string[]) => void;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  rowKey?: string;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  bulkActions?: BulkAction[];
  onRefresh?: () => void;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  pageSize?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
};

// ═══════════════════════════════════════════════════
// SKELETON LOADER
// ═══════════════════════════════════════════════════

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-4 px-6 border-b border-slate-100 dark:border-slate-700/50">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1"
              style={{ maxWidth: j === 0 ? "40px" : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  rowKey = "id",
  title,
  subtitle,
  searchPlaceholder = "Search...",
  bulkActions = [],
  onRefresh,
  onExportCSV,
  onExportExcel,
  onExportPDF,
  pageSize = 10,
  emptyMessage = "No data found",
  headerActions,
  onRowClick,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});

  // Visible columns
  const visibleColumns = useMemo(() => columns.filter((c) => !c.hidden), [columns]);

  // Search & Filter
  const filteredData = useMemo(() => {
    let result = [...data];

    // Global search
    if (search) {
      const searchLower = search.toLowerCase();
      const searchableCols = columns.filter((c) => c.searchable !== false);
      result = result.filter((row) =>
        searchableCols.some((col) => {
          const val = row[col.key];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower);
        })
      );
    }

    // Column-level search
    Object.entries(columnSearch).forEach(([key, val]) => {
      if (val) {
        result = result.filter((row) =>
          String(row[key] ?? "").toLowerCase().includes(val.toLowerCase())
        );
      }
    });

    return result;
  }, [data, search, columnSearch, columns]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(
    () => sortedData.slice((page - 1) * pageSize, page * pageSize),
    [sortedData, page, pageSize]
  );

  // Selection
  const allSelected = paginatedData.length > 0 && paginatedData.every((r) => selectedIds.includes(r[rowKey]));

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map((r) => r[rowKey]));
    }
  }, [allSelected, paginatedData, rowKey]);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Global Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={searchPlaceholder}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              />
            </div>

            {/* Refresh */}
            {onRefresh && (
              <button onClick={onRefresh} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Export */}
            {(onExportCSV || onExportExcel || onExportPDF) && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 py-1 min-w-[140px]">
                    {onExportCSV && (
                      <button onClick={() => { onExportCSV(); setShowExportMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <FileText className="w-4 h-4" /> CSV
                      </button>
                    )}
                    {onExportExcel && (
                      <button onClick={() => { onExportExcel(); setShowExportMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <FileSpreadsheet className="w-4 h-4" /> Excel
                      </button>
                    )}
                    {onExportPDF && (
                      <button onClick={() => { onExportPDF(); setShowExportMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <FileText className="w-4 h-4" /> PDF
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {headerActions}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && bulkActions.length > 0 && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              {selectedIds.length} selected
            </span>
            <div className="flex gap-2">
              {bulkActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => action.onClick(selectedIds)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    action.variant === "danger"
                      ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
                      : action.variant === "warning"
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300"
                  }`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedIds([])}
              className="ml-auto text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`bg-slate-50 dark:bg-slate-800/50 ${stickyHeader ? "sticky top-0 z-10" : ""}`}>
            <tr>
              {bulkActions.length > 0 && (
                <th className="px-4 py-3 w-12">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                    {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                    col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"
                  } ${col.sortable !== false ? "cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200" : ""}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && sortKey === col.key && (
                      sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + (bulkActions.length > 0 ? 1 : 0)}>
                  <TableSkeleton rows={pageSize} cols={visibleColumns.length} />
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (bulkActions.length > 0 ? 1 : 0)} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row[rowKey] || idx}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  } ${selectedIds.includes(row[rowKey]) ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {bulkActions.length > 0 && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleRow(row[rowKey])}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {selectedIds.includes(row[rowKey]) ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-300 ${
                        col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {col.render ? col.render(row, idx) : row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER / PAGINATION */}
      {!loading && sortedData.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, sortedData.length)} of{" "}
            {sortedData.length} results
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
