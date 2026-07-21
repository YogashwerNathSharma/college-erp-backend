import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  GripVertical,
  Filter,
  X,
  CheckSquare,
  Square,
  MinusSquare,
  Loader2,
  Database,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface ColumnDef<T> {
  id: string;
  label: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  frozen?: boolean;
  hidden?: boolean;
  align?: "left" | "center" | "right";
  renderCell?: (value: any, row: T, index: number) => React.ReactNode;
  renderFilter?: (value: string, onChange: (val: string) => void) => React.ReactNode;
  filterOptions?: { label: string; value: string }[];
}

export interface SortConfig {
  columnId: string;
  direction: "asc" | "desc";
}

export interface EnterpriseTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (columnId: string, direction: "asc" | "desc", multiSort?: boolean) => void;
  multiSort?: SortConfig[];
  onMultiSort?: (sorts: SortConfig[]) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  onRowContextMenu?: (e: React.MouseEvent, row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  stickyHeader?: boolean;
  frozenColumns?: number;
  enableResize?: boolean;
  enableReorder?: boolean;
  enableColumnManager?: boolean;
  enableColumnFilters?: boolean;
  rowKey?: keyof T;
  className?: string;
  pageSizeOptions?: number[];
  storageKey?: string;
}

export interface EnterpriseTableRef {
  scrollToIndex: (index: number) => void;
  resetColumns: () => void;
  getVisibleColumns: () => string[];
}

// ══════════════════════════════════════════════════════════════════
// HELPER: Column Width Persistence
// ══════════════════════════════════════════════════════════════════

