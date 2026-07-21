import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bookmark,
  ChevronDown,
  Star,
  Trash2,
  Edit3,
  Check,
  X,
  Plus,
  Filter,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, string>;
  filterCount: number;
  isDefault?: boolean;
  createdAt?: string;
}

export interface FilterPresetManagerProps {
  presets: FilterPreset[];
  activePresetId?: string;
  onApply: (preset: FilterPreset) => void;
  onSave: (name: string, filters: Record<string, string>) => void;
  onDelete: (presetId: string) => void;
  onSetDefault: (presetId: string) => void;
  onRename?: (presetId: string, newName: string) => void;
  currentFilters?: Record<string, string>;
  className?: string;
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function FilterPresetManager({
  presets,
  activePresetId,
  onApply,
  onSave,
  onDelete,
  onSetDefault,
  onRename,
  currentFilters = {},
  className = "",
}: FilterPresetManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const newNameInputRef = useRef<HTMLInputElement>(null);
  const editNameInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setEditingId(null);
        setConfirmDeleteId(null);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus input on create/edit
  useEffect(() => {
    if (isCreating && newNameInputRef.current) newNameInputRef.current.focus();
  }, [isCreating]);

  useEffect(() => {
    if (editingId && editNameInputRef.current) editNameInputRef.current.focus();
  }, [editingId]);

  // Active filter count in current filters
  const currentFilterCount = Object.values(currentFilters).filter(
    (v) => v && v.trim() !== ""
  ).length;

  const handleSave = useCallback(() => {
    if (newName.trim()) {
      onSave(newName.trim(), currentFilters);
      setNewName("");
      setIsCreating(false);
    }
  }, [newName, currentFilters, onSave]);

  const handleRename = useCallback(
    (id: string) => {
      if (editName.trim() && onRename) {
        onRename(id, editName.trim());
        setEditingId(null);
        setEditName("");
      }
    },
    [editName, onRename]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onDelete(id);
      setConfirmDeleteId(null);
    },
    [onDelete]
  );

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
          isOpen
            ? "border-indigo-300 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 hover:text-gray-800 dark:hover:text-slate-200"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Saved filters"
      >
        <Bookmark size={14} />
        <span className="hidden sm:inline">Saved Filters</span>
        {presets.length > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 rounded-full px-1">
            {presets.length}
          </span>
        )}
        <ChevronDown
          size={12}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h4 className="text-xs font-semibold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
              Filter Presets
            </h4>
            {currentFilterCount > 0 && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1 text-[11px] font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors"
              >
                <Plus size={12} />
                Save Current
              </button>
            )}
          </div>

          {/* Create New */}
          {isCreating && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <input
                  ref={newNameInputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") {
                      setIsCreating(false);
                      setNewName("");
                    }
                  }}
                  placeholder="Filter name..."
                  className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={handleSave}
                  disabled={!newName.trim()}
                  className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-30 transition-colors"
                  aria-label="Confirm save"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewName("");
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                  aria-label="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1.5">
                {currentFilterCount} filter{currentFilterCount !== 1 ? "s" : ""} will be saved
              </p>
            </div>
          )}

          {/* Presets List */}
          <div className="max-h-64 overflow-y-auto">
            {presets.length === 0 ? (
              <div className="flex flex-col items-center py-8 px-4">
                <Filter size={24} className="text-gray-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
                  No saved filters yet.
                  <br />
                  Apply filters and save them for quick access.
                </p>
              </div>
            ) : (
              presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`group relative px-4 py-2.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                    activePresetId === preset.id
                      ? "bg-indigo-50/50 dark:bg-indigo-900/10"
                      : ""
                  }`}
                >
                  {/* Delete Confirmation */}
                  {confirmDeleteId === preset.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 dark:text-red-400 flex-1">
                        Delete "{preset.name}"?
                      </span>
                      <button
                        onClick={() => handleDelete(preset.id)}
                        className="px-2 py-1 text-[10px] font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-[10px] font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : editingId === preset.id ? (
                    /* Rename Mode */
                    <div className="flex items-center gap-2">
                      <input
                        ref={editNameInputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(preset.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <button
                        onClick={() => handleRename(preset.id)}
                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    /* Normal Display */
                    <div className="flex items-center gap-2">
                      {/* Default Star */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetDefault(preset.id);
                        }}
                        className={`flex-shrink-0 transition-colors ${
                          preset.isDefault
                            ? "text-amber-500"
                            : "text-gray-300 dark:text-slate-600 hover:text-amber-400"
                        }`}
                        aria-label={
                          preset.isDefault ? "Remove default" : "Set as default"
                        }
                      >
                        <Star
                          size={13}
                          className={preset.isDefault ? "fill-amber-500" : ""}
                        />
                      </button>

                      {/* Name & Apply */}
                      <button
                        onClick={() => {
                          onApply(preset);
                          setIsOpen(false);
                        }}
                        className="flex-1 text-left"
                      >
                        <span className="text-xs font-medium text-gray-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {preset.name}
                        </span>
                        <span className="ml-2 text-[10px] text-gray-400 dark:text-slate-500">
                          ({preset.filterCount} filters)
                        </span>
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onRename && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(preset.id);
                              setEditName(preset.name);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                            aria-label="Rename"
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(preset.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {presets.length > 0 && currentFilterCount > 0 && !isCreating && (
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30">
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors"
              >
                <Plus size={12} />
                Save current filters as preset
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
