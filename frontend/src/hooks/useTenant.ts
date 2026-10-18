import { useState, useEffect } from "react";

//////////////////////////////////////////////////////
// 🏫 TENANT HOOK
//////////////////////////////////////////////////////

interface Tenant {
  id: string;
  name: string;
  code: string;
  logo?: string;
  primaryColor?: string;
  address: string;
  phone: string;
}

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(() => {
    const stored = localStorage.getItem("tenant");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem("tenant");
      setTenant(stored ? JSON.parse(stored) : null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateTenant = (data: Tenant) => {
    localStorage.setItem("tenant", JSON.stringify(data));
    setTenant(data);
  };

  return { tenant, setTenant: updateTenant };
}
