import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import axios from "axios";
import { getFullUrl } from "../utils/url";

/**
 * 🔒 Module Permission Context
 * 
 * Fetches tenant's permitted modules from backend on login.
 * Used by Sidebar to show/hide module items.
 * 
 * Modes:
 *  - "all" → No restrictions (new tenant or Super Admin) → show everything
 *  - "restricted" → Only show modules in the `modules` array
 *  - "loading" → Still fetching from API
 */

interface ModuleContextType {
  /** List of permitted module slugs */
  permittedModules: string[];
  /** "all" = no restrictions, "restricted" = filtered, "loading" = fetching */
  mode: "all" | "restricted" | "loading";
  /** Check if a specific module slug is allowed */
  isModuleAllowed: (slug: string) => boolean;
  /** Force refresh modules from API */
  refreshModules: () => void;
}

const ModuleContext = createContext<ModuleContextType>({
  permittedModules: [],
  mode: "loading",
  isModuleAllowed: () => true,
  refreshModules: () => {},
});

export const useModules = () => useContext(ModuleContext);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [permittedModules, setPermittedModules] = useState<string[]>([]);
  const [mode, setMode] = useState<"all" | "restricted" | "loading">("loading");

  const fetchModules = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // No token = not logged in = show all (login page etc)
        setMode("all");
        return;
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Super Admin always sees everything
      if (user?.role === "SUPER_ADMIN") {
        setMode("all");
        return;
      }

      const res = await axios.get(getFullUrl("/api/modules/permitted"), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      const data = res.data?.data;
      if (data?.mode === "all") {
        setMode("all");
        setPermittedModules([]);
      } else if (data?.mode === "restricted" && Array.isArray(data.modules)) {
        setMode("restricted");
        setPermittedModules(data.modules);
      } else {
        // Fallback: allow all
        setMode("all");
      }
    } catch (error) {
      console.warn("Failed to fetch module permissions, showing all:", error);
      // On error, show all modules (fail-open — don't break existing UX)
      setMode("all");
    }
  }, []);

  useEffect(() => {
    fetchModules();

    // Re-fetch when token changes (login/logout) — cross-tab
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "token") fetchModules();
    };

    // Re-fetch when user comes back to the tab (Super Admin may have changed modules)
    const handleFocus = () => {
      fetchModules();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchModules]);

  const isModuleAllowed = useCallback(
    (slug: string) => {
      if (mode !== "restricted") return true;
      return permittedModules.includes(slug);
    },
    [mode, permittedModules]
  );

  return (
    <ModuleContext.Provider value={{ permittedModules, mode, isModuleAllowed, refreshModules: fetchModules }}>
      {children}
    </ModuleContext.Provider>
  );
}
