import { ReactNode, useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Columns3,
  Search,
  Check,
  X,
  Loader2,
  Inbox,
} from "lucide-react";

//////////////////////////////////////////////////////
// 📊 ENHANCED DATA TABLE COMPONENT
// - Mobile card view (<768px)
// - Sticky headers
// - Column visibility toggle
// - Export options
// - Bulk selection
// - Loading skeletons
// - Empty states
// - Pagination with infinite scroll option
//////////////////////////////////////////////////////

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  sortable?: boolean;
  hiddenOnMobile?: boolean;
  priority?: number; // lower = shown first on mobile card
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  exportable?: boolean;
  exportFilename?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  bulkActions?: { label: string; icon?: ReactNode; onClick: (ids: string[]) => void; variant?: "danger" | "default" }[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  infiniteScroll?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  title?: string;
  headerActions?: ReactNode;
  mobileCardRender?: (item: T) => ReactNode;
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data found",
  emptyIcon,
  onRowClick,
  keyExtractor,
  searchable = false,
  searchPlaceholder = "Search...",
  exportable = false,
  exportFilename = "export",
  selectable = false,
  onSelectionChange,
  bulkActions,
  pagination,
  infiniteScroll = false,
  onLoadMore,
  hasMore = false,
  title,
  headerActions,
  mobileCardRender,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.key))
  );
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!infiniteScroll || !onLoadMore || !hasMore) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    return () => observerRef.current?.disconnect();
  }, [infiniteScroll, onLoadMore, hasMore, loading]);

  // Selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [onSelectionChange]);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    } else {
      const all = new Set(data.map(keyExtractor));
      setSelectedIds(all);
      onSelectionChange?.(Array.from(all));
    }
  }, [data, keyExtractor, selectedIds.size, onSelectionChange]);

  // Filter data by search
  const filteredData = searchQuery
    ? data.filter((item) =>
        columns.some((col) => {
          const value = (item as any)[col.key];
          return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
        })
      )
    : data;

  // Export to CSV
  const handleExport = () => {
    const visibleCols = columns.filter((c) => visibleColumns.has(c.key));
    const headers = visibleCols.map((c) => c.label).join(",");
    const rows = filteredData.map((item) =>
      visibleCols.map((col) => {
        const value = (item as any)[col.key];
        return `"${(value || "").toString().replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Visible columns for display
  const displayColumns = columns.filter((c) => visibleColumns.has(c.key));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-soft border border-gray-100 dark:border-slate-700 overflow-hidden animate-fade-in">
      {/* Header */}
      {(title || searchable || exportable || headerActions) && (
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 dark:border-slate-700 flex flex-wrap items-center gap-3">
          {title && (
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mr-auto">
              {title}
            </h3>
          )}

          {/* Search */}
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all min-h-touch"
                aria-label="Search table"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {headerActions}

            {/* Column visibility */}
            <div className="relative">
              <button
                onClick={() => setShowColumnPicker(!showColumnPicker)}
                className="tap-target rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle columns"
                title="Column visibility"
              >
                <Columns3 size={18} />
              </button>
              {showColumnPicker && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 py-2 z-30 animate-fade-in-down">
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer min-h-[36px]"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.key)}
                        onChange={() => {
                          setVisibleColumns((prev) => {
                            const next = new Set(prev);
                            if (next.has(col.key)) next.delete(col.key);
                            else next.add(col.key);
                            return next;
                          });
                        }}
                        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Export */}
            {exportable && (
              <button
                onClick={handleExport}
                className="tap-target rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                aria-label="Export data"
                title="Export CSV"
              >
                <Download size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Content */}
      {loading && data.length === 0 ? (
        /* Loading Skeleton */
        <div className="p-4 md:p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              {selectable && <div className="w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded" />}
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-slate-700/50 rounded w-1/2" />
              </div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20" />
            </div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
          {emptyIcon || (
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <Inbox size={28} className="text-gray-400" />
            </div>
          )}
          <p className="text-gray-500 dark:text-gray-400 text-sm">{emptyMessage}</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-3 text-primary-500 text-sm font-medium hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : isMobile ? (
        /* Mobile Card View */
        <div className="p-3 space-y-3">
          {filteredData.map((item) => {
            const id = keyExtractor(item);
            return (
              <div
                key={id}
                className={`bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-100 dark:border-slate-600 transition-all ${
                  onRowClick ? "cursor-pointer active:scale-[0.98]" : ""
                } ${selectedIds.has(id) ? "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20" : ""}`}
                onClick={() => onRowClick?.(item)}
              >
                {mobileCardRender ? (
                  mobileCardRender(item)
                ) : (
                  <div className="space-y-2">
                    {selectable && (
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            selectedIds.has(id)
                              ? "bg-primary-500 border-primary-500 text-white"
                              : "border-gray-300 dark:border-slate-500"
                          }`}
                        >
                          {selectedIds.has(id) && <Check size={12} />}
                        </button>
                      </div>
                    )}
                    {displayColumns
                      .filter((col) => !col.hiddenOnMobile)
                      .slice(0, 5)
                      .map((col) => (
                        <div key={col.key} className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {col.label}
                          </span>
                          <span className="text-sm text-gray-800 dark:text-gray-200 text-right">
                            {col.render ? col.render(item) : (item as any)[col.key]}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0 z-10">
              <tr>
                {selectable && (
                  <th className="px-4 py-3 w-12">
                    <button
                      onClick={toggleSelectAll}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        selectedIds.size === data.length && data.length > 0
                          ? "bg-primary-500 border-primary-500 text-white"
                          : "border-gray-300 dark:border-slate-500 hover:border-primary-400"
                      }`}
                      aria-label="Select all"
                    >
                      {selectedIds.size === data.length && data.length > 0 && <Check size={12} />}
                    </button>
                  </th>
                )}
                {displayColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 md:px-6 py-3 text-${col.align || "left"} text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredData.map((item) => {
                const id = keyExtractor(item);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(item)}
                    className={`transition-colors ${
                      onRowClick ? "cursor-pointer" : ""
                    } ${
                      selectedIds.has(id)
                        ? "bg-primary-50 dark:bg-primary-900/10"
                        : "hover:bg-gray-50 dark:hover:bg-slate-700/30"
                    }`}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            selectedIds.has(id)
                              ? "bg-primary-500 border-primary-500 text-white"
                              : "border-gray-300 dark:border-slate-500"
                          }`}
                          aria-label={`Select row ${id}`}
                        >
                          {selectedIds.has(id) && <Check size={12} />}
                        </button>
                      </td>
                    )}
                    {displayColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 md:px-6 py-3.5 text-sm text-${col.align || "left"} text-gray-700 dark:text-gray-300`}
                      >
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Infinite scroll trigger */}
      {infiniteScroll && hasMore && (
        <div ref={loadMoreRef} className="py-4 flex items-center justify-center">
          {loading && <Loader2 size={20} className="animate-spin text-primary-500" />}
        </div>
      )}

      {/* Pagination */}
      {pagination && !infiniteScroll && pagination.totalPages > 1 && (
        <div className="px-4 md:px-6 py-3 border-t border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {(pagination.currentPage - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{" "}
            {pagination.totalItems}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.currentPage === 1}
              className="tap-target rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="First page"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="tap-target rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="tap-target rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="tap-target rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Last page"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectable && selectedIds.size > 0 && bulkActions && (
        <div className="floating-action-bar">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-white/30" />
          {bulkActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => action.onClick(Array.from(selectedIds))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                action.variant === "danger"
                  ? "bg-red-500 hover:bg-red-400 text-white"
                  : "bg-white/20 hover:bg-white/30 text-white"
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
          <button
            onClick={() => { setSelectedIds(new Set()); onSelectionChange?.([]); }}
            className="tap-target text-white/60 hover:text-white ml-1"
            aria-label="Clear selection"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
