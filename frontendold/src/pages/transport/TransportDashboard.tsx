
import React, { useState, useEffect, useCallback } from "react";
import {
  Bus,
  Route,
  MapPin,
  Users,
  UserCheck,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Fuel,
  Shield,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

// ============================================
// AXIOS INSTANCE
// ============================================

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================
// TYPES
// ============================================

interface Vehicle {
  id: string;
  vehicleNo: string;
  type: string;
  capacity: number;
  driverName: string;
  driverPhone: string;
  driverLicense: string;
  conductorName?: string;
  conductorPhone?: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  permitExpiry: string;
  fuelType: string;
  status: string;
  _count?: { assignments: number };
}

interface RouteStop {
  id: string;
  routeId: string;
  name: string;
  pickupTime: string;
  dropTime: string;
  sequence: number;
  latitude?: number;
  longitude?: number;
}

interface TransportRoute {
  id: string;
  name: string;
  code: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  estimatedTime: number;
  monthlyFee: number;
  status: string;
  stops: RouteStop[];
  _count?: { assignments: number };
}

interface Assignment {
  id: string;
  studentId: string;
  studentName: string;
  classInfo: string;
  routeId: string;
  stopId: string;
  vehicleId: string;
  assignmentType: string;
  monthlyFee: number;
  startDate: string;
  endDate?: string;
  status: string;
  route?: TransportRoute;
  stop?: RouteStop;
  vehicle?: Vehicle;
}

interface AttendanceRecord {
  id: string;
  assignmentId: string;
  date: string;
  status: string;
  type: string;
  remarks?: string;
  assignment?: Assignment;
}

interface TransportSettings {
  id: string;
  lateFinePerDay: number;
  absentNotification: boolean;
  gpsTrackingEnabled: boolean;
  smsAlertEnabled: boolean;
  maxStudentsPerVehicle: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

const TransportDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "vehicles", label: "Vehicles", icon: Bus },
    { id: "routes", label: "Routes & Stops", icon: Route },
    { id: "assignments", label: "Assignments", icon: Users },
    { id: "attendance", label: "Attendance", icon: UserCheck },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-80px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transport Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage vehicles, routes, assignments & attendance
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "vehicles" && <VehiclesTab />}
        {activeTab === "routes" && <RoutesTab />}
        {activeTab === "assignments" && <AssignmentsTab />}
        {activeTab === "attendance" && <AttendanceTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
};

// ============================================
// DASHBOARD TAB
// ============================================

