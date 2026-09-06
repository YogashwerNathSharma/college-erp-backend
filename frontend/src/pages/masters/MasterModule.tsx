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

interface MasterModel { key: string; label: string; icon?: string; description?: string; }
interface MasterCategory { id: string; label: string; icon: string; description: string; modelCount: number; models: MasterModel[]; }
interface FieldConfig { name: string; label: string; type: string; required?: boolean; options?: { label: string; value: string }[]; min?: number; max?: number; }
interface PaginationInfo { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean; }

// School Master is an explicit institution-profile form. Other masters continue
// to use the existing generic configuration unchanged.
function getEffectiveFields(modelKey: string, configuredFields: FieldConfig[]): FieldConfig[] {
  if (modelKey !== "school-master") return configuredFields;

  const schoolFields: FieldConfig[] = [
    { name: "name", label: "School Name", type: "text", required: true },
    { name: "code", label: "School Code", type: "text" },
    { name: "address", label: "Address", type: "textarea" },
    { name: "city", label: "City", type: "text" },
    { name: "state", label: "State", type: "text" },
    { name: "pincode", label: "Pincode", type: "text" },
    { name: "phone", label: "Phone", type: "phone" },
    { name: "email", label: "Email", type: "email" },
    { name: "website", label: "Website", type: "url" },
    { name: "logo", label: "Logo", type: "url" },
    { name: "affiliation", label: "Affiliation", type: "text" },
    { name: "establishedYear", label: "Established Year", type: "number", min: 1800, max: 2100 },
    { name: "principalName", label: "Principal Name", type: "text" },
  ];

  return schoolFields.map((fallback) => {
    const configured = configuredFields.find((field) => field.name === fallback.name);
    return configured ? { ...fallback, ...configured } : fallback;
  });
}

function getEntryId(entry: any): string | null {
  const id = entry?.id ?? entry?._id;
  return id === undefined || id === null || id === "" ? null : String(id);
}

export default function MasterModule() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MasterCategory | null>(null);
  const [selectedModel, setSelectedModel] = useState<MasterModel | null>(null);
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const api = getFullUrl("/api/masters");

  const loadCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${api}/categories`);
      setCategories(res.data?.categories || res.data || []);
    } catch (error) {
      console.error("Failed to load master categories", error);
    }
  }, [api]);

  const loadModel = useCallback(async (model: MasterModel) => {
    setLoading(true);
    try {
      const res = await axios.get(`${api}/${model.key}`);
      const data = res.data || {};
      const configuredFields: FieldConfig[] = data.fields || data.config?.fields || [];
      setFields(getEffectiveFields(model.key, configuredFields));
      setEntries(data.entries || data.data || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("Failed to load master", error);
      setFields(getEffectiveFields(model.key, []));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  useEffect(() => {
    if (selectedModel) loadModel(selectedModel);
  }, [selectedModel, loadModel]);

  const openModel = (model: MasterModel) => {
    setSelectedModel(model);
    setEditingEntry(null);
    setShowForm(false);
    setSearch("");
  };

  const backToCategories = () => {
    setSelectedCategory(null);
    setSelectedModel(null);
    setEntries([]);
    setFields([]);
    setEditingEntry(null);
    setShowForm(false);
  };

  const backToModels = () => {
    setSelectedModel(null);
    setEntries([]);
    setFields([]);
    setEditingEntry(null);
    setShowForm(false);
  };

  const openCreate = () => { setEditingEntry(null); setShowForm(true); };

  const openEdit = (entry: any) => {
    const id = getEntryId(entry);
    if (!id) return;
    setEditingEntry({ ...entry, id });
    setShowForm(true);
  };

  const submitForm = async (formData: Record<string, any>) => {
    if (!selectedModel) return;
    setLoading(true);
    try {
      const id = editingEntry ? getEntryId(editingEntry) : null;
      if (editingEntry && !id) throw new Error("Invalid master record id");
      if (editingEntry) {
        await axios.put(`${api}/${selectedModel.key}/${id}`, formData);
      } else {
        await axios.post(`${api}/${selectedModel.key}`, formData);
      }
      setShowForm(false);
      setEditingEntry(null);
      await loadModel(selectedModel);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return Object.values(entry || {}).some((value) => String(value ?? "").toLowerCase().includes(q));
  });

  if (!selectedModel) {
    if (!selectedCategory) {
      return (
        <div className="p-4 md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div><h1 className="text-2xl font-bold">Masters</h1><p className="text-sm text-slate-500">Manage master data</p></div>
            <button onClick={() => navigate(-1)} className="rounded-lg border px-3 py-2"><ArrowLeft size={18} /></button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <button key={category.id} onClick={() => setSelectedCategory(category)} className="rounded-xl border bg-white p-5 text-left shadow-sm dark:bg-slate-900">
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-lg ${RECENT_COLORS[index % RECENT_COLORS.length].iconBg}`}>{getCategoryIcon(category.icon)}</div>
                <div className="font-semibold">{category.label}</div>
                <div className="mt-1 text-sm text-slate-500">{category.description}</div>
                <div className="mt-3 text-xs text-slate-400">{category.modelCount} masters</div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 md:p-6">
        <div className="mb-6 flex items-center gap-3"><button onClick={backToCategories} className="rounded-lg border p-2"><ArrowLeft size={18} /></button><div><h1 className="text-2xl font-bold">{selectedCategory.label}</h1><p className="text-sm text-slate-500">Select a master</p></div></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {selectedCategory.models.map((model) => <button key={model.key} onClick={() => openModel(model)} className="rounded-xl border bg-white p-5 text-left shadow-sm dark:bg-slate-900"><div className="font-semibold">{model.label}</div><div className="mt-1 text-sm text-slate-500">{model.description}</div></button>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><button onClick={backToModels} className="rounded-lg border p-2"><ArrowLeft size={18} /></button><div><h1 className="text-2xl font-bold">{selectedModel.label}</h1><p className="text-sm text-slate-500">Manage records</p></div></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => loadModel(selectedModel)} className="rounded-lg border px-3 py-2"><RefreshCw size={17} /></button><button onClick={() => setShowImport(true)} className="rounded-lg border px-3 py-2"><Upload size={17} /></button><button onClick={() => setShowExport(true)} className="rounded-lg border px-3 py-2"><Download size={17} /></button><button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white"><Plus size={17} /> Add New</button></div>
      </div>
      <div className="mb-4 flex items-center gap-2 rounded-lg border bg-white px-3 py-2 dark:bg-slate-900"><Search size={18} className="text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter records..." className="w-full bg-transparent outline-none" /></div>
      <MasterTable fields={fields} entries={filteredEntries} loading={loading} onEdit={openEdit} />
      {showForm && <MasterForm fields={fields} initialData={editingEntry} onSubmit={submitForm} onClose={() => { setShowForm(false); setEditingEntry(null); }} loading={loading} title={`${editingEntry ? "Edit" : "Add"} ${selectedModel.label}`} />}
      {showImport && <div />}
      {showExport && <div />}
    </div>
  );
}
