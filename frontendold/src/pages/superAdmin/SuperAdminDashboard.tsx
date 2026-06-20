
import { useEffect, useState } from "react";
import axios from "axios";

import {
  Building2,
  Users,
  User,
  TrendingUp,
  Activity,
  School2,
} from "lucide-react";

//////////////////////////////////////////////////////
// HELPER — Full URL for logo
//////////////////////////////////////////////////////
const getFullUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${path}`;
};

//////////////////////////////////////////////////////
// 🚀 SUPER ADMIN DASHBOARD
//////////////////////////////////////////////////////

export default function SuperAdminDashboard() {
  const [data, setData] = useState<any>({
    totalSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    activeTenants: 0,
    inactiveTenants: 0,
    recentTenants: [],
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "/api/super-admin/dashboard",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data.data);
    } catch (err) {
      console.log("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => { fetchDashboard(); }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-10 text-gray-500 text-lg">Loading Dashboard...</div>;
  }

  const totalSchools = Number(data?.totalSchools) || 1;
  const activeTenants = Number(data?.activeTenants) || 0;
  const inactiveTenants = Number(data?.inactiveTenants) || 0;
  const activePercentage = (activeTenants / totalSchools) * 100;
  const inactivePercentage = (inactiveTenants / totalSchools) * 100;

  return (
    <div className="p-6 md:p-8 bg-slate-100 min-h-screen">

      {/* TOP HEADER */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 md:p-6 flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <img
            src="/super-admin-logo.png"
            alt="Super Admin"
            className="w-14 h-14 rounded-full object-cover border-4 border-primary-500 shadow-lg bg-white"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Manage All Tenants</h1>
            <p className="text-slate-500 text-sm mt-1">Centralized ERP SaaS Control Panel</p>
          </div>
        </div>
      </div>

      {/* PAGE TITLE */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-slate-900">Super Admin Dashboard</h2>
        <p className="text-slate-500 mt-2 text-lg">SaaS Overview (All Tenants)</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card title="Total Schools" value={totalSchools} icon={<School2 size={28} />} color="from-primary-500 to-purple-600" />
        <Card title="Total Students" value={data.totalStudents} icon={<Users size={28} />} color="from-cyan-500 to-teal-600" />
        <Card title="Total Teachers" value={data.totalTeachers} icon={<User size={28} />} color="from-orange-500 to-pink-600" />
        <Card title="Active Tenants" value={activeTenants} icon={<Activity size={28} />} color="from-green-500 to-emerald-600" />
      </div>

      {/* STATUS + RECENT */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* TENANT STATUS */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary-100 text-primary-600">
              <Building2 size={22} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Tenant Status</h3>
          </div>

          {/* ACTIVE */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-green-600">Active Tenants</span>
              <span className="text-sm font-bold text-green-700">{activeTenants}</span>
            </div>
            <div className="relative group cursor-pointer">
              <div className="w-full h-5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-700"
                  style={{ width: `${Math.max(activePercentage, activeTenants > 0 ? 5 : 0)}%` }}
                />
              </div>
              <div className="absolute hidden group-hover:flex flex-col z-50 -top-3 left-1/2 -translate-x-1/2 -translate-y-full bg-black text-white text-xs px-4 py-3 rounded-xl shadow-xl whitespace-nowrap">
                <span className="font-bold mb-2">Active Tenants ({activeTenants})</span>
                {data.activeTenantList?.map((tenant: any) => (
                  <span key={tenant.id}>• {tenant.name}</span>
                ))}
              </div>
            </div>
          </div>

          {/* INACTIVE */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-red-500">Inactive Tenants</span>
              <span className="text-sm font-bold text-red-600">{inactiveTenants}</span>
            </div>
            <div className="relative group cursor-pointer">
              <div className="w-full h-5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-pink-600 transition-all duration-700"
                  style={{ width: `${Math.max(inactivePercentage, inactiveTenants > 0 ? 5 : 0)}%` }}
                />
              </div>
              <div className="absolute hidden group-hover:flex flex-col z-50 -top-3 left-1/2 -translate-x-1/2 -translate-y-full bg-black text-white text-xs px-4 py-3 rounded-xl shadow-xl whitespace-nowrap">
                <span className="font-bold mb-2">Inactive Tenants ({inactiveTenants})</span>
                {data.inactiveTenantList?.map((tenant: any) => (
                  <span key={tenant.id}>• {tenant.name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RECENT TENANTS — LOGO FIXED ✅ */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-5">Recent Tenants</h3>

          {data.recentTenants?.length > 0 ? (
            <div className="space-y-4">
              {data.recentTenants.map((tenant: any) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    {getFullUrl(tenant?.logoUrl) ? (
                      <img
                        src={getFullUrl(tenant.logoUrl)!}
                        alt="tenant"
                        className="w-11 h-11 rounded-full object-cover border-2 border-indigo-400 bg-white"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {tenant?.name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-slate-800">{tenant.name}</h4>
                      <p className="text-xs text-slate-500">Tenant ERP</p>
                    </div>
                  </div>
                  <div
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      tenant.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tenant.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Building2 size={50} className="text-slate-300" />
              <p className="text-slate-400 mt-3">No tenants found</p>
            </div>
          )}
        </div>
      </div>

      {/* INSIGHTS */}
      <div className="mt-8 bg-gradient-to-r from-primary-600 via-purple-600 to-fuchsia-600 text-white rounded-3xl shadow-xl p-8">
        <div className="flex items-center gap-3">
          <TrendingUp size={24} />
          <h3 className="text-2xl font-bold">Platform Insights</h3>
        </div>
        <p className="mt-4 text-lg opacity-90 leading-8">
          {totalSchools > 5
            ? "Your ERP SaaS platform is scaling rapidly with multiple active tenants 🚀"
            : "Start onboarding more schools to grow your ERP platform 📈"}
        </p>
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////
// 🚀 CARD COMPONENT
//////////////////////////////////////////////////////

const Card = ({ title, value, icon, color }: any) => (
  <div className={`bg-gradient-to-r ${color} text-white rounded-3xl shadow-xl p-6 hover:scale-[1.02] transition-all duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm opacity-80">{title}</p>
        <h2 className="text-4xl font-bold mt-3">{value ?? 0}</h2>
      </div>
      <div className="bg-white/20 p-4 rounded-2xl">{icon}</div>
    </div>
  </div>
);

