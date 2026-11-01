import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package, Check, X, ArrowLeft, Save, Shield, RefreshCw,
  Users, BookOpen, IndianRupee, Bus, Library, BedDouble,
  ClipboardCheck, FileText, UserCog, CalendarClock, Activity,
  Brush, BarChart3, HelpCircle, MessageSquare, CalendarDays,
  Award, FolderOpen, IdCard, DoorOpen, LayoutDashboard,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { getFullUrl } from "../../utils/url";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface ModuleWithStatus {
  id: string;
  slug: string;
  name: string;
  icon: string;
  category: string;
  isCore: boolean;
  isAssigned: boolean;
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Users, UserCog, ClipboardCheck, FileText,
  IndianRupee, Bus, Library, BedDouble, Package, DoorOpen,
  MessageSquare, CalendarDays, Award, FolderOpen, IdCard,
  Activity, Brush, BarChart3, HelpCircle, CalendarClock, BookOpen,
  Shield,
};

const getIcon = (iconName: string, size = 20) => {
  const Icon = ICON_MAP[iconName] || Package;
  return <Icon size={size} />;
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  Core: "bg-gray-700 text-gray-300",
  Academic: "bg-blue-900/50 text-blue-300",
  Finance: "bg-green-900/50 text-green-300",
  Operations: "bg-orange-900/50 text-orange-300",
  HR: "bg-purple-900/50 text-purple-300",
  Communication: "bg-cyan-900/50 text-cyan-300",
  Documents: "bg-yellow-900/50 text-yellow-300",
  Tools: "bg-indigo-900/50 text-indigo-300",
  Design: "bg-pink-900/50 text-pink-300",
  Support: "bg-red-900/50 text-red-300",
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function TenantModuleAssignment() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  const [modules, setModules] = useState<ModuleWithStatus[]>([]);
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalState, setOriginalState] = useState<Record<string, boolean>>({});

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ─── Fetch modules with tenant status ─────────────────
  const fetchModules = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      // Fetch modules with tenant assignment status
      const res = await axios.get(
        getFullUrl(`/api/modules/tenant-status/${tenantId}`),
        { headers }
      );
      const data = res.data?.data || [];
      setModules(data);

      // Save original state for change detection
      const orig: Record<string, boolean> = {};
      data.forEach((m: ModuleWithStatus) => { orig[m.id] = m.isAssigned; });
      setOriginalState(orig);
      setHasChanges(false);

      // Fetch tenant name
      try {
        const tenantRes = await axios.get(
          getFullUrl(`/api/super-admin/tenants/${tenantId}`),
          { headers }
        );
        setTenantName(tenantRes.data?.data?.name || tenantRes.data?.name || "Tenant");
      } catch {
        setTenantName("Tenant");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load modules");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  // ─── Toggle module ─────────────────────────────────────
  const toggleModule = (moduleId: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId && !m.isCore
          ? { ...m, isAssigned: !m.isAssigned }
          : m
      )
    );
    // Check if anything changed
    setHasChanges(true);
  };

  // ─── Select All / Deselect All ─────────────────────────
  const selectAll = () => {
    setModules((prev) => prev.map((m) => ({ ...m, isAssigned: true })));
    setHasChanges(true);
  };

  const deselectAll = () => {
    setModules((prev) =>
      prev.map((m) => m.isCore ? m : { ...m, isAssigned: false })
    );
    setHasChanges(true);
  };

  // ─── Save assignments ─────────────────────────────────
  const saveAssignments = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      const assignedSlugs = modules
        .filter((m) => m.isAssigned && !m.isCore)
        .map((m) => m.slug);

      await axios.post(
        getFullUrl("/api/modules/assign"),
        { tenantId, modules: assignedSlugs },
        { headers }
      );

      toast.success(`Modules updated for ${tenantName}`);
      setHasChanges(false);

      // Update original state
      const orig: Record<string, boolean> = {};
      modules.forEach((m) => { orig[m.id] = m.isAssigned; });
      setOriginalState(orig);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ─── Group by category ─────────────────────────────────
  const categories = [...new Set(modules.map((m) => m.category))];
  const assignedCount = modules.filter((m) => m.isAssigned).length;
  const totalCount = modules.length;

  // ─── RENDER ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-700 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Module Assignment
            </h1>
            <p className="text-gray-400 mt-1">
              <span className="text-teal-400 font-semibold">{tenantName}</span>
              {" — "}Select which modules this tenant can access
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {assignedCount} / {totalCount} modules
          </span>
          <button
            onClick={fetchModules}
            className="p-2 rounded-lg hover:bg-gray-700 transition"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={saveAssignments}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              hasChanges
                ? "bg-teal-600 hover:bg-teal-700 text-white"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={selectAll}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
        >
          Select All
        </button>
        <button
          onClick={deselectAll}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
        >
          Deselect All
        </button>
      </div>

      {/* Module grid by category */}
      {categories.map((category) => {
        const categoryModules = modules.filter((m) => m.category === category);
        const catAssigned = categoryModules.filter((m) => m.isAssigned).length;

        return (
          <div key={category} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded ${
                  CATEGORY_COLORS[category] || "bg-gray-700 text-gray-300"
                }`}
              >
                {category}
              </span>
              <span className="text-xs text-gray-500">
                {catAssigned}/{categoryModules.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => toggleModule(mod.id)}
                  disabled={mod.isCore}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    mod.isCore
                      ? "border-gray-600 bg-gray-800/50 opacity-70 cursor-not-allowed"
                      : mod.isAssigned
                      ? "border-teal-500/50 bg-teal-900/20 hover:bg-teal-900/30"
                      : "border-gray-700 bg-gray-800 hover:bg-gray-750 hover:border-gray-600"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`p-2 rounded-lg ${
                      mod.isAssigned
                        ? "bg-teal-900/40 text-teal-400"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {getIcon(mod.icon)}
                  </div>

                  {/* Name */}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white text-sm">
                      {mod.name}
                    </div>
                    {mod.isCore && (
                      <span className="text-xs text-gray-500">
                        Always enabled
                      </span>
                    )}
                  </div>

                  {/* Toggle indicator */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      mod.isAssigned
                        ? "bg-teal-500 text-white"
                        : "bg-gray-700 text-gray-500"
                    }`}
                  >
                    {mod.isAssigned ? <Check size={14} /> : <X size={14} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-yellow-900/90 text-yellow-200 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50">
          <span>⚠️ You have unsaved changes</span>
          <button
            onClick={saveAssignments}
            disabled={saving}
            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm"
          >
            {saving ? "Saving..." : "Save Now"}
          </button>
        </div>
      )}
    </div>
  );
}
