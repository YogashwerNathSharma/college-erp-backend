// ═══════════════════════════════════════════════════════════════════
// MASTER MODULE - Main Page Component (FULLY MOBILE RESPONSIVE)
// Enterprise Master Data Management with Mobile Layout Logic
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Building2, GraduationCap, Users, UserCog, IndianRupee,
  ClipboardList, CalendarCheck, BookOpen, BedDouble, Bus,
  Package, Briefcase, MessageSquare, Award, Shield,
  FileCheck, CalendarHeart, UserRound, Brain, Settings,
  ChevronRight, ChevronDown, Search, Plus, Download,
  Upload, RefreshCw, Filter, Database, ArrowLeft,
} from "lucide-react";
import MasterTable from "./MasterTable";
import MasterForm from "./MasterForm";

const CATEGORY_ICONS: Record<string, any> = {
  Building2, GraduationCap, Users, UserCog, IndianRupee,
  ClipboardList, CalendarCheck, BookOpen, BedDouble, Bus,
  Package, Briefcase, MessageSquare, Award, Shield,
  FileCheck, CalendarHeart, UserRound, Brain, Settings,
};

function getCategoryIcon(iconName: string) {
  const Icon = CATEGORY_ICONS[iconName];
  return Icon ? <Icon size={18} /> : <Database size={18} />;
}

interface MasterModel {
  key: string;
  label: string;
  icon?: string;
  description?: string;
}

