import { useState, useEffect, Fragment } from "react";
import axios from "axios";
import {
  Building2, BedDouble, Users, Plus, Search, Filter, X, Home,
  ChevronRight, Loader2, AlertCircle, Edit2, UserPlus
} from "lucide-react";

interface Hostel {
  id: string;
  name: string;
  type: "BOYS" | "GIRLS" | "CO_ED";
  totalRooms: number;
  warden: string;
  wardenPhone: string;
  occupancy: number;
}

interface Room {
  id: string;
  hostelId: string;
  roomNo: string;
  floor: number;
  capacity: number;
  occupied: number;
  type: "SINGLE" | "DOUBLE" | "TRIPLE";
  status: "AVAILABLE" | "FULL" | "MAINTENANCE";
}

interface Allocation {
  id: string;
  studentName: string;
  admissionNo: string;
  roomNo: string;
  hostelName: string;
  floor: number;
  allocationDate: string;
}

type Tab = "hostels" | "rooms" | "allocations";

export default function RoomAllocation() {
  const [activeTab, setActiveTab] = useState<Tab>("hostels");
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHostel, setSelectedHostel] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddHostelModal, setShowAddHostelModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [hostelForm, setHostelForm] = useState({ name: "", type: "BOYS", warden: "", wardenPhone: "" });
  const [allocateForm, setAllocateForm] = useState({ studentId: "", roomId: "" });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchData(); }, [activeTab, selectedHostel]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "hostels") {
        const res = await axios.get("/api/hostel/hostels", { headers });
        setHostels(res.data.data || []);
      } else if (activeTab === "rooms") {
        const params: any = {};
        if (selectedHostel) params.hostelId = selectedHostel;
        if (floorFilter) params.floor = floorFilter;
        const res = await axios.get("/api/hostel/rooms", { headers, params });
        setRooms(res.data.data || []);
      } else {
        const params: any = {};
        if (selectedHostel) params.hostelId = selectedHostel;
        if (floorFilter) params.floor = floorFilter;
        const res = await axios.get("/api/hostel/allocations", { headers, params });
        setAllocations(res.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHostel = async () => {
    try {
      await axios.post("/api/hostel/hostels", hostelForm, { headers });
      setShowAddHostelModal(false);
      setHostelForm({ name: "", type: "BOYS", warden: "", wardenPhone: "" });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add hostel");
    }
  };

  const handleAllocate = async () => {
    try {
      await axios.post("/api/hostel/allocations", allocateForm, { headers });
      setShowAllocateModal(false);
      setAllocateForm({ studentId: "", roomId: "" });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to allocate room");
    }
  };

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === "FULL").length;
  const availableRooms = rooms.filter(r => r.status === "AVAILABLE").length;
  const occupancyPercent = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const typeColors: Record<string, string> = {
    BOYS: "bg-blue-100 text-blue-700", GIRLS: "bg-pink-100 text-pink-700", CO_ED: "bg-purple-100 text-purple-700",
  };
  const statusColors: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-700", FULL: "bg-red-100 text-red-700", MAINTENANCE: "bg-yellow-100 text-yellow-700",
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "hostels", label: "Hostels", icon: Building2 },
    { key: "rooms", label: "Rooms", icon: BedDouble },
    { key: "allocations", label: "Allocations", icon: Users },
  ];

  return (
    <div className="page-container p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center text-sm text-gray-500 gap-1">
        <Home size={14} /> <ChevronRight size={14} /> <span>Hostel</span> <ChevronRight size={14} /> <span className="text-gray-900 font-medium">Room Allocation</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Room Allocation</h1>
        <button onClick={() => activeTab === "hostels" ? setShowAddHostelModal(true) : setShowAllocateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm">
          <Plus size={16} /> {activeTab === "hostels" ? "Add Hostel" : "Allocate Room"}
        </button>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Stats Cards (Rooms tab) */}
      {activeTab === "rooms" && !loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Rooms", value: totalRooms, color: "bg-blue-50 border-blue-200 text-blue-700" },
            { label: "Occupied", value: occupiedRooms, color: "bg-red-50 border-red-200 text-red-700" },
            { label: "Available", value: availableRooms, color: "bg-green-50 border-green-200 text-green-700" },
            { label: "Occupancy %", value: `${occupancyPercent}%`, color: "bg-purple-50 border-purple-200 text-purple-700" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm mt-1 opacity-80">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      {(activeTab === "rooms" || activeTab === "allocations") && (
        <div className="flex flex-wrap gap-3">
          <select value={selectedHostel} onChange={(e) => setSelectedHostel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Hostels</option>
            {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Floors</option>
            {[1, 2, 3, 4, 5].map(f => <option key={f} value={f}>Floor {f}</option>)}
          </select>
          {activeTab === "allocations" && (
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search student..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      ) : (
        <Fragment>
          {/* Hostels Tab */}
          {activeTab === "hostels" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hostels.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">No hostels found. Add one to get started.</div>
              ) : hostels.map((hostel) => (
                <div key={hostel.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{hostel.name}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[hostel.type]}`}>{hostel.type.replace("_", " ")}</span>
                    </div>
                    <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                      <Edit2 size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 mt-4 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-700">Total Rooms:</span> {hostel.totalRooms}</p>
                    <p><span className="font-medium text-gray-700">Warden:</span> {hostel.warden}</p>
                    <p><span className="font-medium text-gray-700">Phone:</span> {hostel.wardenPhone}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Occupancy</span>
                      <span className="font-medium text-gray-700">{hostel.occupancy || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${hostel.occupancy || 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rooms Tab */}
          {activeTab === "rooms" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rooms.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">No rooms found for selected filters.</div>
              ) : rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Room {room.roomNo}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[room.status]}`}>{room.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">Floor {room.floor} • {room.type}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">{room.occupied}/{room.capacity} beds</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: room.capacity }).map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i < room.occupied ? "bg-indigo-500" : "bg-gray-200"}`} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Allocations Tab */}
          {activeTab === "allocations" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Admission No</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Room</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Hostel</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Floor</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allocations.filter(a => a.studentName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No allocations found</td></tr>
                    ) : allocations.filter(a => a.studentName.toLowerCase().includes(searchQuery.toLowerCase())).map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 text-sm">{alloc.studentName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{alloc.admissionNo}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium">{alloc.roomNo}</td>
                        <td className="px-4 py-3 text-sm text-center">{alloc.hostelName}</td>
                        <td className="px-4 py-3 text-sm text-center">{alloc.floor}</td>
                        <td className="px-4 py-3 text-sm text-center">{new Date(alloc.allocationDate).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Fragment>
      )}

      {/* Add Hostel Modal */}
      {showAddHostelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Hostel</h2>
              <button onClick={() => setShowAddHostelModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Name</label>
                <input type="text" value={hostelForm.name} onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Tagore Hostel" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={hostelForm.type} onChange={(e) => setHostelForm({ ...hostelForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="BOYS">Boys</option><option value="GIRLS">Girls</option><option value="CO_ED">Co-Ed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warden Name</label>
                <input type="text" value={hostelForm.warden} onChange={(e) => setHostelForm({ ...hostelForm, warden: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Warden full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warden Phone</label>
                <input type="tel" value={hostelForm.wardenPhone} onChange={(e) => setHostelForm({ ...hostelForm, wardenPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddHostelModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddHostel} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Add Hostel</button>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Room Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Allocate Room</h2>
              <button onClick={() => setShowAllocateModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student (Search)</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={allocateForm.studentId} onChange={(e) => setAllocateForm({ ...allocateForm, studentId: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Search by name or admission no" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Room</label>
                <select value={allocateForm.roomId} onChange={(e) => setAllocateForm({ ...allocateForm, roomId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">-- Select a room --</option>
                  {rooms.filter(r => r.status === "AVAILABLE").map(r => (
                    <option key={r.id} value={r.id}>Room {r.roomNo} (Floor {r.floor}, {r.type})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAllocateModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAllocate} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 inline-flex items-center justify-center gap-2">
                <UserPlus size={16} /> Allocate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
