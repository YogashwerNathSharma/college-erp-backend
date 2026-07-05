import { useState, useEffect } from "react";
import axios from "axios";
import {
  Users, UserPlus, Search, Download, Eye, Phone, Mail,
  Home, ChevronRight, Loader2, X, AlertCircle, Building2, Filter
} from "lucide-react";

interface Staff {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  joiningDate: string;
  salary: number;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  photo?: string;
}

export default function StaffList() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", designation: "", department: "", joiningDate: "", salary: ""
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/hr/staff", { headers });
      const data = res.data?.data;
      setStaff(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    try {
      await axios.post("/api/hr/staff", { ...form, salary: parseFloat(form.salary) }, { headers });
      setShowAddModal(false);
      setForm({ name: "", email: "", phone: "", designation: "", department: "", joiningDate: "", salary: "" });
      fetchStaff();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add staff");
    }
  };

  const handleExport = async () => {
    try {
      const res = await axios.get("/api/hr/staff/export", { headers, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "staff_list.xlsx";
      link.click();
    } catch (err: any) {
      setError("Failed to export");
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchDept = !departmentFilter || s.department === departmentFilter;
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const departments = [...new Set(staff.map(s => s.department))].filter(Boolean);
  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.status === "ACTIVE").length;
  const onLeaveStaff = staff.filter(s => s.status === "ON_LEAVE").length;

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700", INACTIVE: "bg-gray-100 text-gray-600", ON_LEAVE: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="page-container p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 gap-1">
        <Home size={14} /> <ChevronRight size={14} /> <span>HR</span> <ChevronRight size={14} /> <span className="text-gray-900 font-medium">Staff List</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700">
            <Download size={16} /> Export
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm">
            <UserPlus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error} <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg"><Users size={20} className="text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{totalStaff}</p><p className="text-sm text-gray-500">Total Staff</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg"><Users size={20} className="text-green-600" /></div>
            <div><p className="text-2xl font-bold text-green-700">{activeStaff}</p><p className="text-sm text-gray-500">Active</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-lg"><Users size={20} className="text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-amber-700">{onLeaveStaff}</p><p className="text-sm text-gray-500">On Leave</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option><option value="ON_LEAVE">On Leave</option><option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Designation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStaff.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No staff found</td></tr>
                  ) : filteredStaff.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold text-sm">{s.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.designation}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.department}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600"><Phone size={12} /> {s.phone}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5"><Mail size={11} /> {s.email}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[s.status]}`}>
                          {s.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => { setSelectedStaff(s); setShowDetailPanel(true); }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredStaff.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-500">No staff found</div>
            ) : filteredStaff.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold">{s.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.designation} • {s.department}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[s.status]}`}>
                    {s.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm text-gray-600">
                  <span>{s.phone}</span>
                  <button onClick={() => { setSelectedStaff(s); setShowDetailPanel(true); }}
                    className="text-indigo-600 font-medium text-xs">View Profile</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail Panel */}
      {showDetailPanel && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
          <div className="bg-white h-full w-full max-w-md p-6 overflow-y-auto shadow-xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Staff Profile</h2>
              <button onClick={() => setShowDetailPanel(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-indigo-600 font-bold text-2xl">{selectedStaff.name.charAt(0)}</span>
              </div>
              <h3 className="font-bold text-xl text-gray-900">{selectedStaff.name}</h3>
              <p className="text-sm text-gray-500">{selectedStaff.designation}</p>
            </div>
            <div className="space-y-4">
              {[
                { label: "Employee ID", value: selectedStaff.employeeId },
                { label: "Department", value: selectedStaff.department },
                { label: "Email", value: selectedStaff.email },
                { label: "Phone", value: selectedStaff.phone },
                { label: "Joining Date", value: new Date(selectedStaff.joiningDate).toLocaleDateString("en-IN") },
                { label: "Salary", value: `₹${selectedStaff.salary?.toLocaleString("en-IN") || "N/A"}` },
                { label: "Status", value: selectedStaff.status.replace("_", " ") },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add New Staff</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input type="text" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select</option>
                  <option value="TEACHING">Teaching</option><option value="NON_TEACHING">Non-Teaching</option>
                  <option value="ADMINISTRATION">Administration</option><option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                <input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹)</label>
                <input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddStaff} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Add Staff</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
