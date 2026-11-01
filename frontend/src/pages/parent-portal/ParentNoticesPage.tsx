import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  Megaphone,
  FileText,
  Info,
} from "lucide-react";

// ─── Types ───
interface Notice {
  id: string;
  title: string;
  body: string;
  type: string;
  priority?: string;
  createdAt: string;
}

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  NOTICE: { icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
  CIRCULAR: { icon: Megaphone, color: "text-purple-600", bg: "bg-purple-100" },
  ANNOUNCEMENT: { icon: Bell, color: "text-amber-600", bg: "bg-amber-100" },
  GENERAL: { icon: Info, color: "text-teal-600", bg: "bg-teal-100" },
};

function ParentNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotices();
  }, [page]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await axios.get(getFullUrl(`/api/parent/notices?page=${page}&limit=10`));
      if (res.data?.success) {
        setNotices(res.data.data.notices || []);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getTypeInfo = (type: string) => TYPE_ICONS[type] || TYPE_ICONS["GENERAL"];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Bell className="text-teal-600" size={24} />
        School Notices
      </h1>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        </div>
      )}

      {/* No Notices */}
      {!loading && notices.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-3" size={40} />
          <p className="text-gray-500 text-sm">No notices available.</p>
        </div>
      )}

      {/* Notices List */}
      {!loading && notices.length > 0 && (
        <div className="space-y-3">
          {notices.map((notice) => {
            const typeInfo = getTypeInfo(notice.type);
            const IconComponent = typeInfo.icon;
            const isExpanded = expandedId === notice.id;

            return (
              <div
                key={notice.id}
                className="bg-white rounded-xl border border-gray-200 transition-all hover:shadow-sm"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : notice.id)}
                  className="w-full text-left p-4 flex items-start gap-4"
                >
                  <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className={typeInfo.color} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">{notice.title}</h3>
                        {!isExpanded && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{notice.body}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.bg} ${typeInfo.color}`}>
                          {notice.type}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(notice.createdAt)}
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                          {notice.body}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default ParentNoticesPage;
