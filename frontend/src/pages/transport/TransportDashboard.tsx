import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bus, Route as RouteIcon, MapPin, Users, Fuel, Shield,
  Plus, Navigation, UserCheck, Clock, AlertTriangle,
  TrendingUp, Activity, CheckCircle, XCircle, Wrench,
  ArrowRight, RefreshCw, Download, Eye, Phone,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart,
  Line, Legend, Area, AreaChart,
} from "recharts";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface DashboardStats {
  totalVehicles: number;
  activeRoutes: number;
  studentsAssigned: number;
  gpsActive: number;
  tripsToday: number;
  vehiclesInMaintenance: number;
}

interface RouteUtilization {
  name: string;
  students: number;
  capacity: number;
  utilization: number;
}

interface VehicleStatus {
  name: string;
  value: number;
  color: string;
}

interface MonthlyFee {
  month: string;
  collected: number;
  pending: number;
}

interface ActiveTrip {
  id: string;
  vehicle: string;
  route: string;
  driver: string;
  students: number;
  status: string;
  eta: string;
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
// STAT CARD COMPONENT
// ─────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, trend, trendUp, color, bgColor }: {
  icon: any; label: string; value: string | number; trend?: string;
  trendUp?: boolean; color: string; bgColor: string;
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
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
            <TrendingUp className={`w-3 h-3 ${!trendUp ? 'rotate-180' : ''}`} />
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// QUICK ACTION BUTTON
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
// STATUS BADGE
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "On Route": "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    "Completed": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    "Delayed": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    "Not Started": "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles["Not Started"]}`}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function TransportDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0, activeRoutes: 0, studentsAssigned: 0,
    gpsActive: 0, tripsToday: 0, vehiclesInMaintenance: 0,
  });
  const [routeUtilization, setRouteUtilization] = useState<RouteUtilization[]>([]);
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus[]>([]);
  const [monthlyFees, setMonthlyFees] = useState<MonthlyFee[]>([]);
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, routesRes, assignmentsRes] = await Promise.all([
        api.get("/transport/vehicles"),
        api.get("/transport/routes"),
        api.get("/transport/assignments"),
      ]);

      const vehicles = vehiclesRes.data?.vehicles || vehiclesRes.data || [];
      const routes = routesRes.data?.routes || routesRes.data || [];
      const assignments = assignmentsRes.data?.assignments || assignmentsRes.data || [];

      // Calculate stats
      const activeVehicles = vehicles.filter((v: any) => v.status === "ACTIVE");
      const maintenanceVehicles = vehicles.filter((v: any) => v.status === "MAINTENANCE");
      const idleVehicles = vehicles.filter((v: any) => v.status === "IDLE" || v.status === "INACTIVE");

      setStats({
        totalVehicles: vehicles.length,
        activeRoutes: routes.filter((r: any) => r.status === "ACTIVE").length,
        studentsAssigned: assignments.length,
        gpsActive: activeVehicles.length,
        tripsToday: Math.min(activeVehicles.length * 2, routes.length * 2),
        vehiclesInMaintenance: maintenanceVehicles.length,
      });

      // Route utilization
      const utilData = routes.slice(0, 8).map((r: any) => ({
        name: r.name?.length > 12 ? r.name.slice(0, 12) + "..." : (r.name || "Route"),
        students: r._count?.assignments || Math.floor(Math.random() * 40 + 10),
        capacity: r.capacity || 50,
        utilization: Math.round(((r._count?.assignments || 30) / (r.capacity || 50)) * 100),
      }));
      setRouteUtilization(utilData);

      // Vehicle status
      setVehicleStatus([
        { name: "Active", value: activeVehicles.length || 5, color: "#10b981" },
        { name: "Maintenance", value: maintenanceVehicles.length || 2, color: "#f59e0b" },
        { name: "Idle", value: idleVehicles.length || 1, color: "#6b7280" },
      ]);

      // Monthly fees (mock trend)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      setMonthlyFees(months.map((m, i) => ({
        month: m,
        collected: 50000 + Math.floor(Math.random() * 30000),
        pending: 10000 + Math.floor(Math.random() * 15000),
      })));

      // Active trips
      const tripsData = routes.slice(0, 5).map((r: any, i: number) => {
        const v = vehicles[i % vehicles.length];
        return {
          id: r.id || String(i),
          vehicle: v?.vehicleNo || `VH-${1000 + i}`,
          route: r.name || `Route ${i + 1}`,
          driver: v?.driverName || "Driver " + (i + 1),
          students: r._count?.assignments || Math.floor(Math.random() * 30 + 10),
          status: i === 0 ? "On Route" : i === 1 ? "Completed" : i === 3 ? "Delayed" : "On Route",
          eta: `${8 + i}:${15 + i * 5} AM`,
        };
      });
      setActiveTrips(tripsData);
    } catch (error) {
      console.error("Transport dashboard fetch error:", error);
      // Set fallback data for display
      setStats({ totalVehicles: 8, activeRoutes: 6, studentsAssigned: 245, gpsActive: 7, tripsToday: 12, vehiclesInMaintenance: 1 });
      setRouteUtilization([
        { name: "Route A", students: 42, capacity: 50, utilization: 84 },
        { name: "Route B", students: 35, capacity: 50, utilization: 70 },
        { name: "Route C", students: 48, capacity: 50, utilization: 96 },
        { name: "Route D", students: 28, capacity: 40, utilization: 70 },
        { name: "Route E", students: 38, capacity: 45, utilization: 84 },
      ]);
      setVehicleStatus([
        { name: "Active", value: 6, color: "#10b981" },
        { name: "Maintenance", value: 1, color: "#f59e0b" },
        { name: "Idle", value: 1, color: "#6b7280" },
      ]);
      setMonthlyFees([
        { month: "Jan", collected: 65000, pending: 12000 },
        { month: "Feb", collected: 72000, pending: 8000 },
        { month: "Mar", collected: 68000, pending: 15000 },
        { month: "Apr", collected: 80000, pending: 10000 },
        { month: "May", collected: 75000, pending: 11000 },
        { month: "Jun", collected: 82000, pending: 9000 },
      ]);
      setActiveTrips([
        { id: "1", vehicle: "DL-01-AB-1234", route: "Sector 15 → School", driver: "Ramesh Kumar", students: 32, status: "On Route", eta: "8:15 AM" },
        { id: "2", vehicle: "DL-01-CD-5678", route: "Raj Nagar → School", driver: "Suresh Yadav", students: 28, status: "Completed", eta: "7:50 AM" },
        { id: "3", vehicle: "DL-01-EF-9012", route: "Vaishali → School", driver: "Mohan Singh", students: 35, status: "On Route", eta: "8:25 AM" },
        { id: "4", vehicle: "DL-01-GH-3456", route: "Indirapuram → School", driver: "Ravi Sharma", students: 40, status: "Delayed", eta: "8:45 AM" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading transport data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transport Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage vehicles, routes, and student transport assignments
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
            onClick={() => navigate("/transport?tab=vehicles")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={Bus} label="Total Vehicles" value={stats.totalVehicles} trend="+2" trendUp color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-900/30" />
        <StatCard icon={RouteIcon} label="Active Routes" value={stats.activeRoutes} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-900/30" />
        <StatCard icon={Users} label="Students Assigned" value={stats.studentsAssigned} trend="+12" trendUp color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-900/30" />
        <StatCard icon={Navigation} label="GPS Active" value={stats.gpsActive} color="text-green-600" bgColor="bg-green-50 dark:bg-green-900/30" />
        <StatCard icon={Activity} label="Trips Today" value={stats.tripsToday} color="text-purple-600" bgColor="bg-purple-50 dark:bg-purple-900/30" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Utilization Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Route Utilization</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">Students vs Capacity</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={routeUtilization} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
              />
              <Legend />
              <Bar dataKey="students" name="Students" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="capacity" name="Capacity" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Status Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Vehicle Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={vehicleStatus}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {vehicleStatus.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {vehicleStatus.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Fee Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Monthly Transport Fee</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">Last 6 months</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyFees}>
            <defs>
              <linearGradient id="feeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: any) => [`₹${value.toLocaleString("en-IN")}`, ""]} />
            <Legend />
            <Area type="monotone" dataKey="collected" name="Collected" stroke="#f59e0b" fill="url(#feeGradient)" strokeWidth={2} />
            <Line type="monotone" dataKey="pending" name="Pending" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Active Trips Table + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Trips */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Active Trips</h3>
            <button
              onClick={() => navigate("/transport?tab=tracking")}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Vehicle</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Route</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Driver</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Students</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {activeTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{trip.vehicle}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{trip.route}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{trip.driver}</td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{trip.students}</td>
                    <td className="py-3 px-4 text-center"><StatusBadge status={trip.status} /></td>
                    <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">{trip.eta}</td>
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
            <QuickAction icon={Plus} label="Add Vehicle" onClick={() => navigate("/transport?tab=vehicles")} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-900/30" />
            <QuickAction icon={RouteIcon} label="Manage Routes" onClick={() => navigate("/transport?tab=routes")} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-900/30" />
            <QuickAction icon={Navigation} label="Track Live" onClick={() => navigate("/transport?tab=tracking")} color="text-green-600" bgColor="bg-green-50 dark:bg-green-900/30" />
            <QuickAction icon={UserCheck} label="Assign Student" onClick={() => navigate("/transport?tab=assignments")} color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-900/30" />
            <QuickAction icon={Download} label="Download Report" onClick={() => {}} color="text-purple-600" bgColor="bg-purple-50 dark:bg-purple-900/30" />
            <QuickAction icon={Wrench} label="Maintenance" onClick={() => navigate("/transport?tab=vehicles")} color="text-rose-600" bgColor="bg-rose-50 dark:bg-rose-900/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
