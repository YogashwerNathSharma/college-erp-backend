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
  { iconBg: "bg-teal-500", lightBg: "bg-teal-950/50" },
  { iconBg: "bg-rose-500", lightBg: "bg-rose-50 dark:bg-rose-950/50" },
  { iconBg: "bg-indigo-500", lightBg: "bg-indigo-950/50" },
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

interface MasterModel { key: string; label: string; icon?: string; description?: string; }
interface MasterCategory { id: string; label: string; icon: string; description: string; modelCount: number; models: MasterModel[]; }
interface FieldConfig { name: string; label: string; type: string; required?: boolean; options?: { label: string; value: string }[]; lookupUrl?: string; lookupLabelField?: string; lookupValueField?: string; }
interface PaginationInfo { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean; }

function getEffectiveFields(modelKey: string, configuredFields: FieldConfig[]): FieldConfig[] {
  if (modelKey === "school-master") return configuredFields.filter((field) => field.name === "name" || field.name === "code");
  if (modelKey === "timetable-slot-master") {
    const timetableFields: FieldConfig[] = [
      { name: "dayOfWeek", label: "Day", type: "select", required: true, options: [
        { label: "Monday", value: "1" }, { label: "Tuesday", value: "2" }, { label: "Wednesday", value: "3" },
        { label: "Thursday", value: "4" }, { label: "Friday", value: "5" }, { label: "Saturday", value: "6" }, { label: "Sunday", value: "0" },
      ] },
      { name: "periodId", label: "Period", type: "lookup", lookupUrl: "/api/masters/period-master/dropdown", lookupLabelField: "name", lookupValueField: "id", required: true },
      { name: "classId", label: "Class", type: "lookup", lookupUrl: "/api/class", lookupLabelField: "name", lookupValueField: "id", required: true },
      { name: "sectionId", label: "Section", type: "lookup", lookupUrl: "/api/section", lookupLabelField: "name", lookupValueField: "id" },
      { name: "subjectId", label: "Subject", type: "lookup", lookupUrl: "/api/subject", lookupLabelField: "name", lookupValueField: "id" },
      { name: "teacherId", label: "Teacher", type: "lookup", lookupUrl: "/api/teacher", lookupLabelField: "name", lookupValueField: "id" },
      { name: "roomId", label: "Room", type: "lookup", lookupUrl: "/api/room", lookupLabelField: "name", lookupValueField: "id" },
    ];
    return timetableFields.map((fallback) => {
      const configured = configuredFields.find((field) => field.name === fallback.name);
      return configured ? { ...configured, ...fallback } : fallback;
    });
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

  const fetchCategories = async () => { try { const res = await axios.get(getFullUrl("/api/masters/categories")); if (res.data.success) setCategories(res.data.data); } catch (err) { console.error("Failed to load master categories:", err); } };
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
    } catch (err) { console.error("Failed to load entries:", err); } finally { setLoading(false); }
  }, [search, showInactive]);

  useEffect(() => { if (selectedModel) fetchEntries(selectedModel); }, [selectedModel, search, showInactive, fetchEntries]);
  const handleCategoryClick = (category: MasterCategory) => { setSelectedCategory(category); setCurrentView("child_grid"); };
  const handleModelClick = (model: MasterModel) => { setSelectedModel(model.key); setSelectedModelLabel(model.label); setSearch(""); setPagination({ page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false }); setCurrentView("table_view"); };
  const handleBackToCategories = () => { setSelectedCategory(null); setSelectedModel(null); setCurrentView("categories"); };
  const handleBackToChildGrid = () => { setSelectedModel(null); setCurrentView("child_grid"); };
  const handleCreate = () => { setEditingEntry(null); setShowForm(true); };
  const handleEdit = (entry: any) => { const id = getEntryId(entry); if (!id) { alert("This School Master record has no valid ID and cannot be edited."); return; } setEditingEntry({ ...entry, id }); setShowForm(true); };
  const handleDelete = async (id: string) => { if (!selectedModel || !window.confirm("Are you sure you want to deactivate this entry?")) return; try { await axios.delete(getFullUrl(`/api/masters/${selectedModel}/${id}`)); fetchEntries(selectedModel, pagination.page); } catch (err) { console.error("Delete failed:", err); } };
  const handleToggle = async (id: string) => { if (!selectedModel) return; try { await axios.put(getFullUrl(`/api/masters/${selectedModel}/${id}/toggle`)); fetchEntries(selectedModel, pagination.page); } catch (err) { console.error("Toggle failed:", err); } };
  const handleClone = async (id: string) => { if (!selectedModel) return; try { await axios.post(getFullUrl(`/api/masters/${selectedModel}/${id}/clone`)); fetchEntries(selectedModel, pagination.page); } catch (err) { console.error("Clone failed:", err); } };
  const handleExport = async () => { if (!selectedModel) return; try { const res = await axios.get(getFullUrl(`/api/masters/${selectedModel}/export`)); if (res.data.success) { const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${selectedModel}-export.json`; a.click(); URL.revokeObjectURL(url); } } catch (err) { console.error("Export failed:", err); } };
  const handleFormSubmit = async (data: any) => { if (!selectedModel) return; setFormLoading(true); try { if (editingEntry) { const id = getEntryId(editingEntry); if (!id) throw new Error("This record has no valid ID and cannot be updated."); await axios.put(getFullUrl(`/api/masters/${selectedModel}/${id}`), data); } else { await axios.post(getFullUrl(`/api/masters/${selectedModel}`), data); } setShowForm(false); setEditingEntry(null); fetchEntries(selectedModel, pagination.page); } catch (err: any) { alert(err.response?.data?.message || err.message || "Operation failed"); } finally { setFormLoading(false); } };

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-y-auto p-4 md:p-6 [scrollbar-gutter:stable]">
      {currentView === "categories" && <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn"><div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center gap-3"><button onClick={() => navigate("/dashboard")} className="md:hidden p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors flex-shrink-0 tap-target" aria-label="Back"><ArrowLeft size={18} /></button><div><h1 className="text-lg md:text-2xl font-bold flex items-center gap-2"><Grid className="text-indigo-500" size={24} />Master Control Setup</h1><p className="text-xs text-slate-400 mt-1">Select any architecture base matrix block to handle child structural models</p></div></div><div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-1.5 sm:gap-3">{categories.map((category, index) => { const color = RECENT_COLORS[index % RECENT_COLORS.length]; return <button key={category.id} onClick={() => handleCategoryClick(category)} className={`flex flex-col items-center gap-1 py-2 sm:py-3 px-1 sm:px-2 rounded-lg ${color.lightBg} hover:scale-105 transition-all duration-200 group relative outline-none active:scale-95 cursor-pointer`}><div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-md sm:rounded-lg ${color.iconBg} flex items-center justify-center`}>{getCategoryIcon(category.icon, 16)}</div><span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center leading-tight">{category.label}</span></button>; })}</div></div>}
      {currentView === "child_grid" && selectedCategory && <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn"><div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4"><button onClick={handleBackToCategories} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center" title="Back to Main Menu"><ArrowLeft size={20} /></button><div><div className="flex items-center gap-2"><span>{getCategoryIcon(selectedCategory.icon, 20, "text-indigo-400")}</span><h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{selectedCategory.label}</h1></div><p className="text-xs text-slate-400 mt-0.5">Select a master target collection mapping below</p></div></div><div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-1.5 sm:gap-3">{selectedCategory.models.map((model, idx) => <button key={model.key} onClick={() => handleModelClick(model)} className={`flex flex-col items-center gap-1 py-2 sm:py-3 px-1 sm:px-2 rounded-lg ${RECENT_COLORS[idx % RECENT_COLORS.length].lightBg} hover:scale-105 transition-all duration-200 active:scale-95 cursor-pointer`}><div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg ${RECENT_COLORS[idx % RECENT_COLORS.length].iconBg} flex items-center justify-center`}>{getCategoryIcon(model.icon || selectedCategory.icon, 16)}</div><span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center leading-tight">{model.label}</span></button>)}</div></div>}
      {currentView === "table_view" && selectedModel && <div className="max-w-7xl mx-auto animate-fadeIn"><div className="flex items-center justify-between gap-3 mb-4"><div className="flex items-center gap-3"><button onClick={handleBackToChildGrid} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400"><ArrowLeft size={20} /></button><div><h1 className="text-lg md:text-xl font-bold">{selectedModelLabel}</h1><p className="text-xs text-slate-400">Master data management</p></div></div><div className="flex items-center gap-2"><button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"><Plus size={18} />Add</button><button onClick={handleExport} className="hidden sm:flex items-center gap-2 px-4 py-2 border rounded-xl"><Download size={18} />Export</button></div></div><MasterTable entries={entries} fields={fields} loading={loading} search={search} onSearch={setSearch} showInactive={showInactive} onShowInactive={setShowInactive} pagination={pagination} onPageChange={(page) => fetchEntries(selectedModel, page)} onEdit={handleEdit} onDelete={handleDelete} onToggle={handleToggle} onClone={handleClone} /></div>}
      {showForm && selectedModel && <MasterForm modelKey={selectedModel} fields={fields} initialData={editingEntry} onSubmit={handleFormSubmit} onClose={() => { setShowForm(false); setEditingEntry(null); }} loading={formLoading} title={`${editingEntry ? "Edit" : "Add"} ${selectedModelLabel}`} />}
    </div>
  );
}
