// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// MASTER FORM - Dynamic Add/Edit form for any master model
// Auto-generates form fields based on config + FILE UPLOAD SUPPORT FOR LOGO/IMAGES
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { X, Save, Loader2, Upload, Image as ImageIcon } from "lucide-react";
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


// ─── Lookup Field Component (fetches options from API) ───────────────────────
function LookupField({ field, value, onChange }: { field: FieldConfig; value: any; onChange: (val: string) => void }) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(getFullUrl(field.lookupUrl || ""), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = res.data?.data || res.data || [];
        const labelField = field.lookupLabelField || "name";
        const valueField = field.lookupValueField || "id";
        setOptions(
          (Array.isArray(data) ? data : []).map((item: any) => ({
            label: item[labelField] || item.name || item.id,
            value: item[valueField] || item.id,
          }))
        );
      } catch (err) {
        console.error("Lookup fetch failed:", err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    if (field.lookupUrl) fetchOptions();
  }, [field.lookupUrl, field.lookupLabelField, field.lookupValueField]);

  if (loading) {
    return (
      <select disabled className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm">
        <option>Loading...</option>
      </select>
    );
  }

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    >
      <option value="">Select {field.label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default function MasterForm({
  fields, initialData, onSubmit, onClose, loading, title,
}: MasterFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Initialize form data safely
  useEffect(() => {
    const initial: Record<string, any> = {};
    fields.forEach((field) => {
      if (initialData && initialData[field.name] !== undefined) {
        initial[field.name] = initialData[field.name];
      } else if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue;
      } else {
        initial[field.name] = field.type === "boolean" ? false : "";
      }
    });
    setFormData(initial);
    setErrors({});
  }, [fields, initialData]);

  // Handle file upload (for logo, images, etc.)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      
      // Upload to Cloudinary via your backend
      const response = await axios.post(getFullUrl('/api/upload/image'), formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        // Set the full URL returned from upload
        const uploadedUrl = response.data.url || response.data.data?.url;
        if (uploadedUrl) {
          handleChange(fieldName, uploadedUrl);
        } else {
          setErrors((prev) => ({
            ...prev,
            [fieldName]: 'Upload successful but URL not returned',
          }));
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: response.data.message || 'Upload failed',
        }));
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrors((prev) => ({
        ...prev,
        [fieldName]: err.response?.data?.message || 'Upload failed. Check console.',
      }));
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  // Handle field change cleanly
  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => { const e = { ...prev }; delete e[name]; return e; });
    }
  };

  // Validate & submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const val = formData[field.name];
      if (field.required && (val === undefined || val === null || val === "")) {
        newErrors[field.name] = `${field.label} is required`;
      }
      if (field.type === "number" && val !== "" && val !== null) {
        const num = Number(val);
        if (field.min !== undefined && num < field.min) {
          newErrors[field.name] = `Minimum value is ${field.min}`;
        }
        if (field.max !== undefined && num > field.max) {
          newErrors[field.name] = `Maximum value is ${field.max}`;
        }
      }
      if (field.type === "email" && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          newErrors[field.name] = "Invalid email address";
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clean empty strings/nulls out of final payload
    const cleanData: Record<string, any> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        cleanData[key] = value;
      }
    });

    onSubmit(cleanData);
  };

  // Render field by type wrapper
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
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={`${baseClasses} resize-none`}
          />
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseClasses}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "boolean":
        return (
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <div className="relative">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-slate-600 rounded-full peer-checked:bg-indigo-600 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 select-none">
              {value ? "Yes" : "No"}
            </span>
          </label>
        );

      case "color":
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value || "#4f46e5"}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-300 dark:border-slate-600 cursor-pointer p-0 bg-transparent"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder="#4f46e5"
              className={`${baseClasses} flex-1`}
            />
          </div>
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className={baseClasses}
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={value ? (typeof value === "string" && value.includes("T") ? value.split("T")[0] : value) : ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseClasses}
          />
        );

      case "datetime":
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseClasses}
          />
        );

      case "email":
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder || "email@example.com"}
            className={baseClasses}
          />
        );

      case "phone":
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder || "+91 XXXXXXXXXX"}
            className={baseClasses}
          />
        );

      case "url":
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder || "https://"}
            className={baseClasses}
          />
        );

      case "file":
      case "image":
        return (
          <div className="space-y-2">
            <label className="flex-1 relative group">
              <input
                type="file"
                accept={field.type === "image" ? "image/*" : undefined}
                onChange={(e) => handleFileUpload(e, field.name)}
                disabled={uploadingField === field.name}
                className="sr-only"
              />
              <div className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                uploadingField === field.name
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20'
                  : error
                  ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                  : 'border-gray-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700'
              }`}>
                {uploadingField === field.name ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} className="text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload</span>
                  </>
                )}
              </div>
            </label>
            {value && (
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  {field.type === "image" ? (
                    <ImageIcon size={14} className="text-indigo-600 flex-shrink-0" />
                  ) : (
                    <Upload size={14} className="text-indigo-600 flex-shrink-0" />
                  )}
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline truncate"
                    title={value}
                  >
                    View uploaded file
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange(field.name, '')}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        );

      case "json":
        return (
          <textarea
            value={typeof value === "object" ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              const textVal = e.target.value;
              try {
                handleChange(field.name, JSON.parse(textVal));
              } catch {
                handleChange(field.name, textVal);
              }
            }}
            placeholder={field.placeholder || "{}"}
            rows={4}
            className={`${baseClasses} font-mono text-xs resize-none`}
          />
        );

      case "lookup":
        return (
          <LookupField
            field={field}
            value={value}
            onChange={(val) => handleChange(field.name, val)}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body - Scroll Container Fixed */}
        <form onSubmit={handleSubmit} id="masterDynamicForm" className="flex-1 overflow-y-auto p-6 [scrollbar-gutter:stable]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => {
              const isFullWidth = ["textarea", "json", "file", "image"].includes(field.type);
              return (
                <div key={field.name} className={isFullWidth ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                  {errors[field.name] && (
                    <p className="mt-1 text-xs text-red-500">{errors[field.name]}</p>
                  )}
                </div>
              );
            })}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="masterDynamicForm"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={14} /> {initialData ? "Update" : "Create"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
