import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Palette,
  FileText,
  CreditCard,
  BookOpen,
  Layers,
  Trash2,
  Copy,
  Edit,
  MoreVertical,
  ClipboardList,
  Bell,
} from "lucide-react";
import { DesignTemplate, TEMPLATE_TYPES, TemplateType } from "../utils/templateTypes";

const API = import.meta.env.VITE_API_URL || "";

// For demo — in production this comes from auth context
const TENANT_ID = import.meta.env.VITE_TENANT_ID || "000000000000000000000000";

export default function Dashboard() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<TemplateType>("certificate");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/templates`, {
        params: { tenantId: TENANT_ID, type: filterType },
      });
      setTemplates(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [filterType]);

  const createTemplate = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    try {
      const res = await axios.post(`${API}/api/templates`, {
        name: newName.trim(),
        type: newType,
        tenantId: TENANT_ID,
        canvasJSON: {},
      });
      toast.success("Template created!");
      setShowCreateModal(false);
      setNewName("");
      navigate(`/editor/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create");
    }
  };

  const duplicateTemplate = async (id: string) => {
    try {
      await axios.post(`${API}/api/templates/${id}/duplicate`);
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
      await axios.delete(`${API}/api/templates/${id}`);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "certificate": return <FileText size={18} className="text-amber-500" />;
      case "id-card": return <CreditCard size={18} className="text-blue-500" />;
      case "report-card": return <BookOpen size={18} className="text-green-500" />;
      case "admit-card": return <ClipboardList size={18} className="text-pink-500" />;
      case "notification": return <Bell size={18} className="text-orange-500" />;
      default: return <Layers size={18} className="text-purple-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Palette size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">YN-UDP Designer</h1>
              <p className="text-xs text-gray-500">Visual Template Designer</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Template
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Type Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                filterType === "all" ? "bg-gray-900 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}
            >
              All
            </button>
            {TEMPLATE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setFilterType(t.value)}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                  filterType === t.value ? "text-white" : "bg-white text-gray-600 border hover:bg-gray-50"
                }`}
                style={filterType === t.value ? { backgroundColor: t.color } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-64 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading templates...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20">
            <Palette size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No templates found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first template to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group relative"
              >
                {/* Thumbnail */}
                <div
                  className="h-44 bg-gray-100 flex items-center justify-center cursor-pointer"
                  onClick={() => navigate(`/editor/${template.id}`)}
                >
                  {template.thumbnail ? (
                    <img src={template.thumbnail} alt={template.name} className="h-full w-full object-contain" />
                  ) : (
                    <div className="text-gray-300 text-center">
                      <Layers size={40} className="mx-auto mb-2" />
                      <span className="text-xs">No preview</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <span className="text-sm font-medium text-gray-700 truncate">{template.name}</span>
                    </div>
                    {/* Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === template.id ? null : template.id)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <MoreVertical size={16} className="text-gray-500" />
                      </button>
                      {menuOpen === template.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-20 w-36">
                          <button
                            onClick={() => { navigate(`/editor/${template.id}`); setMenuOpen(null); }}
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
                    {new Date(template.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[420px] p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Template</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Template Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Character Certificate"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && createTemplate()}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Type</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {TEMPLATE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setNewType(t.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        newType === t.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setNewName(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createTemplate}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create & Open Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
