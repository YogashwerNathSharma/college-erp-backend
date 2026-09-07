// MASTER FORM - Dynamic Add/Edit form for any master model
// Timetable Slot relations always render as real dropdowns with normalized API values.

import { useEffect, useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";

interface SelectOption {
  label: string;
  value: string;
}

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  defaultValue?: any;
  lookupUrl?: string;
  lookupLabelField?: string;
  lookupValueField?: string;
}

interface MasterFormProps {
  modelKey?: string | null;
  fields: FieldConfig[];
  initialData?: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
  loading: boolean;
  title: string;
}

function extractArray(payload: any): any[] {
  const candidates = [
    payload?.data?.data,
    payload?.data?.items,
    payload?.data?.results,
    payload?.data?.options,
    payload?.data,
    payload?.items,
    payload?.results,
    payload?.options,
    payload,
  ];
  return candidates.find(Array.isArray) || [];
}

function normalizeOptions(payload: any, field: FieldConfig): SelectOption[] {
  const labelField = field.lookupLabelField || "name";
  const valueField = field.lookupValueField || "id";

  return extractArray(payload)
    .map((item: any) => {
      if (item === null || item === undefined) return null;
      if (typeof item !== "object") {
        return { label: String(item), value: String(item) };
      }

      const value = item?.[valueField] ?? item?.id ?? item?._id ?? item?.value;
      const label =
        item?.[labelField] ??
        item?.label ??
        item?.name ??
        item?.title ??
        item?.fullName ??
        item?.code ??
        value;

      if (value === undefined || value === null || value === "") return null;
      return { label: String(label ?? value), value: String(value) };
    })
    .filter((option): option is SelectOption => Boolean(option));
}

