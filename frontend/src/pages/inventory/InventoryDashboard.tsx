import { useEffect, useState } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Package, PackageCheck, PackageMinus, Wrench, AlertTriangle,
  Plus, Send, RotateCcw, ClipboardCheck, Search, Filter,
  Download, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight,
  Monitor, Armchair, Dumbbell, FlaskConical, MoreHorizontal,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: number;
  trendUp?: boolean;
}

interface IssuedAsset {
  id: string;
  itemName: string;
  issuedTo: string;
  issuedToType: "Staff" | "Student";
  issueDate: string;
  dueReturn: string;
  status: "Issued" | "Returned" | "Overdue";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    totalAssets: 0,
    issued: 0,
    inStock: 0,
    underMaintenance: 0,
    lowStockAlerts: 0,
  });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [conditionData, setConditionData] = useState<any[]>([]);
  const [recentIssues, setRecentIssues] = useState<IssuedAsset[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getFullUrl("/api/inventory/dashboard"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data) {
        setStats(res.data.stats || stats);
        setCategoryData(res.data.categoryDistribution || defaultCategoryData);
        setMonthlyData(res.data.monthlyIssueReturn || defaultMonthlyData);
        setConditionData(res.data.conditionData || defaultConditionData);
        setRecentIssues(res.data.recentIssues || defaultRecentIssues);
      }
    } catch (error) {
      console.error("Failed to fetch inventory dashboard:", error);
      // Use default data for demo
      setStats({ totalAssets: 1247, issued: 342, inStock: 856, underMaintenance: 49, lowStockAlerts: 12 });
      setCategoryData(defaultCategoryData);
      setMonthlyData(defaultMonthlyData);
      setConditionData(defaultConditionData);
      setRecentIssues(defaultRecentIssues);
    } finally {
      setLoading(false);
    }
  };

  // ── Stat Cards Config ──
  const statCards: StatCard[] = [
    { label: "Total Assets", value: stats.totalAssets, icon: <Package size={22} />, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950", trend: 5.2, trendUp: true },
    { label: "Issued", value: stats.issued, icon: <PackageMinus size={22} />, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950", trend: 3.1, trendUp: true },
    { label: "In Stock", value: stats.inStock, icon: <PackageCheck size={22} />, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950", trend: 2.4, trendUp: false },
    { label: "Under Maintenance", value: stats.underMaintenance, icon: <Wrench size={22} />, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950", trend: 1.8, trendUp: true },
    { label: "Low Stock Alerts", value: stats.lowStockAlerts, icon: <AlertTriangle size={22} />, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950", trend: 4.0, trendUp: true },
  ];

  // ── Quick Actions ──
  const quickActions = [
    { label: "Add Asset", icon: <Plus size={20} />, color: "bg-blue-500 hover:bg-blue-600", onClick: () => {} },
    { label: "Issue Asset", icon: <Send size={20} />, color: "bg-orange-500 hover:bg-orange-600", onClick: () => {} },
    { label: "Return Asset", icon: <RotateCcw size={20} />, color: "bg-emerald-500 hover:bg-emerald-600", onClick: () => {} },
    { label: "Stock Check", icon: <ClipboardCheck size={20} />, color: "bg-purple-500 hover:bg-purple-600", onClick: () => {} },
  ];

  const DONUT_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];
  const itemsPerPage = 5;
  const filteredIssues = recentIssues.filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.issuedTo.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const paginatedIssues = filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-slate-700" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory & Assets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all school assets, inventory, and stock</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus size={16} /> Add Asset
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-lg ${card.bgColor} ${card.color} flex items-center justify-center`}>
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{card.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
                  {card.trend && (
                    <span className={`flex items-center text-xs font-medium ${card.trendUp ? "text-green-600" : "text-red-500"}`}>
                      {card.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {card.trend}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`flex items-center justify-center gap-2 px-4 py-3 ${action.color} text-white rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Distribution - Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Asset Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                paddingAngle={3}
              >
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [value, "Items"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3">
            {categoryData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Issue/Return - Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Monthly Issue / Return</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="issued" name="Issued" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returned" name="Returned" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Condition - Horizontal Bars */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Asset Condition</h3>
          <div className="space-y-4 mt-6">
            {conditionData.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recently Issued Table ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recently Issued Assets</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-48"
              />
            </div>
            <button className="p-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
              <Filter size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issued To</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issue Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Return</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIssues.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{item.itemName}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{item.issuedTo}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.issuedToType === "Staff" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                      {item.issuedToType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{item.issueDate}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{item.dueReturn}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status === "Issued" ? "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                      item.status === "Returned" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-500">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 flex items-center justify-between border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredIssues.length)} of {filteredIssues.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-medium ${currentPage === i + 1 ? "bg-blue-600 text-white" : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"}`}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEFAULT / DEMO DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const defaultCategoryData = [
  { name: "Furniture", value: 420 },
  { name: "Electronics", value: 310 },
  { name: "Sports", value: 185 },
  { name: "Lab Equipment", value: 230 },
  { name: "Stationery", value: 102 },
];

const defaultMonthlyData = [
  { month: "Jan", issued: 45, returned: 38 },
  { month: "Feb", issued: 52, returned: 44 },
  { month: "Mar", issued: 38, returned: 50 },
  { month: "Apr", issued: 61, returned: 42 },
  { month: "May", issued: 49, returned: 55 },
  { month: "Jun", issued: 55, returned: 48 },
];

const defaultConditionData = [
  { name: "Good", value: 72, color: "#10b981" },
  { name: "Fair", value: 18, color: "#f59e0b" },
  { name: "Poor", value: 7, color: "#f97316" },
  { name: "Damaged", value: 3, color: "#ef4444" },
];

const defaultRecentIssues: IssuedAsset[] = [
  { id: "1", itemName: "Dell Laptop", issuedTo: "Mr. Sharma", issuedToType: "Staff", issueDate: "2026-06-25", dueReturn: "2026-07-25", status: "Issued" },
  { id: "2", itemName: "Cricket Kit", issuedTo: "Rahul Verma", issuedToType: "Student", issueDate: "2026-06-24", dueReturn: "2026-06-26", status: "Overdue" },
  { id: "3", itemName: "Projector", issuedTo: "Mrs. Gupta", issuedToType: "Staff", issueDate: "2026-06-23", dueReturn: "2026-06-30", status: "Issued" },
  { id: "4", itemName: "Microscope", issuedTo: "Science Lab", issuedToType: "Staff", issueDate: "2026-06-22", dueReturn: "2026-06-28", status: "Returned" },
  { id: "5", itemName: "Football Set", issuedTo: "Amit Kumar", issuedToType: "Student", issueDate: "2026-06-21", dueReturn: "2026-06-23", status: "Returned" },
  { id: "6", itemName: "Whiteboard Marker", issuedTo: "Mr. Singh", issuedToType: "Staff", issueDate: "2026-06-20", dueReturn: "2026-06-27", status: "Issued" },
  { id: "7", itemName: "Chemistry Kit", issuedTo: "Priya Patel", issuedToType: "Student", issueDate: "2026-06-19", dueReturn: "2026-06-25", status: "Overdue" },
  { id: "8", itemName: "Audio Speaker", issuedTo: "Music Dept", issuedToType: "Staff", issueDate: "2026-06-18", dueReturn: "2026-07-18", status: "Issued" },
];