interface MasterCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  modelCount: number;
  models: MasterModel[];
}

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  defaultValue?: any;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function MasterModule() {
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedModelLabel, setSelectedModelLabel] = useState<string>("");

  // MOBILE STATE: Manage visibility between Sidebar and Content on small screens
  const [viewMode, setViewMode] = useState<"sidebar" | "content">("sidebar");

  const [entries, setEntries] = useState<any[]>([]);
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false,
  });

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/masters/categories"));
      if (res.data.success) {
        setCategories(res.data.data);
        if (res.data.data.length > 0 && !expandedCategory) {
          setExpandedCategory(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load master categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchEntries = useCallback(async (modelKey: string, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        search,
        showInactive: showInactive.toString(),
      });
      const res = await axios.get(getFullUrl(`/api/masters/${modelKey}?${params}`));
      if (res.data.success) {
        setEntries(res.data.data);
        setPagination(res.data.pagination);
        if (res.data.config?.fields) {
          setFields(res.data.config.fields);
        }
      }
    } catch (err) {
      console.error("Failed to load entries:", err);
    } finally {
      setLoading(false);
    }
  }, [search, showInactive]);

  useEffect(() => {
    if (selectedModel) {
      fetchEntries(selectedModel);
    }
  }, [selectedModel, search, showInactive, fetchEntries]);

  const handleSelectModel = (model: MasterModel) => {
    setSelectedModel(model.key);
    setSelectedModelLabel(model.label);
    setSearch("");
    setPagination({ page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
    setViewMode("content"); // Switch view to content view panel on mobile
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setShowForm(true);
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!selectedModel) return;
    if (!window.confirm("Are you sure you want to deactivate this entry?")) return;
    try {
      await axios.delete(getFullUrl(`/api/masters/${selectedModel}/${id}`));
      fetchEntries(selectedModel, pagination.page);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleToggle = async (id: string) => {
    if (!selectedModel) return;
    try {
      await axios.put(getFullUrl(`/api/masters/${selectedModel}/${id}/toggle`));
      fetchEntries(selectedModel, pagination.page);
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleClone = async (id: string) => {
    if (!selectedModel) return;
    try {
      await axios.post(getFullUrl(`/api/masters/${selectedModel}/${id}/clone`));
      fetchEntries(selectedModel, pagination.page);
    } catch (err) {
      console.error("Clone failed:", err);
    }
  };

  const handleExport = async () => {
    if (!selectedModel) return;
    try {
      const res = await axios.get(getFullUrl(`/api/masters/${selectedModel}/export`));
      if (res.data.success) {
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedModel}-export.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!selectedModel) return;
    setFormLoading(true);
    try {
      if (editingEntry) {
        await axios.put(getFullUrl(`/api/masters/${selectedModel}/${editingEntry.id}`), data);
      } else {
        await axios.post(getFullUrl(`/api/masters/${selectedModel}`), data);
      }
      setShowForm(false);
      setEditingEntry(null);
      fetchEntries(selectedModel, pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-gray-50 dark:bg-slate-900 overflow-hidden relative">
      
      {/* ═══════ LEFT SIDEBAR ═══════ */}
      {/* Added mobile responsiveness classes: md:w-72, md:flex, and viewMode logic toggle */}
      <div className={`w-full md:w-72 h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col flex-shrink-0 overflow-hidden ${
        viewMode === "sidebar" ? "flex" : "hidden md:flex"
      }`}>
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Database size={20} className="text-indigo-500" />
            Master Data
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {categories.reduce((sum, c) => sum + c.modelCount, 0)} masters across {categories.length} categories
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 [scrollbar-gutter:stable]">
          {categories.map((category) => (
            <div key={category.id} className="mb-1">
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-200 outline-none ${
                  expandedCategory === category.id
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                <span className={`flex-shrink-0 ${expandedCategory === category.id ? "text-indigo-500" : "text-gray-400"}`}>
                  {getCategoryIcon(category.icon)}
                </span>
                <span className="flex-1 text-sm font-medium truncate">{category.label}</span>
                <span className="text-xs text-gray-400 mr-1">{category.modelCount}</span>
                {expandedCategory === category.id ? (
                  <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                )}
              </button>

              {expandedCategory === category.id && (
                <div className="ml-4 mt-1 space-y-0.5 transition-all">
                  {category.models.map((model) => (
                    <button
                      key={model.key}
                      onClick={() => handleSelectModel(model)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-150 outline-none ${
                        selectedModel === model.key
                          ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 font-medium border-l-2 border-indigo-500"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      {model.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ RIGHT CONTENT AREA ═══════ */}
      {/* Added viewMode dynamic toggles so it shows correctly on layout break rules */}
      <div className={`flex-1 flex flex-col overflow-hidden h-full w-full ${
        viewMode === "content" ? "flex" : "hidden md:flex"
      }`}>
        {selectedModel ? (
          <>
            {/* Toolbar Action Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 md:px-6 md:py-4 flex-shrink-0">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button: Only visible on small devices to return back to masters list */}
                  <button
                    onClick={() => setViewMode("sidebar")}
                    className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 md:hidden flex-shrink-0"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                      {selectedModelLabel}
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      {pagination.total} entries total
                    </p>
                  </div>
                </div>

                {/* Actions Grid Flow Wrappers optimized for smaller screens */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[140px] sm:flex-initial">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full sm:w-48 lg:w-56 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={() => setShowInactive(!showInactive)}
                    className={`px-2.5 py-2 rounded-lg text-xs md:text-sm border flex items-center gap-1 transition-colors ${
                      showInactive
                        ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300"
                        : "border-gray-300 text-gray-600 dark:border-slate-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Filter size={14} />
                    {showInactive ? "All" : "Active"}
                  </button>

                  <button
                    onClick={handleExport}
                    className="px-2.5 py-2 rounded-lg text-xs md:text-sm border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Download size={14} /> <span className="hidden sm:inline">Export</span>
                  </button>

                  <button
                    onClick={() => setShowImport(true)}
                    className="px-2.5 py-2 rounded-lg text-xs md:text-sm border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Upload size={14} /> <span className="hidden sm:inline">Import</span>
                  </button>

                  <button
                    onClick={handleCreate}
                    className="px-3 py-2 rounded-lg text-xs md:text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5 ml-auto sm:ml-0"
                  >
                    <Plus size={16} /> Add New
                  </button>
                </div>
              </div>
            </div>

            {/* Responsive Table Layout Bounds */}
            <div className="flex-1 overflow-auto p-3 md:p-6 [scrollbar-gutter:stable]">
              <MasterTable
                entries={entries}
                fields={fields}
                loading={loading}
                pagination={pagination}
                onPageChange={(p) => fetchEntries(selectedModel, p)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onClone={handleClone}
              />
            </div>
          </>
        ) : (
          /* Empty Initial State View Container Layout fixes for responsive metrics */
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-900">
            <div className="text-center max-w-sm sm:max-w-md w-full">
              {/* Back to layout logic if screen is empty on mobile initialization */}
              <button 
                onClick={() => setViewMode("sidebar")}
                className="mb-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mx-auto md:hidden"
              >
                <ArrowLeft size={16} /> View Master Categories
              </button>
              
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database size={30} className="text-indigo-500" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Select a Master Model
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm px-4">
                Choose a collection framework from the category panel matrix layout configuration index options.
              </p>
              
              <div className="mt-6 grid grid-cols-2 gap-3 text-left px-2">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-xs">
                  <p className="text-xl sm:text-2xl font-bold text-indigo-600">{categories.length}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Categories</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-xs">
                  <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                    {categories.reduce((sum, c) => sum + c.modelCount, 0)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Total Datasets</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forms and Bulk Upload Action Framework maps */}
      {showForm && (
        <MasterForm
          fields={fields}
          initialData={editingEntry}
          onSubmit={handleFormSubmit}
          onClose={() => { setShowForm(false); setEditingEntry(null); }}
          loading={formLoading}
          title={editingEntry ? `Edit ${selectedModelLabel}` : `Add ${selectedModelLabel}`}
        />
      )}

      {showImport && (
        <ImportModal
          modelKey={selectedModel!}
          modelLabel={selectedModelLabel}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            if (selectedModel) fetchEntries(selectedModel);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// IMPORT MODAL COMPONENT (Mobile Height Constraint Updates)
// ═══════════════════════════════════════════════════════════════════
function ImportModal({
  modelKey, modelLabel, onClose, onSuccess,
}: {
  modelKey: string;
  modelLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [jsonData, setJsonData] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const data = JSON.parse(text);
        setJsonData(JSON.stringify(data, null, 2));
      } catch {
        setJsonData(text);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      let entries;
      try {
        entries = JSON.parse(jsonData);
        if (!Array.isArray(entries)) entries = [entries];
      } catch {
        const lines = jsonData.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        entries = lines.slice(1).map(line => {
          const values = line.split(",").map(v => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = values[i]; });
          return obj;
        });
      }

      const res = await axios.post(getFullUrl(`/api/masters/${modelKey}/bulk`), { entries });
      setResult(res.data.data);
      if (res.data.data.failed === 0) {
        setTimeout(onSuccess, 1200);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Import execution failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Upload size={18} className="text-indigo-500" />
            Import {modelLabel}
          </h3>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 [scrollbar-gutter:stable]">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Upload Configuration Matrix (JSON / CSV)
            </label>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileUpload}
              className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Direct Raw JSON Matrix Array Paste
            </label>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              rows={5}
              className="w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-mono bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder={`[\n  { "code": "M1", "name": "Dynamic Row" }\n]`}
            />
          </div>

          {result && (
            <div className={`p-3 rounded-lg border text-xs ${result.failed > 0 ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-green-50 border-green-200 text-green-900"}`}>
              <p className="font-semibold">Sync Engine Stats Summary:</p>
              <p className="mt-0.5">Passed: {result.success} rows | Failed: {result.failed} rows</p>
            </div>
          )}
        </div>

        <div className="p-3 md:p-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2 flex-shrink-0 bg-gray-50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs md:text-sm border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!jsonData.trim() || importing}
            className="px-3.5 py-2 rounded-lg text-xs md:text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {importing ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
            Import Data
          </button>
        </div>
      </div>
    </div>
  );
}
