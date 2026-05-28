
import { useEffect, useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

import {
  Users,
  School,
  IndianRupee,
  AlertCircle,
} from "lucide-react";

// 🔥 COMPONENTS
import StatsCard from "../components/dashboard/StatsCard";
import RevenueChart from "../components/dashboard/RevenueChart";
import RecentPayments from "../components/dashboard/RecentPayments";
import DefaultersList from "../components/dashboard/DefaultersList";
import Insights from "../components/dashboard/Insights";

//////////////////////////////////////////////////////
// 🚀 DASHBOARD
//////////////////////////////////////////////////////

export default function Dashboard() {

  //////////////////////////////////////////////////////
  // 👤 USER
  //////////////////////////////////////////////////////

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  //////////////////////////////////////////////////////
  // 🔗 OUTLET CONTEXT
  //////////////////////////////////////////////////////

  const { setTenant }: any = useOutletContext();

  //////////////////////////////////////////////////////
  // 📊 STATE
  //////////////////////////////////////////////////////

  const [data, setData] = useState<any>({
    totalStudents: 0,
    totalClasses: 0,
    totalPaid: 0,
    totalPending: 0,
    monthlyData: [],
    recentPayments: [],
    defaulters: [],
    insights: {},
  });

  //////////////////////////////////////////////////////
  // ⏳ LOADING
  //////////////////////////////////////////////////////

  const [loading, setLoading] = useState(true);

  //////////////////////////////////////////////////////
  // 🚀 API CALL
  //////////////////////////////////////////////////////

  useEffect(() => {

    const fetchDashboard = async () => {

      try {

        //////////////////////////////////////////////////////
        // 🔑 TOKEN
        //////////////////////////////////////////////////////

        const token = localStorage.getItem("token");

        //////////////////////////////////////////////////////
        // 🌐 API
        //////////////////////////////////////////////////////

        const res = await axios.get(
          "http://localhost:5000/api/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        //////////////////////////////////////////////////////
        // 📦 RESPONSE
        //////////////////////////////////////////////////////

        const d = res.data?.data;

        console.log("DASHBOARD RESPONSE =>", d);

        //////////////////////////////////////////////////////
        // 📊 SET DASHBOARD DATA
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
        // 🏫 TENANT DATA - NO HARDCODING
        //////////////////////////////////////////////////////

        const tenantData = {
          // ✅ DYNAMIC - API se directly
          name: d?.tenant?.name,
          
          // ✅ DYNAMIC - API se directly
          schoolName: d?.tenant?.schoolName || d?.tenant?.name,
          
          // ✅ DYNAMIC - API se directly
          type: d?.tenant?.type,

          //////////////////////////////////////////////////////
          // 🔥 LOGO - DYNAMIC
          //////////////////////////////////////////////////////
          
          logoUrl: d?.tenant?.logoUrl
            ? d.tenant.logoUrl
            : d?.tenant?.logo
            ? d.tenant.logo.startsWith("http")
              ? d.tenant.logo
              : `http://localhost:5000/${d.tenant.logo}`
            : null,  // ✅ null - no hardcoded fallback
        };

        //////////////////////////////////////////////////////
        // 🔥 DEBUG
        //////////////////////////////////////////////////////

        console.log(
          "TENANT DATA =>",
          tenantData
        );

        //////////////////////////////////////////////////////
        // 🔥 SET TENANT - DONO JAGAH
        //////////////////////////////////////////////////////

        // 1️⃣ Context mein pass karo (Sidebar/TopNavbar ko)
        setTenant(tenantData);

        // 2️⃣ localStorage mein bhi save karo (persistence)
        localStorage.setItem("tenant", JSON.stringify(tenantData));

      } catch (err) {

        console.log(
          "Dashboard error:",
          err
        );

        //////////////////////////////////////////////////////
        // 🔥 ERROR HANDLING - localStorage se fallback
        //////////////////////////////////////////////////////

        const savedTenant = localStorage.getItem("tenant");
        if (savedTenant) {
          setTenant(JSON.parse(savedTenant));
        }

      } finally {

        setLoading(false);

      }
    };

    fetchDashboard();

  }, []);

  //////////////////////////////////////////////////////
  // ⏳ LOADING UI
  //////////////////////////////////////////////////////

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  //////////////////////////////////////////////////////
  // 🎨 UI
  //////////////////////////////////////////////////////

  return (
    <div className="p-6 space-y-6">

      {/* 🧾 HEADER */}
      <div>

        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Welcome,{" "}
          <b>{user?.name}</b>
          {" "}
          ({user?.role})
        </p>

      </div>

      {/* 📊 STATS */}
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
      <Insights
        data={data.insights}
      />

      {/* 📈 CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <RevenueChart
          data={data.monthlyData}
        />

        <RecentPayments
          data={data.recentPayments}
        />

      </div>

      {/* ⚠️ DEFAULTERS */}
      <DefaultersList
        data={data.defaulters}
      />

      {/* ⚠️ ALERT */}
      {data.totalPending > 0 && (

        <div className="p-4 bg-red-100 text-red-600 rounded-xl shadow">

          ⚠️ Pending Fees:
          {" "}
          ₹ {data.totalPending}

        </div>

      )}

    </div>
  );
}
