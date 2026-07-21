// ═══════════════════════════════════════════════════════════════════════════
// ENTERPRISE STUDENT DASHBOARD - CHART COMPONENTS
// React 19 + TypeScript + Recharts + Tailwind CSS
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { Maximize2, Minimize2, Download, X } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface MonthlyTrendItem {
  month: string;
  count: number;
}

export interface GenderRatioItem {
  name: string;
  value: number;
}

export interface ClassStrengthItem {
  class: string;
  count: number;
}

export interface SectionStrengthItem {
  section: string;
  boys: number;
  girls: number;
  total: number;
}

export interface CategoryDistItem {
  category: string;
  count: number;
  percentage: number;
}

export interface StudentGrowthItem {
  year: string;
  students: number;
  newAdmissions: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const CHART_COLORS = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#84cc16", "#a855f7", "#0ea5e9",
];

const GENDER_COLORS = ["#3b82f6", "#ec4899", "#a78bfa"];

const GRADIENT_ID_AREA = "studentGrowthGradient";
const GRADIENT_ID_ADMISSION = "admissionGradient";

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl px-4 py-3 backdrop-blur-sm">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
        {label}
      </p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <p className="text-sm text-slate-700 dark:text-slate-200">
            <span className="font-medium">{entry.name}:</span>{" "}
            <span className="font-bold">{typeof entry.value === "number" ? entry.value.toLocaleString("en-IN") : entry.value}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHART WRAPPER (with fullscreen + export)
// ═══════════════════════════════════════════════════════════════════════════

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
}

