import { useState, useEffect } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import { FiBell } from "react-icons/fi";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}
function normalizeId(item: any): string { return item?.id || item?._id || ""; }
function Spinner() { return (<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>); }

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "N/A";
  try { return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return dateStr; }
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(getFullUrl("/api/notifications"), { headers: getAuthHeaders(), params: { limit: 50 } })
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setNotices(Array.isArray(data) ? data : []);
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Notices & Announcements</h2>
      {notices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8"><div className="text-center py-8 text-gray-500"><FiBell className="mx-auto text-3xl mb-2 text-gray-300" /><p className="text-sm">No notices available.</p></div></div>
      ) : (
        <div className="space-y-3">
          {notices.map((n: any, i: number) => {
            const message = n.message || n.title || n.text || "Notice";
            const time = n.createdAt ? formatDate(n.createdAt) : "";
            return (
              <div key={normalizeId(n) || i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0"><FiBell className="text-indigo-600" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{message}</p>
                    {n.description && <p className="text-sm text-gray-500 mt-1">{n.description}</p>}
                    {time && <p className="text-xs text-gray-400 mt-2">{time}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
