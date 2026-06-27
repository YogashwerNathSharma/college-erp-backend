import { useState, useEffect } from "react";
import { portalService } from "../services/portal.service";
import { HiSpeakerphone } from "react-icons/hi";

//////////////////////////////////////////////////////
// 📢 NOTICES PAGE
//////////////////////////////////////////////////////

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  category: string;
  isImportant: boolean;
  attachments?: Array<{ name: string; url: string }>;
}

export default function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Notice | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const data = await portalService.getNotices();
        setNotices(data || []);
      } catch (error) {
        console.error("Notices fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Notices</h1>

      {selected ? (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <button
            onClick={() => setSelected(null)}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm mb-4"
          >
            ← Back to notices
          </button>
          <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{selected.date} • {selected.category}</p>
          <div className="mt-4 text-gray-700 whitespace-pre-wrap">{selected.content}</div>
          {selected.attachments?.length && (
            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
              {selected.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-primary-600 hover:underline text-sm"
                >
                  📎 {att.name}
                </a>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {notices.length ? (
            notices.map((notice) => (
              <div
                key={notice.id}
                onClick={() => setSelected(notice)}
                className={`bg-white rounded-xl shadow-sm p-5 border cursor-pointer hover:border-primary-300 transition ${
                  notice.isImportant ? "border-l-4 border-l-red-500" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <HiSpeakerphone className={`w-5 h-5 mt-0.5 ${notice.isImportant ? "text-red-500" : "text-gray-400"}`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notice.content}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{notice.date}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
              <p className="text-gray-500">No notices available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
