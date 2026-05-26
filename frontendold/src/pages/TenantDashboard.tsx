import { useEffect, useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

import {
  Users,
  School,
  IndianRupee,
  AlertCircle,
} from "lucide-react";

// 🔥 NEW COMPONENTS
import StatsCard from "../components/dashboard/StatsCard";
import RevenueChart from "../components/dashboard/RevenueChart";
import RecentPayments from "../components/dashboard/RecentPayments";
import DefaultersList from "../components/dashboard/DefaultersList";
import Insights from "../components/dashboard/Insights";

export default function Dashboard() {

  //////////////////////////////////////////////////////
  // 👤 USER
  //////////////////////////////////////////////////////
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  //////////////////////////////////////////////////////
  // 🔗 Layout connection
  //////////////////////////////////////////////////////
  const { setTenant }: any = useOutletContext();

  //////////////////////////////////////////////////////
  // 📊 DATA STATE (UPGRADED)
  //////////////////////////////////////////////////////
  const [data, setData] = useState<any>({
    totalStudents: 0,
    totalClasses: 0,
    totalPaid: 0,
    totalPending: 0,
    monthlyData: [],
    recentPayments: [],      // 🔥 NEW
    defaulters: [],          // 🔥 NEW
    insights: {},            // 🔥 NEW
  });

  const [loading, setLoading] = useState(true);

  //////////////////////////////////////////////////////
  // 🚀 API
  //////////////////////////////////////////////////////
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/dashboard",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const d = res.data?.data;

        console.log("DASHBOARD API:", d);

        //////////////////////////////////////////////////////
        // 📊 SET DATA (UPGRADED)
        //////////////////////////////////////////////////////
        setData({
          totalStudents: d?.totalStudents ?? 0,
          totalClasses: d?.totalClasses ?? 0,
          totalPaid: d?.totalPaid ?? 0,
          totalPending: d?.totalPending ?? 0,
          monthlyData: d?.monthlyData ?? [],
          recentPayments: d?.recentPayments ?? [],
          defaulters: d?.defaulters ?? [],
          insights: d?.insights ?? {},
        });

        //////////////////////////////////////////////////////
        // 🏫 TENANT
        //////////////////////////////////////////////////////
        setTenant(d?.tenant);

      } catch (err) {
        console.log("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  //////////////////////////////////////////////////////
  // ⏳ LOADING
  //////////////////////////////////////////////////////
  if (loading) {
    return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  }

  //////////////////////////////////////////////////////
  // 🎨 UI
  //////////////////////////////////////////////////////
  return (
    <div className="p-6 space-y-6">

      {/* 🧾 HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">
          Welcome, <b>{user?.name}</b> ({user?.role})
        </p>
      </div>

      {/* 📊 CARDS (UPGRADED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <StatsCard
          title="Students"
          value={data.totalStudents}
          icon={<Users />}
          color="from-indigo-500 to-purple-600"
        />

        <StatsCard
          title="Classes"
          value={data.totalClasses}
          icon={<School />}
          color="from-teal-500 to-cyan-600"
        />

        <StatsCard
          title="Fees Collected"
          value={`₹ ${data.totalPaid}`}
          icon={<IndianRupee />}
          color="from-yellow-500 to-orange-500"
          growth={data?.insights?.growth}
        />

        <StatsCard
          title="Pending Fees"
          value={`₹ ${data.totalPending}`}
          icon={<AlertCircle />}
          color="from-red-500 to-pink-600"
        />

      </div>

      {/* 🔥 INSIGHTS */}
      <Insights data={data.insights} />

      {/* 📈 CHART + PAYMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <RevenueChart data={data.monthlyData} />

        <RecentPayments data={data.recentPayments} />

      </div>

      {/* ⚠️ DEFAULTERS */}
      <DefaultersList data={data.defaulters} />

      {/* ⚠️ ALERT */}
      {data.totalPending > 0 && (
        <div className="p-4 bg-red-100 text-red-600 rounded-lg">
          ⚠️ Pending Fees: ₹ {data.totalPending}
        </div>
      )}

    </div>
  );
}