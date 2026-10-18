import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Settings2,
  Search,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
  Check,
  X,
  Lock,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  frozen?: boolean;
  required?: boolean;
}

export interface ColumnManagerProps {
  columns: ColumnConfig[];
  onToggle: (columnId: string) => void;
  onReorder: (columns: ColumnConfig[]) => void;
  onReset: () => void;
  onShowAll?: () => void;
  onHideAll?: () => void;
  className?: string;
  trigger?: React.ReactNode;
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function ColumnManager({
  columns,
  onToggle,
  onReorder,
  onReset,
  onShowAll,
  onHideAll,
  className = "",
  trigger,
}: ColumnManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Filtered columns based on search
  const filteredColumns = useMemo(() => {
    if (!search.trim()) return columns;
    const term = search.toLowerCase();
    return columns.filter((col) => col.label.toLowerCase().includes(term));
  }, [columns, search]);

  // Visible/hidden counts
  const visibleCount = useMemo(
    () => columns.filter((c) => c.visible).length,
    [columns]
  );
  const hiddenCount = columns.length - visibleCount;

  // ── Drag & Drop handlers ──
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;
      setDragOverIndex(index);
    },
    [draggedIndex]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      const newColumns = [...columns];
      const [removed] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(dropIndex, 0, removed);
      onReorder(newColumns);
      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex, columns, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Show all / Hide all handlers
  const handleShowAll = useCallback(() => {
    if (onShowAll) {
      onShowAll();
    } else {
      columns.forEach((col) => {
        if (!col.visible && !col.required) onToggle(col.id);
      });
    }
  }, [columns, onToggle, onShowAll]);

  const handleHideAll = useCallback(() => {
    if (onHideAll) {
      onHideAll();
    } else {
      columns.forEach((col) => {
        if (col.visible && !col.required && !col.frozen) onToggle(col.id);
      });
    }
  }, [columns, onToggle, onHideAll]);

  return (
    <div ref={panelRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg border transition-all ${
            isOpen
              ? "border-indigo-300 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500"
          }`}
          aria-label="Manage columns"
          aria-expanded={isOpen}
        >
          <Settings2 size={14} />
          <span className="hidden sm:inline">Columns</span>
          {hiddenCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[16px] h-4 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-full px-1">
              {hiddenCount}
            </span>
          )}
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-semibold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
                Manage Columns
              </h4>
              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                {visibleCount}/{columns.length} visible
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search columns..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 dark:border-slate-700">
            <button
              onClick={handleShowAll}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <Eye size={11} />
              Show All
            </button>
            <button
              onClick={handleHideAll}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <EyeOff size={11} />
              Hide All
            </button>
            <div className="flex-1" />
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          </div>

          {/* Column List */}
          <div className="max-h-64 overflow-y-auto py-1">
            {filteredColumns.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  No columns match "{search}"
                </p>
              </div>
            ) : (
              filteredColumns.map((col, index) => {
                const actualIndex = columns.findIndex((c) => c.id === col.id);
                const isDraggedOver = dragOverIndex === actualIndex;
                const isDragging = draggedIndex === actualIndex;

                return (
                  <div
                    key={col.id}
                    draggable={!col.frozen && !col.required}
                    onDragStart={() => handleDragStart(actualIndex)}
                    onDragOver={(e) => handleDragOver(e, actualIndex)}
                    onDrop={(e) => handleDrop(e, actualIndex)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 px-3 py-2 mx-1 rounded-md transition-all ${
                      isDraggedOver
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-t-2 border-indigo-400"
                        : isDragging
                        ? "opacity-50 bg-gray-50 dark:bg-slate-700"
                        : "hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    } ${col.frozen || col.required ? "opacity-70" : "cursor-grab active:cursor-grabbing"}`}
                  >
                    {/* Drag Handle */}
                    <div
                      className={`flex-shrink-0 ${
                        col.frozen || col.required
                          ? "text-gray-200 dark:text-slate-700"
                          : "text-gray-400 dark:text-slate-500"
                      }`}
                    >
                      {col.frozen ? <Lock size={12} /> : <GripVertical size={12} />}
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => {
                        if (!col.required && !col.frozen) onToggle(col.id);
                      }}
                      disabled={col.required || col.frozen}
                      className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        col.visible
                          ? "bg-indigo-500 border-indigo-500 text-white"
                          : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      } ${
                        col.required || col.frozen
                          ? "cursor-not-allowed"
                          : "cursor-pointer hover:border-indigo-400"
                      }`}
                      aria-label={`Toggle ${col.label}`}
                    >
                      {col.visible && <Check size={10} strokeWidth={3} />}
                    </button>

                    {/* Label */}
                    <span
                      className={`flex-1 text-xs ${
                        col.visible
                          ? "text-gray-700 dark:text-slate-300 font-medium"
                          : "text-gray-400 dark:text-slate-500"
                      }`}
                    >
                      {col.label}
                    </span>

                    {/* Status badges */}
                    {col.frozen && (
                      <span className="text-[9px] font-medium text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                        Frozen
                      </span>
                    )}
                    {col.required && (
                      <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30">
            <p className="text-[10px] text-gray-400 dark:text-slate-500 text-center">
              Drag to reorder • Click checkbox to show/hide
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export type { ColumnConfig };
