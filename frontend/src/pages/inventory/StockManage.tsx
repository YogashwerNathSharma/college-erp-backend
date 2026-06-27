import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  BarChart3,
  Plus,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  AlertTriangle,
  TrendingDown,
  Package,
  ArrowUpCircle,
  Filter,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type StockStatus = "ADEQUATE" | "LOW" | "OUT_OF_STOCK";

interface StockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  lastRestocked: string;
  status: StockStatus;
  supplier?: string;
  costPerUnit?: number;
}

interface StockStats {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES = ["STATIONERY", "CLEANING", "ELECTRICAL", "PLUMBING", "SPORTS", "LAB_SUPPLIES", "IT_CONSUMABLES", "CANTEEN", "MEDICAL", "OTHER"];
const UNITS = ["pieces", "packets", "boxes", "litres", "kg", "reams", "bottles", "rolls", "sets", "meters"];

const STATUS_CONFIG: Record<StockStatus, { color: string; label: string; bgColor: string }> = {
  ADEQUATE: { color: "text-green-700", label: "Adequate", bgColor: "bg-green-50 border-green-200" },
  LOW: { color: "text-amber-700", label: "Low Stock", bgColor: "bg-amber-50 border-amber-200" },
  OUT_OF_STOCK: { color: "text-red-700", label: "Out of Stock", bgColor: "bg-red-50 border-red-200" },
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
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

// ─── Stock Level Bar ─────────────────────────────────────────────────────────
function StockBar({ current, min, max }: { current: number; min: number; max: number }) {
  const effectiveMax = max || min * 5 || 100;
  const pct = Math.min(100, Math.round((current / effectiveMax) * 100));
  const barColor = current <= 0 ? "bg-red-500" : current <= min ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="w-full">
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
        <span>0</span>
        <span className="text-amber-500">Min: {min}</span>
        <span>{effectiveMax}</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function StockManage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState<StockItem | null>(null);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [stats, setStats] = useState<StockStats>({ totalItems: 0, lowStockCount: 0, outOfStockCount: 0, totalValue: 0 });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ─── Fetch Stock ───────────────────────────────────────────────────────────
  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;

      const res = await axios.get("/api/inventory/stock", { headers, params });
      const data: StockItem[] = res.data.data || [];
      setStock(data);

      // Compute stats
      const lowCount = data.filter((s) => s.status === "LOW").length;
      const oosCount = data.filter((s) => s.status === "OUT_OF_STOCK").length;
      const totalVal = data.reduce((sum, s) => sum + (s.currentStock * (s.costPerUnit || 0)), 0);
      setStats({ totalItems: data.length, lowStockCount: lowCount, outOfStockCount: oosCount, totalValue: totalVal });
    } catch {
      setToast({ message: "Failed to load stock data", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterCategory, filterStatus]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  // ─── Restock ───────────────────────────────────────────────────────────────
  const handleRestock = async (itemId: string, quantity: number) => {
    try {
      await axios.put(`/api/inventory/stock/${itemId}/restock`, { quantity }, { headers });
      setToast({ message: `Restocked ${quantity} units successfully`, type: "success" });
      setShowRestockModal(null);
      fetchStock();
    } catch {
      setToast({ message: "Failed to restock", type: "error" });
    }
  };

  return (
    <div className="page-container space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="text-purple-600" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-sm text-gray-500">Monitor and manage consumable stock levels</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowAddModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium text-sm"
        >
          <Plus size={18} />
          Add Stock Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <Package size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Low Stock</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.lowStockCount}</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <TrendingDown size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStockCount}</p>
            </div>
            <div className="p-2.5 bg-red-50 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Stock Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="p-2.5 bg-green-50 rounded-lg">
              <BarChart3 size={20} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {stats.lowStockCount + stats.outOfStockCount} item(s) need attention
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {stats.lowStockCount} low stock • {stats.outOfStockCount} out of stock. Please restock soon.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stock items..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="">All Status</option>
              <option value="ADEQUATE">Adequate</option>
              <option value="LOW">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 size={28} className="animate-spin text-gray-400" />
          </div>
        ) : stock.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No stock items found</h3>
            <p className="text-sm text-gray-500 mt-1">Add your first stock item to start tracking</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-40">Level</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Last Restocked</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stock.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition ${item.status === "OUT_OF_STOCK" ? "bg-red-50/30" : item.status === "LOW" ? "bg-amber-50/20" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        {item.supplier && <p className="text-xs text-gray-400">Supplier: {item.supplier}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{item.category?.replace("_", " ")}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${item.currentStock <= 0 ? "text-red-600" : item.currentStock <= item.minStock ? "text-amber-600" : "text-gray-900"}`}>
                          {item.currentStock}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StockBar current={item.currentStock} min={item.minStock} max={item.maxStock} />
                      </td>
                      <td className="px-4 py-3 text-xs text-center text-gray-500">
                        {formatDate(item.lastRestocked)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${cfg.bgColor} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setShowRestockModal(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium hover:bg-purple-100 transition"
                        >
                          <ArrowUpCircle size={12} />
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {showRestockModal && (
        <RestockModal
          item={showRestockModal}
          onClose={() => setShowRestockModal(null)}
          onRestock={handleRestock}
        />
      )}

      {/* Add/Edit Stock Item Modal */}
      {showAddModal && (
        <StockFormModal
          item={editingItem}
          onClose={() => { setShowAddModal(false); setEditingItem(null); }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingItem(null);
            fetchStock();
            setToast({ message: editingItem ? "Stock item updated!" : "Stock item added!", type: "success" });
          }}
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}
    </div>
  );
}

// ─── Restock Modal ───────────────────────────────────────────────────────────
function RestockModal({
  item,
  onClose,
  onRestock,
}: {
  item: StockItem;
  onClose: () => void;
  onRestock: (itemId: string, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-full">
            <ArrowUpCircle size={20} className="text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Restock Item</h3>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium text-gray-900">{item.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Current: {item.currentStock} {item.unit} • Min: {item.minStock} {item.unit}
          </p>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity to Add *</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              placeholder="Enter quantity"
              className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              autoFocus
            />
            <span className="text-sm text-gray-500">{item.unit}</span>
          </div>
          {quantity && (
            <p className="text-xs text-gray-500 mt-1.5">
              New stock level: <strong>{item.currentStock + parseInt(quantity || "0")}</strong> {item.unit}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
          <button
            onClick={() => { if (parseInt(quantity) > 0) onRestock(item.id, parseInt(quantity)); }}
            disabled={!quantity || parseInt(quantity) <= 0}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            Confirm Restock
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stock Form Modal ────────────────────────────────────────────────────────
function StockFormModal({
  item,
  onClose,
  onSuccess,
  onError,
}: {
  item: StockItem | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    name: item?.name || "",
    category: item?.category || "STATIONERY",
    currentStock: item?.currentStock?.toString() || "0",
    minStock: item?.minStock?.toString() || "10",
    maxStock: item?.maxStock?.toString() || "100",
    unit: item?.unit || "pieces",
    supplier: item?.supplier || "",
    costPerUnit: item?.costPerUnit?.toString() || "",
  });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      onError("Item name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        currentStock: parseInt(form.currentStock) || 0,
        minStock: parseInt(form.minStock) || 10,
        maxStock: parseInt(form.maxStock) || 100,
        costPerUnit: form.costPerUnit ? parseFloat(form.costPerUnit) : 0,
      };

      if (item) {
        await axios.put(`/api/inventory/stock/${item.id}`, payload, { headers });
      } else {
        await axios.post("/api/inventory/stock", payload, { headers });
      }
      onSuccess();
    } catch {
      onError("Failed to save stock item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{item ? "Edit Stock Item" : "Add Stock Item"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Item Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Whiteboard Marker, A4 Paper" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c.replace("_", " ")}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                {UNITS.map((u) => (<option key={u} value={u}>{u}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Stock</label>
              <input type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} min="0" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Stock</label>
              <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} min="0" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Maximum Stock</label>
              <input type="number" value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: e.target.value })} min="0" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost per Unit (₹)</label>
              <input type="number" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} min="0" step="0.01" placeholder="0" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier</label>
              <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name or contact" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition shadow-sm">
              {saving ? "Saving..." : item ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