const DashboardTab: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/transport/dashboard");
      if (res.data.success) setStats(res.data.data);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  const statCards = [
    {
      title: "Total Vehicles",
      value: stats?.totalVehicles || 0,
      icon: Bus,
      gradient: "from-indigo-500 to-purple-600",
    },
    {
      title: "Active Routes",
      value: stats?.activeRoutes || 0,
      icon: Route,
      gradient: "from-purple-500 to-pink-600",
    },
    {
      title: "Total Assignments",
      value: stats?.totalAssignments || 0,
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      title: "Today's Attendance",
      value: `${stats?.attendancePercentage || 0}%`,
      icon: UserCheck,
      gradient: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${card.gradient} rounded-xl p-6 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{card.title}</p>
                  <p className="text-3xl font-bold mt-1">{card.value}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vehicle Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Status</h3>
          <div className="space-y-3">
            {stats?.vehiclesByStatus?.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{item.status}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                  item.status === "MAINTENANCE" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {item.count} vehicles
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Assignments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Assignments</h3>
          <div className="space-y-3">
            {stats?.recentAssignments?.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent assignments</p>
            ) : (
              stats?.recentAssignments?.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{assignment.studentName}</p>
                    <p className="text-xs text-gray-500">{assignment.route?.name} - {assignment.stop?.name}</p>
                  </div>
                  <span className="text-xs text-gray-400">{assignment.classInfo}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// VEHICLES TAB
// ============================================

const VehiclesTab: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await api.get("/transport/vehicles", { params });
      if (res.data.success) {
        setVehicles(res.data.data.vehicles);
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, statusFilter, typeFilter]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/transport/vehicles/${id}`);
      if (res.data.success) {
        toast.success("Vehicle deleted successfully");
        fetchVehicles();
        setDeleteConfirm(null);
      }
    } catch (error) {
      toast.error("Failed to delete vehicle");
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="BUS">Bus</option>
            <option value="VAN">Van</option>
            <option value="AUTO">Auto</option>
          </select>
        </div>
        <button
          onClick={() => { setEditingVehicle(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-medium shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {/* Table */}
      {loading ? <LoadingState /> : vehicles.length === 0 ? (
        <EmptyState message="No vehicles found" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Vehicle No</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Driver</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Capacity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{vehicle.vehicleNo}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                        {vehicle.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-gray-900">{vehicle.driverName}</p>
                        <p className="text-gray-500 text-xs">{vehicle.driverPhone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{vehicle.capacity}</td>
                    <td className="px-4 py-3 text-gray-700">{vehicle._count?.assignments || 0}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={vehicle.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingVehicle(vehicle); setShowModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(vehicle.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar pagination={pagination} onChange={(page) => setPagination(p => ({ ...p, page }))} />
        </div>
      )}

      {/* Vehicle Modal */}
      {showModal && (
        <VehicleModal
          vehicle={editingVehicle}
          onClose={() => { setShowModal(false); setEditingVehicle(null); }}
          onSave={() => { setShowModal(false); setEditingVehicle(null); fetchVehicles(); }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Vehicle"
          message="Are you sure you want to delete this vehicle? This action cannot be undone."
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

// ============================================
// VEHICLE MODAL
// ============================================

const VehicleModal: React.FC<{ vehicle: Vehicle | null; onClose: () => void; onSave: () => void }> = ({ vehicle, onClose, onSave }) => {
  const [form, setForm] = useState<any>({
    vehicleNo: vehicle?.vehicleNo || "",
    type: vehicle?.type || "BUS",
    capacity: vehicle?.capacity || 40,
    driverName: vehicle?.driverName || "",
    driverPhone: vehicle?.driverPhone || "",
    driverLicense: vehicle?.driverLicense || "",
    conductorName: vehicle?.conductorName || "",
    conductorPhone: vehicle?.conductorPhone || "",
    insuranceExpiry: vehicle?.insuranceExpiry?.split("T")[0] || "",
    fitnessExpiry: vehicle?.fitnessExpiry?.split("T")[0] || "",
    permitExpiry: vehicle?.permitExpiry?.split("T")[0] || "",
    fuelType: vehicle?.fuelType || "DIESEL",
    status: vehicle?.status || "ACTIVE",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (vehicle) {
        const res = await api.put(`/transport/vehicles/${vehicle.id}`, form);
        if (res.data.success) toast.success("Vehicle updated successfully");
      } else {
        const res = await api.post("/transport/vehicles", form);
        if (res.data.success) toast.success("Vehicle created successfully");
      }
      onSave();
    } catch (error) {
      toast.error("Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl  shadow-2xl">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-900">
            {vehicle ? "Edit Vehicle" : "Add New Vehicle"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Vehicle No" value={form.vehicleNo} onChange={(v) => setForm({ ...form, vehicleNo: v })} required />
            <SelectField label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={[
              { value: "BUS", label: "Bus" },
              { value: "VAN", label: "Van" },
              { value: "AUTO", label: "Auto" },
            ]} />
            <InputField label="Capacity" type="number" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: parseInt(v) })} required />
            <SelectField label="Fuel Type" value={form.fuelType} onChange={(v) => setForm({ ...form, fuelType: v })} options={[
              { value: "DIESEL", label: "Diesel" },
              { value: "PETROL", label: "Petrol" },
              { value: "CNG", label: "CNG" },
              { value: "ELECTRIC", label: "Electric" },
            ]} />
            <InputField label="Driver Name" value={form.driverName} onChange={(v) => setForm({ ...form, driverName: v })} required />
            <InputField label="Driver Phone" value={form.driverPhone} onChange={(v) => setForm({ ...form, driverPhone: v })} required />
            <InputField label="Driver License" value={form.driverLicense} onChange={(v) => setForm({ ...form, driverLicense: v })} required />
            <InputField label="Conductor Name" value={form.conductorName} onChange={(v) => setForm({ ...form, conductorName: v })} />
            <InputField label="Conductor Phone" value={form.conductorPhone} onChange={(v) => setForm({ ...form, conductorPhone: v })} />
            <SelectField label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
              { value: "MAINTENANCE", label: "Maintenance" },
            ]} />
            <InputField label="Insurance Expiry" type="date" value={form.insuranceExpiry} onChange={(v) => setForm({ ...form, insuranceExpiry: v })} required />
            <InputField label="Fitness Expiry" type="date" value={form.fitnessExpiry} onChange={(v) => setForm({ ...form, fitnessExpiry: v })} required />
            <InputField label="Permit Expiry" type="date" value={form.permitExpiry} onChange={(v) => setForm({ ...form, permitExpiry: v })} required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-medium disabled:opacity-50">
              {saving ? "Saving..." : vehicle ? "Update Vehicle" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// ROUTES & STOPS TAB
// ============================================

const RoutesTab: React.FC = () => {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showStopModal, setShowStopModal] = useState(false);
  const [editingStop, setEditingStop] = useState<RouteStop | null>(null);
  const [stopRouteId, setStopRouteId] = useState<string>("");

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/transport/routes", { params });
      if (res.data.success) {
        setRoutes(res.data.data.routes);
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      toast.error("Failed to load routes");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, statusFilter]);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const handleDeleteRoute = async (id: string) => {
    try {
      const res = await api.delete(`/transport/routes/${id}`);
      if (res.data.success) {
        toast.success("Route deleted successfully");
        fetchRoutes();
        setDeleteConfirm(null);
      }
    } catch (error) {
      toast.error("Failed to delete route");
    }
  };

  const handleDeleteStop = async (stopId: string) => {
    try {
      const res = await api.delete(`/transport/stops/${stopId}`);
      if (res.data.success) {
        toast.success("Stop deleted successfully");
        fetchRoutes();
      }
    } catch (error) {
      toast.error("Failed to delete stop");
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search routes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <button
          onClick={() => { setEditingRoute(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-medium shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Route
        </button>
      </div>

      {/* Routes List */}
      {loading ? <LoadingState /> : routes.length === 0 ? (
        <EmptyState message="No routes found" />
      ) : (
        <div className="space-y-3">
          {routes.map((route) => (
            <div key={route.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}>
                  <div className="bg-indigo-50 p-2.5 rounded-lg">
                    <Route className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{route.name}</h4>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{route.code}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {route.startLocation} → {route.endLocation} | {route.distance} km | {route.estimatedTime} min
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">₹{route.monthlyFee}/month</p>
                      <p className="text-xs text-gray-500">{route._count?.assignments || 0} students</p>
                    </div>
                    <StatusBadge status={route.status} />
                    {expandedRoute === route.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button onClick={() => { setEditingRoute(route); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(route.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Stops */}
              {expandedRoute === route.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700">Stops ({route.stops?.length || 0})</h5>
                    <button
                      onClick={() => { setStopRouteId(route.id); setEditingStop(null); setShowStopModal(true); }}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <Plus className="w-3 h-3" /> Add Stop
                    </button>
                  </div>
                  {route.stops?.length === 0 ? (
                    <p className="text-sm text-gray-500">No stops added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {route.stops?.map((stop) => (
                        <div key={stop.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                              {stop.sequence}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{stop.name}</p>
                              <p className="text-xs text-gray-500">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Pickup: {stop.pickupTime} | Drop: {stop.dropTime}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setStopRouteId(route.id); setEditingStop(stop); setShowStopModal(true); }}
                              className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteStop(stop.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <PaginationBar pagination={pagination} onChange={(page) => setPagination(p => ({ ...p, page }))} />
        </div>
      )}

      {/* Route Modal */}
      {showModal && (
        <RouteModal
          route={editingRoute}
          onClose={() => { setShowModal(false); setEditingRoute(null); }}
          onSave={() => { setShowModal(false); setEditingRoute(null); fetchRoutes(); }}
        />
      )}

      {/* Stop Modal */}
      {showStopModal && (
        <StopModal
          stop={editingStop}
          routeId={stopRouteId}
          onClose={() => { setShowStopModal(false); setEditingStop(null); }}
          onSave={() => { setShowStopModal(false); setEditingStop(null); fetchRoutes(); }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Route"
          message="Are you sure you want to delete this route and all its stops? This action cannot be undone."
          onConfirm={() => handleDeleteRoute(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

// ============================================
// ROUTE MODAL
// ============================================

const RouteModal: React.FC<{ route: TransportRoute | null; onClose: () => void; onSave: () => void }> = ({ route, onClose, onSave }) => {
  const [form, setForm] = useState<any>({
    name: route?.name || "",
    code: route?.code || "",
    startLocation: route?.startLocation || "",
    endLocation: route?.endLocation || "",
    distance: route?.distance || 0,
    estimatedTime: route?.estimatedTime || 30,
    monthlyFee: route?.monthlyFee || 0,
    status: route?.status || "ACTIVE",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (route) {
        const res = await api.put(`/transport/routes/${route.id}`, form);
        if (res.data.success) toast.success("Route updated successfully");
      } else {
        const res = await api.post("/transport/routes", form);
        if (res.data.success) toast.success("Route created successfully");
      }
      onSave();
    } catch (error) {
      toast.error("Failed to save route");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg  shadow-2xl">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-900">{route ? "Edit Route" : "Add New Route"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Route Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <InputField label="Route Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} required />
            <InputField label="Start Location" value={form.startLocation} onChange={(v) => setForm({ ...form, startLocation: v })} required />
            <InputField label="End Location" value={form.endLocation} onChange={(v) => setForm({ ...form, endLocation: v })} required />
            <InputField label="Distance (km)" type="number" value={form.distance} onChange={(v) => setForm({ ...form, distance: parseFloat(v) })} required />
            <InputField label="Estimated Time (min)" type="number" value={form.estimatedTime} onChange={(v) => setForm({ ...form, estimatedTime: parseInt(v) })} required />
            <InputField label="Monthly Fee (₹)" type="number" value={form.monthlyFee} onChange={(v) => setForm({ ...form, monthlyFee: parseFloat(v) })} required />
            <SelectField label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 text-sm font-medium disabled:opacity-50">
              {saving ? "Saving..." : route ? "Update Route" : "Add Route"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// STOP MODAL
// ============================================

const StopModal: React.FC<{ stop: RouteStop | null; routeId: string; onClose: () => void; onSave: () => void }> = ({ stop, routeId, onClose, onSave }) => {
  const [form, setForm] = useState<any>({
    name: stop?.name || "",
    pickupTime: stop?.pickupTime || "07:00",
    dropTime: stop?.dropTime || "16:00",
    sequence: stop?.sequence || 1,
    latitude: stop?.latitude || "",
    longitude: stop?.longitude || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };
      if (stop) {
        const res = await api.put(`/transport/stops/${stop.id}`, payload);
        if (res.data.success) toast.success("Stop updated successfully");
      } else {
        const res = await api.post(`/transport/stops/${routeId}`, payload);
        if (res.data.success) toast.success("Stop added successfully");
      }
      onSave();
    } catch (error) {
      toast.error("Failed to save stop");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{stop ? "Edit Stop" : "Add Stop"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <InputField label="Stop Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Pickup Time" type="time" value={form.pickupTime} onChange={(v) => setForm({ ...form, pickupTime: v })} required />
            <InputField label="Drop Time" type="time" value={form.dropTime} onChange={(v) => setForm({ ...form, dropTime: v })} required />
          </div>
          <InputField label="Sequence" type="number" value={form.sequence} onChange={(v) => setForm({ ...form, sequence: parseInt(v) })} required />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Latitude (optional)" type="number" value={form.latitude} onChange={(v) => setForm({ ...form, latitude: v })} />
            <InputField label="Longitude (optional)" type="number" value={form.longitude} onChange={(v) => setForm({ ...form, longitude: v })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 text-sm font-medium disabled:opacity-50">
              {saving ? "Saving..." : stop ? "Update Stop" : "Add Stop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// ASSIGNMENTS TAB
// ============================================

const AssignmentsTab: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (routeFilter) params.routeId = routeFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/transport/assignments", { params });
      if (res.data.success) {
        setAssignments(res.data.data.assignments);
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, routeFilter, statusFilter]);

  const fetchRoutes = async () => {
    try {
      const res = await api.get("/transport/routes", { params: { limit: 100 } });
      if (res.data.success) setRoutes(res.data.data.routes);
    } catch (error) { /* ignore */ }
  };

  useEffect(() => { fetchAssignments(); fetchRoutes(); }, [fetchAssignments]);

  const handleUnassign = async (id: string) => {
    try {
      const res = await api.delete(`/transport/assignments/${id}`);
      if (res.data.success) {
        toast.success("Student unassigned successfully");
        fetchAssignments();
        setDeleteConfirm(null);
      }
    } catch (error) {
      toast.error("Failed to unassign student");
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Routes</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <button
          onClick={() => { setEditingAssignment(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-medium shadow-md"
        >
          <Plus className="w-4 h-4" /> Assign Student
        </button>
      </div>

      {/* Table */}
      {loading ? <LoadingState /> : assignments.length === 0 ? (
        <EmptyState message="No assignments found" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Class</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Route</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Stop</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Vehicle</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Fee</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{assignment.studentName}</td>
                    <td className="px-4 py-3 text-gray-700">{assignment.classInfo}</td>
                    <td className="px-4 py-3 text-gray-700">{assignment.route?.name || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{assignment.stop?.name || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{assignment.vehicle?.vehicleNo || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                        {assignment.assignmentType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">₹{assignment.monthlyFee}</td>
                    <td className="px-4 py-3"><StatusBadge status={assignment.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingAssignment(assignment); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(assignment.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar pagination={pagination} onChange={(page) => setPagination(p => ({ ...p, page }))} />
        </div>
      )}

      {/* Assignment Modal */}
      {showModal && (
        <AssignmentModal
          assignment={editingAssignment}
          routes={routes}
          onClose={() => { setShowModal(false); setEditingAssignment(null); }}
          onSave={() => { setShowModal(false); setEditingAssignment(null); fetchAssignments(); }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmModal
          title="Unassign Student"
          message="Are you sure you want to unassign this student from transport?"
          onConfirm={() => handleUnassign(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

// ============================================
// ASSIGNMENT MODAL
// ============================================

const AssignmentModal: React.FC<{ assignment: Assignment | null; routes: TransportRoute[]; onClose: () => void; onSave: () => void }> = ({ assignment, routes, onClose, onSave }) => {
  const [form, setForm] = useState<any>({
    studentId: assignment?.studentId || "",
    studentName: assignment?.studentName || "",
    classInfo: assignment?.classInfo || "",
    routeId: assignment?.routeId || "",
    stopId: assignment?.stopId || "",
    vehicleId: assignment?.vehicleId || "",
    assignmentType: assignment?.assignmentType || "BOTH",
    monthlyFee: assignment?.monthlyFee || 0,
    startDate: assignment?.startDate?.split("T")[0] || new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  useEffect(() => {
    fetchVehicles();
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (form.routeId) {
      const selectedRoute = routes.find(r => r.id === form.routeId);
      if (selectedRoute && !assignment) {
        setForm((f: any) => ({ ...f, monthlyFee: selectedRoute.monthlyFee }));
      }
      // Fetch stops separately for selected route
      const fetchStops = async () => {
        try {
          const res = await api.get(`/transport/routes/${form.routeId}`);
          if (res.data.success) {
            setStops(res.data.data.stops || []);
          }
        } catch (error) { setStops([]); }
      }
      fetchStops();
    }
  }, [form.routeId, routes]);

  // Fetch Academic Years
  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic");
      const raw = res.data?.data || res.data || [];
      const years = Array.isArray(raw) ? raw : [];
      setAcademicYears(years);
      const current = years.find((y: any) => y.isCurrent || y.isActive) || years[0];
      if (current && !assignment) {
        setSelectedAcademicYear(current.id);
      }
    } catch (error) { /* ignore */ }
  };

  // Fetch Classes when Academic Year changes
  useEffect(() => {
    if (selectedAcademicYear) {
      fetchClasses();
      setSelectedClass("");
      setSelectedSection("");
      setStudents([]);
    }
  }, [selectedAcademicYear]);

  const fetchClasses = async () => {
    try {
      const res = await api.get("/class", { params: { academicYearId: selectedAcademicYear } });
      const raw = res.data?.data || res.data || [];
      setClasses(Array.isArray(raw) ? raw : []);
    } catch (error) { setClasses([]); }
  };

  // Fetch Sections when Class changes
  useEffect(() => {
    if (selectedClass) {
      fetchSections();
      setSelectedSection("");
      setStudents([]);
    }
  }, [selectedClass]);

  const fetchSections = async () => {
    try {
      const res = await api.get("/section", { params: { classId: selectedClass } });
      const raw = res.data?.data || res.data || [];
      setSections(Array.isArray(raw) ? raw : []);
    } catch (error) { setSections([]); }
  };

  // Fetch Students when Section changes
  useEffect(() => {
    if (selectedSection) {
      fetchStudents();
    }
  }, [selectedSection]);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/students", { params: { classId: selectedClass, sectionId: selectedSection, academicYearId: selectedAcademicYear, limit: 200 } });
      const raw = res.data?.data?.students || res.data?.data || res.data || [];
      setStudents(Array.isArray(raw) ? raw : []);
    } catch (error) { setStudents([]); }
  };

  // When student is selected from dropdown
  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s: any) => s.id === studentId);
    if (student) {
      const className = classes.find((c: any) => c.id === selectedClass)?.name || "";
      const sectionName = sections.find((s: any) => s.id === selectedSection)?.name || "";
      setForm({
        ...form,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        classInfo: `${className} - ${sectionName}`,
      });
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/transport/vehicles", { params: { limit: 100, status: "ACTIVE" } });
      if (res.data.success) setVehicles(res.data.data.vehicles);
    } catch (error) { /* ignore */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (assignment) {
        const res = await api.put(`/transport/assignments/${assignment.id}`, form);
        if (res.data.success) toast.success("Assignment updated successfully");
      } else {
        const res = await api.post("/transport/assignments", form);
        if (res.data.success) toast.success("Student assigned successfully");
      }
      onSave();
    } catch (error) {
      toast.error("Failed to save assignment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl  shadow-2xl">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-900">{assignment ? "Edit Assignment" : "Assign Student"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Academic Year / Class / Section / Student Selection */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Student</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SelectField label="Academic Year" value={selectedAcademicYear} onChange={(v) => setSelectedAcademicYear(v)} options={[
                { value: "", label: "Select Year" },
                ...academicYears.map((y: any) => ({ value: y.id, label: y.name }))
              ]} />
              <SelectField label="Class" value={selectedClass} onChange={(v) => setSelectedClass(v)} options={[
                { value: "", label: "Select Class" },
                ...classes.map((c: any) => ({ value: c.id, label: c.name }))
              ]} />
              <SelectField label="Section" value={selectedSection} onChange={(v) => setSelectedSection(v)} options={[
                { value: "", label: "Select Section" },
                ...sections.map((s: any) => ({ value: s.id, label: s.name }))
              ]} />
            </div>
            <SelectField label="Student" value={form.studentId} onChange={(v) => handleStudentSelect(v)} options={[
              { value: "", label: students.length === 0 ? "Select Class & Section first" : "Select Student" },
              ...students.map((s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNo})` }))
            ]} />
            {form.studentName && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-indigo-50 rounded-lg">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">{form.studentName}</span>
                <span className="text-xs text-indigo-500">({form.classInfo})</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Route" value={form.routeId} onChange={(v) => setForm({ ...form, routeId: v, stopId: "" })} options={[
              { value: "", label: "Select Route" },
              ...routes.map(r => ({ value: r.id, label: `${r.name} (${r.code})` }))
            ]} />
            <SelectField label="Stop" value={form.stopId} onChange={(v) => setForm({ ...form, stopId: v })} options={[
              { value: "", label: "Select Stop" },
              ...stops.map(s => ({ value: s.id, label: `${s.name} (${s.pickupTime})` }))
            ]} />
            <SelectField label="Vehicle" value={form.vehicleId} onChange={(v) => setForm({ ...form, vehicleId: v })} options={[
              { value: "", label: "Select Vehicle" },
              ...vehicles.map(v => ({ value: v.id, label: `${v.vehicleNo} (${v.type})` }))
            ]} />
            <SelectField label="Assignment Type" value={form.assignmentType} onChange={(v) => setForm({ ...form, assignmentType: v })} options={[
              { value: "BOTH", label: "Both (Pickup & Drop)" },
              { value: "PICKUP", label: "Pickup Only" },
              { value: "DROP", label: "Drop Only" },
            ]} />
            <InputField label="Monthly Fee (₹)" type="number" value={form.monthlyFee} onChange={(v) => setForm({ ...form, monthlyFee: parseFloat(v) })} required />
            <InputField label="Start Date" type="date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 text-sm font-medium disabled:opacity-50">
              {saving ? "Saving..." : assignment ? "Update" : "Assign Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// ATTENDANCE TAB
// ============================================

const AttendanceTab: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [routeFilter, setRouteFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("PICKUP");
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchRoutes(); }, []);
  useEffect(() => { if (routeFilter) fetchStudentsAndAttendance(); }, [routeFilter, date, typeFilter]);

  const fetchRoutes = async () => {
    try {
      const res = await api.get("/transport/routes", { params: { limit: 100, status: "ACTIVE" } });
      if (res.data.success) setRoutes(res.data.data.routes);
    } catch (error) { toast.error("Failed to load routes"); }
  };

  const fetchStudentsAndAttendance = async () => {
    try {
      setLoading(true);
      const [assignRes, attRes] = await Promise.all([
        api.get("/transport/assignments", { params: { routeId: routeFilter, status: "ACTIVE", limit: 100 } }),
        api.get("/transport/attendance", { params: { date, routeId: routeFilter, type: typeFilter } }),
      ]);

      if (assignRes.data.success) setAssignments(assignRes.data.data.assignments);

      if (attRes.data.success) {
        const records: Record<string, string> = {};
        attRes.data.data.forEach((att: any) => {
          records[att.assignmentId] = att.status;
        });
        setAttendanceRecords(records);
      }
    } catch (error) {
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (assignmentId: string, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [assignmentId]: prev[assignmentId] === status ? "PRESENT" : status,
    }));
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      const records = assignments.map(a => ({
        assignmentId: a.id,
        status: attendanceRecords[a.id] || "PRESENT",
        type: typeFilter,
      }));

      const res = await api.post("/transport/attendance", { date, records });
      if (res.data.success) toast.success("Attendance saved successfully");
    } catch (error) {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Route</label>
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Route</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
            <div className="flex gap-1">
              <button
                onClick={() => setTypeFilter("PICKUP")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === "PICKUP" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Pickup
              </button>
              <button
                onClick={() => setTypeFilter("DROP")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === "DROP" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Drop
              </button>
            </div>
          </div>
          {routeFilter && assignments.length > 0 && (
            <div className="ml-auto">
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 text-sm font-medium disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Attendance
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Attendance List */}
      {!routeFilter ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Select a route to mark attendance</p>
        </div>
      ) : loading ? <LoadingState /> : assignments.length === 0 ? (
        <EmptyState message="No students assigned to this route" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Class</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Stop</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Present</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Absent</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map((assignment, idx) => {
                  const currentStatus = attendanceRecords[assignment.id] || "PRESENT";
                  return (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{assignment.studentName}</td>
                      <td className="px-4 py-3 text-gray-700">{assignment.classInfo}</td>
                      <td className="px-4 py-3 text-gray-700">{assignment.stop?.name || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleAttendance(assignment.id, "PRESENT")}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${currentStatus === "PRESENT" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400 hover:bg-green-50"}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleAttendance(assignment.id, "ABSENT")}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${currentStatus === "ABSENT" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400 hover:bg-red-50"}`}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleAttendance(assignment.id, "LATE")}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${currentStatus === "LATE" ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-400 hover:bg-yellow-50"}`}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Summary */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center gap-6">
            <span className="text-sm text-gray-600">
              Total: <strong>{assignments.length}</strong>
            </span>
            <span className="text-sm text-green-600">
              Present: <strong>{Object.values(attendanceRecords).filter(s => s === "PRESENT").length || assignments.length - Object.values(attendanceRecords).filter(s => s !== "PRESENT").length}</strong>
            </span>
            <span className="text-sm text-red-600">
              Absent: <strong>{Object.values(attendanceRecords).filter(s => s === "ABSENT").length}</strong>
            </span>
            <span className="text-sm text-yellow-600">
              Late: <strong>{Object.values(attendanceRecords).filter(s => s === "LATE").length}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// REPORTS TAB
// ============================================

const ReportsTab: React.FC = () => {
  const [reportType, setReportType] = useState("route-students");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get(`/transport/reports/${reportType}`, { params });
      if (res.data.success) setReportData(res.data.data);
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [reportType]);

  return (
    <div className="space-y-4">
      {/* Report Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="route-students">Route-wise Students</option>
              <option value="vehicle-utilization">Vehicle Utilization</option>
              <option value="fee-collection">Fee Collection</option>
              <option value="attendance">Attendance Report</option>
            </select>
          </div>
          {reportType === "attendance" && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
            </>
          )}
          <button
            onClick={fetchReport}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Generate
          </button>
        </div>
      </div>

      {/* Report Content */}
      {loading ? <LoadingState /> : !reportData ? (
        <EmptyState message="No report data available" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {reportType === "route-students" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Route</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Students</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Monthly Fee</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Array.isArray(reportData) && reportData.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.routeName}</td>
                      <td className="px-4 py-3 text-gray-700">{item.routeCode}</td>
                      <td className="px-4 py-3 text-gray-700">{item.totalStudents}</td>
                      <td className="px-4 py-3 text-gray-700">₹{item.monthlyFee}</td>
                      <td className="px-4 py-3 font-medium text-indigo-600">₹{item.totalRevenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === "vehicle-utilization" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Vehicle</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Capacity</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Available</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Array.isArray(reportData) && reportData.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.vehicleNo}</td>
                      <td className="px-4 py-3 text-gray-700">{item.type}</td>
                      <td className="px-4 py-3 text-gray-700">{item.capacity}</td>
                      <td className="px-4 py-3 text-gray-700">{item.assigned}</td>
                      <td className="px-4 py-3 text-gray-700">{item.available}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div className={`h-2 rounded-full ${item.utilization > 80 ? "bg-red-500" : item.utilization > 50 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(item.utilization, 100)}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{item.utilization}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === "fee-collection" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
                  <p className="text-white/80 text-sm">Total Students</p>
                  <p className="text-2xl font-bold">{reportData.totalStudents}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                  <p className="text-white/80 text-sm">Total Monthly Fee</p>
                  <p className="text-2xl font-bold">₹{reportData.totalMonthlyFee?.toLocaleString()}</p>
                </div>
              </div>
              <h4 className="font-medium text-gray-900 mb-3">Route-wise Breakdown</h4>
              <div className="space-y-2">
                {reportData.routeWise?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.routeName}</p>
                      <p className="text-xs text-gray-500">{item.students} students</p>
                    </div>
                    <p className="text-sm font-medium text-indigo-600">₹{item.totalFee?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportType === "attendance" && reportData && (
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{reportData.totalRecords}</p>
                  <p className="text-xs text-blue-600">Total Records</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{reportData.presentCount}</p>
                  <p className="text-xs text-green-600">Present</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{reportData.absentCount}</p>
                  <p className="text-xs text-red-600">Absent</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-700">{reportData.lateCount}</p>
                  <p className="text-xs text-yellow-600">Late</p>
                </div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-indigo-700">{reportData.attendancePercentage}%</p>
                <p className="text-sm text-indigo-600">Overall Attendance</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// SETTINGS TAB
// ============================================

const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<TransportSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/transport/settings");
      if (res.data.success) setSettings(res.data.data);
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const res = await api.put("/transport/settings", settings);
      if (res.data.success) toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!settings) return <EmptyState message="Failed to load settings" />;

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Transport Settings</h3>
          <p className="text-sm text-gray-500">Configure transport module preferences</p>
        </div>

        <div className="space-y-5">
          {/* Late Fine */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Late Fine Per Day (₹)</label>
            <input
              type="number"
              value={settings.lateFinePerDay}
              onChange={(e) => setSettings({ ...settings, lateFinePerDay: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Fine amount per day for late arrivals</p>
          </div>

          {/* Max Students */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Students Per Vehicle</label>
            <input
              type="number"
              value={settings.maxStudentsPerVehicle}
              onChange={(e) => setSettings({ ...settings, maxStudentsPerVehicle: parseInt(e.target.value) || 50 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum allowed students per vehicle</p>
          </div>

          {/* Toggle Settings */}
          <div className="space-y-4 pt-2">
            <ToggleSetting
              label="Absent Notification"
              description="Send notification when student is marked absent"
              value={settings.absentNotification}
              onChange={(v) => setSettings({ ...settings, absentNotification: v })}
            />
            <ToggleSetting
              label="GPS Tracking"
              description="Enable GPS tracking for vehicles"
              value={settings.gpsTrackingEnabled}
              onChange={(v) => setSettings({ ...settings, gpsTrackingEnabled: v })}
            />
            <ToggleSetting
              label="SMS Alerts"
              description="Send SMS alerts to parents for pickup/drop"
              value={settings.smsAlertEnabled}
              onChange={(v) => setSettings({ ...settings, smsAlertEnabled: v })}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-medium disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SHARED COMPONENTS
// ============================================

const InputField: React.FC<{
  label: string;
  value: any;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, type = "text", required, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      step={type === "number" ? "any" : undefined}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
    />
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}> = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    INACTIVE: "bg-red-100 text-red-700",
    MAINTENANCE: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
};

const ToggleSetting: React.FC<{
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, description, value, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-indigo-600" : "bg-gray-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </div>
);

const PaginationBar: React.FC<{ pagination: Pagination; onChange: (page: number) => void }> = ({ pagination, onChange }) => {
  if (pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
      <p className="text-sm text-gray-600">
        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
          const pageNum = i + 1;
          return (
            <button
              key={pageNum}
              onClick={() => onChange(pageNum)}
              className={`px-3 py-1.5 text-sm rounded-lg ${pagination.page === pageNum ? "bg-indigo-600 text-white" : "border border-gray-300 hover:bg-gray-100"}`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center p-12">
    <div className="flex flex-col items-center gap-3">
      <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-gray-200">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
        <FileText className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  </div>
);

const ConfirmModal: React.FC<{
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium">
          Cancel
        </button>
        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
          Confirm
        </button>
      </div>
    </div>
  </div>
);

export default TransportDashboard;

