import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import axios from "axios";
import { getFullUrl } from "../utils/url";

//////////////////////////////////////////////////////
// 🎓 ACADEMIC YEAR CONTEXT
// Provides global academic year state across the ERP.
// Persists selected year in localStorage.
// Attaches x-academic-year-id header to all API requests.
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
  /** List of all academic years for the tenant */
  academicYears: AcademicYear[];
  /** Currently selected academic year */
  selectedAcademicYear: AcademicYear | null;
  /** The selected academic year's ID (convenience) */
  selectedAcademicYearId: string | null;
  /** Change the selected academic year */
  setSelectedAcademicYear: (year: AcademicYear) => void;
  /** Whether academic years are loading */
  loading: boolean;
  /** Re-fetch academic years from API */
  refetch: () => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType | null>(null);

const STORAGE_KEY = "selectedAcademicYearId";

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedState] = useState<AcademicYear | null>(null);
  const [loading, setLoading] = useState(false);
  const interceptorIdRef = useRef<number | null>(null);

  // ─── Axios Interceptor: Attach x-academic-year-id to ALL requests ───
  useEffect(() => {
    // Remove previous interceptor if any
    if (interceptorIdRef.current !== null) {
      axios.interceptors.request.eject(interceptorIdRef.current);
    }

    interceptorIdRef.current = axios.interceptors.request.use((config) => {
      const yearId = localStorage.getItem(STORAGE_KEY);
      if (yearId) {
        config.headers = config.headers || {};
        config.headers["x-academic-year-id"] = yearId;
      }
      return config;
    });

    return () => {
      if (interceptorIdRef.current !== null) {
        axios.interceptors.request.eject(interceptorIdRef.current);
      }
    };
  }, []);

  // ─── Fetch academic years ───
  const fetchAcademicYears = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(getFullUrl("/api/academic"));
      const years: AcademicYear[] = res.data.data || res.data || [];
      setAcademicYears(years);

      // Determine which year to select
      const savedId = localStorage.getItem(STORAGE_KEY);
      const savedYear = savedId ? years.find((y) => y.id === savedId) : null;
      const currentYear = years.find((y) => y.isCurrent);
      const activeYear = years.find((y) => y.isActive);

      const yearToSelect = savedYear || currentYear || activeYear || years[0] || null;

      if (yearToSelect) {
        setSelectedState(yearToSelect);
        localStorage.setItem(STORAGE_KEY, yearToSelect.id);
      }
    } catch (error) {
      console.error("Failed to fetch academic years:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Initial fetch ───
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchAcademicYears();
    }
  }, [fetchAcademicYears]);

  // ─── Change selected year ───
  const setSelectedAcademicYear = useCallback((year: AcademicYear) => {
    setSelectedState(year);
    localStorage.setItem(STORAGE_KEY, year.id);

    // Dispatch a custom event so components can react to year change
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
