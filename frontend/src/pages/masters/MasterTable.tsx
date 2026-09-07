import {
  Edit2, Trash2, ToggleLeft, ToggleRight, Copy,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreHorizontal, Loader2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface FieldConfig { name: string; label: string; type: string; required?: boolean; options?: { label: string; value: string }[]; }
interface PaginationInfo { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean; }
interface MasterTableProps {
  entries: any[]; fields: FieldConfig[]; loading: boolean; pagination: PaginationInfo;
  onPageChange: (page: number) => void; onEdit: (entry: any) => void; onDelete: (id: string) => void;
  onToggle: (id: string) => void; onClone: (id: string) => void; search?: string;
  onSearch?: (value: string) => void; showInactive?: boolean; onShowInactive?: (value: boolean) => void;
}

const DAY_NAMES: Record<string, string> = { "0": "Sunday", "1": "Monday", "2": "Tuesday", "3": "Wednesday", "4": "Thursday", "5": "Friday", "6": "Saturday" };
const TIMETABLE_FIELDS: FieldConfig[] = [
  { name: "dayOfWeek", label: "Day", type: "select" },
  { name: "periodId", label: "Period", type: "lookup" },
  { name: "classId", label: "Class", type: "lookup" },
  { name: "sectionId", label: "Section", type: "lookup" },
  { name: "subjectId", label: "Subject", type: "lookup" },
  { name: "teacherId", label: "Teacher", type: "lookup" },
  { name: "roomId", label: "Room", type: "lookup" },
];

export default function MasterTable({ entries, fields, loading, pagination, onPageChange, onEdit, onDelete, onToggle, onClone }: MasterTableProps) {
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActionMenuId(null); };
    if (actionMenuId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionMenuId]);

  const isTimetableSlot = fields.some(f => f.name === "dayOfWeek") || entries.some(entry => ["periodId", "classId", "sectionId", "subjectId", "teacherId", "roomId"].some(k => entry?.[k] !== undefined));
  const effectiveFields = isTimetableSlot ? TIMETABLE_FIELDS.map(f => fields.find(existing => existing.name === f.name) || f) : fields;
  const isHiddenField = (name: string) => {
    if (isTimetableSlot && TIMETABLE_FIELDS.some(f => f.name === name)) return false;
    return [/^(id|_id)$/i, /Id$/, /^(tenantId|createdAt|updatedAt|deletedAt|isDeleted|isActive)$/].some(p => p.test(name));
  };
  const visibleFields = effectiveFields.filter(f => !isHiddenField(f.name)).slice(0, isTimetableSlot ? 7 : 6);

  const formatValue = (value: any, field: FieldConfig, entry?: any): string => {
    if (field.name === "dayOfWeek") { const key = value == null ? "" : String(value); return DAY_NAMES[key] || (key || "—"); }
    if (value == null || value === "") return "—";
    if (field.type === "boolean") return value ? "Yes" : "No";
    if (field.type === "date") { try { return new Date(value).toLocaleDateString("en-IN"); } catch { return String(value); } }
    if (field.type === "select" && field.options) { const opt = field.options.find(o => String(o.value) === String(value)); return opt ? opt.label : String(value); }
    if (isTimetableSlot && field.name.endsWith("Id")) {
      const relation = entry?.[field.name.slice(0, -2)];
      if (relation && typeof relation === "object") return String(relation.name ?? relation.label ?? relation.title ?? relation.code ?? relation.id ?? value);
    }
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return String(value.name ?? value.label ?? value.title ?? value.code ?? value.id ?? "—");
    return String(value);
  };

  const renderActions = (entry: any) => (
    <div className="flex items-center gap-1">
      <button onClick={() => onEdit(entry)} className="p-1.5 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700" title="Edit Entry"><Edit2 size={13} /></button>
      <button onClick={() => setActionMenuId(actionMenuId === entry.id ? null : entry.id)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"><MoreHorizontal size={13} /></button>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-64 w-full"><Loader2 size={32} className="animate-spin text-indigo-500" /><span className="ml-3 text-sm text-gray-500">Loading entries data matrix...</span></div>;
  if (entries.length === 0) return <div className="flex items-center justify-center h-64 text-center border border-dashed border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"><div><div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3"><ChevronsLeft size={20} className="text-gray-400" /></div><p className="text-gray-500 dark:text-gray-400 text-sm">No synchronized master engine rows fetched</p></div></div>;

  return <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-gray-200 dark:border-slate-700 overflow-hidden w-full flex flex-col">
    {isTimetableSlot ? (
      <>
        <div className="md:hidden divide-y divide-gray-200 dark:divide-slate-700">
          {entries.map((entry, index) => (
            <div key={entry.id || index} className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-gray-400">#{(pagination.page - 1) * pagination.limit + index + 1}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => onToggle(entry.id)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${entry.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{entry.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}{entry.isActive ? "Active" : "Inactive"}</button>
                  {renderActions(entry)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {visibleFields.map(field => <div key={field.name} className="min-w-0"><div className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{field.label}</div><div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{formatValue(entry[field.name], field, entry)}</div></div>)}
              </div>
              {actionMenuId === entry.id && <div ref={menuRef} className="border-t pt-2 flex gap-3 text-sm"><button onClick={() => { onClone(entry.id); setActionMenuId(null); }} className="text-gray-600 dark:text-gray-300 flex items-center gap-1"><Copy size={13}/>Clone</button><button onClick={() => { onToggle(entry.id); setActionMenuId(null); }} className="text-gray-600 dark:text-gray-300 flex items-center gap-1">{entry.isActive ? <ToggleLeft size={13}/> : <ToggleRight size={13}/>}Toggle</button><button onClick={() => { onDelete(entry.id); setActionMenuId(null); }} className="text-red-600 flex items-center gap-1"><Trash2 size={13}/>Delete</button></div>}
            </div>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[1100px]"><thead><tr className="bg-gray-50 dark:bg-slate-700/50 border-b"><th className="px-4 py-3 text-left text-xs text-gray-500">#</th>{visibleFields.map(f => <th key={f.name} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{f.label}</th>)}<th className="px-4 py-3 text-center text-xs text-gray-500">Status</th><th className="px-4 py-3 text-center text-xs text-gray-500">Actions</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-slate-700">{entries.map((entry,index)=><tr key={entry.id||index}><td className="px-4 py-3 text-gray-400">{(pagination.page-1)*pagination.limit+index+1}</td>{visibleFields.map(f=><td key={f.name} className="px-4 py-3"><span className="truncate block max-w-[180px] text-gray-700 dark:text-gray-300">{formatValue(entry[f.name],f,entry)}</span></td>)}<td className="px-4 py-3 text-center"><button onClick={()=>onToggle(entry.id)} className="text-xs">{entry.isActive ? "Active" : "Inactive"}</button></td><td className="px-4 py-3"><div className="justify-center flex">{renderActions(entry)}</div>{actionMenuId===entry.id&&<div ref={menuRef} className="absolute right-4 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-xl border z-30 py-1"><button onClick={()=>{onClone(entry.id);setActionMenuId(null)}} className="w-full text-left px-3 py-2 text-sm">Clone</button><button onClick={()=>{onDelete(entry.id);setActionMenuId(null)}} className="w-full text-left px-3 py-2 text-sm text-red-600">Delete</button></div>}</td></tr>)}</tbody></table>
        </div>
      </>
    ) : (
      <div className="overflow-x-auto w-full"><table className="w-full text-sm min-w-[900px]"><thead><tr className="bg-gray-50 dark:bg-slate-700/50 border-b"><th className="px-4 py-3 text-left text-xs text-gray-500">#</th>{visibleFields.map(f=><th key={f.name} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{f.label}</th>)}<th className="px-4 py-3 text-center text-xs text-gray-500">Status</th><th className="px-4 py-3 text-center text-xs text-gray-500">Actions</th></tr></thead><tbody className="divide-y">{entries.map((entry,index)=><tr key={entry.id||index}><td className="px-4 py-3 text-gray-400">{(pagination.page-1)*pagination.limit+index+1}</td>{visibleFields.map(f=><td key={f.name} className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatValue(entry[f.name],f,entry)}</td>)}<td className="px-4 py-3 text-center"><button onClick={()=>onToggle(entry.id)}>{entry.isActive?"Active":"Inactive"}</button></td><td className="px-4 py-3"><div className="justify-center flex">{renderActions(entry)}</div></td></tr>)}</tbody></table></div>
    )}
    {pagination.totalPages > 1 && <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between text-xs text-gray-500"><span>Showing {(pagination.page-1)*pagination.limit+1}–{Math.min(pagination.page*pagination.limit,pagination.total)} of {pagination.total}</span><div className="flex items-center gap-1"><button onClick={()=>onPageChange(1)} disabled={!pagination.hasPrev}><ChevronsLeft size={15}/></button><button onClick={()=>onPageChange(pagination.page-1)} disabled={!pagination.hasPrev}><ChevronLeft size={15}/></button><span>{pagination.page} / {pagination.totalPages}</span><button onClick={()=>onPageChange(pagination.page+1)} disabled={!pagination.hasNext}><ChevronRight size={15}/></button><button onClick={()=>onPageChange(pagination.totalPages)} disabled={!pagination.hasNext}><ChevronsRight size={15}/></button></div></div>}
  </div>;
}
