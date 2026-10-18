import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Settings,
  Copy,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  Search,
  ToggleLeft,
  ToggleRight,
  Type,
  Hash,
  Mail,
  Phone,
  Calendar,
  List,
  CheckSquare,
  Circle,
  Upload,
  Image,
  AlignLeft,
  Columns,
  LayoutList,
  Send,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Clock,
} from "lucide-react";

// ══════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════

interface FieldType {
  type: string;
  label: string;
  icon: any;
  category: string;
}

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  options: string[];
  validation: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  order: number;
  width: "FULL" | "HALF";
  helpText: string;
  defaultValue: string;
}

interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  module?: string;
  fields: FormField[];
  settings: any;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: { submissions: number };
}

interface FormSubmission {
  id: string;
  data: Record<string, any>;
  submittedByName?: string;
  submittedByEmail?: string;
  status: string;
  createdAt: string;
}

interface FormStats {
  totalForms: number;
  publishedForms: number;
  totalSubmissions: number;
  todaySubmissions: number;
}

// ══════════════════════════════════════════════════════════
// FIELD TYPES CONFIG
// ══════════════════════════════════════════════════════════

const FIELD_TYPES: FieldType[] = [
  { type: "TEXT", label: "Text Input", icon: Type, category: "Basic" },
  { type: "NUMBER", label: "Number", icon: Hash, category: "Basic" },
  { type: "EMAIL", label: "Email", icon: Mail, category: "Basic" },
  { type: "PHONE", label: "Phone", icon: Phone, category: "Basic" },
  { type: "TEXTAREA", label: "Text Area", icon: AlignLeft, category: "Basic" },
  { type: "DATE", label: "Date", icon: Calendar, category: "Basic" },
  { type: "SELECT", label: "Dropdown", icon: List, category: "Choice" },
  { type: "MULTI_SELECT", label: "Multi Select", icon: LayoutList, category: "Choice" },
  { type: "RADIO", label: "Radio Buttons", icon: Circle, category: "Choice" },
  { type: "CHECKBOX", label: "Checkbox", icon: CheckSquare, category: "Choice" },
  { type: "FILE", label: "File Upload", icon: Upload, category: "Advanced" },
  { type: "IMAGE", label: "Image Upload", icon: Image, category: "Advanced" },
];

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════

