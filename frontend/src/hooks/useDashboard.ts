import { useEffect, useState, useCallback } from "react";
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
// 🚀 CUSTOM HOOK — with refresh support
// ⚡ Cache: 30 min backend, refresh=true busts cache
// ⚡ Page reload OR refresh button → new data fetched
//////////////////////////////////////////////////////
export const useDashboard = (setTenant?: any) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchDashboard = useCallback(async (refresh: boolean = false) => {
    try {
      setLoading(true);

      const d = await getDashboardApi(refresh);

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
  }, [setTenant]);

  // ⚡ On mount: check if page was refreshed (performance.navigation or sessionStorage)
  useEffect(() => {
    const isPageRefresh = performance?.navigation?.type === 1 ||
      (performance.getEntriesByType?.("navigation")?.[0] as any)?.type === "reload";

    fetchDashboard(isPageRefresh);
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refreshDashboard: () => fetchDashboard(true), // ⚡ For refresh button
  };
};
