import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Filter,
  Bookmark,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface SearchField {
  id: string;
  label: string;
  type: "text" | "select" | "date" | "boolean" | "number";
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, string>;
  isDefault?: boolean;
}

export interface AdvancedSearchPanelProps {
  fields?: SearchField[];
  filters: Record<string, string>;
  onFiltersChange: (filters: Record<string, string>) => void;
  onSearch: (filters: Record<string, string>) => void;
  onReset: () => void;
  onSaveFilter?: (name: string, filters: Record<string, string>) => void;
  savedFilters?: FilterPreset[];
  onApplyPreset?: (preset: FilterPreset) => void;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
  loading?: boolean;
  className?: string;
}

// ══════════════════════════════════════════════════════════════════
// DEFAULT STUDENT SEARCH FIELDS
// ══════════════════════════════════════════════════════════════════

const DEFAULT_STUDENT_FIELDS: SearchField[] = [
  { id: "admissionNo", label: "Admission No", type: "text", placeholder: "e.g. ADM-2024-001" },
  { id: "rollNo", label: "Roll No", type: "text", placeholder: "e.g. 101" },
  { id: "name", label: "Student Name", type: "text", placeholder: "First or last name" },
  { id: "fatherName", label: "Father Name", type: "text", placeholder: "Father's name" },
  { id: "motherName", label: "Mother Name", type: "text", placeholder: "Mother's name" },
  { id: "mobile", label: "Mobile No", type: "text", placeholder: "10-digit mobile" },
  { id: "aadhaar", label: "Aadhaar No", type: "text", placeholder: "12-digit Aadhaar" },
  {
    id: "classId",
    label: "Class",
    type: "select",
    options: [], // Populated dynamically
  },
  {
    id: "sectionId",
    label: "Section",
    type: "select",
    options: [], // Populated dynamically
  },
  {
    id: "academicYearId",
    label: "Session",
    type: "select",
    options: [], // Populated dynamically
  },
  {
    id: "houseId",
    label: "House",
    type: "select",
    options: [], // Populated dynamically
  },
  {
    id: "category",
    label: "Category",
    type: "select",
    options: [
      { label: "General", value: "General" },
      { label: "OBC", value: "OBC" },
      { label: "SC", value: "SC" },
      { label: "ST", value: "ST" },
      { label: "EWS", value: "EWS" },
    ],
  },
  {
    id: "religion",
    label: "Religion",
    type: "select",
    options: [
      { label: "Hindu", value: "Hindu" },
      { label: "Muslim", value: "Muslim" },
      { label: "Christian", value: "Christian" },
      { label: "Sikh", value: "Sikh" },
      { label: "Buddhist", value: "Buddhist" },
      { label: "Jain", value: "Jain" },
      { label: "Other", value: "Other" },
    ],
  },
  { id: "transport", label: "Transport", type: "boolean" },
  { id: "hostel", label: "Hostel", type: "boolean" },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
      { label: "Transferred", value: "transferred" },
      { label: "Passed", value: "passed" },
      { label: "Dropped", value: "dropped" },
      { label: "Suspended", value: "suspended" },
      { label: "Alumni", value: "alumni" },
    ],
  },
  {
    id: "gender",
    label: "Gender",
    type: "select",
    options: [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
      { label: "Other", value: "Other" },
    ],
  },
  {
    id: "bloodGroup",
    label: "Blood Group",
    type: "select",
    options: [
      { label: "A+", value: "A+" },
      { label: "A-", value: "A-" },
      { label: "B+", value: "B+" },
      { label: "B-", value: "B-" },
      { label: "O+", value: "O+" },
      { label: "O-", value: "O-" },
      { label: "AB+", value: "AB+" },
      { label: "AB-", value: "AB-" },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════
// SAVE FILTER MODAL
// ══════════════════════════════════════════════════════════════════

function SaveFilterModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-4">
          Save Filter Preset
        </h3>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              onSave(name.trim());
              setName("");
              onClose();
            }
          }}
          placeholder="Enter filter name..."
          className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onSave(name.trim());
                setName("");
                onClose();
              }
            }}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function AdvancedSearchPanel({
  fields = DEFAULT_STUDENT_FIELDS,
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  onSaveFilter,
  savedFilters = [],
  onApplyPreset,
  isExpanded: controlledExpanded,
  onToggleExpand,
  loading = false,
  className = "",
}: AdvancedSearchPanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const presetsRef = useRef<HTMLDivElement>(null);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggleExpand = useCallback(() => {
    const newVal = !isExpanded;
    if (onToggleExpand) onToggleExpand(newVal);
    else setInternalExpanded(newVal);
  }, [isExpanded, onToggleExpand]);

  // Count active filters
  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => v && v.trim() !== "").length,
    [filters]
  );

  // Handle field change
  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      onFiltersChange({ ...filters, [fieldId]: value });
    },
    [filters, onFiltersChange]
  );

  // Clear single field
  const clearField = useCallback(
    (fieldId: string) => {
      const updated = { ...filters };
      delete updated[fieldId];
      onFiltersChange(updated);
    },
    [filters, onFiltersChange]
  );

  // Close presets dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) {
        setShowPresetsDropdown(false);
      }
    }
    if (showPresetsDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPresetsDropdown]);

  return (
    <div className={`${className}`}>
      {/* ── Toggle Bar ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl">
        <button
          onClick={toggleExpand}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <Filter size={16} />
          <span>Advanced Search</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-indigo-500 rounded-full">
              {activeFilterCount}
            </span>
          )}
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <div className="flex items-center gap-2">
          {/* Saved Filters Dropdown */}
          {savedFilters.length > 0 && (
            <div ref={presetsRef} className="relative">
              <button
                onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-slate-600 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
              >
                <Bookmark size={12} />
                Saved ({savedFilters.length})
              </button>
              {showPresetsDropdown && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
                  {savedFilters.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onApplyPreset?.(preset);
                        setShowPresetsDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Bookmark
                        size={12}
                        className={
                          preset.isDefault
                            ? "text-amber-500 fill-amber-500"
                            : "text-gray-400 dark:text-slate-500"
                        }
                      />
                      <span className="text-gray-700 dark:text-slate-300 truncate">
                        {preset.name}
                      </span>
                      <span className="ml-auto text-[10px] text-gray-400 dark:text-slate-500">
                        {Object.keys(preset.filters).length} filters
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active filter count & reset */}
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <RotateCcw size={12} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded Panel ── */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[800px] opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
          {/* Search Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {fields.map((field) => (
              <div key={field.id} className="relative">
                <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  {field.label}
                </label>

                {field.type === "select" ? (
                  <div className="relative">
                    <select
                      value={filters[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none appearance-none pr-8 transition-colors"
                    >
                      <option value="">All</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                ) : field.type === "boolean" ? (
                  <div className="flex items-center gap-3 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters[field.id] === "true"}
                        onChange={(e) =>
                          handleFieldChange(field.id, e.target.checked ? "true" : "")
                        }
                        className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-600 dark:text-slate-400">Yes</span>
                    </label>
                  </div>
                ) : field.type === "date" ? (
                  <input
                    type="date"
                    value={filters[field.id] || ""}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-colors"
                  />
                ) : (
                  <div className="relative">
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={filters[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder || `Search ${field.label}...`}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-colors pr-8"
                    />
                    {filters[field.id] && (
                      <button
                        onClick={() => clearField(field.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Save Filter */}
              {onSaveFilter && activeFilterCount > 0 && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-600 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Save size={13} />
                  Save Filter
                </button>
              )}

              {/* Reset */}
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw size={13} />
                Reset
              </button>

              {/* Search */}
              <button
                onClick={() => onSearch(filters)}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Search size={13} />
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Filter Modal */}
      <SaveFilterModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={(name) => {
          onSaveFilter?.(name, filters);
        }}
      />
    </div>
  );
}

export type { SearchField, FilterPreset };
