import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  LayoutDashboard,
  Plus,
  Save,
  RotateCcw,
  Pencil,
  Eye,
  Trash2,
  GripVertical,
  Settings,
  X,
  Users,
  UserCog,
  IndianRupee,
  AlertCircle,
  CalendarCheck,
  School,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Clock,
  Calendar,
  Table2,
  ChevronDown,
  Check,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

interface Widget {
  id: string;
  name: string;
  type: "STAT_CARD" | "BAR_CHART" | "LINE_CHART" | "DONUT_CHART" | "TABLE" | "CALENDAR" | "ACTIVITY" | "CLOCK";
  dataSource: string;
  config: any;
  isPublic?: boolean;
}

interface WidgetInstance {
  id: string;
  widgetId: string;
  type: string;
  position: { x: number; y: number; w: number; h: number };
  config: { title: string; dataSource: string; color: string; filters?: any };
}

interface Layout {
  id: string;
  name: string;
  widgets: WidgetInstance[];
  gridConfig: { cols: number; rowHeight: number; gap: number };
  isDefault: boolean;
}

// ══════════════════════════════════════════════════════════════
// ICON MAP
// ══════════════════════════════════════════════════════════════

const iconMap: Record<string, any> = {
  Users: <Users size={24} />,
  UserCog: <UserCog size={24} />,
  IndianRupee: <IndianRupee size={24} />,
  AlertCircle: <AlertCircle size={24} />,
  CalendarCheck: <CalendarCheck size={24} />,
  School: <School size={24} />,
  BarChart3: <BarChart3 size={24} />,
  PieChart: <PieChart size={24} />,
  TrendingUp: <TrendingUp size={24} />,
  Activity: <Activity size={24} />,
  Clock: <Clock size={24} />,
  Calendar: <Calendar size={24} />,
  Table2: <Table2 size={24} />,
};

// ══════════════════════════════════════════════════════════════
// WIDGET TYPE CONFIG
// ══════════════════════════════════════════════════════════════

const widgetTypeConfig: Record<string, { icon: any; label: string; defaultSize: { w: number; h: number } }> = {
  STAT_CARD: { icon: <BarChart3 size={16} />, label: "Stat Card", defaultSize: { w: 3, h: 1 } },
  BAR_CHART: { icon: <BarChart3 size={16} />, label: "Bar Chart", defaultSize: { w: 6, h: 3 } },
  LINE_CHART: { icon: <TrendingUp size={16} />, label: "Line Chart", defaultSize: { w: 6, h: 3 } },
  DONUT_CHART: { icon: <PieChart size={16} />, label: "Donut Chart", defaultSize: { w: 4, h: 3 } },
  TABLE: { icon: <Table2 size={16} />, label: "Data Table", defaultSize: { w: 6, h: 4 } },
  CALENDAR: { icon: <Calendar size={16} />, label: "Calendar", defaultSize: { w: 4, h: 3 } },
  ACTIVITY: { icon: <Activity size={16} />, label: "Activity Feed", defaultSize: { w: 4, h: 4 } },
  CLOCK: { icon: <Clock size={16} />, label: "Clock", defaultSize: { w: 3, h: 1 } },
};

// ══════════════════════════════════════════════════════════════
// HELPER: Format INR
// ══════════════════════════════════════════════════════════════
function formatINR(amount: number): string {
  if (!amount && amount !== 0) return "₹0";
  return "₹" + amount.toLocaleString("en-IN");
}

