// MASTER FORM - Dynamic Add/Edit form for any master model
// NOTE: Timetable Slot relation dropdown handling is centralized below.

import { useState, useEffect } from "react";
import { X, Save, Loader2, Upload } from "lucide-react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";

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
  lookupUrl?: string;
  lookupLabelField?: string;
  lookupValueField?: string;
}

interface MasterFormProps {
  fields: FieldConfig[];
  initialData?: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
  loading: boolean;
  title: string;
}

function LookupField({ field, value, onChange }: { field: FieldConfig; value: any; onChange: (val: string) => void }) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(getFullUrl(field.lookupUrl || ""), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const raw = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
        const data = Array.isArray(raw) ? raw : [];
        const labelField = field.lookupLabelField || "name";
        const valueField = field.lookupValueField || "id";
        const normalized = data.map((item: any) => ({
          label: String(item?.[labelField] ?? item?.name ?? item?.id ?? ""),
          value: String(item?.[valueField] ?? item?.id ?? ""),
        }));
        if (active) setOptions(normalized);
      } catch (err) {
        console.error("Lookup fetch failed:", field.lookupUrl, err);
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    setLoading(Boolean(field.lookupUrl));
    if (field.lookupUrl) fetchOptions();
    return () => { active = false; };
  }, [field.lookupUrl, field.lookupLabelField, field.lookupValueField]);

  if (loading) {
    return <select disabled className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm"><option>Loading...</option></select>;
  }

  return (
    <select
      value={value == null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    >
      <option value="">Select {field.label}</option>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}

export default function MasterForm({ fields, initialData, onSubmit, onClose, loading, title }: MasterFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, any> = {};
    fields.forEach((field) => {
      if (initialData && initialData[field.name] !== undefined) initial[field.name] = initialData[field.name];
      else if (field.defaultValue !== undefined) initial[field.name] = field.defaultValue;
      else initial[field.name] = field.type === "boolean" ? false : "";
    });
    setFormData(initial);
    setErrors({});
  }, [fields, initialData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldName);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);
      const response = await axios.post(getFullUrl("/api/upload/image"), formDataToSend, { headers: { "Content-Type": "multipart/form-data" } });
      if (response.data.success) {
        const uploadedUrl = response.data.url || response.data.data?.url;
        if (uploadedUrl) handleChange(fieldName, uploadedUrl);
        else setErrors((p) => ({ ...p, [fieldName]: "Upload successful but URL not returned" }));
      } else setErrors((p) => ({ ...p, [fieldName]: response.data.message || "Upload failed" }));
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrors((p) => ({ ...p, [fieldName]: err.response?.data?.message || "Upload failed. Check console." }));
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const e = { ...prev }; delete e[name]; return e; });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const val = formData[field.name];
      if (field.required && (val === undefined || val === null || val === "")) newErrors[field.name] = `${field.label} is required`;
      if (field.type === "number" && val !== "" && val !== null) {
        const num = Number(val);
        if (field.min !== undefined && num < field.min) newErrors[field.name] = `Minimum value is ${field.min}`;
        if (field.max !== undefined && num > field.max) newErrors[field.name] = `Maximum value is ${field.max}`;
      }
      if (field.type === "email" && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) newErrors[field.name] = "Invalid email address";
      }
    });
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    const cleanData: Record<string, any> = {};
    Object.entries(formData).forEach(([key, value]) => { if (value !== "" && value !== null && value !== undefined) cleanData[key] = value; });
    onSubmit(cleanData);
  };

  const isTimetableSlotForm = fields.some((item) => item.name === "dayOfWeek") && fields.some((item) => item.name === "periodId");
  const timetableLookup: Record<string, Partial<FieldConfig>> = {
    periodId: { label: "Period", type: "lookup", lookupUrl: "/api/masters/period-master/dropdown", lookupLabelField: "name", lookupValueField: "id", required: true },
    classId: { label: "Class", type: "lookup", lookupUrl: "/api/class", lookupLabelField: "name", lookupValueField: "id", required: true },
    sectionId: { label: "Section", type: "lookup", lookupUrl: "/api/section", lookupLabelField: "name", lookupValueField: "id" },
    subjectId: { label: "Subject", type: "lookup", lookupUrl: "/api/subject", lookupLabelField: "name", lookupValueField: "id" },
    teacherId: { label: "Teacher", type: "lookup", lookupUrl: "/api/teacher", lookupLabelField: "name", lookupValueField: "id" },
    roomId: { label: "Room", type: "lookup", lookupUrl: "/api/room", lookupLabelField: "name", lookupValueField: "id" },
  };

  const renderField = (originalField: FieldConfig) => {
    const field = isTimetableSlotForm && timetableLookup[originalField.name]
      ? { ...originalField, ...timetableLookup[originalField.name] }
      : originalField;
    const value = formData[field.name] ?? "";
    const error = errors[field.name];
    const baseClasses = `w-full px-3 py-2.5 border rounded-lg text-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${error ? "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-700 text-gray-900 dark:text-gray-100" : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"}`;

    switch (field.type) {
      case "textarea": return <textarea value={value} onChange={(e) => handleChange(field.name, e.target.value)} className={baseClasses} rows={4} placeholder={field.placeholder} />;
      case "select": return <select value={value} onChange={(e) => handleChange(field.name, e.target.value)} className={baseClasses}><option value="">Select {field.label}</option>{field.options?.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>;
      case "lookup": return <LookupField field={field} value={value} onChange={(nextValue) => handleChange(field.name, nextValue)} />;
      case "boolean": return <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={Boolean(value)} onChange={(e) => handleChange(field.name, e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" /><span className="text-sm text-gray-600 dark:text-gray-300">{field.label}</span></label>;
      case "number": return <input type="number" value={value} onChange={(e) => handleChange(field.name, e.target.value)} min={field.min} max={field.max} placeholder={field.placeholder} className={baseClasses} />;
      case "email": return <input type="email" value={value} onChange={(e) => handleChange(field.name, e.target.value)} placeholder={field.placeholder} className={baseClasses} />;
      case "phone": return <input type="tel" value={value} onChange={(e) => handleChange(field.name, e.target.value)} placeholder={field.placeholder} className={baseClasses} />;
      case "date": return <input type="date" value={value ? String(value).slice(0, 10) : ""} onChange={(e) => handleChange(field.name, e.target.value)} className={baseClasses} />;
      case "datetime": return <input type="datetime-local" value={value ? String(value).slice(0, 16) : ""} onChange={(e) => handleChange(field.name, e.target.value)} className={baseClasses} />;
      case "url": return <input type="url" value={value} onChange={(e) => handleChange(field.name, e.target.value)} placeholder={field.placeholder} className={baseClasses} />;
      case "color": return <div className="flex items-center gap-2"><input type="color" value={value || "#6366f1"} onChange={(e) => handleChange(field.name, e.target.value)} className="w-10 h-10 rounded border cursor-pointer" /><input type="text" value={value} onChange={(e) => handleChange(field.name, e.target.value)} className={baseClasses} /></div>;
      case "file": return <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, field.name)} className={baseClasses} disabled={uploadingField === field.name} />;
      default: return <input type="text" value={value} onChange={(e) => handleChange(field.name, e.target.value)} placeholder={field.placeholder} className={baseClasses} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700"><h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2><button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"><X size={20} /></button></div>
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-6 space-y-4">
            {fields.map((field) => <div key={field.name}><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{field.label} {field.required && <span className="text-red-500">*</span>}</label>{renderField(field)}{errors[field.name] && <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>}</div>)}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"><button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">Cancel</button><button type="submit" disabled={loading || uploadingField !== null} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">{loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{loading ? "Saving..." : "Save"}</button></div>
        </form>
      </div>
    </div>
  );
}