function loadColumnWidths(storageKey: string): Record<string, number> {
  try {
    const stored = localStorage.getItem(`et_widths_${storageKey}`);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveColumnWidths(storageKey: string, widths: Record<string, number>) {
  try {
    localStorage.setItem(`et_widths_${storageKey}`, JSON.stringify(widths));
  } catch {
    // localStorage full or unavailable
  }
}

function loadHiddenColumns(storageKey: string): string[] {
  try {
    const stored = localStorage.getItem(`et_hidden_${storageKey}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHiddenColumns(storageKey: string, hidden: string[]) {
  try {
    localStorage.setItem(`et_hidden_${storageKey}`, JSON.stringify(hidden));
  } catch {}
}

// ══════════════════════════════════════════════════════════════════
// SKELETON
// ══════════════════════════════════════════════════════════════════

function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 py-3.5 px-4 border-b border-gray-100 dark:border-slate-700/50"
        >
          <div className="h-4 w-4 bg-gray-200 dark:bg-slate-700 rounded" />
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-4 bg-gray-200 dark:bg-slate-700 rounded flex-1"
              style={{ maxWidth: j === 0 ? "120px" : j === 1 ? "200px" : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// RESIZE HANDLE
// ══════════════════════════════════════════════════════════════════

function ResizeHandle({
  onResize,
  onResizeEnd,
}: {
  onResize: (delta: number) => void;
  onResizeEnd: () => void;
}) {
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startXRef.current = e.clientX;
      isDraggingRef.current = true;

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const delta = ev.clientX - startXRef.current;
        startXRef.current = ev.clientX;
        onResize(delta);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        onResizeEnd();
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onResize, onResizeEnd]
  );

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-400 dark:hover:bg-indigo-500 transition-colors z-10 group"
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column"
    >
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-300 dark:bg-slate-600 group-hover:bg-indigo-400 transition-colors rounded-full" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// COLUMN FILTER DROPDOWN
// ══════════════════════════════════════════════════════════════════

function ColumnFilterDropdown<T>({
  column,
  value,
  onChange,
}: {
  column: ColumnDef<T>;
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`p-0.5 rounded transition-colors ${
          value
            ? "text-indigo-500 dark:text-indigo-400"
            : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
        }`}
        aria-label={`Filter ${column.label}`}
      >
        <Filter size={12} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[180px] p-2">
          {column.renderFilter ? (
            column.renderFilter(value, onChange)
          ) : column.filterOptions ? (
            <div className="space-y-1">
              <button
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 text-xs rounded ${
                  !value
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
                }`}
              >
                All
              </button>
              {column.filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-xs rounded ${
                    value === opt.value
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`Filter ${column.label}...`}
                className="flex-1 text-xs px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
                autoFocus
              />
              {value && (
                <button
                  onClick={() => onChange("")}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

function EnterpriseTableInner<T extends Record<string, any>>(
  {
    columns: initialColumns,
    data,
    total,
    page,
    limit,
    onPageChange,
    onLimitChange,
    sortBy,
    sortDir = "asc",
    onSort,
    multiSort,
    onMultiSort,
    selectedIds = [],
    onSelectionChange,
    onRowClick,
    onRowContextMenu,
    loading = false,
    emptyMessage = "No records found",
    emptyIcon,
    stickyHeader = true,
    frozenColumns = 0,
    enableResize = true,
    enableReorder = false,
    enableColumnManager = true,
    enableColumnFilters = true,
    rowKey = "id" as keyof T,
    className = "",
    pageSizeOptions = [25, 50, 100, 200],
    storageKey = "enterprise_table",
  }: EnterpriseTableProps<T>,
  ref: React.Ref<EnterpriseTableRef>
) {
  // ── State ──
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    loadColumnWidths(storageKey)
  );
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() =>
    loadHiddenColumns(storageKey)
  );
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const columnManagerRef = useRef<HTMLDivElement>(null);

  // ── Visible Columns ──
  const visibleColumns = useMemo(
    () =>
      initialColumns.filter(
        (col) => !col.hidden && !hiddenColumns.includes(col.id)
      ),
    [initialColumns, hiddenColumns]
  );

  // ── Column widths with defaults ──
  const getColumnWidth = useCallback(
    (col: ColumnDef<T>) => {
      return columnWidths[col.id] || col.width || 150;
    },
    [columnWidths]
  );

  // ── Imperative Handle ──
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number) => {
      const container = tableContainerRef.current;
      if (container) {
        const rowHeight = 48;
        container.scrollTop = index * rowHeight;
      }
    },
    resetColumns: () => {
      setColumnWidths({});
      setHiddenColumns([]);
      saveColumnWidths(storageKey, {});
      saveHiddenColumns(storageKey, []);
    },
    getVisibleColumns: () => visibleColumns.map((c) => c.id),
  }));

  // ── Persist column widths on change ──
  useEffect(() => {
    saveColumnWidths(storageKey, columnWidths);
  }, [columnWidths, storageKey]);

  useEffect(() => {
    saveHiddenColumns(storageKey, hiddenColumns);
  }, [hiddenColumns, storageKey]);

  // ── Close column manager on outside click ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        columnManagerRef.current &&
        !columnManagerRef.current.contains(e.target as Node)
      ) {
        setShowColumnManager(false);
      }
    }
    if (showColumnManager) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColumnManager]);

  // ── Selection Logic ──
  const allPageIds = useMemo(
    () => data.map((row) => String(row[rowKey])),
    [data, rowKey]
  );

  const isAllSelected = useMemo(
    () => allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id)),
    [allPageIds, selectedIds]
  );

  const isSomeSelected = useMemo(
    () => allPageIds.some((id) => selectedIds.includes(id)) && !isAllSelected,
    [allPageIds, selectedIds, isAllSelected]
  );

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange(selectedIds.filter((id) => !allPageIds.includes(id)));
    } else {
      const newIds = [...new Set([...selectedIds, ...allPageIds])];
      onSelectionChange(newIds);
    }
  }, [isAllSelected, selectedIds, allPageIds, onSelectionChange]);

  const handleSelectRow = useCallback(
    (id: string) => {
      if (!onSelectionChange) return;
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((s) => s !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    },
    [selectedIds, onSelectionChange]
  );

  // ── Sort Logic ──
  const handleSort = useCallback(
    (columnId: string, e: React.MouseEvent) => {
      if (!onSort) return;
      const isMulti = e.shiftKey && onMultiSort;

      if (isMulti && multiSort) {
        const existing = multiSort.find((s) => s.columnId === columnId);
        if (existing) {
          if (existing.direction === "asc") {
            onMultiSort(
              multiSort.map((s) =>
                s.columnId === columnId ? { ...s, direction: "desc" } : s
              )
            );
          } else {
            onMultiSort(multiSort.filter((s) => s.columnId !== columnId));
          }
        } else {
          onMultiSort([...multiSort, { columnId, direction: "asc" }]);
        }
      } else {
        const newDir =
          sortBy === columnId ? (sortDir === "asc" ? "desc" : "asc") : "asc";
        onSort(columnId, newDir, false);
      }
    },
    [onSort, onMultiSort, sortBy, sortDir, multiSort]
  );

  // ── Resize Logic ──
  const handleResize = useCallback(
    (columnId: string, delta: number) => {
      setColumnWidths((prev) => {
        const col = initialColumns.find((c) => c.id === columnId);
        const current = prev[columnId] || col?.width || 150;
        const minW = col?.minWidth || 60;
        const maxW = col?.maxWidth || 600;
        const newWidth = Math.max(minW, Math.min(maxW, current + delta));
        return { ...prev, [columnId]: newWidth };
      });
    },
    [initialColumns]
  );

  // ── Keyboard Navigation ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (loading || data.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedRowIndex((prev) => Math.min(prev + 1, data.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          if (focusedRowIndex >= 0 && onRowClick) {
            onRowClick(data[focusedRowIndex]);
          }
          break;
        case " ":
          e.preventDefault();
          if (focusedRowIndex >= 0 && onSelectionChange) {
            const id = String(data[focusedRowIndex][rowKey]);
            handleSelectRow(id);
          }
          break;
        case "Escape":
          setFocusedRowIndex(-1);
          break;
      }
    },
    [loading, data, focusedRowIndex, onRowClick, onSelectionChange, handleSelectRow, rowKey]
  );

  // ── Pagination ──
  const totalPages = Math.ceil(total / limit);
  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  // ── Frozen Columns ──
  const frozenCols = useMemo(
    () => visibleColumns.slice(0, frozenColumns),
    [visibleColumns, frozenColumns]
  );
  const scrollableCols = useMemo(
    () => visibleColumns.slice(frozenColumns),
    [visibleColumns, frozenColumns]
  );
  const frozenWidth = useMemo(
    () => frozenCols.reduce((sum, col) => sum + getColumnWidth(col), 0) + (onSelectionChange ? 44 : 0),
    [frozenCols, getColumnWidth, onSelectionChange]
  );

  // ── Cell Value Accessor ──
  const getCellValue = useCallback((row: T, col: ColumnDef<T>) => {
    if (typeof col.accessor === "function") return col.accessor(row);
    return row[col.accessor as keyof T];
  }, []);

  // ── Toggle column visibility ──
  const toggleColumn = useCallback((colId: string) => {
    setHiddenColumns((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="grid"
      aria-rowcount={total}
      aria-colcount={visibleColumns.length}
    >
      {/* ── Column Manager Toggle ── */}
      {enableColumnManager && (
        <div className="flex items-center justify-end px-4 py-2 border-b border-gray-100 dark:border-slate-700/50">
          <div ref={columnManagerRef} className="relative">
            <button
              onClick={() => setShowColumnManager(!showColumnManager)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              aria-label="Manage columns"
            >
              <Settings2 size={14} />
              Columns
            </button>
            {showColumnManager && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 p-3 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                    Toggle Columns
                  </span>
                  <button
                    onClick={() => setHiddenColumns([])}
                    className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
                  >
                    Show All
                  </button>
                </div>
                <div className="space-y-1">
                  {initialColumns.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.includes(col.id) && !col.hidden}
                        onChange={() => toggleColumn(col.id)}
                        disabled={col.frozen}
                        className="w-3.5 h-3.5 rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-700 dark:text-slate-300">
                        {col.label}
                      </span>
                      {col.frozen && (
                        <span className="ml-auto text-[10px] text-gray-400 dark:text-slate-500">
                          Frozen
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Table Container ── */}
      <div
        ref={tableContainerRef}
        className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]"
      >
        <table className="w-full border-collapse" role="grid">
          {/* ── Header ── */}
          <thead
            className={
              stickyHeader
                ? "sticky top-0 z-20 bg-gray-50 dark:bg-slate-800/95 backdrop-blur-sm"
                : "bg-gray-50 dark:bg-slate-800"
            }
          >
            <tr className="border-b border-gray-200 dark:border-slate-700">
              {/* Selection Column */}
              {onSelectionChange && (
                <th
                  className={`w-11 px-3 py-3 text-center ${
                    frozenColumns > 0
                      ? "sticky left-0 z-30 bg-gray-50 dark:bg-slate-800"
                      : ""
                  }`}
                >
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                    aria-label={isAllSelected ? "Deselect all" : "Select all"}
                  >
                    {isAllSelected ? (
                      <CheckSquare size={16} />
                    ) : isSomeSelected ? (
                      <MinusSquare size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
              )}

              {/* Data Columns */}
              {visibleColumns.map((col, colIdx) => {
                const width = getColumnWidth(col);
                const isFrozen = colIdx < frozenColumns;
                const leftOffset = isFrozen
                  ? visibleColumns
                      .slice(0, colIdx)
                      .reduce((sum, c) => sum + getColumnWidth(c), 0) +
                    (onSelectionChange ? 44 : 0)
                  : undefined;

                const isSorted = sortBy === col.id;
                const multiSortEntry = multiSort?.find((s) => s.columnId === col.id);

                return (
                  <th
                    key={col.id}
                    className={`relative px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap ${
                      isFrozen
                        ? "sticky z-30 bg-gray-50 dark:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                        : ""
                    } ${col.sortable ? "cursor-pointer hover:text-gray-900 dark:hover:text-slate-200" : ""}`}
                    style={{
                      width: `${width}px`,
                      minWidth: `${col.minWidth || 60}px`,
                      left: isFrozen ? `${leftOffset}px` : undefined,
                    }}
                    onClick={(e) => col.sortable && handleSort(col.id, e)}
                    role="columnheader"
                    aria-sort={
                      isSorted
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>

                      {/* Sort Indicator */}
                      {col.sortable && (isSorted || multiSortEntry) && (
                        <span className="text-indigo-500 dark:text-indigo-400">
                          {(isSorted && sortDir === "asc") ||
                          multiSortEntry?.direction === "asc" ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </span>
                      )}

                      {/* Column Filter */}
                      {enableColumnFilters && col.filterable && (
                        <ColumnFilterDropdown
                          column={col}
                          value={columnFilters[col.id] || ""}
                          onChange={(val) =>
                            setColumnFilters((prev) => ({ ...prev, [col.id]: val }))
                          }
                        />
                      )}
                    </div>

                    {/* Resize Handle */}
                    {enableResize && (
                      <ResizeHandle
                        onResize={(delta) => handleResize(col.id, delta)}
                        onResizeEnd={() => {}}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + (onSelectionChange ? 1 : 0)}>
                  <TableSkeleton rows={limit > 10 ? 10 : limit} cols={Math.min(visibleColumns.length, 8)} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (onSelectionChange ? 1 : 0)}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    {emptyIcon || (
                      <Database size={40} className="text-gray-300 dark:text-slate-600" />
                    )}
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => {
                const rowId = String(row[rowKey]);
                const isSelected = selectedIds.includes(rowId);
                const isFocused = rowIdx === focusedRowIndex;

                return (
                  <tr
                    key={rowId}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-indigo-50/60 dark:bg-indigo-900/20"
                        : isFocused
                        ? "bg-gray-50 dark:bg-slate-800/50"
                        : rowIdx % 2 === 1
                        ? "bg-gray-50/50 dark:bg-slate-800/20"
                        : ""
                    } hover:bg-gray-100/80 dark:hover:bg-slate-800/60 ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                    onClick={() => onRowClick?.(row)}
                    onContextMenu={(e) => {
                      if (onRowContextMenu) {
                        e.preventDefault();
                        onRowContextMenu(e, row);
                      }
                    }}
                    role="row"
                    aria-rowindex={rowIdx + 1}
                    aria-selected={isSelected}
                  >
                    {/* Selection Checkbox */}
                    {onSelectionChange && (
                      <td
                        className={`w-11 px-3 py-3 text-center ${
                          frozenColumns > 0
                            ? "sticky left-0 z-10 bg-inherit"
                            : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleSelectRow(rowId)}
                          className="text-gray-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                          aria-label={isSelected ? "Deselect row" : "Select row"}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-indigo-500 dark:text-indigo-400" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                    )}

                    {/* Data Cells */}
                    {visibleColumns.map((col, colIdx) => {
                      const width = getColumnWidth(col);
                      const isFrozen = colIdx < frozenColumns;
                      const leftOffset = isFrozen
                        ? visibleColumns
                            .slice(0, colIdx)
                            .reduce((sum, c) => sum + getColumnWidth(c), 0) +
                          (onSelectionChange ? 44 : 0)
                        : undefined;
                      const value = getCellValue(row, col);

                      return (
                        <td
                          key={col.id}
                          className={`px-4 py-3 text-sm text-gray-700 dark:text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis ${
                            isFrozen
                              ? "sticky z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                              : ""
                          } ${
                            col.align === "center"
                              ? "text-center"
                              : col.align === "right"
                              ? "text-right"
                              : "text-left"
                          }`}
                          style={{
                            width: `${width}px`,
                            maxWidth: `${width}px`,
                            left: isFrozen ? `${leftOffset}px` : undefined,
                          }}
                          role="gridcell"
                        >
                          {col.renderCell
                            ? col.renderCell(value, row, rowIdx)
                            : value != null
                            ? String(value)
                            : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer: Pagination ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
        {/* Left: Record info */}
        <div className="text-xs text-gray-500 dark:text-slate-400">
          {selectedIds.length > 0 && (
            <span className="mr-3 font-medium text-indigo-600 dark:text-indigo-400">
              {selectedIds.length} selected
            </span>
          )}
          Showing {total > 0 ? startRecord : 0}–{endRecord} of {total.toLocaleString()} records
        </div>

        {/* Center: Page size */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-slate-400">Rows:</label>
          <select
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="text-xs px-2 py-1 border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-slate-400"
            aria-label="First page"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-slate-400"
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="px-3 text-xs font-medium text-gray-700 dark:text-slate-300">
            {page} / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-slate-400"
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-slate-400"
            aria-label="Last page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Forward ref with generics workaround
const EnterpriseTable = forwardRef(EnterpriseTableInner) as <T extends Record<string, any>>(
  props: EnterpriseTableProps<T> & { ref?: React.Ref<EnterpriseTableRef> }
) => React.ReactElement;

export default EnterpriseTable;
export type { EnterpriseTableProps as TableProps };
