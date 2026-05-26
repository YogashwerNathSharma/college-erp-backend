import { useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  Users,
  User,
  TrendingUp,
  Activity,
} from "lucide-react";

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

  //////////////////////////////////////////////////////
  // 🚀 FETCH DATA
  //////////////////////////////////////////////////////
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/dashboard",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setData(res.data.data);
      } catch (err) {
        console.log("Super Admin Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  //////////////////////////////////////////////////////
  // 🎨 UI
  //////////////////////////////////////////////////////
  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Super Admin Dashboard
        </h1>
        <p className="text-gray-500">
          SaaS Overview (All Tenants)
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <Card
          title="Total Schools"
          value={data.totalSchools}
          icon={<Building2 />}
          color="from-indigo-500 to-purple-600"
        />

        <Card
          title="Total Students"
          value={data.totalStudents}
          icon={<Users />}
          color="from-teal-500 to-cyan-600"
        />

        <Card
          title="Total Teachers"
          value={data.totalTeachers}
          icon={<User />}
          color="from-orange-500 to-pink-600"
        />

        <Card
          title="Active Tenants"
          value={data.activeTenants}
          icon={<Activity />}
          color="from-green-500 to-emerald-600"
        />

      </div>

      {/* TENANT STATUS + RECENT */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* STATUS */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h3 className="font-semibold mb-3">Tenant Status</h3>

          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-medium">
              Active: {data.activeTenants}
            </span>
            <span className="text-red-500 font-medium">
              Inactive: {data.inactiveTenants}
            </span>
          </div>
        </div>

        {/* RECENT TENANTS */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h3 className="font-semibold mb-3">Recent Tenants</h3>

          {data.recentTenants?.length > 0 ? (
            <div className="space-y-2">
              {data.recentTenants.map((t: any, i: number) => (
                <div
                  key={i}
                  className="text-sm text-gray-600 border-b pb-1"
                >
                  {t.name}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No tenants found</p>
          )}
        </div>

      </div>

      {/* INSIGHTS */}
      <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp size={18} />
          Platform Insights
        </h3>

        <p className="mt-2 text-sm opacity-90">
          {data.totalSchools > 5
            ? "Your SaaS platform is growing fast 🚀"
            : "Start adding more tenants to scale your platform 📈"}
        </p>
      </div>

    </div>
  );
}

//////////////////////////////////////////////////////
// 🎴 CARD COMPONENT
//////////////////////////////////////////////////////
const Card = ({ title, value, icon, color }: any) => (
  <div className={`p-5 rounded-2xl text-white bg-gradient-to-r ${color} shadow-lg`}>
    <div className="flex justify-between items-center">
      <p className="opacity-80">{title}</p>
      {icon}
    </div>
    <h2 className="text-2xl font-bold mt-3">{value ?? 0}</h2>
  </div>
);