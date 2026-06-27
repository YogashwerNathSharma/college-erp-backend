import { useEffect, useState } from "react";
import { getDashboardApi } from "../services/dashboard.api";

//////////////////////////////////////////////////////
// 📊 TYPES (optional but good practice)
//////////////////////////////////////////////////////
type DashboardData = {
  totalStudents: number;
  totalClasses: number;
  totalPaid: number;
  totalPending: number;
  monthlyData: any[];
  recentPayments: any[];
  defaulters: any[];
  insights: any;
  tenant: any;
};

//////////////////////////////////////////////////////
// 🚀 CUSTOM HOOK
//////////////////////////////////////////////////////
export const useDashboard = (setTenant?: any) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const d = await getDashboardApi();

        //////////////////////////////////////////////////////
        // 📊 DATA SET
        //////////////////////////////////////////////////////
        setData(d);

        //////////////////////////////////////////////////////
        // 🏫 TENANT → Layout ko bhejna
        //////////////////////////////////////////////////////
        if (setTenant) {
          setTenant(d?.tenant);
        }

      } catch (err) {
        console.error("Dashboard Hook Error:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return {
    data,
    loading,
    error,
  };
};