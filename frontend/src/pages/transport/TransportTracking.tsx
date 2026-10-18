import { useState, useEffect } from "react";
import {
  MapPin,
  Bus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Navigation,
  Users,
  Phone,
  RefreshCw,
  ChevronRight,
  Bell,
} from "lucide-react";

//////////////////////////////////////////////////////
// 🚌 TRANSPORT LIVE TRACKING PAGE
// - Live vehicle map placeholder (Google Maps/Leaflet)
// - Vehicle status cards (online/offline)
// - Active trips list
// - Recent alerts
// - Student pickup/drop status
// - ETA display for parents
//////////////////////////////////////////////////////

interface VehicleStatus {
  id: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  route: string;
  status: "online" | "offline" | "delayed" | "en-route";
  speed: number;
  lastUpdate: string;
  studentsOnboard: number;
  totalCapacity: number;
  eta?: string;
  currentStop?: string;
  nextStop?: string;
  latitude?: number;
  longitude?: number;
}

interface TripAlert {
  id: string;
  type: "delay" | "breakdown" | "deviation" | "sos" | "geofence";
  vehicleNo: string;
  message: string;
  time: string;
  resolved: boolean;
}

interface StudentPickupStatus {
  id: string;
  name: string;
  class: string;
  stop: string;
  status: "waiting" | "picked" | "dropped" | "absent";
  time?: string;
}

