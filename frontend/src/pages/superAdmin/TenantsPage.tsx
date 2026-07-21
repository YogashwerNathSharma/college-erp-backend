
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Building2,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Eye,
  Copy,
  UserCog,
  RotateCcw,
  Activity,
  X,
  Upload,
  School,
  GraduationCap,
  Users,
  HardDrive,
  Shield,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Clock,
} from "lucide-react";
import {
  DataTable,
  PageHeader,
  StatsCard,
  ConfirmDialog,
  StatusBadge,
  ActivityTimeline,
} from "../../components/enterprise";
import type { Column } from "../../components/enterprise";
import { getFullUrl } from "../../utils/url";

// ══════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════

type Tenant = {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  backgroundUrl: string | null;
  isActive: boolean;
  isDeleted?: boolean;
  maxStudents: number;
  maxTeachers: number;
  maxAdmins: number;
  maxStorageInGB: number;
  createdAt: string;
  _count?: {
    students: number;
    teachers: number;
    users: number;
    classes?: number;
    sections?: number;
  };
};

type TabKey = "all" | "active" | "suspended" | "deleted";

// ══════════════════════════════════════════════════════
// CREATE/EDIT TENANT MODAL
// ══════════════════════════════════════════════════════

function TenantFormModal({
  open,
  onClose,
  onSuccess,
  editingTenant,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTenant: Tenant | null;
}) {
  const [form, setForm] = useState({
    name: "",
    type: "SCHOOL",
    email: "",
    phone: "",
    address: "",
    maxStudents: "100",
    maxTeachers: "20",
    maxAdmins: "5",
    maxStorageInGB: "5",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingTenant) {
      setForm({
        name: editingTenant.name || "",
        type: editingTenant.type || "SCHOOL",
        email: editingTenant.email || "",
        phone: editingTenant.phone || "",
        address: editingTenant.address || "",
        maxStudents: String(editingTenant.maxStudents || 100),
        maxTeachers: String(editingTenant.maxTeachers || 20),
        maxAdmins: String(editingTenant.maxAdmins || 5),
        maxStorageInGB: String(editingTenant.maxStorageInGB || 5),
      });
      setLogoPreview(editingTenant.logoUrl ? getFullUrl(editingTenant.logoUrl) || null : null);
      setBgPreview(editingTenant.backgroundUrl ? getFullUrl(editingTenant.backgroundUrl) || null : null);
    } else {
      setForm({
        name: "",
        type: "SCHOOL",
        email: "",
        phone: "",
        address: "",
        maxStudents: "100",
        maxTeachers: "20",
        maxAdmins: "5",
        maxStorageInGB: "5",
      });
      setLogoPreview(null);
      setBgPreview(null);
    }
    setLogoFile(null);
    setBackgroundFile(null);
  }, [editingTenant, open]);

  const handleFileChange = (field: "logo" | "background", file: File | null) => {
    if (!file) return;
    if (field === "logo") {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setBackgroundFile(file);
      setBgPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Tenant name is required");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("type", form.type);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      formData.append("maxStudents", form.maxStudents);
      formData.append("maxTeachers", form.maxTeachers);
      formData.append("maxAdmins", form.maxAdmins);
      formData.append("maxStorageInGB", form.maxStorageInGB);
      if (logoFile) formData.append("logo", logoFile);
      if (backgroundFile) formData.append("background", backgroundFile);

      if (editingTenant) {
        await axios.put(`/api/super-admin/tenants/${editingTenant.id}`, formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        toast.success("Tenant updated successfully");
      } else {
        const res = await axios.post("/api/super-admin/tenants", formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        const admin = res.data.admin;
        toast.success(`Tenant created! Admin: ${admin?.email}`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingTenant ? "Edit Tenant" : "Create New Tenant"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {editingTenant ? "Update institution details" : "Register a new institution"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Institution Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Springfield Academy"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="SCHOOL">School</option>
                  <option value="COLLEGE">College</option>
                  <option value="UNIVERSITY">University</option>
                  <option value="COACHING">Coaching Institute</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@school.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="123 Education Lane, City"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Limits */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
              Resource Limits
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max Students</label>
                <input
                  type="number"
                  value={form.maxStudents}
                  onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max Teachers</label>
                <input
                  type="number"
                  value={form.maxTeachers}
                  onChange={(e) => setForm({ ...form, maxTeachers: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max Admins</label>
                <input
                  type="number"
                  value={form.maxAdmins}
                  onChange={(e) => setForm({ ...form, maxAdmins: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Storage (GB)</label>
                <input
                  type="number"
                  value={form.maxStorageInGB}
                  onChange={(e) => setForm({ ...form, maxStorageInGB: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
              Branding
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Logo</label>
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain mx-auto rounded-lg" />
                  ) : (
                    <Upload className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  )}
                  <p className="text-xs text-slate-400 mt-2">Click to upload</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange("logo", e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Background */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Background</label>
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                  {bgPreview ? (
                    <img src={bgPreview} alt="Background" className="w-full h-16 object-cover mx-auto rounded-lg" />
                  ) : (
                    <Upload className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  )}
                  <p className="text-xs text-slate-400 mt-2">Click to upload</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange("background", e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {editingTenant ? "Update Tenant" : "Create Tenant"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// TENANT DETAIL PANEL (Slide-over)
// ══════════════════════════════════════════════════════

function TenantDetailPanel({
  tenant,
  onClose,
  onImpersonate,
  onClone,
  onViewActivity,
}: {
  tenant: Tenant | null;
  onClose: () => void;
  onImpersonate: (id: string) => void;
  onClone: (tenant: Tenant) => void;
  onViewActivity: (id: string) => void;
}) {
  if (!tenant) return null;

  const usageStudents = tenant._count?.students || 0;
  const usageTeachers = tenant._count?.teachers || 0;
  const usageUsers = tenant._count?.users || 0;

  const getUsagePercent = (used: number, max: number) => {
    if (max === 0) return 0;
    return Math.min(Math.round((used / max) * 100), 100);
  };

  return (
    <div className="fixed inset-0 z-[9998] flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header with background */}
        <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-purple-600">
          {tenant.backgroundUrl && (
            <img
              src={getFullUrl(tenant.backgroundUrl)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute -bottom-8 left-6">
            <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center overflow-hidden">
              {tenant.logoUrl ? (
                <img src={getFullUrl(tenant.logoUrl)} alt={tenant.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 px-6 pb-6 space-y-6">
          {/* Name & Status */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tenant.name}</h2>
              <StatusBadge
                label={tenant.isActive ? "Active" : "Suspended"}
                variant={tenant.isActive ? "success" : "danger"}
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{tenant.type.toLowerCase()}</p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onImpersonate(tenant.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            >
              <UserCog className="w-3.5 h-3.5" /> Impersonate
            </button>
            <button
              onClick={() => onClone(tenant)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> Clone
            </button>
            <button
              onClick={() => onViewActivity(tenant.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" /> Activity
            </button>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</h4>
            {tenant.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">{tenant.email}</span>
              </div>
            )}
            {tenant.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">{tenant.phone}</span>
              </div>
            )}
            {tenant.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">{tenant.address}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300">
                Created {new Date(tenant.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Resource Usage
            </h4>
            <div className="space-y-3">
              <UsageBar label="Students" used={usageStudents} max={tenant.maxStudents} color="indigo" />
              <UsageBar label="Teachers" used={usageTeachers} max={tenant.maxTeachers} color="emerald" />
              <UsageBar label="Users" used={usageUsers} max={tenant.maxAdmins} color="amber" />
              <UsageBar label="Storage" used={0} max={tenant.maxStorageInGB} color="cyan" suffix="GB" />
            </div>
          </div>

          {/* Capacity Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Students</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {usageStudents} <span className="text-xs font-normal text-slate-400">/ {tenant.maxStudents}</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Teachers</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {usageTeachers} <span className="text-xs font-normal text-slate-400">/ {tenant.maxTeachers}</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Admins</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {usageUsers} <span className="text-xs font-normal text-slate-400">/ {tenant.maxAdmins}</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="w-4 h-4 text-cyan-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Storage</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {tenant.maxStorageInGB} <span className="text-xs font-normal text-slate-400">GB</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// USAGE BAR COMPONENT
// ══════════════════════════════════════════════════════

function UsageBar({
  label,
  used,
  max,
  color,
  suffix = "",
}: {
  label: string;
  used: number;
  max: number;
  color: "indigo" | "emerald" | "amber" | "cyan";
  suffix?: string;
}) {
  const percent = max > 0 ? Math.min(Math.round((used / max) * 100), 100) : 0;
  const barColors = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    cyan: "bg-cyan-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">
          {used}{suffix} / {max}{suffix} ({percent}%)
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColors[color]} ${percent > 90 ? "animate-pulse" : ""}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// ACTIVITY LOG MODAL
// ══════════════════════════════════════════════════════

function ActivityLogModal({
  open,
  onClose,
  tenantId,
}: {
  open: boolean;
  onClose: () => void;
  tenantId: string | null;
}) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && tenantId) {
      fetchActivity();
    }
  }, [open, tenantId]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/super-admin/tenants/${tenantId}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawActivities = res.data.data?.activities || [];
      setActivities(
        rawActivities.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))
      );
    } catch {
      toast.error("Failed to load activity");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Activity Log</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <ActivityTimeline items={activities} loading={loading} title="" maxItems={20} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CLONE DIALOG
// ══════════════════════════════════════════════════════

function CloneDialog({
  open,
  onClose,
  tenant,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      setName(`${tenant.name} (Copy)`);
    }
  }, [tenant]);

  const handleClone = async () => {
    if (!tenant || !name.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `/api/super-admin/tenants/${tenant.id}/clone`,
        { name: name.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Tenant cloned! Admin: ${res.data.admin?.email}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Clone failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !tenant) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Copy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Clone Tenant</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cloning "{tenant.name}" with same settings
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            New Tenant Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new tenant name"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleClone}
            disabled={loading || !name.trim()}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Clone Tenant
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════════════════

export default function TenantsPage() {
  // Data state
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "info" | "success";
    onConfirm: () => void;
    confirmLabel?: string;
  }>({ open: false, title: "", message: "", variant: "danger", onConfirm: () => {} });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Clone dialog
  const [cloneTarget, setCloneTarget] = useState<Tenant | null>(null);
  const [showCloneDialog, setShowCloneDialog] = useState(false);

  // Activity log
  const [activityTenantId, setActivityTenantId] = useState<string | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);

  // ─────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/super-admin/tenants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenants(res.data.data || []);
    } catch {
      toast.error("Failed to fetch tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // ─────────────────────────────────────────────
  // FILTERED DATA
  // ─────────────────────────────────────────────

  const filteredTenants = useMemo(() => {
    switch (activeTab) {
      case "active":
        return tenants.filter((t) => t.isActive && !t.isDeleted);
      case "suspended":
        return tenants.filter((t) => !t.isActive && !t.isDeleted);
      case "deleted":
        return tenants.filter((t) => t.isDeleted);
      default:
        return tenants;
    }
  }, [tenants, activeTab]);

  // ─────────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter((t) => t.isActive && !t.isDeleted).length;
    const suspended = tenants.filter((t) => !t.isActive && !t.isDeleted).length;
    const totalStudents = tenants.reduce((sum, t) => sum + (t._count?.students || 0), 0);
    return { total, active, suspended, totalStudents };
  }, [tenants]);

  // ─────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────

  const handleToggleStatus = (tenant: Tenant) => {
    setConfirmDialog({
      open: true,
      title: tenant.isActive ? "Suspend Tenant" : "Activate Tenant",
      message: tenant.isActive
        ? `Are you sure you want to suspend "${tenant.name}"? Their users will lose access immediately.`
        : `Activate "${tenant.name}"? Their users will regain access.`,
      variant: tenant.isActive ? "warning" : "success",
      confirmLabel: tenant.isActive ? "Suspend" : "Activate",
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const token = localStorage.getItem("token");
          await axios.patch(`/api/super-admin/tenants/${tenant.id}/toggle-status`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success(`Tenant ${tenant.isActive ? "suspended" : "activated"}`);
          fetchTenants();
        } catch {
          toast.error("Failed to toggle status");
        } finally {
          setConfirmLoading(false);
          setConfirmDialog((p) => ({ ...p, open: false }));
        }
      },
    });
  };

  const handleDelete = (tenant: Tenant) => {
    setConfirmDialog({
      open: true,
      title: "Delete Tenant",
      message: `This will soft-delete "${tenant.name}". You can restore it later.`,
      variant: "danger",
      confirmLabel: "Delete",
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/super-admin/tenants/${tenant.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Tenant deleted");
          fetchTenants();
        } catch {
          toast.error("Failed to delete tenant");
        } finally {
          setConfirmLoading(false);
          setConfirmDialog((p) => ({ ...p, open: false }));
        }
      },
    });
  };

  const handleRestore = (tenant: Tenant) => {
    setConfirmDialog({
      open: true,
      title: "Restore Tenant",
      message: `Restore "${tenant.name}" and reactivate their account?`,
      variant: "info",
      confirmLabel: "Restore",
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const token = localStorage.getItem("token");
          await axios.post(`/api/super-admin/tenants/${tenant.id}/restore`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Tenant restored");
          fetchTenants();
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to restore");
        } finally {
          setConfirmLoading(false);
          setConfirmDialog((p) => ({ ...p, open: false }));
        }
      },
    });
  };

  const handleImpersonate = async (tenantId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`/api/super-admin/tenants/${tenantId}/impersonate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data;
      // Open admin panel in new tab with impersonated token
      const impersonateUrl = `/admin/dashboard?impersonate_token=${data.token}`;
      toast.success(`Impersonating ${data.tenant.name} as ${data.user.name}`);
      window.open(impersonateUrl, "_blank");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Impersonation failed");
    }
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    setConfirmDialog({
      open: true,
      title: "Bulk Delete",
      message: `Delete ${selectedIds.length} selected tenants? This is a soft delete.`,
      variant: "danger",
      confirmLabel: `Delete ${selectedIds.length}`,
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const token = localStorage.getItem("token");
          await Promise.all(
            selectedIds.map((id) =>
              axios.delete(`/api/super-admin/tenants/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            )
          );
          toast.success(`${selectedIds.length} tenants deleted`);
          fetchTenants();
        } catch {
          toast.error("Some deletions failed");
        } finally {
          setConfirmLoading(false);
          setConfirmDialog((p) => ({ ...p, open: false }));
        }
      },
    });
  };

  // ─────────────────────────────────────────────
  // TABLE COLUMNS
  // ─────────────────────────────────────────────

  const columns: Column<Tenant>[] = [
    {
      key: "name",
      label: "Institution",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
            {row.logoUrl ? (
              <img src={getFullUrl(row.logoUrl)} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{row.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{row.type.toLowerCase()}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact",
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{row.email || "—"}</p>
          <p className="text-xs text-slate-400">{row.phone || ""}</p>
        </div>
      ),
    },
    {
      key: "students",
      label: "Students",
      sortable: false,
      align: "center",
      render: (row) => (
        <div className="text-center">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {row._count?.students || 0}
          </span>
          <span className="text-xs text-slate-400"> / {row.maxStudents}</span>
        </div>
      ),
    },
    {
      key: "teachers",
      label: "Teachers",
      sortable: false,
      align: "center",
      render: (row) => (
        <div className="text-center">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {row._count?.teachers || 0}
          </span>
          <span className="text-xs text-slate-400"> / {row.maxTeachers}</span>
        </div>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (row) => (
        <StatusBadge
          label={row.isDeleted ? "Deleted" : row.isActive ? "Active" : "Suspended"}
          variant={row.isDeleted ? "danger" : row.isActive ? "success" : "warning"}
        />
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          {new Date(row.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setDetailTenant(row); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditingTenant(row); setShowCreateModal(true); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Edit"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            title={row.isActive ? "Suspend" : "Activate"}
          >
            {row.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          {row.isDeleted ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleRestore(row); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title="Restore"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ─────────────────────────────────────────────
  // TABS
  // ─────────────────────────────────────────────

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All Tenants", count: tenants.length },
    { key: "active", label: "Active", count: tenants.filter((t) => t.isActive && !t.isDeleted).length },
    { key: "suspended", label: "Suspended", count: tenants.filter((t) => !t.isActive && !t.isDeleted).length },
    { key: "deleted", label: "Deleted", count: tenants.filter((t) => t.isDeleted).length },
  ];

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Tenant Management"
        subtitle="Manage all registered institutions on the platform"
        icon={<Building2 className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", path: "/super-admin" },
          { label: "Tenants" },
        ]}
        actions={
          <button
            onClick={() => { setEditingTenant(null); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-200 dark:shadow-none transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Tenant
          </button>
        }
      />

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCard key={i} title="" value="" icon={<div />} loading />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Institutions"
            value={stats.total}
            icon={<Building2 className="w-5 h-5" />}
            color="indigo"
            subtitle="All registered tenants"
          />
          <StatsCard
            title="Active"
            value={stats.active}
            icon={<School className="w-5 h-5" />}
            color="emerald"
            subtitle="Currently operating"
          />
          <StatsCard
            title="Suspended"
            value={stats.suspended}
            icon={<Shield className="w-5 h-5" />}
            color="amber"
            subtitle="Access disabled"
          />
          <StatsCard
            title="Total Students"
            value={stats.totalStudents.toLocaleString()}
            icon={<GraduationCap className="w-5 h-5" />}
            color="purple"
            subtitle="Across all tenants"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              {tab.label}
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.key
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable<Tenant>
        columns={columns}
        data={filteredTenants}
        loading={loading}
        rowKey="id"
        searchPlaceholder="Search tenants by name, email, phone..."
        pageSize={10}
        emptyMessage="No tenants found"
        onRefresh={fetchTenants}
        onRowClick={(row) => setDetailTenant(row)}
        bulkActions={[
          {
            label: "Delete Selected",
            icon: <Trash2 className="w-4 h-4" />,
            variant: "danger",
            onClick: handleBulkDelete,
          },
        ]}
      />

      {/* ────────────────────────────── MODALS ────────────────────────────── */}

      {/* Create/Edit Modal */}
      <TenantFormModal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingTenant(null); }}
        onSuccess={fetchTenants}
        editingTenant={editingTenant}
      />

      {/* Detail Panel */}
      <TenantDetailPanel
        tenant={detailTenant}
        onClose={() => setDetailTenant(null)}
        onImpersonate={handleImpersonate}
        onClone={(t) => { setCloneTarget(t); setShowCloneDialog(true); }}
        onViewActivity={(id) => { setActivityTenantId(id); setShowActivityLog(true); }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((p) => ({ ...p, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.confirmLabel}
        loading={confirmLoading}
      />

      {/* Clone Dialog */}
      <CloneDialog
        open={showCloneDialog}
        onClose={() => { setShowCloneDialog(false); setCloneTarget(null); }}
        tenant={cloneTarget}
        onSuccess={fetchTenants}
      />

      {/* Activity Log Modal */}
      <ActivityLogModal
        open={showActivityLog}
        onClose={() => { setShowActivityLog(false); setActivityTenantId(null); }}
        tenantId={activityTenantId}
      />
    </div>
  );
}
