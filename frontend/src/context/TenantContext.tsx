import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

//////////////////////////////////////////////////////
// 🏫 TENANT CONTEXT
//////////////////////////////////////////////////////

interface Tenant {
  id: string;
  name: string;
  code: string;
  logo?: string;
  primaryColor?: string;
  address: any;
  contact: any;
  settings?: any;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  setTenant: (tenant: Tenant) => void;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenantState] = useState<Tenant | null>(() => {
    const stored = localStorage.getItem("tenant");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const setTenant = (data: Tenant) => {
    localStorage.setItem("tenant", JSON.stringify(data));
    setTenantState(data);
  };

  const refreshTenant = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/tenant/profile");
      const data = res.data.data;
      setTenant(data);
    } catch (error) {
      console.error("Tenant refresh error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tenant) {
      refreshTenant();
    }
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, loading, setTenant, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) throw new Error("useTenantContext must be used within TenantProvider");
  return context;
}
