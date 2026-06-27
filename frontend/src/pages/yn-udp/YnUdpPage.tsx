import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Palette,
  ExternalLink,
  Plus,
  FileText,
  CreditCard,
  BookOpen,
  Layers,
  Trash2,
  Copy,
  Edit,
  MoreVertical,
  Search,
  ClipboardList,
  Bell,
} from "lucide-react";

// Auto-detect: use Render URL in production, localhost in development
const YN_UDP_BASE = window.location.hostname !== "localhost"
  ? "https://yn-udp.onrender.com"
  : "http://localhost:5001";

const YN_UDP_API = `${YN_UDP_BASE}/api`;
const YN_UDP_CLIENT = window.location.hostname !== "localhost"
  ? "https://yn-udp.onrender.com"
  : "http://localhost:5173";

// Get tenant ID from auth
const getTenantId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.tenantId || "000000000000000000000000";
  } catch {
    return "000000000000000000000000";
  }
};

interface Template {
  id: string;
  name: string;
  type: string;
  category?: string;
  thumbnail?: string;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

const TABS = [
  { key: "all", label: "All", icon: <Layers size={15} />, color: "#6366f1" },
  { key: "certificate", label: "Certificates", icon: <FileText size={15} />, color: "#f59e0b" },
  { key: "id-card", label: "ID Cards", icon: <CreditCard size={15} />, color: "#3b82f6" },
  { key: "report-card", label: "Report Cards", icon: <BookOpen size={15} />, color: "#10b981" },
  { key: "admit-card", label: "Admit Cards", icon: <ClipboardList size={15} />, color: "#ec4899" },
  { key: "notification", label: "Notifications", icon: <Bell size={15} />, color: "#f97316" },
  { key: "custom", label: "Custom", icon: <Palette size={15} />, color: "#8b5cf6" },
];

export default function YnUdpPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState(true);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const tenantId = getTenantId();
      let res = await axios.get(`${YN_UDP_API}/templates`, {
        params: { tenantId, type: activeTab },
      });
      let data = res.data.data || [];
      // If no templates found with actual tenantId, try default tenantId
      if (data.length === 0 && tenantId !== "000000000000000000000000") {
        const fallbackRes = await axios.get(`${YN_UDP_API}/templates`, {
          params: { tenantId: "000000000000000000000000", type: activeTab },
        });
        data = fallbackRes.data.data || [];
      }
      setTemplates(data);
      setServerOnline(true);
    } catch (err: any) {
      if (err.code === "ERR_NETWORK") {
        setServerOnline(false);
      } else {
        toast.error("Failed to load templates");
      }
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [activeTab]);

  const openEditor = (templateId?: string) => {
    const url = templateId
      ? `${YN_UDP_CLIENT}/editor/${templateId}`
      : YN_UDP_CLIENT;
    window.open(url, "_blank");
  };

  const duplicateTemplate = async (id: string) => {
    try {
      await axios.post(`${YN_UDP_API}/templates/${id}/duplicate`);
      toast.success("Template duplicated!");
      fetchTemplates();
    } catch (err) {
      toast.error("Failed to duplicate");
    }
    setMenuOpen(null);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await axios.delete(`${YN_UDP_API}/templates/${id}`);
      toast.success("Template deleted");
      fetchTemplates();
    } catch (err) {
      toast.error("Failed to delete");
    }
    setMenuOpen(null);
  };

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    const tab = TABS.find((t) => t.key === type);
    return tab?.color || "#6366f1";
  };

  // Server offline state
  if (!serverOnline) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Palette size={28} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Designer Server Offline</h2>
          <p className="text-gray-500 text-sm mb-6">
            YN-UDP Designer server is not running on port 5001.
            <br />Start it with: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">cd yn-udp/server && npm run dev</code>
          </p>
          <button
            onClick={() => { setServerOnline(true); fetchTemplates(); }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Designer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage saved certificates, ID cards, and report card templates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Template
            <ExternalLink size={13} className="opacity-60" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          {/* Tab Buttons */}
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                  activeTab === tab.key
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={activeTab === tab.key ? { backgroundColor: tab.color } : {}}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 w-48 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-400 outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-500 text-sm">Loading templates...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <Palette size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                {search ? "No templates match your search" : "No templates yet"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Open the designer to create your first {activeTab !== "all" ? activeTab.replace("-", " ") : ""} template
              </p>
              <button
                onClick={() => openEditor()}
                className="mt-4 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
              >
                Open Designer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all group relative"
                >
                  {/* Thumbnail */}
                  <div
                    className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center cursor-pointer overflow-hidden rounded-t-xl"
                    onClick={() => openEditor(template.id)}
                  >
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <div
                          className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2"
                          style={{ backgroundColor: `${getTypeColor(template.type)}20` }}
                        >
                          {template.type === "certificate" && <FileText size={20} style={{ color: getTypeColor(template.type) }} />}
                          {template.type === "id-card" && <CreditCard size={20} style={{ color: getTypeColor(template.type) }} />}
                          {template.type === "report-card" && <BookOpen size={20} style={{ color: getTypeColor(template.type) }} />}
                          {template.type === "admit-card" && <ClipboardList size={20} style={{ color: getTypeColor(template.type) }} />}
                          {template.type === "notification" && <Bell size={20} style={{ color: getTypeColor(template.type) }} />}
                          {template.type === "custom" && <Palette size={20} style={{ color: getTypeColor(template.type) }} />}
                        </div>
                        <span className="text-xs text-gray-400">No preview</span>
                      </div>
                    )}
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: getTypeColor(template.type) }}
                    >
                      {template.type.replace("-", " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 truncate flex-1">
                        {template.name}
                      </span>
                      {/* Actions Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === template.id ? null : template.id); }}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <MoreVertical size={16} className="text-gray-500" />
                        </button>
                        {menuOpen === template.id && (
                          <div className="absolute right-0 top-7 bg-white border rounded-lg shadow-xl py-1 z-20 w-36">
                            <button
                              onClick={() => { openEditor(template.id); setMenuOpen(null); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              onClick={() => duplicateTemplate(template.id)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Copy size={14} /> Duplicate
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Updated {new Date(template.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