export default function FormBuilder() {
  const [view, setView] = useState<"list" | "builder" | "submissions">("list");
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);

  // Builder state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formModule, setFormModule] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const [formsRes, statsRes] = await Promise.all([
        axios.get(getFullUrl("/api/forms")),
        axios.get(getFullUrl("/api/forms/stats")),
      ]);
      setForms(formsRes.data.data || []);
      setStats(statsRes.data.data || null);
    } catch (err) {
      console.error("Failed to fetch forms:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateFieldId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  const addField = (type: string) => {
    const fieldType = FIELD_TYPES.find((f) => f.type === type);
    const newField: FormField = {
      id: generateFieldId(),
      label: fieldType?.label || type,
      type,
      required: false,
      placeholder: "",
      options: type === "SELECT" || type === "MULTI_SELECT" || type === "RADIO" ? ["Option 1", "Option 2"] : [],
      validation: {},
      order: fields.length + 1,
      width: "FULL",
      helpText: "",
      defaultValue: "",
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  const removeField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    newFields.forEach((f, i) => (f.order = i + 1));
    setFields(newFields);
  };

  const duplicateField = (field: FormField) => {
    const newField: FormField = {
      ...field,
      id: generateFieldId(),
      label: `${field.label} (Copy)`,
      order: fields.length + 1,
    };
    setFields([...fields, newField]);
  };

  const handleSaveForm = async () => {
    if (!formName.trim()) {
      alert("Form name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName,
        description: formDescription || null,
        module: formModule || null,
        fields,
        settings: {},
      };

      if (editingFormId) {
        await axios.put(getFullUrl(`/api/forms/${editingFormId}`), payload);
      } else {
        await axios.post(getFullUrl("/api/forms"), payload);
      }

      resetBuilder();
      setView("list");
      fetchForms();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (formId: string, publish: boolean) => {
    try {
      await axios.put(getFullUrl(`/api/forms/${formId}`), { isPublished: publish });
      fetchForms();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update form");
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;
    try {
      await axios.delete(getFullUrl(`/api/forms/${formId}`));
      fetchForms();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete form");
    }
  };

  const handleEditForm = (form: FormTemplate) => {
    setEditingFormId(form.id);
    setFormName(form.name);
    setFormDescription(form.description || "");
    setFormModule(form.module || "");
    setFields(form.fields || []);
    setView("builder");
  };

  const handleViewSubmissions = async (form: FormTemplate) => {
    setSelectedForm(form);
    try {
      const res = await axios.get(getFullUrl(`/api/forms/${form.id}/submissions`));
      setSubmissions(res.data.data || []);
      setView("submissions");
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    }
  };

  const resetBuilder = () => {
    setFormName("");
    setFormDescription("");
    setFormModule("");
    setFields([]);
    setSelectedFieldId(null);
    setEditingFormId(null);
    setShowPreview(false);
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  // ════════════════ SUBMISSIONS VIEW ════════════════
  if (view === "submissions" && selectedForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setView("list")}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-2 flex items-center gap-1"
            >
              ← Back to Forms
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedForm.name} — Submissions
            </h1>
            <p className="text-sm text-gray-500 mt-1">{submissions.length} total submissions</p>
          </div>
          <button
            onClick={() => window.open(getFullUrl(`/api/forms/${selectedForm.id}/submissions/export?format=csv`), "_blank")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-750">
                <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                {(selectedForm.fields || []).slice(0, 5).map((field) => (
                  <th key={field.id} className="px-4 py-3 text-left font-medium text-gray-500">
                    {field.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {submissions.map((sub, index) => (
                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                  {(selectedForm.fields || []).slice(0, 5).map((field) => (
                    <td key={field.id} className="px-4 py-3 text-gray-900 dark:text-white">
                      {Array.isArray(sub.data[field.id])
                        ? sub.data[field.id].join(", ")
                        : sub.data[field.id] || "—"}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        sub.status === "SUBMITTED"
                          ? "bg-blue-100 text-blue-700"
                          : sub.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : sub.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {submissions.length === 0 && (
            <p className="text-center py-12 text-gray-400">No submissions yet</p>
          )}
        </div>
      </div>
    );
  }

  // ════════════════ BUILDER VIEW ════════════════
  if (view === "builder") {
    return (
      <div className="space-y-4">
        {/* Builder Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetBuilder();
                setView("list");
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingFormId ? "Edit Form" : "Create Form"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
                showPreview
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPreview ? "Edit" : "Preview"}
            </button>
            <button
              onClick={handleSaveForm}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Save Form
            </button>
          </div>
        </div>

        {/* Form Name & Description */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Form Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Admission Enquiry Form"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description..."
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Module</label>
              <select
                value={formModule}
                onChange={(e) => setFormModule(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                <option value="ADMISSION">Admission</option>
                <option value="ENQUIRY">Enquiry</option>
                <option value="FEEDBACK">Feedback</option>
                <option value="VISITOR">Visitor</option>
                <option value="LEAVE">Leave</option>
                <option value="COMPLAINT">Complaint</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview Mode */}
        {showPreview ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{formName || "Untitled Form"}</h2>
            {formDescription && <p className="text-sm text-gray-500 mb-6">{formDescription}</p>}
            <div className="space-y-5">
              {fields.map((field) => (
                <div key={field.id} className={field.width === "HALF" ? "w-1/2 inline-block pr-2" : "w-full"}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderPreviewField(field)}
                  {field.helpText && (
                    <p className="text-xs text-gray-400 mt-1">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>
            {fields.length > 0 && (
              <button className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Submit
              </button>
            )}
            {fields.length === 0 && (
              <p className="text-center text-gray-400 py-8">No fields added yet. Switch to Edit mode to add fields.</p>
            )}
          </div>
        ) : (
          /* Builder Mode */
          <div className="grid grid-cols-12 gap-4">
            {/* Left: Field Types Panel */}
            <div className="col-span-12 md:col-span-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 sticky top-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Add Fields</h3>
                {["Basic", "Choice", "Advanced"].map((category) => (
                  <div key={category} className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{category}</p>
                    <div className="space-y-1.5">
                      {FIELD_TYPES.filter((f) => f.category === category).map((fieldType) => (
                        <button
                          key={fieldType.type}
                          onClick={() => addField(fieldType.type)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                        >
                          <fieldType.icon size={15} />
                          {fieldType.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Fields List */}
            <div className="col-span-12 md:col-span-5">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 min-h-[400px]">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Form Fields ({fields.length})
                </h3>
                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText size={40} className="text-gray-300 mb-3" />
                    <p className="text-gray-400 text-sm">Click field types on the left to add them</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                          selectedFieldId === field.id
                            ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 dark:border-indigo-700"
                            : "border-gray-100 dark:border-slate-700 hover:border-gray-200"
                        }`}
                      >
                        <GripVertical size={14} className="text-gray-300 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {field.label}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {field.type} {field.required && "• Required"} {field.width === "HALF" && "• Half width"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveField(index, "up"); }}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveField(index, "down"); }}
                            disabled={index === fields.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); duplicateField(field); }}
                            className="p-1 text-gray-400 hover:text-indigo-600"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Field Properties */}
            <div className="col-span-12 md:col-span-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 sticky top-4">
                {selectedField ? (
                  <>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Settings size={15} /> Field Properties
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                        <input
                          type="text"
                          value={selectedField.label}
                          onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Placeholder</label>
                        <input
                          type="text"
                          value={selectedField.placeholder}
                          onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Help Text</label>
                        <input
                          type="text"
                          value={selectedField.helpText}
                          onChange={(e) => updateField(selectedField.id, { helpText: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedField.required}
                            onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                          />
                          <span className="text-gray-700 dark:text-gray-300">Required</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedField.width === "HALF"}
                            onChange={(e) => updateField(selectedField.id, { width: e.target.checked ? "HALF" : "FULL" })}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                          />
                          <span className="text-gray-700 dark:text-gray-300">Half width</span>
                        </label>
                      </div>

                      {/* Options for choice fields */}
                      {["SELECT", "MULTI_SELECT", "RADIO", "CHECKBOX"].includes(selectedField.type) && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2">Options</label>
                          {selectedField.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2 mb-1.5">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...selectedField.options];
                                  newOptions[idx] = e.target.value;
                                  updateField(selectedField.id, { options: newOptions });
                                }}
                                className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                              <button
                                onClick={() => {
                                  const newOptions = selectedField.options.filter((_, i) => i !== idx);
                                  updateField(selectedField.id, { options: newOptions });
                                }}
                                className="text-red-400 hover:text-red-600 p-1"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              updateField(selectedField.id, {
                                options: [...selectedField.options, `Option ${selectedField.options.length + 1}`],
                              });
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1 flex items-center gap-1"
                          >
                            <Plus size={12} /> Add Option
                          </button>
                        </div>
                      )}

                      {/* Validation */}
                      {["TEXT", "TEXTAREA", "EMAIL", "PHONE"].includes(selectedField.type) && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Min Length</label>
                            <input
                              type="number"
                              value={selectedField.validation.minLength || ""}
                              onChange={(e) =>
                                updateField(selectedField.id, {
                                  validation: { ...selectedField.validation, minLength: parseInt(e.target.value) || undefined },
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Max Length</label>
                            <input
                              type="number"
                              value={selectedField.validation.maxLength || ""}
                              onChange={(e) =>
                                updateField(selectedField.id, {
                                  validation: { ...selectedField.validation, maxLength: parseInt(e.target.value) || undefined },
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                      {selectedField.type === "NUMBER" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Min Value</label>
                            <input
                              type="number"
                              value={selectedField.validation.min || ""}
                              onChange={(e) =>
                                updateField(selectedField.id, {
                                  validation: { ...selectedField.validation, min: parseInt(e.target.value) || undefined },
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Max Value</label>
                            <input
                              type="number"
                              value={selectedField.validation.max || ""}
                              onChange={(e) =>
                                updateField(selectedField.id, {
                                  validation: { ...selectedField.validation, max: parseInt(e.target.value) || undefined },
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Settings size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">Select a field to edit its properties</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════ LIST VIEW ════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Form Builder</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create dynamic forms for admissions, enquiries, feedback and more
          </p>
        </div>
        <button
          onClick={() => {
            resetBuilder();
            setView("builder");
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span className="font-medium">Create Form</span>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<FileText size={22} />} label="Total Forms" value={stats.totalForms} color="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" />
          <StatCard icon={<Send size={22} />} label="Published" value={stats.publishedForms} color="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" />
          <StatCard icon={<BarChart3 size={22} />} label="Total Submissions" value={stats.totalSubmissions} color="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
          <StatCard icon={<Clock size={22} />} label="Today" value={stats.todaySubmissions} color="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" />
        </div>
      )}

      {/* Forms List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Your Forms</h3>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-slate-700">
          {forms.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No forms created yet</p>
              <button
                onClick={() => {
                  resetBuilder();
                  setView("builder");
                }}
                className="mt-3 text-indigo-600 text-sm font-medium hover:underline"
              >
                Create your first form →
              </button>
            </div>
          ) : (
            forms.map((form) => (
              <div key={form.id} className="p-5 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{form.name}</h4>
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                          form.isPublished
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {form.isPublished ? "Published" : "Draft"}
                      </span>
                      {form.module && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 font-medium">
                          {form.module}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(form.fields || []).length} fields •{" "}
                      {form._count?.submissions || 0} submissions •{" "}
                      Created {new Date(form.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewSubmissions(form)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      Responses
                    </button>
                    <button
                      onClick={() => handleEditForm(form)}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handlePublish(form.id, !form.isPublished)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                        form.isPublished
                          ? "text-amber-600 border border-amber-200 hover:bg-amber-50"
                          : "text-green-600 border border-green-200 hover:bg-green-50"
                      }`}
                    >
                      {form.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => handleDelete(form.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ══════════════════════════════════════════════════════════

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function renderPreviewField(field: FormField) {
  const baseClass = "w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white";

  switch (field.type) {
    case "TEXT":
    case "EMAIL":
    case "PHONE":
      return <input type={field.type.toLowerCase()} placeholder={field.placeholder || field.label} className={baseClass} disabled />;
    case "NUMBER":
      return <input type="number" placeholder={field.placeholder || "0"} className={baseClass} disabled />;
    case "DATE":
      return <input type="date" className={baseClass} disabled />;
    case "TEXTAREA":
      return <textarea placeholder={field.placeholder || field.label} rows={3} className={`${baseClass} resize-none`} disabled />;
    case "SELECT":
      return (
        <select className={baseClass} disabled>
          <option>{field.placeholder || "Select..."}</option>
          {field.options.map((opt, i) => (
            <option key={i}>{opt}</option>
          ))}
        </select>
      );
    case "MULTI_SELECT":
      return (
        <div className="space-y-1">
          {field.options.map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" disabled />
              {opt}
            </label>
          ))}
        </div>
      );
    case "RADIO":
      return (
        <div className="space-y-1">
          {field.options.map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="radio" name={field.id} className="w-4 h-4 text-indigo-600" disabled />
              {opt}
            </label>
          ))}
        </div>
      );
    case "CHECKBOX":
      return (
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" disabled />
          {field.label}
        </label>
      );
    case "FILE":
    case "IMAGE":
      return (
        <div className="border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-lg p-4 text-center">
          <Upload size={20} className="mx-auto text-gray-400 mb-1" />
          <p className="text-xs text-gray-400">Click or drag to upload {field.type === "IMAGE" ? "image" : "file"}</p>
        </div>
      );
    default:
      return <input type="text" placeholder={field.placeholder} className={baseClass} disabled />;
  }
}
