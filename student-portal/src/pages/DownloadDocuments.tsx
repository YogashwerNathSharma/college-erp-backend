import { useState, useEffect } from "react";
import { portalService } from "../services/portal.service";
import { HiDownload, HiDocument } from "react-icons/hi";
import toast from "react-hot-toast";

//////////////////////////////////////////////////////
// 📄 DOWNLOAD DOCUMENTS PAGE
//////////////////////////////////////////////////////

interface Document {
  id: string;
  name: string;
  type: string;
  description: string;
  uploadedAt: string;
  size: string;
}

export default function DownloadDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const data = await portalService.getDocuments();
        setDocuments(data || []);
      } catch (error) {
        console.error("Documents fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const handleDownload = async (doc: Document) => {
    setDownloading(doc.id);
    try {
      const blob = await portalService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch (error) {
      toast.error("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Download Documents</h1>

      {documents.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm p-5 border flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-50 rounded-lg">
                  <HiDocument className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{doc.name}</h3>
                  <p className="text-sm text-gray-500">{doc.type} • {doc.size}</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(doc)}
                disabled={downloading === doc.id}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition disabled:opacity-50"
              >
                <HiDownload className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
          <HiDocument className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No documents available for download</p>
        </div>
      )}
    </div>
  );
}
