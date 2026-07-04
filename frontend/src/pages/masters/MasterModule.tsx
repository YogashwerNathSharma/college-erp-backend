// ═══════════════════════════════════════════════════════════════════
// MASTER MODULE - STABLE HUB NAVIGATOR ENGINE
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getFullUrl } from "../../utils/url";
import {
  Building2, GraduationCap, Users, UserCog, IndianRupee,
  ClipboardList, CalendarCheck, BookOpen, BedDouble, Bus,
  Package, Briefcase, MessageSquare, Award, Shield,
  FileCheck, CalendarHeart, UserRound, Brain, Settings,
  Search, Plus, Download, Upload, RefreshCw, Filter, Database, ArrowLeft, LayoutGrid
} from "lucide-react";
import MasterTable from "./MasterTable";
import MasterForm from "./MasterForm";

const RECENT_COLORS = [
  "bg-blue-600/10 text-blue-500 dark:bg-blue-500/20 border-blue-500/30",
  "bg-emerald-600/10 text-emerald-500 dark:bg-emerald-500/20 border-emerald-500/30",
  "bg-teal-600/10 text-teal-500 dark:bg-teal-500/20 border-teal-500/30",
  "bg-rose-600/10 text-rose-500 dark:bg-rose-500/20 border-rose-500/30",
  "bg-indigo-600/10 text-indigo-500 dark:bg-indigo-500/20 border-indigo-500/30",
  "bg-purple-600/10 text-purple-500 dark:bg-purple-500/20 border-purple-500/30",
  "bg-amber-600/10 text-amber-500 dark:bg-amber-500/20 border-amber-500/30",
  "bg-cyan-600/10 text-cyan-500 dark:bg-cyan-500/20 border-cyan-500/30",
];

const CATEGORY_ICONS: Record<string, any> = {
  Building2, GraduationCap, Users, UserCog, IndianRupee,
  ClipboardList, CalendarCheck, BookOpen, BedDouble, Bus,
  Package, Briefcase, MessageSquare, Award, Shield,
  FileCheck, CalendarHeart, UserRound, Brain, Settings,
};

function getCategoryIcon(iconName: string, size = 22) {
  const Icon = CATEGORY_ICONS[iconName];
  return Icon ? <Icon size={size} /> : <Database size={size} />;
}

interface MasterModel { key: string; label: string; icon?: string; description?: string; }
interface MasterCategory { id: string; label: string; icon: string; description: string; modelCount: number; models: MasterModel[]; }
interface FieldConfig { name: string; label: string; type: string; required?: boolean; options?: { label: string; value: string }[]; }
interface PaginationInfo { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean; }

