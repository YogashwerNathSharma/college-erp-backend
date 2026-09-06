// MASTER MODULE - Dashboard Style Grid Navigation (FULLY RESPONSIVE)
// Flat Categories -> Child Grid Layout -> Data Matrix
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getFullUrl } from "../../utils/url";
import {
  Building2, GraduationCap, Users, UserCog, IndianRupee,
  ClipboardList, CalendarCheck, BookOpen, BedDouble, Bus,
  Package, Briefcase, MessageSquare, Award, Shield,
  FileCheck, CalendarHeart, UserRound, Brain, Settings,
  Search, Plus, Download, Upload, RefreshCw, Filter, Database, ArrowLeft, Grid
} from "lucide-react";
import MasterTable from "./MasterTable";
import MasterForm from "./MasterForm";

const RECENT_COLORS = [
  { iconBg: "bg-blue-500", lightBg: "bg-blue-50 dark:bg-blue-950/50" },
  { iconBg: "bg-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-950/50" },
  { iconBg: "bg-teal-500", lightBg: "bg-teal-50 dark:bg-teal-950/50" },
  { iconBg: "bg-rose-500", lightBg: "bg-rose-50 dark:bg-rose-950/50" },
  { iconBg: "bg-indigo-500", lightBg: "bg-indigo-50 dark:bg-indigo-950/50" },
  { iconBg: "bg-purple-500", lightBg: "bg-purple-950/50" },
  { iconBg: "bg-amber-500", lightBg: "bg-amber-50 dark:bg-amber-950/50" },
  { iconBg: "bg-cyan-500", lightBg: "bg-cyan-50 dark:bg-cyan-950/50" },
  { iconBg: "bg-orange-500", lightBg: "bg-orange-50 dark:bg-orange-950/50" },
  { iconBg: "bg-sky-500", lightBg: "bg-sky-50 dark:bg-sky-950/50" },
  { iconBg: "bg-red-500", lightBg: "bg-red-50 dark:bg-red-950/50" },
  { iconBg: "bg-green-500", lightBg: "bg-green-950/50" },
  { iconBg: "bg-violet-500", lightBg: "bg-violet-50 dark:bg-violet-950/50" },
  { iconBg: "bg-fuchsia-500", lightBg: "bg-fuchsia-50 dark:bg-fuchsia-950/50" },
  { iconBg: "bg-lime-500", lightBg: "bg-lime-50 dark:bg-lime-950/50" },
  { iconBg: "bg-pink-500", lightBg: "bg-pink-50 dark:bg-pink-950/50" },
];

const CATEGORY_ICONS: Record<string, any> = {
  Building2, GraduationCap, Users, UserCog, IndianRupee,
  ClipboardList, CalendarCheck, BookOpen, BedDouble, Bus,
  Package, Briefcase, MessageSquare, Award, Shield,
  FileCheck, CalendarHeart, UserRound, Brain, Settings,
};

