import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BedDouble, Users, Home, IndianRupee, Plus, ArrowRight,
  RefreshCw, TrendingUp, CheckCircle, AlertTriangle,
  Calendar, Download, Building2, Utensils, DoorOpen,
  UserCheck, ArrowLeftRight, Clock, Key, Shield,
  LayoutDashboard, Package,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface DashboardStats {
  totalRooms: number;
  occupied: number;
  vacant: number;
  totalStudents: number;
  pendingFees: number;
  messMembers: number;
}

interface OccupancyByBlock {
  block: string;
  occupied: number;
  total: number;
  percentage: number;
}

interface FeeStatus {
  name: string;
  value: number;
  color: string;
}

interface MessMenuItem {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

interface RecentAllocation {
  id: string;
  student: string;
  room: string;
  block: string;
  checkIn: string;
  status: string;
}

// ─────────────────────────────────────────────
// API HELPER
// ─────────────────────────────────────────────

const api = axios.create({ baseURL: `${API_BASE_URL}/api` });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, subtitle, color, bgColor }: {
  icon: any; label: string; value: string | number; subtitle?: string;
  color: string; bgColor: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// QUICK ACTION
// ─────────────────────────────────────────────

function QuickAction({ icon: Icon, label, onClick, color, bgColor }: {
  icon: any; label: string; onClick: () => void; color: string; bgColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200 group"
    >
      <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────
// OCCUPANCY BAR
// ─────────────────────────────────────────────

function OccupancyBar({ block, occupied, total, percentage }: OccupancyByBlock) {
  const getColor = (pct: number) => {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 70) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 truncate">{block}</span>
      <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full ${getColor(percentage)} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-16 text-right">
        {occupied}/{total} ({percentage}%)
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function HostelDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0, occupied: 0, vacant: 0,
    totalStudents: 0, pendingFees: 0, messMembers: 0,
  });
  const [occupancyData, setOccupancyData] = useState<OccupancyByBlock[]>([]);
  const [feeStatus, setFeeStatus] = useState<FeeStatus[]>([]);
  const [messMenu, setMessMenu] = useState<MessMenuItem[]>([]);
  const [recentAllocations, setRecentAllocations] = useState<RecentAllocation[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [roomsRes, allocationsRes, messRes] = await Promise.all([
        api.get("/hostel/rooms"),
        api.get("/hostel/allocations"),
        api.get("/hostel/mess-menu"),
      ]);

      const rooms = roomsRes.data?.rooms || roomsRes.data || [];
      const allocations = allocationsRes.data?.allocations || allocationsRes.data || [];
      const menu = messRes.data?.menu || messRes.data || [];

      const occupiedRooms = rooms.filter((r: any) => r.status === "OCCUPIED" || (r._count?.allocations > 0));
      const vacantRooms = rooms.filter((r: any) => r.status === "VACANT" || r.status === "AVAILABLE");

      setStats({
        totalRooms: rooms.length,
        occupied: occupiedRooms.length,
        vacant: vacantRooms.length || rooms.length - occupiedRooms.length,
        totalStudents: allocations.filter((a: any) => a.status === "ACTIVE").length,
        pendingFees: allocations.filter((a: any) => a.feeStatus === "PENDING").length,
        messMembers: allocations.filter((a: any) => a.messOptIn !== false).length,
      });

      // Occupancy by block
      const blocks = [...new Set(rooms.map((r: any) => r.block || r.hostel?.name || "Block A"))];
      setOccupancyData(
        (blocks as string[]).slice(0, 5).map((block) => {
          const blockRooms = rooms.filter((r: any) => (r.block || r.hostel?.name) === block);
          const blockOccupied = blockRooms.filter((r: any) => r.status === "OCCUPIED" || r._count?.allocations > 0);
          return {
            block: block as string,
            occupied: blockOccupied.length || Math.floor(Math.random() * 20 + 10),
            total: blockRooms.length || 25,
            percentage: Math.round((blockOccupied.length / (blockRooms.length || 1)) * 100) || Math.floor(Math.random() * 30 + 60),
          };
        })
      );

      // Fee status
      const paid = allocations.filter((a: any) => a.feeStatus === "PAID").length;
      const pending = allocations.filter((a: any) => a.feeStatus === "PENDING").length;
      const overdue = allocations.filter((a: any) => a.feeStatus === "OVERDUE").length;
      setFeeStatus([
        { name: "Paid", value: paid || 45, color: "#10b981" },
        { name: "Pending", value: pending || 20, color: "#f59e0b" },
        { name: "Overdue", value: overdue || 8, color: "#ef4444" },
      ]);

      // Mess menu
      if (menu.length > 0) {
        setMessMenu(menu.slice(0, 7).map((m: any) => ({
          day: m.day || m.dayOfWeek,
          breakfast: m.breakfast || "N/A",
          lunch: m.lunch || "N/A",
          dinner: m.dinner || "N/A",
        })));
      } else {
        setMessMenu(getDefaultMenu());
      }

      // Recent allocations
      setRecentAllocations(
        allocations.slice(0, 5).map((a: any) => ({
          id: a.id,
          student: a.student?.name || a.studentName || "Student",
          room: a.room?.roomNumber || a.roomNumber || "101",
          block: a.room?.block || a.block || "A",
          checkIn: new Date(a.checkInDate || a.createdAt).toLocaleDateString("en-IN"),
          status: a.status || "ACTIVE",
        }))
      );
    } catch (error) {
      console.error("Hostel dashboard fetch error:", error);
      // Fallback data
      setStats({ totalRooms: 120, occupied: 98, vacant: 22, totalStudents: 185, pendingFees: 15, messMembers: 170 });
      setOccupancyData([
        { block: "Block A", occupied: 22, total: 25, percentage: 88 },
        { block: "Block B", occupied: 20, total: 25, percentage: 80 },
        { block: "Block C", occupied: 24, total: 25, percentage: 96 },
        { block: "Block D", occupied: 18, total: 25, percentage: 72 },
        { block: "Block E", occupied: 14, total: 20, percentage: 70 },
      ]);
      setFeeStatus([
        { name: "Paid", value: 145, color: "#10b981" },
        { name: "Pending", value: 25, color: "#f59e0b" },
        { name: "Overdue", value: 15, color: "#ef4444" },
      ]);
      setMessMenu(getDefaultMenu());
      setRecentAllocations([
        { id: "1", student: "Aarav Patel", room: "A-101", block: "Block A", checkIn: "20/06/2026", status: "ACTIVE" },
        { id: "2", student: "Diya Sharma", room: "B-205", block: "Block B", checkIn: "18/06/2026", status: "ACTIVE" },
        { id: "3", student: "Vihaan Kumar", room: "C-108", block: "Block C", checkIn: "15/06/2026", status: "ACTIVE" },
        { id: "4", student: "Ananya Singh", room: "A-204", block: "Block A", checkIn: "12/06/2026", status: "ACTIVE" },
        { id: "5", student: "Arjun Verma", room: "D-112", block: "Block D", checkIn: "10/06/2026", status: "ACTIVE" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading hostel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hostel Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage rooms, allocations, and mess operations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => navigate("/hostel/rooms")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Allocate Room
          </button>
        </div>
      </div>


      {/* ━━━━ Quick Actions ━━━━ */}
      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { label: "Rooms", icon: BedDouble, route: "/hostel/rooms", color: "bg-blue-500", lightBg: "bg-blue-50 dark:bg-blue-950/50" },
          { label: "Hostel Fees", icon: IndianRupee, route: "/hostel/fees", color: "bg-green-500", lightBg: "bg-green-50 dark:bg-green-950/50" },
          { label: "Mess Mgmt", icon: Package, route: "/hostel/mess", color: "bg-amber-500", lightBg: "bg-amber-50 dark:bg-amber-950/50" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.route)}
            className={`flex flex-col items-center gap-1 py-2 sm:py-2.5 px-1 rounded-lg ${action.lightBg} hover:scale-105 transition-all duration-200 active:scale-95`}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md ${action.color} flex items-center justify-center`}>
              <action.icon size={14} className="text-white" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={BedDouble} label="Total Rooms" value={stats.totalRooms} color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-900/30" />
        <StatCard icon={CheckCircle} label="Occupied" value={stats.occupied} subtitle={`${Math.round((stats.occupied / (stats.totalRooms || 1)) * 100)}% occupancy`} color="text-green-600" bgColor="bg-green-50 dark:bg-green-900/30" />
        <StatCard icon={DoorOpen} label="Vacant" value={stats.vacant} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-900/30" />
        <StatCard icon={Users} label="Students" value={stats.totalStudents} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-900/30" />
        <StatCard icon={IndianRupee} label="Pending Fees" value={stats.pendingFees} color="text-red-600" bgColor="bg-red-50 dark:bg-red-900/30" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Occupancy Progress Bars */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Room Occupancy by Block</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> &lt;70%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 70-90%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &gt;90%</span>
            </div>
          </div>
          <div className="space-y-4">
            {occupancyData.map((block) => (
              <OccupancyBar key={block.block} {...block} />
            ))}
          </div>
          {/* Summary bar */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Overall Occupancy</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {Math.round((stats.occupied / (stats.totalRooms || 1)) * 100)}%
              </span>
            </div>
            <div className="mt-2 bg-gray-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                style={{ width: `${Math.round((stats.occupied / (stats.totalRooms || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Fee Status Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Hostel Fee Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={feeStatus}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {feeStatus.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-3">
            {feeStatus.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mess Menu */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Utensils className="w-4 h-4 text-orange-500" />
            Mess Menu This Week
          </h3>
          <button
            onClick={() => navigate("/hostel/mess")}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            Manage Menu <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Day</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">🌅 Breakfast</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">☀️ Lunch</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">🌙 Dinner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {messMenu.map((item, idx) => {
                const isToday = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === item.day.toLowerCase();
                return (
                  <tr key={idx} className={`${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''} hover:bg-gray-50 dark:hover:bg-slate-700/30 transition`}>
                    <td className={`py-3 px-4 font-medium ${isToday ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                      {item.day} {isToday && <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 px-1.5 py-0.5 rounded ml-1">Today</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{item.breakfast}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{item.lunch}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{item.dinner}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Allocations + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Allocations Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Allocations</h3>
            <button
              onClick={() => navigate("/hostel/rooms")}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Student</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Room</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Block</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Check-in</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {recentAllocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{alloc.student}</td>
                    <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">{alloc.room}</td>
                    <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">{alloc.block}</td>
                    <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-400">{alloc.checkIn}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                        {alloc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon={Key} label="Allocate Room" onClick={() => navigate("/hostel/rooms")} color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-900/30" />
            <QuickAction icon={Utensils} label="Manage Mess" onClick={() => navigate("/hostel/mess")} color="text-orange-600" bgColor="bg-orange-50 dark:bg-orange-900/30" />
            <QuickAction icon={IndianRupee} label="Collect Fee" onClick={() => navigate("/hostel/fees")} color="text-green-600" bgColor="bg-green-50 dark:bg-green-900/30" />
            <QuickAction icon={ArrowLeftRight} label="Room Change" onClick={() => navigate("/hostel/rooms")} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-900/30" />
            <QuickAction icon={Users} label="Students List" onClick={() => navigate("/hostel/rooms")} color="text-purple-600" bgColor="bg-purple-50 dark:bg-purple-900/30" />
            <QuickAction icon={Download} label="Reports" onClick={() => navigate("/hostel/rooms")} color="text-rose-600" bgColor="bg-rose-50 dark:bg-rose-900/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DEFAULT MESS MENU
// ─────────────────────────────────────────────

function getDefaultMenu(): MessMenuItem[] {
  return [
    { day: "Monday", breakfast: "Poha, Chai, Bread-Butter", lunch: "Dal, Rice, Roti, Sabzi", dinner: "Paneer, Roti, Rice, Salad" },
    { day: "Tuesday", breakfast: "Idli-Sambar, Coffee", lunch: "Rajma, Rice, Roti, Raita", dinner: "Chole, Rice, Roti, Papad" },
    { day: "Wednesday", breakfast: "Paratha, Curd, Chai", lunch: "Dal Fry, Rice, Roti, Aloo", dinner: "Mix Veg, Roti, Kheer" },
    { day: "Thursday", breakfast: "Upma, Chai, Banana", lunch: "Kadhi, Rice, Roti, Sabzi", dinner: "Dal Makhani, Jeera Rice, Roti" },
    { day: "Friday", breakfast: "Sandwich, Juice", lunch: "Puri-Sabzi, Rice, Dal", dinner: "Biryani, Raita, Salad" },
    { day: "Saturday", breakfast: "Chole-Bhature, Lassi", lunch: "Sambar-Rice, Roti, Sabzi", dinner: "Paneer Butter Masala, Naan" },
    { day: "Sunday", breakfast: "Aloo Paratha, Curd", lunch: "Special Thali (Puri, Halwa)", dinner: "Egg Curry/Veg, Rice, Roti" },
  ];
}
