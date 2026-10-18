import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getFullUrl } from "../utils/url";

//////////////////////////////////////////////////////
// 🎓 ACADEMIC YEAR CONTEXT
// Provides global academic year state across the ERP.
// Persists selected year in localStorage.
// Attaches x-academic-year-id to ALL axios requests,
// including custom axios.create() instances used by modules.
//////////////////////////////////////////////////////

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCurrent: boolean;
}

interface AcademicYearContextType {
  academicYears: AcademicYear[];
  selectedAcademicYear: AcademicYear | null;
  selectedAcademicYearId: string | null;
  setSelectedAcademicYear: (year: AcademicYear) => void;
  loading: boolean;
  refetch: () => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType | null>(null);
const STORAGE_KEY = "selectedAcademicYearId";
const INTERCEPTOR_MARK = "__academicYearInterceptorInstalled";

function attachAcademicYear(config: InternalAxiosRequestConfig) {
  const yearId = localStorage.getItem(STORAGE_KEY);
  if (yearId) {
    config.headers = config.headers || {};
    config.headers["x-academic-year-id"] = yearId;
  }
  return config;
}

function installAcademicYearInterceptor(client: AxiosInstance) {
  const markedClient = client as AxiosInstance & { [INTERCEPTOR_MARK]?: boolean };
  if (markedClient[INTERCEPTOR_MARK]) return;

  client.interceptors.request.use(attachAcademicYear);
  markedClient[INTERCEPTOR_MARK] = true;
}

// Install on the default axios client immediately.
installAcademicYearInterceptor(axios);

// Also cover the many module-level axios.create() clients in the ERP.
// This keeps the academic-year contract centralized instead of requiring
// every existing module to be rewritten individually.
const originalAxiosCreate = axios.create.bind(axios);
if (!(axios as any).__academicYearCreatePatched) {
  (axios as any).create = (...args: any[]) => {
    const client = originalAxiosCreate(...args);
    installAcademicYearInterceptor(client);
    return client;
  };
  (axios as any).__academicYearCreatePatched = true;
}

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedState] = useState<AcademicYear | null>(null);
  const [loading, setLoading] = useState(false);
  const interceptorIdRef = useRef<number | null>(null);

  // Keep the default client's interceptor lifecycle-safe for this provider.
  useEffect(() => {
    interceptorIdRef.current = axios.interceptors.request.use(attachAcademicYear);
    return () => {
      if (interceptorIdRef.current !== null) {
        axios.interceptors.request.eject(interceptorIdRef.current);
      }
    };
  }, []);

  const fetchAcademicYears = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(getFullUrl("/api/academic"));
      const years: AcademicYear[] = res.data.data || res.data || [];
      setAcademicYears(years);

      const savedId = localStorage.getItem(STORAGE_KEY);
      const hasExplicitSelection = localStorage.getItem("academicYearExplicitSelection") === "1";
      const savedYear = hasExplicitSelection && savedId ? years.find((y) => y.id === savedId) : null;
      const currentYear = years.find((y) => y.isCurrent);
      const activeYear = years.find((y) => y.isActive);
      const yearToSelect = savedYear || currentYear || activeYear || years[0] || null;

      if (yearToSelect) {
        setSelectedState(yearToSelect);
        localStorage.setItem(STORAGE_KEY, yearToSelect.id);
      } else {
        // Do not leave a stale year ID behind when the tenant has no years.
        localStorage.removeItem(STORAGE_KEY);
        setSelectedState(null);
      }
    } catch (error) {
      console.error("Failed to fetch academic years:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchAcademicYears();
  }, [fetchAcademicYears]);

  const setSelectedAcademicYear = useCallback((year: AcademicYear) => {
    setSelectedState(year);
    localStorage.setItem(STORAGE_KEY, year.id);
    localStorage.setItem("academicYearExplicitSelection", "1");
    window.dispatchEvent(new CustomEvent("academicYearChanged", { detail: year }));
  }, []);

  return (
    <AcademicYearContext.Provider
      value={{
        academicYears,
        selectedAcademicYear,
        selectedAcademicYearId: selectedAcademicYear?.id || null,
        setSelectedAcademicYear,
        loading,
        refetch: fetchAcademicYears,
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const context = useContext(AcademicYearContext);
  if (!context) {
    throw new Error("useAcademicYear must be used within AcademicYearProvider");
  }
  return context;
}
