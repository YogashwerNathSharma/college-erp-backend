import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  PenTool,
  Upload,
  Stamp,
  CheckCircle,
  XCircle,
  Trash2,
  Star,
  FileSignature,
  Shield,
  Search,
  Eye,
  Download,
  Plus,
  X,
  RefreshCw,
} from "lucide-react";

// ══════════════════════════════════════════════════
// DIGITAL SIGNATURE MANAGER
// ══════════════════════════════════════════════════

export default function DigitalSignatureManager() {
  const [activeTab, setActiveTab] = useState<"signatures" | "signed" | "verify">("signatures");
  const [signatures, setSignatures] = useState<any[]>([]);
  const [signedDocs, setSignedDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);

  // Drawing canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");

  // Create form
  const [form, setForm] = useState({
    name: "",
    designation: "",
    department: "",
    signatureType: "DRAWN",
    isDefault: false,
  });

  useEffect(() => {
    fetchSignatures();
    fetchSignedDocs();
  }, []);

  const fetchSignatures = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/signatures"));
      if (res.data.success) setSignatures(res.data.data);
    } catch (err) {
      console.error("Failed to fetch signatures:", err);
    }
  };

  const fetchSignedDocs = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/signatures/documents?limit=30"));
      if (res.data.success) setSignedDocs(res.data.data.documents);
    } catch (err) {
      console.error("Failed to fetch signed docs:", err);
    }
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl("");
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    setIsDrawing(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) setSignatureDataUrl(canvas.toDataURL("image/png"));
  };

  const handleSave = async () => {
    if (!form.name || !form.designation || !signatureDataUrl) {
      alert("Please fill name, designation, and draw your signature");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(getFullUrl("/api/signatures/upload"), {
        ...form,
        signatureImage: signatureDataUrl,
      });
      if (res.data.success) {
        fetchSignatures();
        setShowCreateModal(false);
        clearCanvas();
        setForm({ name: "", designation: "", department: "", signatureType: "DRAWN", isDefault: false });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save signature");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this signature?")) return;
    try {
      await axios.delete(getFullUrl(`/api/signatures/${id}`));
      fetchSignatures();
    } catch (err: any) {
      alert("Delete failed");
    }
  };

  const handleVerify = async () => {
    if (!verifyCode.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(getFullUrl(`/api/signatures/verify/${verifyCode.trim()}`));
      setVerifyResult(res.data);
    } catch (err: any) {
      setVerifyResult({ success: false, verified: false, message: "Verification failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Signatures</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create, manage, and verify digital signatures for documents
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
        >
          <Plus size={18} />
          New Signature
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex border-b border-gray-200 dark:border-slate-700 px-4">
          {[
            { key: "signatures", label: "My Signatures", icon: PenTool },
            { key: "signed", label: "Signed Documents", icon: FileSignature },
            { key: "verify", label: "Verify", icon: Shield },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Signatures Tab */}
          {activeTab === "signatures" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signatures.map((sig) => (
                <div
                  key={sig.id}
                  className="border border-gray-200 dark:border-slate-600 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{sig.name}</p>
                      <p className="text-sm text-gray-500">{sig.designation}</p>
                      {sig.department && <p className="text-xs text-gray-400">{sig.department}</p>}
                    </div>
                    <div className="flex gap-1">
                      {sig.isDefault && (
                        <Star size={16} className="text-amber-500 fill-amber-500" />
                      )}
                      <button onClick={() => handleDelete(sig.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  {/* Signature preview */}
                  <div className="w-full h-20 bg-gray-50 dark:bg-slate-700 rounded-lg flex items-center justify-center border border-dashed border-gray-300 dark:border-slate-500">
                    {sig.signatureImage ? (
                      <img
                        src={sig.signatureImage.startsWith("data:") ? sig.signatureImage : getFullUrl(sig.signatureImage)}
                        alt="Signature"
                        className="max-h-16 max-w-full object-contain"
                      />
                    ) : (
                      <PenTool size={24} className="text-gray-300" />
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700">{sig.signatureType}</span>
                    <span>{new Date(sig.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              ))}
              {signatures.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-400">
                  <PenTool size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No signatures yet. Create your first signature.</p>
                </div>
              )}
            </div>
          )}

          {/* Signed Documents Tab */}
          {activeTab === "signed" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Document</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Signed By</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {signedDocs.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-white">
                        {doc.documentTitle || doc.documentId.substring(0, 12)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                          {doc.documentType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {doc.signerName} ({doc.signerDesignation})
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {new Date(doc.signedAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {doc.verificationCode}
                      </td>
                      <td className="py-3 px-4">
                        {doc.isValid ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle size={14} /> Valid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs">
                            <XCircle size={14} /> Revoked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {signedDocs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">No signed documents</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Verify Tab */}
          {activeTab === "verify" && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center">
                <Shield size={48} className="mx-auto text-indigo-500 mb-3" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Verify Document Signature</h3>
                <p className="text-sm text-gray-500 mt-1">Enter the 8-character verification code printed on the document</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  placeholder="e.g. A1B2C3D4"
                  maxLength={8}
                  className="flex-1 px-4 py-3 text-center text-lg font-mono tracking-widest border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 uppercase"
                />
                <button
                  onClick={handleVerify}
                  disabled={loading || verifyCode.length < 6}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : "Verify"}
                </button>
              </div>

              {/* Result */}
              {verifyResult && (
                <div
                  className={`p-5 rounded-xl border-2 ${
                    verifyResult.verified
                      ? "border-green-200 bg-green-50 dark:bg-green-950/30"
                      : "border-red-200 bg-red-50 dark:bg-red-950/30"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {verifyResult.verified ? (
                      <CheckCircle size={28} className="text-green-600" />
                    ) : (
                      <XCircle size={28} className="text-red-600" />
                    )}
                    <div>
                      <p className="text-lg font-semibold">{verifyResult.message}</p>
                    </div>
                  </div>
                  {verifyResult.data && verifyResult.verified && (
                    <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                      <div>
                        <p className="text-gray-500">Document Type</p>
                        <p className="font-medium">{verifyResult.data.documentType}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Signed By</p>
                        <p className="font-medium">{verifyResult.data.signedBy}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Designation</p>
                        <p className="font-medium">{verifyResult.data.designation}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Signed At</p>
                        <p className="font-medium">
                          {new Date(verifyResult.data.signedAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Signature Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Digital Signature</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Dr. R.K. Sharma"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation *</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="Principal"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Administration"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>

              {/* Signature Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Draw Your Signature *
                  </label>
                  <button onClick={clearCanvas} className="text-xs text-red-500 hover:text-red-600">
                    Clear
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-500 rounded-xl overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={150}
                    className="w-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Draw using mouse or finger (touch devices)</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Set as default signature</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); clearCanvas(); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !form.name || !form.designation || !signatureDataUrl}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Signature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
