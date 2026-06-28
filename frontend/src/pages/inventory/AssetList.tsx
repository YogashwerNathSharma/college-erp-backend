import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  IndianRupee,
  BarChart3,
  Users,
  ShieldCheck,
  MapPin,
  Calendar,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Condition = "NEW" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";
type AssetStatus = "AVAILABLE" | "ISSUED" | "MAINTENANCE" | "DISPOSED";

interface Asset {
  id: string;
  name: string;
  assetCode: string;
  category: string;
  serialNumber: string;
  location: string;
  condition: Condition;
  status: AssetStatus;
  purchaseDate: string;
  purchasePrice: number;
  assignedTo?: string;
  quantity: number;
  description?: string;
  warranty?: string;
}

interface AssetStats {
  total: number;
  totalValue: number;
  goodConditionPct: number;
  assigned: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES = ["FURNITURE", "ELECTRONICS", "SPORTS", "LAB", "LIBRARY", "IT_EQUIPMENT", "VEHICLE", "OTHER"];
const CONDITIONS: Condition[] = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"];
const LOCATIONS = ["Main Building", "Science Lab", "Computer Lab", "Library", "Sports Room", "Admin Office", "Auditorium", "Playground"];

const CONDITION_COLORS: Record<Condition, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  GOOD: "bg-green-50 text-green-700 border-green-200",
  FAIR: "bg-yellow-50 text-yellow-700 border-yellow-200",
  POOR: "bg-red-50 text-red-700 border-red-200",
  DAMAGED: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_COLORS: Record<AssetStatus, string> = {
  AVAILABLE: "bg-green-50 text-green-700",
  ISSUED: "bg-blue-50 text-blue-700",
  MAINTENANCE: "bg-yellow-50 text-yellow-700",
  DISPOSED: "bg-gray-100 text-gray-500",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ─── Toast Component ─────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
        type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
      }`}>
        {type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={14} /></button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState<AssetStats>({ total: 0, totalValue: 0, goodConditionPct: 0, assigned: 0 });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ─── Fetch Assets ──────────────────────────────────────────────────────────
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (filterCategory) params.category = filterCategory;
      if (filterCondition) params.condition = filterCondition;
      if (filterLocation) params.location = filterLocation;

      const res = await axios.get("/api/inventory/assets", { headers, params });
      const rawData = res.data?.data || {};
      const data = Array.isArray(rawData) ? rawData : (rawData.assets || []);
      setAssets(data);

      // Calculate stats
      const total = data.length;
      const totalValue = data.reduce((sum: number, a: Asset) => sum + (a.purchasePrice || 0), 0);
      const goodCount = data.filter((a: Asset) => ["NEW", "GOOD"].includes(a.condition)).length;
      const assignedCount = data.filter((a: Asset) => a.status === "ISSUED" || a.assignedTo).length;
      setStats({
        total,
        totalValue,
        goodConditionPct: total > 0 ? Math.round((goodCount / total) * 100) : 0,
        assigned: assignedCount,
      });
    } catch {
      setToast({ message: "Failed to load assets", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterCategory, filterCondition, filterLocation]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/inventory/assets/${id}`, { headers });
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setToast({ message: "Asset deleted", type: "success" });
    } catch {
      setToast({ message: "Failed to delete asset", type: "error" });
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="page-container space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Package className="text-indigo-600" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Asset Inventory</h1>
            <p className="text-sm text-gray-500">Manage all institutional assets</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingAsset(null); setShowAddModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
        >
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-lg">
              <Package size={20} className="text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="p-2.5 bg-green-50 rounded-lg">
              <IndianRupee size={20} className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Good Condition</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.goodConditionPct}%</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <ShieldCheck size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Assigned</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.assigned}</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or serial number..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Conditions</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Locations</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 size={28} className="animate-spin text-gray-400" />
          </div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No assets found</h3>
            <p className="text-sm text-gray-500 mt-1">Add your first asset or adjust filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Condition</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Purchase Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{asset.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{asset.serialNumber || asset.assetCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{asset.category?.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin size={12} className="text-gray-400" />
                        {asset.location || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${CONDITION_COLORS[asset.condition]}`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {asset.purchasePrice ? formatCurrency(asset.purchasePrice) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {formatDate(asset.purchaseDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {asset.assignedTo || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[asset.status]}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditingAsset(asset); setShowAddModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(asset.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Cards (shown on small screens as alternative) */}
      <div className="lg:hidden space-y-3">
        {!loading && assets.map((asset) => (
          <div key={asset.id + "-card"} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{asset.name}</h4>
                <p className="text-xs text-gray-400 font-mono">{asset.serialNumber || asset.assetCode}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${CONDITION_COLORS[asset.condition]}`}>
                {asset.condition}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
              <span>📍 {asset.location || "—"}</span>
              <span>📂 {asset.category}</span>
              <span>💰 {asset.purchasePrice ? formatCurrency(asset.purchasePrice) : "—"}</span>
              <span>👤 {asset.assignedTo || "Unassigned"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Asset</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to remove this asset from inventory?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Asset Modal */}
      {showAddModal && (
        <AssetFormModal
          asset={editingAsset}
          onClose={() => { setShowAddModal(false); setEditingAsset(null); }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingAsset(null);
            fetchAssets();
            setToast({ message: editingAsset ? "Asset updated!" : "Asset added!", type: "success" });
          }}
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}
    </div>
  );
}

// ─── Asset Form Modal ────────────────────────────────────────────────────────
function AssetFormModal({
  asset,
  onClose,
  onSuccess,
  onError,
}: {
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    name: asset?.name || "",
    category: asset?.category || "FURNITURE",
    serialNumber: asset?.serialNumber || "",
    location: asset?.location || "",
    condition: asset?.condition || ("GOOD" as Condition),
    status: asset?.status || ("AVAILABLE" as AssetStatus),
    purchaseDate: asset?.purchaseDate?.split("T")[0] || "",
    purchasePrice: asset?.purchasePrice?.toString() || "",
    assignedTo: asset?.assignedTo || "",
    quantity: asset?.quantity?.toString() || "1",
    description: asset?.description || "",
    warranty: asset?.warranty || "",
  });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      onError("Asset name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : 0,
        quantity: parseInt(form.quantity) || 1,
      };

      if (asset) {
        await axios.put(`/api/inventory/assets/${asset.id}`, payload, { headers });
      } else {
        await axios.post("/api/inventory/assets", payload, { headers });
      }
      onSuccess();
    } catch {
      onError("Failed to save asset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">{asset ? "Edit Asset" : "Add New Asset"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Asset Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Dell Laptop, Wooden Desk" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c.replace("_", " ")}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Serial Number</label>
              <input type="text" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} placeholder="SN-XXXX-XXXX" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Select location</option>
                {LOCATIONS.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as Condition })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                {CONDITIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Purchase Price (₹)</label>
              <input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="0" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned To</label>
              <input type="text" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} placeholder="Staff name or department" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Warranty</label>
              <input type="text" value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} placeholder="e.g., 2 years" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Additional details about the asset" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm">
              {saving ? "Saving..." : asset ? "Update Asset" : "Add Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
