import { useEffect, useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";

interface SelectOption { label: string; value: string; }
interface FieldConfig {
  name: string; label: string; type: string; required?: boolean;
  options?: SelectOption[]; placeholder?: string; min?: number; max?: number;
  defaultValue?: any; lookupUrl?: string; lookupLabelField?: string; lookupValueField?: string;
  multiple?: boolean;
}
interface MasterFormProps {
  modelKey?: string | null; fields: FieldConfig[]; initialData?: any;
  onSubmit: (data: any) => void; onClose: () => void; loading: boolean; title: string;
}

function extractArray(payload: any): any[] {
  const candidates = [payload?.data?.data, payload?.data?.items, payload?.data?.results, payload?.data?.options, payload?.data, payload?.items, payload?.results, payload?.options, payload];
  return candidates.find(Array.isArray) || [];
}

function normalizeOptions(payload: any, field: FieldConfig): SelectOption[] {
  const labelField = field.lookupLabelField || "name";
  const valueField = field.lookupValueField || "id";
  return extractArray(payload).map((item: any) => {
    if (item == null) return null;
    if (typeof item !== "object") return { label: String(item), value: String(item) };
    const value = item?.[valueField] ?? item?.id ?? item?._id ?? item?.value;
    const label = item?.[labelField] ?? item?.label ?? item?.name ?? item?.title ?? item?.fullName ?? item?.code ?? value;
    return value == null || value === "" ? null : { label: String(label ?? value), value: String(value) };
  }).filter(Boolean) as SelectOption[];
}

function LookupField({ field, value, onChange, query }: { field: FieldConfig; value: any; onChange: (v: any) => void; query?: Record<string, string> }) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(Boolean(field.lookupUrl));
  const [failed, setFailed] = useState(false);
  const multiple = Boolean(field.multiple);

  useEffect(() => {
    let active = true;
    const fetchOptions = async () => {
      if (!field.lookupUrl) { setOptions(field.options || []); setLoading(false); return; }
      setLoading(true); setFailed(false);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(getFullUrl(field.lookupUrl), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: { limit: 500, ...(query || {}) },
        });
        if (active) setOptions(normalizeOptions(response.data, field));
      } catch (error) {
        console.error(`Lookup fetch failed for ${field.label}:`, field.lookupUrl, error);
        if (active) { setOptions([]); setFailed(true); }
      } finally { if (active) setLoading(false); }
    };
    fetchOptions();
    return () => { active = false; };
  }, [field.lookupUrl, field.lookupLabelField, field.lookupValueField, field.options, JSON.stringify(query || {})]);

  if (loading) return <select multiple={multiple} disabled className="w-full px-3 py-2.5 border rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm"><option>Loading {field.label}...</option></select>;

  if (multiple) {
    const selected = Array.isArray(value) ? value.map(String) : value ? String(value).split(",").map(s => s.trim()).filter(Boolean) : [];
    return <>
      <select
        multiple
        value={selected}
        onChange={e => onChange(Array.from(e.target.selectedOptions).map(option => option.value))}
        className="w-full min-h-28 px-3 py-2.5 border rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      >
        {options.map(o => <option key={`${field.name}-${o.value}`} value={o.value}>{o.label}</option>)}
      </select>
      <p className="text-xs text-gray-500 mt-1">Ctrl/Cmd + click to select multiple classes.</p>
      {failed && <p className="text-xs text-amber-600 mt-1">Could not load {field.label} values.</p>}
      {!failed && options.length === 0 && <p className="text-xs text-gray-500 mt-1">No {field.label} values available.</p>}
    </>;
  }

  return <>
    <select value={value == null ? "" : String(value)} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
      <option value="">Select {field.label}</option>
      {options.map(o => <option key={`${field.name}-${o.value}`} value={o.value}>{o.label}</option>)}
    </select>
    {failed && <p className="text-xs text-amber-600 mt-1">Could not load {field.label} values.</p>}
    {!failed && options.length === 0 && <p className="text-xs text-gray-500 mt-1">No {field.label} values available.</p>}
  </>;
}

