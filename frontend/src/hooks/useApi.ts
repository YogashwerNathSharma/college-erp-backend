import { useState, useCallback } from "react";
import axios, { AxiosRequestConfig } from "axios";

//////////////////////////////////////////////////////
// 🌐 API HOOK
//////////////////////////////////////////////////////

interface UseApiOptions {
  showError?: boolean;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (config: AxiosRequestConfig): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios(config);
      const result = res.data.data || res.data;
      setData(result);
      return result;
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Request failed";
      setError(message);
      if (options.showError) {
        console.error("API Error:", message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [options.showError]);

  const get = useCallback((url: string, params?: any) => request({ method: "GET", url, params }), [request]);
  const post = useCallback((url: string, data?: any) => request({ method: "POST", url, data }), [request]);
  const put = useCallback((url: string, data?: any) => request({ method: "PUT", url, data }), [request]);
  const del = useCallback((url: string) => request({ method: "DELETE", url }), [request]);

  return { data, loading, error, get, post, put, del, request };
}
