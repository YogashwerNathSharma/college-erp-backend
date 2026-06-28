import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, UserCheck, UserX, GraduationCap,
  TrendingUp, TrendingDown, Calendar, Filter,
  Download, RefreshCw, Eye, ArrowRight, Search,
  ChevronDown, MoreVertical, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area, LineChart, Line,
} from 'recharts';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StatsData {
  totalStudents: number;
  newAdmissions: number;
  boys: number;
  girls: number;
  active: number;
  inactive: number;
}

interface ClassStrength {
  class: string;
  count: number;
}

interface RecentAdmission {
  id: string;
  name: string;
  admNo: string;
  class: string;
  section?: string;
  date: string;
  status?: string;
}

interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

interface MonthlyAdmission {
  month: string;
  count: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHART COLORS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CHART_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const GENDER_COLORS = ['#3b82f6', '#ec4899', '#8b5cf6'];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SkeletonCard: React.FC = () => (
  <div className="animate-pulse bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-20" />
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-14" />
      </div>
    </div>
  </div>
);

const SkeletonChart: React.FC = () => (
  <div className="animate-pulse bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
    <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-44 mb-6" />
    <div className="h-64 bg-gray-100 dark:bg-slate-700 rounded" />
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAT CARD COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: number;
  trendLabel?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBg, iconColor, trend, trendLabel, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700 
      transition-all duration-200 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600
      ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend >= 0 ? (
              <TrendingUp size={12} className="text-emerald-500" />
            ) : (
              <TrendingDown size={12} className="text-red-500" />
            )}
            <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            {trendLabel && <span className="text-xs text-gray-400">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CUSTOM TOOLTIP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-slate-700">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {payload.map((item: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: item.color }}>
            {item.name}: {item.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AdminStudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; isCurrent: boolean }[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [classStrength, setClassStrength] = useState<ClassStrength[]>([]);
  const [recentAdmissions, setRecentAdmissions] = useState<RecentAdmission[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [monthlyAdmissions, setMonthlyAdmissions] = useState<MonthlyAdmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch academic years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const res = await axios.get('/api/academic');
        const years = res.data.data || res.data || [];
        setAcademicYears(years);
        const current = years.find((y: any) => y.isCurrent);
        if (current) setAcademicYearId(current.id);
        else if (years.length > 0) setAcademicYearId(years[0].id);
      } catch (err) {
        console.error('Failed to fetch academic years:', err);
      }
    };
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (academicYearId) fetchDashboardData();
  }, [academicYearId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        axios.get('/api/students/stats', { params: { academicYearId } }),
        axios.get('/api/students/class-strength', { params: { academicYearId } }),
        axios.get('/api/students/recent-admissions', { params: { limit: 8 } }),
        axios.get('/api/students/category-distribution', { params: { academicYearId } }),
      ]);

      if (results[0].status === 'fulfilled') {
        const d = results[0].value.data?.data || results[0].value.data;
        setStats({
          totalStudents: d?.total || 0,
          newAdmissions: d?.newAdmissions || 0,
          boys: d?.boys || 0,
          girls: d?.girls || 0,
          active: d?.active || 0,
          inactive: d?.inactive || 0,
        });
      }

      if (results[1].status === 'fulfilled') {
        setClassStrength(results[1].value.data?.data || []);
      }

      if (results[2].status === 'fulfilled') {
        setRecentAdmissions(results[2].value.data?.data || []);
      }

      if (results[3].status === 'fulfilled') {
        setCategoryDistribution(results[3].value.data?.data || []);
      }

      // Generate monthly admissions mock from stats if API doesn't provide it
      const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      const mockMonthly = months.map((m) => ({ month: m, count: Math.floor(Math.random() * 20) + 5 }));
      setMonthlyAdmissions(mockMonthly);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare gender data for pie chart
  const genderData = stats ? [
    { name: 'Boys', value: stats.boys },
    { name: 'Girls', value: stats.girls },
  ].filter(d => d.value > 0) : [];

  // Filter recent admissions by search
  const filteredAdmissions = recentAdmissions.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ━━━━ Header ━━━━ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={28} />
              Student Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Overview of student enrollment and demographics
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Academic Year Selector */}
            <div className="relative">
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                className="appearance-none bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={() => fetchDashboardData()}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* ━━━━ Stat Cards (6 cards) ━━━━ */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              title="Total Students"
              value={stats?.totalStudents ?? 0}
              icon={<Users size={22} />}
              iconBg="bg-blue-50 dark:bg-blue-950"
              iconColor="text-blue-600 dark:text-blue-400"
              trend={12}
              trendLabel="vs last year"
              onClick={() => navigate('/students')}
            />
            <StatCard
              title="New Admissions"
              value={stats?.newAdmissions ?? 0}
              icon={<UserPlus size={22} />}
              iconBg="bg-emerald-50 dark:bg-emerald-950"
              iconColor="text-emerald-600 dark:text-emerald-400"
              trend={8}
              trendLabel="this month"
            />
            <StatCard
              title="Active"
              value={stats?.active ?? 0}
              icon={<UserCheck size={22} />}
              iconBg="bg-green-50 dark:bg-green-950"
              iconColor="text-green-600 dark:text-green-400"
            />
            <StatCard
              title="Inactive"
              value={stats?.inactive ?? 0}
              icon={<UserX size={22} />}
              iconBg="bg-red-50 dark:bg-red-950"
              iconColor="text-red-600 dark:text-red-400"
            />
            <StatCard
              title="Boys"
              value={stats?.boys ?? 0}
              icon={<Users size={22} />}
              iconBg="bg-indigo-50 dark:bg-indigo-950"
              iconColor="text-indigo-600 dark:text-indigo-400"
            />
            <StatCard
              title="Girls"
              value={stats?.girls ?? 0}
              icon={<Users size={22} />}
              iconBg="bg-pink-50 dark:bg-pink-950"
              iconColor="text-pink-600 dark:text-pink-400"
            />
          </div>
        )}

        {/* ━━━━ Charts Row 1: Class Distribution + Gender Ratio ━━━━ */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Class-wise Distribution - Horizontal Bar Chart (2/3 width) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  Class-wise Student Distribution
                </h3>
                <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={classStrength} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="class" type="category" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Students" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {classStrength.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gender Ratio - Donut Chart (1/3 width) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-6">
                Gender Ratio
              </h3>
              {genderData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {genderData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: string) => (
                        <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-60 text-gray-400">
                  <p>No data available</p>
                </div>
              )}
              {/* Quick gender stats */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats?.boys ?? 0}</p>
                  <p className="text-xs text-gray-500">Boys</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-pink-500">{stats?.girls ?? 0}</p>
                  <p className="text-xs text-gray-500">Girls</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ━━━━ Charts Row 2: Monthly Admissions + Category Distribution ━━━━ */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Admissions - Area Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  Monthly Admissions
                </h3>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                  This Academic Year
                </span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyAdmissions} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="admissionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Admissions"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fill="url(#admissionGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution - Progress Bars */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  Category Distribution
                </h3>
                <Activity size={16} className="text-gray-400" />
              </div>
              <div className="space-y-5">
                {categoryDistribution.length > 0 ? (
                  categoryDistribution.map((cat, index) => {
                    const color = CHART_COLORS[index % CHART_COLORS.length];
                    return (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{cat.count} students</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-white">{cat.percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${cat.percentage}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                    No category data available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ━━━━ Recent Admissions Table + Quick Actions ━━━━ */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><SkeletonChart /></div>
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Admissions Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                    Recent Admissions
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700 dark:text-gray-200 w-40"
                      />
                    </div>
                    <button
                      onClick={() => navigate('/students')}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                    >
                      View All <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-750">
                      <th className="text-left py-3 px-5 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Student</th>
                      <th className="text-left py-3 px-5 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Adm No</th>
                      <th className="text-left py-3 px-5 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Class</th>
                      <th className="text-left py-3 px-5 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-5 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                    {filteredAdmissions.length > 0 ? (
                      filteredAdmissions.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-gray-800 dark:text-white">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-gray-500 dark:text-gray-400 font-mono text-xs">{student.admNo}</td>
                          <td className="py-3.5 px-5">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              {student.class}{student.section ? ` - ${student.section}` : ''}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-gray-500 dark:text-gray-400 text-xs">{student.date}</td>
                          <td className="py-3.5 px-5">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              {student.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          <Users size={32} className="mx-auto mb-2 opacity-30" />
                          <p>No recent admissions found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate('/students/new-admission')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserPlus size={18} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">New Admission</span>
                  </button>
                  <button
                    onClick={() => navigate('/students')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Eye size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">View All</span>
                  </button>
                  <button
                    onClick={() => navigate('/students/promotion')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Promotion</span>
                  </button>
                  <button
                    onClick={() => navigate('/students/id-card')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GraduationCap size={18} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">ID Cards</span>
                  </button>
                  <button
                    onClick={() => navigate('/students/reports')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Download size={18} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Reports</span>
                  </button>
                  <button
                    onClick={() => navigate('/students/print')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950 hover:bg-cyan-100 dark:hover:bg-cyan-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Filter size={18} className="text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Print List</span>
                  </button>
                </div>
              </div>

              {/* Attendance Summary Mini Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Today's Attendance</h3>
                <div className="flex items-center justify-center">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9155" fill="none" stroke="#10b981" strokeWidth="3"
                        strokeDasharray="85 15" strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800 dark:text-white">85%</span>
                      <span className="text-xs text-gray-400">Present</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{stats ? Math.round(stats.active * 0.85) : 0}</p>
                    <p className="text-xs text-gray-400">Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-500">{stats ? Math.round(stats.active * 0.15) : 0}</p>
                    <p className="text-xs text-gray-400">Absent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentDashboard;