export default function MasterModule() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MasterCategory | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedModelLabel, setSelectedModelLabel] = useState<string>("");

  const [currentView, setCurrentView] = useState<"portal_home" | "all_masters_flat" | "category_child_grid" | "table_view">("portal_home");

  const [entries, setEntries] = useState<any[]>([]);
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
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
      }
    } catch (err) {
      console.error("Failed to load master categories:", err);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // 🔥 FIXED: Sync state smoothly if URL route changes directly via Sidebar interactions
  useEffect(() => {
    if (categories.length === 0) return;

    if (location.pathname === "/masters") {
      setSelectedCategory(null);
      setSelectedModel(null);
      setCurrentView("portal_home");
    }
  }, [location.pathname, categories]);

  const fetchEntries = useCallback(async (modelKey: string, page = 1) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: page.toString(), limit: "25", search, showInactive: showInactive.toString() });
      const res = await axios.get(getFullUrl(`/api/masters/${modelKey}?${p}`));
      if (res.data.success) {
        setEntries(res.data.data);
        setPagination(res.data.pagination);
        if (res.data.config?.fields) setFields(res.data.config.fields);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, showInactive]);

  useEffect(() => { if (selectedModel) fetchEntries(selectedModel); }, [selectedModel, search, showInactive, fetchEntries]);

  const handleCategoryClick = (category: MasterCategory) => {
    setSelectedCategory(category);
    setCurrentView("category_child_grid");
  };

  const handleModelClick = (model: MasterModel) => {
    setSelectedModel(model.key);
    setSelectedModelLabel(model.label);
    setSearch("");
    setPagination({ page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
    setCurrentView("table_view");
  };

  const handleBackToHome = () => {
    setSelectedCategory(null);
    setSelectedModel(null);
    setCurrentView("portal_home");
  };

  const handleBackToChildGrid = () => {
    setSelectedModel(null);
    setCurrentView(selectedCategory ? "category_child_grid" : "all_masters_flat");
  };

  const handleCreate = () => { setEditingEntry(null); setShowForm(true); };
  const handleEdit = (entry: any) => { setEditingEntry(entry); setShowForm(true); };

  const handleDelete = async (id: string) => {
    if (!selectedModel || !window.confirm("Are you sure you want to deactivate this entry?")) return;
    try {
      await axios.delete(getFullUrl(`/api/masters/${selectedModel}/${id}`));
      fetchEntries(selectedModel, pagination.page);
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (id: string) => {
    if (!selectedModel) return;
    try {
      await axios.put(getFullUrl(`/api/masters/${selectedModel}/${id}/toggle`));
      fetchEntries(selectedModel, pagination.page);
    } catch (err) { console.error(err); }
  };

  const handleClone = async (id: string) => {
    if (!selectedModel) return;
    try {
      await axios.post(getFullUrl(`/api/masters/${selectedModel}/${id}/clone`));
      fetchEntries(selectedModel, pagination.page);
    } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); }
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

  const allFlatModels: { model: MasterModel; categoryLabel: string }[] = [];
  categories.forEach(c => {
    c.models.forEach(m => {
      allFlatModels.push({ model: m, categoryLabel: c.label });
    });
  });

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-slate-950 text-slate-100 overflow-y-auto p-4 md:p-6 [scrollbar-gutter:stable]">
      
      {/* ═══════ LAYER 1: MAIN PORTAL HOME ═══════ */}
      {currentView === "portal_home" && (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          <div className="border-b border-slate-800 pb-4">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <LayoutGrid className="text-indigo-500" size={24} />
              Masters Dashboard Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1">Institutional configuration master collection layout</p>
          </div>

          <div className="w-full">
            <button
              onClick={() => setCurrentView("all_masters_flat")}
              className="w-full text-left p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-slate-900 hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
            >
              <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
                <div className="w-14 h-14 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Database size={26} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">All Synchronized Masters Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Explore the consolidated framework registry across all channels ({allFlatModels.length} configurations)</p>
                </div>
              </div>
              <span className="bg-indigo-600 text-xs text-white font-semibold px-4 py-2 rounded-xl shadow-md group-hover:bg-indigo-700">Open Directory</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Category Clusters</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map((category, index) => {
                const colorClass = RECENT_COLORS[index % RECENT_COLORS.length];
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="flex flex-col items-center justify-center text-center p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-all group shadow-md relative outline-none active:scale-95 cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-3 shadow-inner ${colorClass}`}>
                      {getCategoryIcon(category.icon, 20)}
                    </div>
                    <span className="text-xs font-semibold block tracking-wide line-clamp-2 text-slate-300 group-hover:text-white px-1">
                      {category.label}
                    </span>
                    <span className="absolute top-2 right-2 bg-slate-800/80 text-[9px] text-slate-400 font-bold px-1.5 py-0.5 border border-slate-700 rounded-md">
                      {category.modelCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ LAYER 2 (A): ALL FLAT MASTERS PANEL VIEW ═══════ */}
      {currentView === "all_masters_flat" && (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
            <button onClick={handleBackToHome} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">Consolidated Global Directory</h1>
              <p className="text-xs text-slate-400 mt-0.5">Flat list index schema mapping</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allFlatModels.map(({ model, categoryLabel }) => (
              <button
                key={model.key}
                onClick={() => handleModelClick(model)}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-indigo-500/10 bg-indigo-950/10 hover:bg-indigo-950/20 hover:border-indigo-500/30 text-center transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Database size={16} />
                </div>
                <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate w-full px-1">{model.label}</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">{categoryLabel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ LAYER 2 (B): CATEGORY CHILD GRID ═══════ */}
      {currentView === "category_child_grid" && selectedCategory && (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
            <button onClick={handleBackToHome} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-indigo-400">{getCategoryIcon(selectedCategory.icon, 20)}</span>
                <h1 className="text-lg md:text-xl font-bold text-white">{selectedCategory.label} Modules</h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Select standard dataset registry block</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {selectedCategory.models.map((model) => (
              <button
                key={model.key}
                onClick={() => handleModelClick(model)}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-indigo-500/10 bg-indigo-950/10 hover:bg-indigo-950/20 hover:border-indigo-500/30 text-center transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Database size={18} />
                </div>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white">{model.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ LAYER 3: TABLE DATASHEET VIEW ═══════ */}
      {currentView === "table_view" && selectedModel && (
        <div className="max-w-7xl mx-auto space-y-4 animate-fadeIn flex flex-col h-full">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button onClick={handleBackToChildGrid} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition-colors cursor-pointer">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-base md:text-lg font-bold text-white truncate max-w-[240px]">{selectedModelLabel}</h1>
                  <p className="text-xs text-slate-400">{pagination.total} records fetched safely</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[130px] sm:flex-initial">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text" placeholder="Filter..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-1.5 w-full sm:w-44 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs border flex items-center gap-1 transition-colors cursor-pointer ${
                    showInactive ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Filter size={12} /> {showInactive ? "All" : "Active"}
                </button>
                <button onClick={handleExport} className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-800 text-slate-400 hover:bg-slate-800 flex items-center gap-1 cursor-pointer">
                  <Download size={12} /> Export
                </button>
                <button onClick={() => setShowImport(true)} className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-800 text-slate-400 hover:bg-slate-800 flex items-center gap-1 cursor-pointer">
                  <Upload size={12} /> Import
                </button>
                <button onClick={handleCreate} className="px-3 py-1.5 rounded-lg text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-sm cursor-pointer ml-auto sm:ml-0 font-medium">
                  <Plus size={14} /> Add New
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <MasterTable
              entries={entries} fields={fields} loading={loading} pagination={pagination}
              onPageChange={(p) => fetchEntries(selectedModel, p)} onEdit={handleEdit} onDelete={handleDelete} onToggle={handleToggle} onClone={handleClone}
            />
          </div>
        </div>
      )}

      {showForm && <MasterForm fields={fields} initialData={editingEntry} onSubmit={handleFormSubmit} onClose={() => { setShowForm(false); setEditingEntry(null); }} loading={formLoading} title={editingEntry ? `Edit ${selectedModelLabel}` : `Add ${selectedModelLabel}`} />}
      {showImport && <ImportModal modelKey={selectedModel!} modelLabel={selectedModelLabel} onClose={() => setShowImport(false)} onSuccess={() => { setShowImport(false); if (selectedModel) fetchEntries(selectedModel); }} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// IMPORT MODAL MATRIX SYNC ENGINE
// ═══════════════════════════════════════════════════════════════════
function ImportModal({ modelKey, modelLabel, onClose, onSuccess }: { modelKey: string; modelLabel: string; onClose: () => void; onSuccess: () => void; }) {
  const [jsonData, setJsonData] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try { setJsonData(JSON.stringify(JSON.parse(text), null, 2)); } catch { setJsonData(text); }
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
      if (res.data.data.failed === 0) setTimeout(onSuccess, 1000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Sync error caught");
    } finally { setImporting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm md:text-base font-semibold flex items-center gap-2">
            <Upload size={16} className="text-indigo-400" /> Bulk Import: {modelLabel}
          </h3>
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Select file (JSON/CSV)</label>
            <input type="file" accept=".json,.csv" onChange={handleFileUpload} className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-700 file:bg-slate-800 file:text-slate-200 cursor-pointer" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Raw Data</label>
            <textarea value={jsonData} onChange={(e) => setJsonData(e.target.value)} rows={5} className="w-full p-2.5 border border-slate-800 rounded-lg text-xs font-mono bg-slate-950 text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder={`[\n  { "code": "X1", "name": "Sync Row" }\n]`} />
          </div>
          {result && (
            <div className={`p-3 rounded-lg border text-xs ${result.failed > 0 ? "bg-amber-950/40 border-amber-500/30 text-amber-300" : "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"}`}>
              <p className="font-semibold">Stats:</p>
              <p className="mt-0.5">Passed: {result.success} | Failed: {result.failed}</p>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-slate-800 flex justify-end gap-2 bg-slate-950 flex-shrink-0">
          <button onClick={onClose} className="px-3.5 py-1.5 rounded-lg text-xs border border-slate-800 text-slate-400 hover:bg-slate-800">Cancel</button>
          <button onClick={handleImport} disabled={!jsonData.trim() || importing} className="px-3.5 py-1.5 rounded-lg text-xs bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1 cursor-pointer">
            {importing ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />} Push Integration
          </button>
        </div>
      </div>
    </div>
  );
}