function LookupField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: any;
  onChange: (val: string) => void;
}) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(Boolean(field.lookupUrl));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchOptions = async () => {
      if (!field.lookupUrl) {
        if (active) {
          setOptions(field.options || []);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setFailed(false);

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(getFullUrl(field.lookupUrl), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: { limit: 500 },
        });
        const normalized = normalizeOptions(response.data, field);
        if (active) setOptions(normalized);
      } catch (error) {
        console.error(`Lookup fetch failed for ${field.label}:`, field.lookupUrl, error);
        if (active) {
          setOptions([]);
          setFailed(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOptions();
    return () => {
      active = false;
    };
  }, [field.lookupUrl, field.lookupLabelField, field.lookupValueField, field.options]);

  const selectedValue = value == null ? "" : String(value);

  if (loading) {
    return (
      <select disabled className="w-full px-3 py-2.5 border rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-gray-500">
        <option>Loading {field.label}...</option>
      </select>
    );
  }

  return (
    <>
      <select
        value={selectedValue}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2.5 border rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
      >
        <option value="">Select {field.label}</option>
        {options.map((option) => (
          <option key={`${field.name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {failed && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          Could not load {field.label} values.
        </p>
      )}
      {!failed && options.length === 0 && (
        <p className="text-xs text-gray-500 mt-1">No {field.label} values available.</p>
      )}
    </>
  );
}

export default function MasterForm({
  modelKey,
  fields,
  initialData,
  onSubmit,
  onClose,
  loading,
  title,
}: MasterFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const timetableFields: FieldConfig[] = [
    {
      name: "dayOfWeek",
      label: "Day",
      type: "select",
      required: true,
      options: [
        { label: "Monday", value: "1" },
        { label: "Tuesday", value: "2" },
        { label: "Wednesday", value: "3" },
        { label: "Thursday", value: "4" },
        { label: "Friday", value: "5" },
        { label: "Saturday", value: "6" },
        { label: "Sunday", value: "0" },
      ],
    },
    {
      name: "periodId",
      label: "Period",
      type: "lookup",
      lookupUrl: "/api/masters/period-master/dropdown",
      lookupLabelField: "name",
      lookupValueField: "id",
      required: true,
    },
    {
      name: "classId",
      label: "Class",
      type: "lookup",
      lookupUrl: "/api/class",
      lookupLabelField: "name",
      lookupValueField: "id",
      required: true,
    },
    {
      name: "sectionId",
      label: "Section",
      type: "lookup",
      lookupUrl: "/api/section",
      lookupLabelField: "name",
      lookupValueField: "id",
    },
    {
      name: "subjectId",
      label: "Subject",
      type: "lookup",
      lookupUrl: "/api/subject",
      lookupLabelField: "name",
      lookupValueField: "id",
    },
    {
      name: "teacherId",
      label: "Teacher",
      type: "lookup",
      lookupUrl: "/api/teacher",
      lookupLabelField: "name",
      lookupValueField: "id",
    },
    {
      name: "roomId",
      label: "Room",
      type: "lookup",
      lookupUrl: "/api/room",
      lookupLabelField: "name",
      lookupValueField: "id",
    },
  ];

  const isTimetableSlot = modelKey === "timetable-slot-master";
  const effectiveFields = isTimetableSlot ? timetableFields : fields;

  useEffect(() => {
    const initial: Record<string, any> = {};
    effectiveFields.forEach((field) => {
      const rawValue = initialData?.[field.name];
      const value =
        rawValue && typeof rawValue === "object"
          ? rawValue[field.lookupValueField || "id"] ?? rawValue.id ?? rawValue._id
          : rawValue;

      if (value !== undefined) initial[field.name] = value;
      else if (field.defaultValue !== undefined) initial[field.name] = field.defaultValue;
      else initial[field.name] = field.type === "boolean" ? false : "";
    });
    setFormData(initial);
    setErrors({});
  }, [initialData, modelKey, fields]);

  const handleChange = (name: string, value: any) => {
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[name];
        return next;
      });
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldName);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await axios.post(getFullUrl("/api/upload/image"), body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        const url = response.data.url || response.data.data?.url;
        if (url) handleChange(fieldName, url);
        else setErrors((previous) => ({ ...previous, [fieldName]: "Upload successful but URL not returned" }));
      } else {
        setErrors((previous) => ({ ...previous, [fieldName]: response.data.message || "Upload failed" }));
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setErrors((previous) => ({ ...previous, [fieldName]: error.response?.data?.message || "Upload failed. Check console." }));
    } finally {
      setUploadingField(null);
      event.target.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    effectiveFields.forEach((field) => {
      const value = formData[field.name];
      if (field.required && (value === undefined || value === null || value === "")) {
        nextErrors[field.name] = `${field.label} is required`;
      }
      if (field.type === "number" && value !== "" && value !== null) {
        const numberValue = Number(value);
        if (field.min !== undefined && numberValue < field.min) nextErrors[field.name] = `Minimum value is ${field.min}`;
        if (field.max !== undefined && numberValue > field.max) nextErrors[field.name] = `Maximum value is ${field.max}`;
      }
      if (field.type === "email" && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) nextErrors[field.name] = "Invalid email address";
      }
    });

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const cleanData: Record<string, any> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) cleanData[key] = value;
    });
    onSubmit(cleanData);
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.name] ?? "";
    const error = errors[field.name];
    const baseClasses = `w-full px-3 py-2.5 border rounded-lg text-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${
      error
        ? "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-700 text-gray-900 dark:text-gray-100"
        : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
    }`;

    switch (field.type) {
      case "textarea":
        return <textarea value={value} onChange={(event) => handleChange(field.name, event.target.value)} className={baseClasses} rows={4} placeholder={field.placeholder} />;
      case "select":
        return (
          <select value={value} onChange={(event) => handleChange(field.name, event.target.value)} className={baseClasses}>
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        );
      case "lookup":
        return <LookupField field={field} value={value} onChange={(next) => handleChange(field.name, next)} />;
      case "boolean":
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={Boolean(value)} onChange={(event) => handleChange(field.name, event.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">{field.label}</span>
          </label>
        );
      case "number":
        return <input type="number" value={value} onChange={(event) => handleChange(field.name, event.target.value)} min={field.min} max={field.max} placeholder={field.placeholder} className={baseClasses} />;
      case "email":
        return <input type="email" value={value} onChange={(event) => handleChange(field.name, event.target.value)} placeholder={field.placeholder} className={baseClasses} />;
      case "phone":
        return <input type="tel" value={value} onChange={(event) => handleChange(field.name, event.target.value)} placeholder={field.placeholder} className={baseClasses} />;
      case "date":
        return <input type="date" value={value ? String(value).slice(0, 10) : ""} onChange={(event) => handleChange(field.name, event.target.value)} className={baseClasses} />;
      case "datetime":
        return <input type="datetime-local" value={value ? String(value).slice(0, 16) : ""} onChange={(event) => handleChange(field.name, event.target.value)} className={baseClasses} />;
      case "url":
        return <input type="url" value={value} onChange={(event) => handleChange(field.name, event.target.value)} placeholder={field.placeholder} className={baseClasses} />;
      case "color":
        return (
          <div className="flex items-center gap-2">
            <input type="color" value={value || "#6366f1"} onChange={(event) => handleChange(field.name, event.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
            <input type="text" value={value} onChange={(event) => handleChange(field.name, event.target.value)} className={baseClasses} />
          </div>
        );
      case "file":
        return <input type="file" accept="image/*" onChange={(event) => handleFileUpload(event, field.name)} className={baseClasses} disabled={uploadingField === field.name} />;
      default:
        return <input type="text" value={value} onChange={(event) => handleChange(field.name, event.target.value)} placeholder={field.placeholder} className={baseClasses} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-6 space-y-4">
            {effectiveFields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {renderField(field)}
                {errors[field.name] && <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={loading || uploadingField !== null} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