function getCategoryIcon(iconName: string, size = 22, colorClass = "text-white") {
  const Icon = CATEGORY_ICONS[iconName];
  return Icon ? <Icon size={size} className={colorClass} /> : <Database size={size} className={colorClass} />;
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
  lookupUrl?: string;
  lookupLabelField?: string;
  lookupValueField?: string;
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

// Keep the generic master engine intact. Relationship fields in Elective Subject
// Master must be selected from real records, never entered as Mongo/ObjectId text.
function getEffectiveFields(modelKey: string, configuredFields: FieldConfig[]): FieldConfig[] {
  if (modelKey === "elective-subject-master") {
    const electiveFields: FieldConfig[] = [
      { name: "subjectId", label: "Subject", type: "lookup", lookupUrl: "/api/subjects", lookupLabelField: "name", lookupValueField: "id", required: true },
      { name: "classId", label: "Class", type: "lookup", lookupUrl: "/api/class", lookupLabelField: "name", lookupValueField: "id", required: true },
      { name: "streamId", label: "Stream", type: "lookup", lookupUrl: "/api/masters/stream-master/dropdown", lookupLabelField: "name", lookupValueField: "id" },
      { name: "maxStudents", label: "Max Students", type: "number" },
    ];
    return electiveFields.map((fallback) => {
      const configured = configuredFields.find((field) => field.name === fallback.name);
      return configured ? { ...configured, ...fallback } : fallback;
    });
  }

  if (modelKey === "school-master") {
    return configuredFields.filter((field) => field.name === "name" || field.name === "code");
  }
  return configuredFields;
}

function getEntryId(entry: any): string | null {
  const id = entry?.id ?? entry?._id;
  return id === undefined || id === null || id === "" ? null : String(id);
}

export default function MasterModule() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MasterCategory | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedModelLabel, setSelectedModelLabel] = useState<string>("");
  const [currentView, setCurrentView] = useState<"categories" | "child_grid" | "table_view">("categories");
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
      if (res.data.success) setCategories(res.data.data);
    } catch (err) { console.error("Failed to load master categories:", err); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const fetchEntries = useCallback(async (modelKey: string, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "25", search, showInactive: showInactive.toString() });
      const res = await axios.get(getFullUrl(`/api/masters/${modelKey}?${params}`));
      if (res.data.success) {
        setEntries(res.data.data);
        setPagination(res.data.pagination);
        if (res.data.config?.fields) setFields(getEffectiveFields(modelKey, res.data.config.fields));
      }
    } catch (err) { console.error("Failed to load entries:", err); }
    finally { setLoading(false); }
  }, [search, showInactive]);

  useEffect(() => { if (selectedModel) fetchEntries(selectedModel); }, [selectedModel, search, showInactive, fetchEntries]);

  const handleCategoryClick = (category: MasterCategory) => { setSelectedCategory(category); setCurrentView("child_grid"); };
  const handleModelClick = (model: MasterModel) => {
    setSelectedModel(model.key); setSelectedModelLabel(model.label); setSearch("");
    setPagination({ page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false }); setCurrentView("table_view");
  };
  const handleBackToCategories = () => { setSelectedCategory(null); setSelectedModel(null); setCurrentView("categories"); };
  const handleBackToChildGrid = () => { setSelectedModel(null); setCurrentView("child_grid"); };
  const handleCreate = () => { setEditingEntry(null); setShowForm(true); };
  const handleEdit = (entry: any) => {
    const id = getEntryId(entry);
    if (!id) { alert("This master record has no valid ID and cannot be edited."); return; }
    setEditingEntry({ ...entry, id }); setShowForm(true);
  };
  const handleDelete = async (id: string) => {
    if (!selectedModel || !window.confirm("Are you sure you want to deactivate this entry?")) return;
    try { await axios.delete(getFullUrl(`/api/masters/${selectedModel}/${id}`)); fetchEntries(selectedModel, pagination.page); }
    catch (err) { console.error("Delete failed:", err); }
  };
  const handleToggle = async (id: string) => {
    if (!selectedModel) return;
    try { await axios.put(getFullUrl(`/api/masters/${selectedModel}/${id}/toggle`)); fetchEntries(selectedModel, pagination.page); }
    catch (err) { console.error("Toggle failed:", err); }
  };
  const handleClone = async (id: string) => {
    if (!selectedModel) return;
    try { await axios.post(getFullUrl(`/api/masters/${selectedModel}/${id}/clone`)); fetchEntries(selectedModel, pagination.page); }
    catch (err) { console.error("Clone failed:", err); }
  };
  const handleExport = async () => {
    if (!selectedModel) return;
    try {
      const res = await axios.get(getFullUrl(`/api/masters/${selectedModel}/export`));
      if (res.data.success) {
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${selectedModel}-export.json`; a.click(); URL.revokeObjectURL(url);
      }
    } catch (err) { console.error("Export failed:", err); }
  };

  const handleFormSubmit = async (data: any) => {
    if (!selectedModel) return;
    setFormLoading(true);
    try {
      if (editingEntry) await axios.put(getFullUrl(`/api/masters/${selectedModel}/${editingEntry.id}`), data);
      else await axios.post(getFullUrl(`/api/masters/${selectedModel}`), data);
      setShowForm(false); setEditingEntry(null); fetchEntries(selectedModel, pagination.page);
    } catch (err: any) {
      console.error("Save failed:", err);
      alert(err?.response?.data?.message || "Failed to save entry");
    } finally { setFormLoading(false); }
  };

  const handleImport = async (file: File) => {
    if (!selectedModel) return;
    try {
      const formData = new FormData(); formData.append("file", file);
      await axios.post(getFullUrl(`/api/masters/${selectedModel}/import`), formData, { headers: { "Content-Type": "multipart/form-data" } });
      fetchEntries(selectedModel, pagination.page);
    } catch (err) { console.error("Import failed:", err); }
  };

  if (currentView === "table_view" && selectedModel) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={handleBackToChildGrid} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedModelLabel}</h1><p className="text-sm text-gray-500">Manage {selectedModelLabel.toLowerCase()} records</p></div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-3 py-2 border rounded-lg" /></div>
          <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-indigo-600 text-white flex items-center gap-2"><Plus size={18} /> Add</button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg border flex items-center gap-2"><Download size={18} /> Export</button>
          <button onClick={() => setShowImport(true)} className="px-4 py-2 rounded-lg border flex items-center gap-2"><Upload size={18} /> Import</button>
          <button onClick={() => selectedModel && fetchEntries(selectedModel, pagination.page)} className="px-4 py-2 rounded-lg border"><RefreshCw size={18} /></button>
          <label className="flex items-center gap-2 px-3 py-2"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive</label>
        </div>
        <MasterTable entries={entries} fields={fields} loading={loading} pagination={pagination} onPageChange={(p) => selectedModel && fetchEntries(selectedModel, p)} onEdit={handleEdit} onDelete={handleDelete} onToggle={handleToggle} onClone={handleClone} />
        {showForm && <MasterForm fields={fields} initialData={editingEntry} onSubmit={handleFormSubmit} onClose={() => setShowForm(false)} loading={formLoading} title={`${editingEntry ? "Edit" : "Add"} ${selectedModelLabel}`} />}
        {showImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md"><h2 className="text-lg font-semibold mb-4">Import {selectedModelLabel}</h2><input type="file" accept=".csv,.xlsx,.json" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }} /><button onClick={() => setShowImport(false)} className="mt-4 px-4 py-2 border rounded-lg">Close</button></div>
          </div>
        )}
      </div>
    );
  }

  if (currentView === "child_grid" && selectedCategory) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6"><button onClick={handleBackToCategories} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"><ArrowLeft size={20} /></button><div><h1 className="text-2xl font-bold">{selectedCategory.label}</h1><p className="text-sm text-gray-500">{selectedCategory.description}</p></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {selectedCategory.models.map((model, index) => { const color = RECENT_COLORS[index % RECENT_COLORS.length]; return <button key={model.key} onClick={() => handleModelClick(model)} className={`text-left p-5 rounded-xl border ${color.lightBg} hover:shadow-md transition-shadow`}><div className={`w-11 h-11 rounded-xl ${color.iconBg} flex items-center justify-center mb-3`}>{getCategoryIcon(model.icon || selectedCategory.icon)}</div><h3 className="font-semibold text-gray-900 dark:text-white">{model.label}</h3><p className="text-sm text-gray-500 mt-1">{model.description || `Manage ${model.label}`}</p></button>; })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6"><h1 className="text-2xl font-bold">Master Module</h1><p className="text-sm text-gray-500">Configure and manage master data</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category, index) => { const color = RECENT_COLORS[index % RECENT_COLORS.length]; return <button key={category.id} onClick={() => handleCategoryClick(category)} className={`text-left p-5 rounded-xl border ${color.lightBg} hover:shadow-md transition-shadow`}><div className={`w-11 h-11 rounded-xl ${color.iconBg} flex items-center justify-center mb-3`}>{getCategoryIcon(category.icon)}</div><h3 className="font-semibold text-gray-900 dark:text-white">{category.label}</h3><p className="text-sm text-gray-500 mt-1">{category.description}</p><span className="text-xs text-gray-400 mt-2 inline-block">{category.modelCount} masters</span></button>; })}
      </div>
    </div>
  );
}
