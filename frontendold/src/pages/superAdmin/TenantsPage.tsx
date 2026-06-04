
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
  GraduationCap,
} from "lucide-react";
import toast from "react-hot-toast";
import CreateTenant from "./CreateTenant";

//////////////////////////////////////////////////////
// HELPER — Full URL for logo/background
//////////////////////////////////////////////////////
const getFullUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `http://localhost:5000${path}`;
};

//////////////////////////////////////////////////////
// 🚀 TENANTS PAGE (SuperAdmin)
//////////////////////////////////////////////////////

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/super-admin/tenants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenants(res.data.data);
    } catch (err: any) {
      toast.error("Failed to fetch tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/super-admin/tenants/${id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Status updated!");
      fetchTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/super-admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Tenant deleted!");
      fetchTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="p-10 text-gray-500 text-lg">Loading Tenants...</div>;
  }

  return (
    <div className="p-6 md:p-8 bg-slate-100 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manage Tenants</h1>
          <p className="text-slate-500 mt-1">Create, edit, and manage all tenants on the platform</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus size={18} />
          Create Tenant
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenants by name or email..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Tenant</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Type</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">Students</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">Teachers</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTenants.length > 0 ? (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                    {/* TENANT INFO — LOGO FIXED ✅ */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getFullUrl(tenant.logoUrl) ? (
                          <img
                            src={getFullUrl(tenant.logoUrl)!}
                            alt={tenant.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-indigo-300"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {tenant.name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-slate-800">{tenant.name}</h4>
                          <p className="text-xs text-slate-500">{tenant.email || "No email"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full capitalize">
                        {tenant.type}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <GraduationCap size={14} className="text-cyan-600" />
                        <span className="text-sm font-medium text-slate-700">
                          {tenant._count?.students || 0}
                          {tenant.maxStudents > 0 && (
                            <span className="text-slate-400">/{tenant.maxStudents}</span>
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <User size={14} className="text-orange-600" />
                        <span className="text-sm font-medium text-slate-700">
                          {tenant._count?.teachers || 0}
                          {tenant.maxTeachers > 0 && (
                            <span className="text-slate-400">/{tenant.maxTeachers}</span>
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          tenant.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {tenant.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(tenant.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            tenant.isActive
                              ? "hover:bg-red-50 text-green-600"
                              : "hover:bg-green-50 text-red-500"
                          }`}
                          title={tenant.isActive ? "Deactivate" : "Activate"}
                        >
                          {tenant.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>

                        <button
                          onClick={() => handleDelete(tenant.id, tenant.name)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">No tenants found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateTenant
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchTenants}
      />
    </div>
  );
}

