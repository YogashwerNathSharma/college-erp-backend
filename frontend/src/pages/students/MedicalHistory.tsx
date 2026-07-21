import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Heart,
  Plus,
  X,
  Save,
  AlertCircle,
  Pill,
  ShieldAlert,
  Phone,
  Building2,
  CalendarCheck,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { PageHeader, LoadingSkeleton } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type MedicalData = {
  conditions: string[];
  allergies: string[];
  medications: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    alternatePhone: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    validTill: string;
  };
  lastCheckup: {
    date: string;
    doctor: string;
    notes: string;
  };
  bloodGroup: string;
  height: string;
  weight: string;
  vision: string;
};

const EMPTY_MEDICAL: MedicalData = {
  conditions: [],
  allergies: [],
  medications: [],
  emergencyContact: { name: "", relationship: "", phone: "", alternatePhone: "" },
  insurance: { provider: "", policyNumber: "", validTill: "" },
  lastCheckup: { date: "", doctor: "", notes: "" },
  bloodGroup: "",
  height: "",
  weight: "",
  vision: "",
};

// ═══════════════════════════════════════════════════════════════
// CHIP INPUT COMPONENT
// ═══════════════════════════════════════════════════════════════

function ChipInput({
  label,
  icon,
  items,
  onAdd,
  onRemove,
  placeholder,
  chipColor,
}: {
  label: string;
  icon: React.ReactNode;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  chipColor: string;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !items.includes(trimmed)) {
      onAdd(trimmed);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-slate-500 dark:text-slate-400">{icon}</div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{label}</h3>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
        {items.map((item, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${chipColor}`}
          >
            {item}
            <button
              onClick={() => onRemove(idx)}
              className="hover:opacity-70 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span className="text-sm text-slate-400 dark:text-slate-500 italic">
            None added
          </span>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function MedicalHistory() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<MedicalData>(EMPTY_MEDICAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  // ─── Load Data ───────────────────────────────────────────────

  useEffect(() => {
    const fetchMedical = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/students/${id}/medical`, authHeaders);
        setData({ ...EMPTY_MEDICAL, ...(response.data.medical || response.data) });
      } catch (error: any) {
        if (error.response?.status !== 404) {
          toast.error(error.response?.data?.message || "Failed to load medical data");
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMedical();
  }, [id]);

  // ─── Save ────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/students/${id}/medical`, data, authHeaders);
      toast.success("Medical information saved successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────

  const addItem = (field: "conditions" | "allergies" | "medications", item: string) => {
    setData((prev) => ({ ...prev, [field]: [...prev[field], item] }));
  };

  const removeItem = (field: "conditions" | "allergies" | "medications", index: number) => {
    setData((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const updateEmergency = (key: keyof MedicalData["emergencyContact"], value: string) => {
    setData((prev) => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [key]: value },
    }));
  };

  const updateInsurance = (key: keyof MedicalData["insurance"], value: string) => {
    setData((prev) => ({
      ...prev,
      insurance: { ...prev.insurance, [key]: value },
    }));
  };

  const updateCheckup = (key: keyof MedicalData["lastCheckup"], value: string) => {
    setData((prev) => ({
      ...prev,
      lastCheckup: { ...prev.lastCheckup, [key]: value },
    }));
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <LoadingSkeleton variant="card" count={6} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Medical History"
        subtitle="View and manage student health information"
        icon={<Heart className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Students", path: "/students" },
          { label: "Profile", path: `/students/${id}` },
          { label: "Medical History" },
        ]}
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        }
      />

      {/* Basic Health Info */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Blood Group
          </label>
          <input
            type="text"
            value={data.bloodGroup}
            onChange={(e) => setData({ ...data, bloodGroup: e.target.value })}
            placeholder="e.g. O+"
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Height (cm)
          </label>
          <input
            type="text"
            value={data.height}
            onChange={(e) => setData({ ...data, height: e.target.value })}
            placeholder="e.g. 145"
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Weight (kg)
          </label>
          <input
            type="text"
            value={data.weight}
            onChange={(e) => setData({ ...data, weight: e.target.value })}
            placeholder="e.g. 42"
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Vision
          </label>
          <input
            type="text"
            value={data.vision}
            onChange={(e) => setData({ ...data, vision: e.target.value })}
            placeholder="e.g. 6/6"
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Chip Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ChipInput
          label="Medical Conditions"
          icon={<AlertCircle className="w-4 h-4" />}
          items={data.conditions}
          onAdd={(item) => addItem("conditions", item)}
          onRemove={(idx) => removeItem("conditions", idx)}
          placeholder="Add condition"
          chipColor="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        />
        <ChipInput
          label="Allergies"
          icon={<ShieldAlert className="w-4 h-4" />}
          items={data.allergies}
          onAdd={(item) => addItem("allergies", item)}
          onRemove={(idx) => removeItem("allergies", idx)}
          placeholder="Add allergy"
          chipColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        />
        <ChipInput
          label="Medications"
          icon={<Pill className="w-4 h-4" />}
          items={data.medications}
          onAdd={(item) => addItem("medications", item)}
          onRemove={(idx) => removeItem("medications", idx)}
          placeholder="Add medication"
          chipColor="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
        />
      </div>

      {/* Emergency Contact */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-red-500" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Emergency Contact
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Contact Name
            </label>
            <input
              type="text"
              value={data.emergencyContact.name}
              onChange={(e) => updateEmergency("name", e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Relationship
            </label>
            <input
              type="text"
              value={data.emergencyContact.relationship}
              onChange={(e) => updateEmergency("relationship", e.target.value)}
              placeholder="e.g. Father, Mother, Guardian"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={data.emergencyContact.phone}
              onChange={(e) => updateEmergency("phone", e.target.value)}
              placeholder="Primary phone"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Alternate Phone
            </label>
            <input
              type="tel"
              value={data.emergencyContact.alternatePhone}
              onChange={(e) => updateEmergency("alternatePhone", e.target.value)}
              placeholder="Alternate phone"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Insurance & Last Checkup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insurance */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Insurance
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Provider
              </label>
              <input
                type="text"
                value={data.insurance.provider}
                onChange={(e) => updateInsurance("provider", e.target.value)}
                placeholder="Insurance company name"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Policy Number
              </label>
              <input
                type="text"
                value={data.insurance.policyNumber}
                onChange={(e) => updateInsurance("policyNumber", e.target.value)}
                placeholder="Policy/ID number"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Valid Till
              </label>
              <input
                type="date"
                value={data.insurance.validTill}
                onChange={(e) => updateInsurance("validTill", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Last Checkup */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Last Checkup
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={data.lastCheckup.date}
                onChange={(e) => updateCheckup("date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Doctor
              </label>
              <input
                type="text"
                value={data.lastCheckup.doctor}
                onChange={(e) => updateCheckup("doctor", e.target.value)}
                placeholder="Doctor's name"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Notes
              </label>
              <textarea
                value={data.lastCheckup.notes}
                onChange={(e) => updateCheckup("notes", e.target.value)}
                rows={3}
                placeholder="Checkup notes"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