// ══════════════════════════════════════════════════════════════
// STAT CARD WIDGET
// ══════════════════════════════════════════════════════════════
function StatCardWidget({ data, config }: { data: any; config: any }) {
  const value = data?.value ?? 0;
  const label = config.title || data?.label || "—";
  const color = config.color || "#4f46e5";
  const icon = iconMap[config.icon] || <BarChart3 size={24} />;

  const displayValue = typeof value === "number" && config.dataSource?.includes("fee")
    ? formatINR(value)
    : value;

  return (
    <div className="flex items-center gap-4 h-full p-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{displayValue}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// BAR CHART WIDGET
// ══════════════════════════════════════════════════════════════
function BarChartWidget({ data, config }: { data: any[]; config: any }) {
  const color = config.color || "#4f46e5";
  if (!data || !Array.isArray(data)) return <div className="p-4 text-gray-400">No data</div>;

  const dataKey = Object.keys(data[0] || {}).find((k) => k !== "name" && k !== "month" && k !== "label") || "value";
  const nameKey = Object.keys(data[0] || {}).find((k) => k === "name" || k === "month" || k === "label") || "name";

  return (
    <div className="h-full p-4">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{config.title}</p>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LINE CHART WIDGET
// ══════════════════════════════════════════════════════════════
function LineChartWidget({ data, config }: { data: any[]; config: any }) {
  const color = config.color || "#10b981";
  if (!data || !Array.isArray(data)) return <div className="p-4 text-gray-400">No data</div>;

  const dataKey = Object.keys(data[0] || {}).find((k) => k !== "date" && k !== "name" && k !== "day") || "value";
  const nameKey = Object.keys(data[0] || {}).find((k) => k === "date" || k === "name" || k === "day") || "date";

  return (
    <div className="h-full p-4">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{config.title}</p>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`gradient-${config.title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#gradient-${config.title})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DONUT CHART WIDGET
// ══════════════════════════════════════════════════════════════
function DonutChartWidget({ data, config }: { data: any[]; config: any }) {
  if (!data || !Array.isArray(data)) return <div className="p-4 text-gray-400">No data</div>;

  const COLORS = config.colors || ["#3b82f6", "#ec4899", "#8b5cf6", "#f59e0b", "#10b981"];

  return (
    <div className="h-full p-4">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{config.title}</p>
      <div className="flex items-center h-[calc(100%-2rem)]">
        <ResponsiveContainer width="60%" height="100%">
          <RechartsPie>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={3}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={data[index]?.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPie>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 w-[40%]">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || COLORS[i % COLORS.length] }} />
              <span className="text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TABLE WIDGET
// ══════════════════════════════════════════════════════════════
function TableWidget({ data, config }: { data: any[]; config: any }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="p-4 text-gray-400">No data available</div>;
  }

  const columns = config.columns || Object.keys(data[0]).filter((k) => k !== "id");

  return (
    <div className="h-full p-4 overflow-auto">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{config.title}</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((col: string) => (
              <th key={col} className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium capitalize">
                {col.replace(/([A-Z])/g, " $1").trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 8).map((row, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              {columns.map((col: string) => (
                <td key={col} className="py-2 px-2 text-gray-700 dark:text-gray-300">
                  {col === "amount" || col === "pending"
                    ? formatINR(row[col])
                    : col === "date" || col === "dueDate"
                      ? new Date(row[col]).toLocaleDateString("en-IN")
                      : col === "status"
                        ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            row[col] === "SUCCESS" || row[col] === "PAID"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : row[col] === "PENDING" || row[col] === "PARTIAL"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}>{row[col]}</span>
                        )
                        : String(row[col] ?? "—")
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ACTIVITY WIDGET
// ══════════════════════════════════════════════════════════════
function ActivityWidget({ data, config }: { data: any[]; config: any }) {
  if (!data || !Array.isArray(data)) return <div className="p-4 text-gray-400">No activity</div>;

  const actionColors: Record<string, string> = {
    CREATE: "bg-green-500",
    UPDATE: "bg-blue-500",
    DELETE: "bg-red-500",
    LOGIN: "bg-purple-500",
    EXPORT: "bg-amber-500",
  };

  return (
    <div className="h-full p-4 overflow-auto">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{config.title || "Recent Activity"}</p>
      <div className="space-y-3">
        {data.slice(0, 10).map((item, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${actionColors[item.action] || "bg-gray-400"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{item.description}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {new Date(item.time).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CLOCK WIDGET
// ══════════════════════════════════════════════════════════════
function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between h-full p-4">
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {time.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <Clock size={28} className="text-gray-300 dark:text-gray-600" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// WIDGET RENDERER (dispatches to correct component)
// ══════════════════════════════════════════════════════════════
function WidgetRenderer({ widget, data }: { widget: WidgetInstance; data: any }) {
  switch (widget.type) {
    case "STAT_CARD":
      return <StatCardWidget data={data} config={widget.config} />;
    case "BAR_CHART":
      return <BarChartWidget data={data} config={widget.config} />;
    case "LINE_CHART":
      return <LineChartWidget data={data} config={widget.config} />;
    case "DONUT_CHART":
      return <DonutChartWidget data={data} config={widget.config} />;
    case "TABLE":
      return <TableWidget data={data} config={widget.config} />;
    case "ACTIVITY":
      return <ActivityWidget data={data} config={widget.config} />;
    case "CLOCK":
      return <ClockWidget />;
    default:
      return <div className="p-4 text-gray-400">Unknown widget type</div>;
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN DASHBOARD BUILDER COMPONENT
// ══════════════════════════════════════════════════════════════

export default function DashboardBuilder() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [activeLayout, setActiveLayout] = useState<Layout | null>(null);
  const [widgetCatalog, setWidgetCatalog] = useState<Widget[]>([]);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<WidgetInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [layoutName, setLayoutName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch layouts on mount
  useEffect(() => {
    fetchLayouts();
    fetchWidgetCatalog();
  }, []);

  // Fetch widget data whenever active layout changes
  useEffect(() => {
    if (activeLayout) {
      fetchAllWidgetData(activeLayout.widgets);
    }
  }, [activeLayout]);

  const fetchLayouts = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/dashboard-builder/layouts"));
      setLayouts(res.data.data || []);
      const defaultLayout = res.data.data?.find((l: Layout) => l.isDefault) || res.data.data?.[0];
      if (defaultLayout) setActiveLayout(defaultLayout);
    } catch (err) {
      console.error("Failed to fetch layouts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWidgetCatalog = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/dashboard-builder/widgets"));
      setWidgetCatalog(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch widget catalog:", err);
    }
  };

  const fetchAllWidgetData = async (widgets: WidgetInstance[]) => {
    const dataMap: Record<string, any> = {};
    await Promise.all(
      widgets.map(async (w) => {
        try {
          const res = await axios.get(
            getFullUrl(`/api/dashboard-builder/data/${w.type}?dataSource=${w.config.dataSource}`)
          );
          dataMap[w.id] = res.data.data;
        } catch {
          dataMap[w.id] = null;
        }
      })
    );
    setWidgetData(dataMap);
  };

  const handleSaveLayout = async () => {
    if (!activeLayout) return;
    setSaving(true);
    try {
      if (activeLayout.id) {
        await axios.put(getFullUrl(`/api/dashboard-builder/layouts/${activeLayout.id}`), {
          widgets: activeLayout.widgets,
        });
      } else {
        const res = await axios.post(getFullUrl("/api/dashboard-builder/layouts"), {
          name: activeLayout.name || "My Dashboard",
          widgets: activeLayout.widgets,
          isDefault: true,
        });
        setActiveLayout(res.data.data);
      }
      fetchLayouts();
    } catch (err) {
      console.error("Failed to save layout:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLayout = async () => {
    if (!layoutName.trim()) return;
    try {
      const res = await axios.post(getFullUrl("/api/dashboard-builder/layouts"), {
        name: layoutName,
        widgets: [],
        isDefault: layouts.length === 0,
      });
      setActiveLayout(res.data.data);
      setLayouts([...layouts, res.data.data]);
      setShowCreateModal(false);
      setLayoutName("");
      setIsEditMode(true);
    } catch (err) {
      console.error("Failed to create layout:", err);
    }
  };

  const handleDeleteLayout = async (id: string) => {
    if (!confirm("Delete this layout?")) return;
    try {
      await axios.delete(getFullUrl(`/api/dashboard-builder/layouts/${id}`));
      const remaining = layouts.filter((l) => l.id !== id);
      setLayouts(remaining);
      if (activeLayout?.id === id) {
        setActiveLayout(remaining[0] || null);
      }
    } catch (err) {
      console.error("Failed to delete layout:", err);
    }
  };

  const addWidgetToLayout = (widget: Widget) => {
    if (!activeLayout) return;

    const typeConf = widgetTypeConfig[widget.type] || { defaultSize: { w: 3, h: 2 } };
    const newWidgetInstance: WidgetInstance = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      widgetId: widget.id,
      type: widget.type,
      position: {
        x: 0,
        y: activeLayout.widgets.length * 2,
        w: typeConf.defaultSize.w,
        h: typeConf.defaultSize.h,
      },
      config: {
        title: widget.name,
        dataSource: widget.dataSource,
        color: widget.config?.color || "#4f46e5",
        ...(widget.config || {}),
      },
    };

    const updatedLayout = {
      ...activeLayout,
      widgets: [...activeLayout.widgets, newWidgetInstance],
    };
    setActiveLayout(updatedLayout);

    // Fetch data for new widget
    fetchWidgetDataSingle(newWidgetInstance);
  };

  const fetchWidgetDataSingle = async (widget: WidgetInstance) => {
    try {
      const res = await axios.get(
        getFullUrl(`/api/dashboard-builder/data/${widget.type}?dataSource=${widget.config.dataSource}`)
      );
      setWidgetData((prev) => ({ ...prev, [widget.id]: res.data.data }));
    } catch {
      setWidgetData((prev) => ({ ...prev, [widget.id]: null }));
    }
  };

  const removeWidgetFromLayout = (widgetId: string) => {
    if (!activeLayout) return;
    setActiveLayout({
      ...activeLayout,
      widgets: activeLayout.widgets.filter((w) => w.id !== widgetId),
    });
    setSelectedWidget(null);
  };

  const handleResetLayout = () => {
    if (!confirm("Reset layout to last saved state?")) return;
    const original = layouts.find((l) => l.id === activeLayout?.id);
    if (original) setActiveLayout({ ...original });
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={22} className="text-indigo-600" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard Builder</h1>
            {/* Layout Selector */}
            <div className="relative ml-4">
              <select
                value={activeLayout?.id || ""}
                onChange={(e) => {
                  const layout = layouts.find((l) => l.id === e.target.value);
                  if (layout) setActiveLayout(layout);
                }}
                className="pl-3 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
              >
                {layouts.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              title="New Layout"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isEditMode && (
              <>
                <button
                  onClick={() => setShowCatalog(!showCatalog)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                >
                  <Plus size={15} /> Add Widget
                </button>
                <button
                  onClick={handleResetLayout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <RotateCcw size={15} /> Reset
                </button>
                <button
                  onClick={handleSaveLayout}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  <Save size={15} /> {saving ? "Saving..." : "Save"}
                </button>
              </>
            )}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition ${
                isEditMode
                  ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              {isEditMode ? <><Eye size={15} /> Preview</> : <><Pencil size={15} /> Edit</>}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* ── WIDGET CATALOG SIDEBAR (shown in edit mode) ── */}
        {isEditMode && showCatalog && (
          <div className="w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 p-4 h-[calc(100vh-60px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Widget Catalog</h3>
              <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            {/* Group by type */}
            {Object.entries(widgetTypeConfig).map(([type, conf]) => {
              const widgets = widgetCatalog.filter((w) => w.type === type);
              if (widgets.length === 0) return null;

              return (
                <div key={type} className="mb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                    {conf.icon} {conf.label}s
                  </p>
                  <div className="space-y-1.5">
                    {widgets.map((widget) => (
                      <button
                        key={widget.id}
                        onClick={() => addWidgetToLayout(widget)}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <Plus size={12} className="text-indigo-500" />
                        {widget.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── MAIN GRID AREA ── */}
        <div className="flex-1 p-6">
          {!activeLayout || activeLayout.widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <LayoutDashboard size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No widgets added yet</p>
              {isEditMode ? (
                <button
                  onClick={() => setShowCatalog(true)}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={16} className="inline mr-1" /> Add Widgets
                </button>
              ) : (
                <p className="text-xs text-gray-400">Click Edit to start building your dashboard</p>
              )}
            </div>
          ) : (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${activeLayout.gridConfig?.cols || 12}, 1fr)`,
              }}
            >
              {activeLayout.widgets.map((widget) => (
                <div
                  key={widget.id}
                  className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden relative transition-all ${
                    isEditMode ? "ring-1 ring-dashed ring-gray-300 dark:ring-gray-600" : ""
                  } ${selectedWidget?.id === widget.id ? "ring-2 ring-indigo-500" : ""}`}
                  style={{
                    gridColumn: `span ${widget.position.w}`,
                    minHeight: `${(widget.position.h || 1) * (activeLayout.gridConfig?.rowHeight || 80)}px`,
                  }}
                  onClick={() => isEditMode && setSelectedWidget(widget)}
                >
                  {/* Edit overlay */}
                  {isEditMode && (
                    <div className="absolute top-1 right-1 z-10 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeWidgetFromLayout(widget.id);
                        }}
                        className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                  {/* Widget content */}
                  <WidgetRenderer widget={widget} data={widgetData[widget.id]} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── WIDGET CONFIG PANEL (right side in edit mode) ── */}
        {isEditMode && selectedWidget && (
          <div className="w-72 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 p-4 h-[calc(100vh-60px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Widget Settings</h3>
              <button onClick={() => setSelectedWidget(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={selectedWidget.config.title || ""}
                  onChange={(e) => {
                    const updated = {
                      ...selectedWidget,
                      config: { ...selectedWidget.config, title: e.target.value },
                    };
                    setSelectedWidget(updated);
                    setActiveLayout((prev) =>
                      prev
                        ? {
                            ...prev,
                            widgets: prev.widgets.map((w) => (w.id === updated.id ? updated : w)),
                          }
                        : null
                    );
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Color</label>
                <input
                  type="color"
                  value={selectedWidget.config.color || "#4f46e5"}
                  onChange={(e) => {
                    const updated = {
                      ...selectedWidget,
                      config: { ...selectedWidget.config, color: e.target.value },
                    };
                    setSelectedWidget(updated);
                    setActiveLayout((prev) =>
                      prev
                        ? {
                            ...prev,
                            widgets: prev.widgets.map((w) => (w.id === updated.id ? updated : w)),
                          }
                        : null
                    );
                  }}
                  className="w-full h-8 rounded-lg cursor-pointer"
                />
              </div>

              {/* Size */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Width (columns)</label>
                <input
                  type="range"
                  min={2}
                  max={12}
                  value={selectedWidget.position.w}
                  onChange={(e) => {
                    const updated = {
                      ...selectedWidget,
                      position: { ...selectedWidget.position, w: parseInt(e.target.value) },
                    };
                    setSelectedWidget(updated);
                    setActiveLayout((prev) =>
                      prev
                        ? {
                            ...prev,
                            widgets: prev.widgets.map((w) => (w.id === updated.id ? updated : w)),
                          }
                        : null
                    );
                  }}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">{selectedWidget.position.w} / 12 cols</span>
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Height (rows)</label>
                <input
                  type="range"
                  min={1}
                  max={6}
                  value={selectedWidget.position.h}
                  onChange={(e) => {
                    const updated = {
                      ...selectedWidget,
                      position: { ...selectedWidget.position, h: parseInt(e.target.value) },
                    };
                    setSelectedWidget(updated);
                    setActiveLayout((prev) =>
                      prev
                        ? {
                            ...prev,
                            widgets: prev.widgets.map((w) => (w.id === updated.id ? updated : w)),
                          }
                        : null
                    );
                  }}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">{selectedWidget.position.h} rows</span>
              </div>

              {/* Type info */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-400">
                  <strong>Type:</strong> {widgetTypeConfig[selectedWidget.type]?.label || selectedWidget.type}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  <strong>Data:</strong> {selectedWidget.config.dataSource}
                </p>
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeWidgetFromLayout(selectedWidget.id)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition mt-4"
              >
                <Trash2 size={14} /> Remove Widget
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE LAYOUT MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Dashboard Layout</h3>
            <input
              type="text"
              placeholder="Layout name..."
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateLayout()}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLayout}
                disabled={!layoutName.trim()}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