function ChartWrapper({ title, subtitle, children, height = "h-72", isEmpty, emptyMessage }: ChartWrapperProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = useCallback(() => {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const a = document.createElement("a");
      a.download = `${title.replace(/\s+/g, "_").toLowerCase()}_chart.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }, [title]);

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 p-8 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPNG}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Export chart as PNG"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFullscreen(false)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Exit fullscreen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div ref={chartRef} className="flex-1 min-h-0">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExportPNG}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Export chart"
            title="Download PNG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFullscreen(true)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fullscreen"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div ref={chartRef} className={height}>
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm">
            {emptyMessage || "No data available"}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. ADMISSION TREND CHART (Line)
// ═══════════════════════════════════════════════════════════════════════════

interface AdmissionTrendChartProps {
  data: MonthlyTrendItem[];
}

export function AdmissionTrendChart({ data }: AdmissionTrendChartProps) {
  return (
    <ChartWrapper
      title="Admission Trend"
      subtitle="Monthly new admissions for current year"
      isEmpty={data.length === 0}
      emptyMessage="No admission trend data available"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id={GRADIENT_ID_ADMISSION} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            name="Admissions"
            stroke="#06b6d4"
            strokeWidth={2.5}
            fill={`url(#${GRADIENT_ID_ADMISSION})`}
            dot={{ r: 4, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: "#06b6d4", strokeWidth: 2, fill: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. GENDER RATIO CHART (Donut/Pie)
// ═══════════════════════════════════════════════════════════════════════════

interface GenderRatioChartProps {
  data: GenderRatioItem[];
}

export function GenderRatioChart({ data }: GenderRatioChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartWrapper
      title="Gender Ratio"
      subtitle={`Total: ${total.toLocaleString("en-IN")} students`}
      isEmpty={data.length === 0}
      emptyMessage="No gender data available"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`gender-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={10}
            formatter={(value: string, entry: any) => (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 ml-1">
                {value} ({entry.payload.value?.toLocaleString("en-IN")})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. CLASS STRENGTH CHART (Bar)
// ═══════════════════════════════════════════════════════════════════════════

interface ClassStrengthChartProps {
  data: ClassStrengthItem[];
}

export function ClassStrengthChart({ data }: ClassStrengthChartProps) {
  const maxValue = Math.max(...data.map((d) => d.count), 0);

  return (
    <ChartWrapper
      title="Class Strength"
      subtitle="Student distribution across classes"
      isEmpty={data.length === 0}
      emptyMessage="No class data available"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
          <XAxis
            dataKey="class"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            angle={data.length > 8 ? -30 : 0}
            textAnchor={data.length > 8 ? "end" : "middle"}
            height={data.length > 8 ? 50 : 30}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, Math.ceil(maxValue * 1.1)]}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar
            dataKey="count"
            name="Students"
            fill="#6366f1"
            radius={[6, 6, 0, 0]}
            maxBarSize={50}
          >
            {data.map((_, index) => (
              <Cell key={`class-bar-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. SECTION STRENGTH CHART (Stacked Bar)
// ═══════════════════════════════════════════════════════════════════════════

interface SectionStrengthChartProps {
  data: SectionStrengthItem[];
}

export function SectionStrengthChart({ data }: SectionStrengthChartProps) {
  return (
    <ChartWrapper
      title="Section Strength"
      subtitle="Gender distribution per section"
      isEmpty={data.length === 0}
      emptyMessage="No section data available"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
          <XAxis
            dataKey="section"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            verticalAlign="top"
            height={30}
            iconType="circle"
            iconSize={10}
            formatter={(value: string) => (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{value}</span>
            )}
          />
          <Bar dataKey="boys" name="Boys" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} maxBarSize={40} />
          <Bar dataKey="girls" name="Girls" stackId="a" fill="#ec4899" radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CATEGORY DISTRIBUTION CHART (Pie)
// ═══════════════════════════════════════════════════════════════════════════

interface CategoryDistributionChartProps {
  data: CategoryDistItem[];
}

export function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  return (
    <ChartWrapper
      title="Category Distribution"
      subtitle="Students by social category"
      isEmpty={data.length === 0}
      emptyMessage="No category data available"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            outerRadius={85}
            paddingAngle={2}
            dataKey="count"
            nameKey="category"
            label={({ category, percentage }) => `${category} (${percentage?.toFixed(1) || 0}%)`}
            labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
          >
            {data.map((_, index) => (
              <Cell key={`cat-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={10}
            formatter={(value: string) => (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. MONTHLY ADMISSION CHART (Bar)
// ═══════════════════════════════════════════════════════════════════════════

interface MonthlyAdmissionChartProps {
  data: MonthlyTrendItem[];
}

export function MonthlyAdmissionChart({ data }: MonthlyAdmissionChartProps) {
  return (
    <ChartWrapper
      title="Monthly Admissions"
      subtitle="New admissions by month"
      isEmpty={data.length === 0}
      emptyMessage="No monthly data available"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="count" name="Admissions" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={45}>
            {data.map((entry, index) => (
              <Cell
                key={`month-bar-${index}`}
                fill={index === data.length - 1 ? "#6366f1" : "#10b981"}
                opacity={index === data.length - 1 ? 1 : 0.7 + (index / data.length) * 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. STUDENT GROWTH CHART (Area with gradient)
// ═══════════════════════════════════════════════════════════════════════════

interface StudentGrowthChartProps {
  data: StudentGrowthItem[];
}

export function StudentGrowthChart({ data }: StudentGrowthChartProps) {
  return (
    <ChartWrapper
      title="Student Growth"
      subtitle="Year-over-year growth trend"
      isEmpty={data.length === 0}
      emptyMessage="No growth data available"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id={GRADIENT_ID_AREA} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="admissionGrowthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            verticalAlign="top"
            height={30}
            iconType="circle"
            iconSize={10}
            formatter={(value: string) => (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="students"
            name="Total Students"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            fill={`url(#${GRADIENT_ID_AREA})`}
            dot={{ r: 4, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
          <Area
            type="monotone"
            dataKey="newAdmissions"
            name="New Admissions"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#admissionGrowthGradient)"
            dot={{ r: 3, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