export default function MasterForm({ modelKey, fields, initialData, onSubmit, onClose, loading, title }: MasterFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const timetableFields: FieldConfig[] = [
    { name: "dayOfWeek", label: "Day", type: "select", required: true, options: [
      { label: "Monday", value: "1" }, { label: "Tuesday", value: "2" }, { label: "Wednesday", value: "3" },
      { label: "Thursday", value: "4" }, { label: "Friday", value: "5" }, { label: "Saturday", value: "6" }, { label: "Sunday", value: "0" }
    ] },
    { name: "periodId", label: "Period", type: "lookup", lookupUrl: "/api/masters/period-master/dropdown", lookupLabelField: "name", lookupValueField: "id", required: true },
    { name: "classId", label: "Class", type: "lookup", lookupUrl: "/api/class", lookupLabelField: "name", lookupValueField: "id", required: true },
    { name: "sectionId", label: "Section", type: "lookup", lookupUrl: "/api/section/dropdown", lookupLabelField: "name", lookupValueField: "id" },
    { name: "subjectId", label: "Subject", type: "lookup", lookupUrl: "/api/subject", lookupLabelField: "name", lookupValueField: "id" },
    { name: "teacherId", label: "Teacher", type: "lookup", lookupUrl: "/api/teacher", lookupLabelField: "name", lookupValueField: "id" },
    { name: "roomId", label: "Room", type: "lookup", lookupUrl: "/api/room", lookupLabelField: "name", lookupValueField: "id" },
  ];
  const isTimetableSlot = modelKey === "timetable-slot-master";
  const isResultTypeMaster = modelKey === "result-type-master";
  const resultTypeFields: FieldConfig[] = isResultTypeMaster ? [
    { name: "calculationMode", label: "Calculation Mode", type: "select", options: [
      { label: "Automatic", value: "AUTOMATIC" },
      { label: "Manual Formula", value: "MANUAL" },
    ], defaultValue: "AUTOMATIC" },
    { name: "formula", label: "Formula", type: "textarea", placeholder: "Manual example: percentage=(totalObtained/totalMaxMarks)*100; cgpa=averageGradePoint" },
  ] : [];
  const assessmentNameOptions: SelectOption[] = [
    { label: "Class Test 1", value: "CLASS_TEST_1" }, { label: "Class Test 2", value: "CLASS_TEST_2" },
    { label: "Unit Test 1", value: "UNIT_TEST_1" }, { label: "Unit Test 2", value: "UNIT_TEST_2" },
    { label: "Periodic Test 1", value: "PERIODIC_TEST_1" }, { label: "Periodic Test 2", value: "PERIODIC_TEST_2" },
    { label: "Mid Term", value: "MID_TERM" }, { label: "Half Yearly", value: "HALF_YEARLY" },
    { label: "Annual", value: "ANNUAL" }, { label: "Pre-Board", value: "PRE_BOARD" },
    { label: "Quiz", value: "QUIZ" }, { label: "Assignment", value: "ASSIGNMENT" },
  ];
  const existingAssessmentName = typeof initialData?.name === "string" ? initialData.name : "";
  if (existingAssessmentName && !assessmentNameOptions.some(option => option.value === existingAssessmentName)) {
    assessmentNameOptions.push({ label: existingAssessmentName, value: existingAssessmentName });
  }
  const assessmentFields: FieldConfig[] = modelKey === "assessment-master"
    ? fields.map(field => field.name === "name"
      ? { ...field, type: "select", options: assessmentNameOptions }
      : field)
    : [];
  const effectiveFields = isTimetableSlot
    ? timetableFields
    : isResultTypeMaster
      ? [...fields.filter(field => field.name !== "calculationMode" && field.name !== "formula"), ...resultTypeFields]
      : modelKey === "assessment-master"
        ? assessmentFields
        : fields;

  useEffect(() => {
    const initial: Record<string, any> = {};
    effectiveFields.forEach(field => {
      const raw = initialData?.[field.name];
      if (field.multiple) {
        if (Array.isArray(raw)) initial[field.name] = raw.map(String);
        else if (typeof raw === "string" && raw) initial[field.name] = raw.split(",").map(s => s.trim()).filter(Boolean);
        else initial[field.name] = [];
        return;
      }
      const value = raw && typeof raw === "object" ? raw[field.lookupValueField || "id"] ?? raw.id ?? raw._id : raw;
      initial[field.name] = value !== undefined ? value : field.defaultValue !== undefined ? field.defaultValue : field.type === "boolean" ? false : "";
    });
    setFormData(initial); setErrors({});
  }, [initialData, modelKey, fields]);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const e = { ...prev }; delete e[name]; return e; });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0]; if (!file) return; setUploadingField(fieldName);
    try {
      const body = new FormData(); body.append("file", file);
      const response = await axios.post(getFullUrl("/api/upload/image"), body, { headers: { "Content-Type": "multipart/form-data" } });
      if (response.data.success) {
        const url = response.data.url || response.data.data?.url;
        if (url) handleChange(fieldName, url); else setErrors(p => ({ ...p, [fieldName]: "Upload successful but URL not returned" }));
      } else setErrors(p => ({ ...p, [fieldName]: response.data.message || "Upload failed" }));
    } catch (error: any) { setErrors(p => ({ ...p, [fieldName]: error.response?.data?.message || "Upload failed. Check console." })); }
    finally { setUploadingField(null); e.target.value = ""; }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); const next: Record<string, string> = {};
    effectiveFields.forEach(field => {
      const value = formData[field.name];
      if (field.required && (value == null || value === "" || (Array.isArray(value) && value.length === 0))) next[field.name] = `${field.label} is required`;
      if (field.type === "number" && value !== "" && value != null) { const n = Number(value); if (field.min !== undefined && n < field.min) next[field.name] = `Minimum value is ${field.min}`; if (field.max !== undefined && n > field.max) next[field.name] = `Maximum value is ${field.max}`; }
      if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) next[field.name] = "Invalid email address";
    });
    if (Object.keys(next).length) { setErrors(next); return; }
    const clean: Record<string, any> = {}; Object.entries(formData).forEach(([k, v]) => { if (v !== "" && v != null && (!Array.isArray(v) || v.length > 0)) clean[k] = v; }); onSubmit(clean);
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.name] ?? "";
    const error = errors[field.name];
    const cls = `w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${error ? "border-red-400" : "border-gray-300 dark:border-slate-600"} bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200`;
    switch (field.type) {
      case "select": return <select value={value} onChange={e => handleChange(field.name, e.target.value)} className={cls}><option value="">Select {field.label}</option>{field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
      case "lookup": return <LookupField field={field} value={value} onChange={v => handleChange(field.name, v)} query={field.name === "sectionId" && formData.classId ? { classId: String(formData.classId) } : undefined} />;
      case "textarea": return <textarea value={value} onChange={e => handleChange(field.name, e.target.value)} className={cls} rows={4} placeholder={field.placeholder} />;
      case "boolean": return <input type="checkbox" checked={Boolean(value)} onChange={e => handleChange(field.name, e.target.checked)} className="w-4 h-4" />;
      case "number": return <input type="number" value={value} onChange={e => handleChange(field.name, e.target.value)} min={field.min} max={field.max} className={cls} placeholder={field.placeholder} />;
      case "email": return <input type="email" value={value} onChange={e => handleChange(field.name, e.target.value)} className={cls} placeholder={field.placeholder} />;
      case "phone": return <input type="tel" value={value} onChange={e => handleChange(field.name, e.target.value)} className={cls} placeholder={field.placeholder} />;
      case "date": return <input type="date" value={value ? String(value).slice(0,10) : ""} onChange={e => handleChange(field.name, e.target.value)} className={cls} />;
      case "datetime": return <input type="datetime-local" value={value ? String(value).slice(0,16) : ""} onChange={e => handleChange(field.name, e.target.value)} className={cls} />;
      case "url": return <input type="url" value={value} onChange={e => handleChange(field.name, e.target.value)} className={cls} placeholder={field.placeholder} />;
      case "color": return <input type="color" value={value || "#6366f1"} onChange={e => handleChange(field.name, e.target.value)} className="w-10 h-10" />;
      case "file": return <input type="file" accept="image/*" onChange={e => handleFileUpload(e, field.name)} className={cls} disabled={uploadingField === field.name} />;
      default: return <input type="text" value={value} onChange={e => handleChange(field.name, e.target.value)} className={cls} placeholder={field.placeholder} />;
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">{title}</h2><button onClick={onClose} className="p-2"><X size={20}/></button></div>
    <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]"><div className="p-6 space-y-4">{effectiveFields.map(field => <div key={field.name}><label className="block text-sm font-medium mb-1.5">{field.label} {field.required && <span className="text-red-500">*</span>}</label>{renderField(field)}{errors[field.name] && <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>}</div>)}</div>
    <div className="flex justify-end gap-3 px-6 py-4 border-t"><button type="button" onClick={onClose} className="px-5 py-2.5 border rounded-xl">Cancel</button><button type="submit" disabled={loading || uploadingField !== null} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2">{loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} {loading ? "Saving..." : "Save"}</button></div></form>
  </div></div>;
}
