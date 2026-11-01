import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import axios from "axios";
import { getFullUrl } from "../utils/url";

/**
 * 🏠 Portal Context
 * 
 * Manages which portal layout/sidebar the user sees based on their role.
 * Fetched from /api/auth/portal-config after login.
 * 
 * Super Admin & Admin use existing layouts.
 * Other roles get custom sidebar + restricted routes.
 */

export interface PortalConfig {
  portalId: string;
  portalName: string;
  homeRoute: string;
  layout: "super-admin" | "admin" | "teacher" | "student" | "parent" | "staff-workspace";
  sidebarSections: SidebarSection[];
  features: string[];
}

interface SidebarSection {
  section: string;
  items: SidebarItem[];
}

interface SidebarItem {
  name: string;
  icon: string;
  path?: string;
  children?: { name: string; icon: string; path: string }[];
}

interface PortalContextType {
  portal: PortalConfig | null;
  loading: boolean;
  isFeatureAllowed: (feature: string) => boolean;
  refreshPortal: () => void;
}

const PortalContext = createContext<PortalContextType>({
  portal: null,
  loading: true,
  isFeatureAllowed: () => true,
  refreshPortal: () => {},
});

export const usePortal = () => useContext(PortalContext);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [portal, setPortal] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortal = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setPortal(null);
        setLoading(false);
        return;
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // Check if portal config was included in login response
      const cachedPortal = localStorage.getItem("portalConfig");
      if (cachedPortal) {
        try {
          setPortal(JSON.parse(cachedPortal));
          setLoading(false);
          return;
        } catch {
          // Invalid cache, fetch fresh
        }
      }

      // Fallback: fetch from API
      const res = await axios.get(getFullUrl("/api/auth/portal-config"), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      if (res.data?.success && res.data?.data) {
        setPortal(res.data.data);
        localStorage.setItem("portalConfig", JSON.stringify(res.data.data));
      }
    } catch (error) {
      console.warn("Failed to fetch portal config:", error);
      // Default to admin layout
      setPortal({
        portalId: "admin",
        portalName: "Admin",
        homeRoute: "/dashboard",
        layout: "admin",
        sidebarSections: [],
        features: ["*"],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortal();
  }, [fetchPortal]);

  const isFeatureAllowed = useCallback(
    (feature: string) => {
      if (!portal) return true;
      if (portal.features.includes("*")) return true;
      if (portal.features.includes(feature)) return true;
      // Check module-level (e.g., "fees" matches "fees.collect")
      const module = feature.split(".")[0];
      return portal.features.includes(module);
    },
    [portal]
  );

  return (
    <PortalContext.Provider value={{ portal, loading, isFeatureAllowed, refreshPortal: fetchPortal }}>
      {children}
    </PortalContext.Provider>
  );
}