export default function TransportTracking() {
  const [vehicles, setVehicles] = useState<VehicleStatus[]>([]);
  const [alerts, setAlerts] = useState<TripAlert[]>([]);
  const [studentStatus, setStudentStatus] = useState<StudentPickupStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "list" | "alerts">("map");

  useEffect(() => {
    // Simulated data - replace with API calls
    setTimeout(() => {
      setVehicles([
        {
          id: "1", vehicleNo: "KA-01-AB-1234", driverName: "Rajesh Kumar",
          driverPhone: "+91 9876543210", route: "Route A - Koramangala",
          status: "online", speed: 32, lastUpdate: "2 min ago",
          studentsOnboard: 28, totalCapacity: 40, eta: "8:15 AM",
          currentStop: "4th Block", nextStop: "Forum Mall",
        },
        {
          id: "2", vehicleNo: "KA-01-CD-5678", driverName: "Suresh Patel",
          driverPhone: "+91 9876543211", route: "Route B - Whitefield",
          status: "en-route", speed: 45, lastUpdate: "1 min ago",
          studentsOnboard: 35, totalCapacity: 45, eta: "8:25 AM",
          currentStop: "ITPL Gate", nextStop: "Phoenix Mall",
        },
        {
          id: "3", vehicleNo: "KA-01-EF-9012", driverName: "Ahmed Khan",
          driverPhone: "+91 9876543212", route: "Route C - Electronic City",
          status: "delayed", speed: 12, lastUpdate: "5 min ago",
          studentsOnboard: 22, totalCapacity: 35, eta: "8:40 AM",
          currentStop: "Silk Board", nextStop: "Bommasandra",
        },
        {
          id: "4", vehicleNo: "KA-01-GH-3456", driverName: "Mohan Das",
          driverPhone: "+91 9876543213", route: "Route D - Hebbal",
          status: "offline", speed: 0, lastUpdate: "1 hour ago",
          studentsOnboard: 0, totalCapacity: 40,
        },
      ]);
      setAlerts([
        { id: "1", type: "delay", vehicleNo: "KA-01-EF-9012", message: "Heavy traffic at Silk Board junction. Delay of ~15 min.", time: "5 min ago", resolved: false },
        { id: "2", type: "geofence", vehicleNo: "KA-01-CD-5678", message: "Vehicle entered school zone", time: "10 min ago", resolved: true },
        { id: "3", type: "sos", vehicleNo: "KA-01-AB-1234", message: "Speed bump alert near Forum Mall", time: "15 min ago", resolved: true },
      ]);
      setStudentStatus([
        { id: "1", name: "Arjun Sharma", class: "10-A", stop: "4th Block", status: "picked", time: "7:45 AM" },
        { id: "2", name: "Priya Reddy", class: "8-B", stop: "Forum Mall", status: "waiting" },
        { id: "3", name: "Rahul Verma", class: "9-C", stop: "Bommasandra", status: "waiting" },
        { id: "4", name: "Sneha Gupta", class: "7-A", stop: "ITPL Gate", status: "picked", time: "7:50 AM" },
        { id: "5", name: "Karthik Nair", class: "10-B", stop: "Silk Board", status: "absent" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const onlineCount = vehicles.filter(v => v.status === "online" || v.status === "en-route").length;
  const offlineCount = vehicles.filter(v => v.status === "offline").length;
  const delayedCount = vehicles.filter(v => v.status === "delayed").length;

  const getStatusColor = (status: VehicleStatus["status"]) => {
    switch (status) {
      case "online": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "en-route": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "delayed": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "offline": return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getAlertIcon = (type: TripAlert["type"]) => {
    switch (type) {
      case "delay": return <Clock size={16} className="text-amber-500" />;
      case "breakdown": return <AlertTriangle size={16} className="text-red-500" />;
      case "deviation": return <Navigation size={16} className="text-orange-500" />;
      case "sos": return <Bell size={16} className="text-red-500" />;
      case "geofence": return <MapPin size={16} className="text-blue-500" />;
    }
  };

  const getStudentStatusBadge = (status: StudentPickupStatus["status"]) => {
    switch (status) {
      case "picked": return <span className="badge bg-green-100 text-green-700">Picked Up</span>;
      case "dropped": return <span className="badge bg-blue-100 text-blue-700">Dropped</span>;
      case "waiting": return <span className="badge bg-amber-100 text-amber-700">Waiting</span>;
      case "absent": return <span className="badge bg-red-100 text-red-700">Absent</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl" />)}
        </div>
        <div className="h-96 bg-gray-200 dark:bg-slate-700 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Live Tracking
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time vehicle monitoring & student status
          </p>
        </div>
        <button
          onClick={() => setLoading(true)}
          className="btn-secondary self-start"
          aria-label="Refresh data"
        >
          <RefreshCw size={16} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Wifi size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{onlineCount}</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <WifiOff size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{offlineCount}</p>
              <p className="text-xs text-gray-500">Offline</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{delayedCount}</p>
              <p className="text-xs text-gray-500">Delayed</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {vehicles.reduce((sum, v) => sum + v.studentsOnboard, 0)}
              </p>
              <p className="text-xs text-gray-500">On Board</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Map Placeholder - Takes 2 cols on desktop */}
        <div className="lg:col-span-2 card overflow-hidden">
          {/* Mobile tabs */}
          <div className="flex border-b border-gray-100 dark:border-slate-700 lg:hidden">
            {(["map", "list", "alerts"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "text-primary-500 border-b-2 border-primary-500"
                    : "text-gray-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Map area */}
          <div className={`${activeTab !== "map" ? "hidden lg:block" : ""}`}>
            <div className="relative h-[300px] md:h-[400px] bg-gradient-to-br from-blue-50 to-green-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
              {/* Placeholder for Google Maps/Leaflet */}
              <div className="text-center p-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-white dark:bg-slate-600 rounded-full flex items-center justify-center shadow-lg">
                  <MapPin size={32} className="text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Live Vehicle Map
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  Integration point for Google Maps or Leaflet.
                  Connect your GPS tracking provider to see real-time vehicle positions.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <span>{onlineCount} vehicles broadcasting</span>
                </div>
              </div>

              {/* Floating vehicle markers (decorative) */}
              <div className="absolute top-8 left-8 bg-white dark:bg-slate-700 rounded-lg shadow-md px-3 py-1.5 flex items-center gap-2 animate-pulse-soft">
                <Bus size={14} className="text-green-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">KA-01-AB-1234</span>
              </div>
              <div className="absolute bottom-12 right-12 bg-white dark:bg-slate-700 rounded-lg shadow-md px-3 py-1.5 flex items-center gap-2 animate-pulse-soft">
                <Bus size={14} className="text-blue-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">KA-01-CD-5678</span>
              </div>
            </div>
          </div>

          {/* Vehicle list (mobile tab) */}
          <div className={`${activeTab !== "list" ? "hidden lg:hidden" : ""} p-4 space-y-3`}>
            {vehicles.map(v => (
              <VehicleCard key={v.id} vehicle={v} onClick={() => setSelectedVehicle(v.id)} />
            ))}
          </div>
        </div>

        {/* Right Panel - Vehicle Details & Alerts */}
        <div className="space-y-4">
          {/* Active Vehicles */}
          <div className={`card ${activeTab !== "map" && activeTab !== "list" ? "" : "hidden lg:block"}`}>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Active Trips</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[280px] overflow-y-auto scrollbar-thin">
              {vehicles.filter(v => v.status !== "offline").map(v => (
                <VehicleCard key={v.id} vehicle={v} compact onClick={() => setSelectedVehicle(v.id)} />
              ))}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className={`card ${activeTab === "alerts" || activeTab === "map" ? "" : "hidden lg:block"}`}>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Recent Alerts</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[250px] overflow-y-auto scrollbar-thin">
              {alerts.map(alert => (
                <div key={alert.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{alert.vehicleNo}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{alert.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{alert.time}</p>
                  </div>
                  {alert.resolved && (
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Student Pickup/Drop Status */}
      <div className="card">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-white">
            Student Pickup Status
          </h3>
          <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
            {studentStatus.filter(s => s.status === "picked").length}/{studentStatus.length} picked
          </span>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-slate-700">
          {studentStatus.map(student => (
            <div key={student.id} className="px-4 md:px-6 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                  {student.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{student.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{student.class} • {student.stop}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {student.time && <span className="text-xs text-gray-400">{student.time}</span>}
                {getStudentStatusBadge(student.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Vehicle Card Sub-component ───────────────────────────────────────────────

function VehicleCard({ vehicle, compact, onClick }: { vehicle: VehicleStatus; compact?: boolean; onClick?: () => void }) {
  const getStatusColor = (status: VehicleStatus["status"]) => {
    switch (status) {
      case "online": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "en-route": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "delayed": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "offline": return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div
      className={`px-4 ${compact ? "py-2.5" : "py-3"} flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer`}
      onClick={onClick}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
        vehicle.status === "online" || vehicle.status === "en-route" 
          ? "bg-green-100 dark:bg-green-900/30" 
          : vehicle.status === "delayed" 
          ? "bg-amber-100 dark:bg-amber-900/30"
          : "bg-gray-100 dark:bg-gray-800"
      }`}>
        <Bus size={18} className={
          vehicle.status === "online" || vehicle.status === "en-route" 
            ? "text-green-600" 
            : vehicle.status === "delayed" 
            ? "text-amber-600"
            : "text-gray-400"
        } />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{vehicle.vehicleNo}</p>
          <span className={`badge text-[10px] ${getStatusColor(vehicle.status)}`}>
            {vehicle.status}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{vehicle.route}</p>
      </div>
      <div className="text-right flex-shrink-0">
        {vehicle.eta && (
          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">ETA {vehicle.eta}</p>
        )}
        <p className="text-[10px] text-gray-400">{vehicle.lastUpdate}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
    </div>
  );
}
