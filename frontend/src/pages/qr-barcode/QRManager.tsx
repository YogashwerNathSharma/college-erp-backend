import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  QrCode,
  ScanLine,
  Printer,
  Download,
  RefreshCw,
  Camera,
  History,
  BarChart3,
  Plus,
  Search,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Users,
  BookOpen,
  Package,
  CreditCard,
  Shield,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ══════════════════════════════════════════════════
// QR CODE MANAGER - Enterprise Module
// ══════════════════════════════════════════════════

const ENTITY_TYPES = [
  { value: "STUDENT_ID", label: "Student ID", icon: Users, color: "blue" },
  { value: "STAFF_ID", label: "Staff ID", icon: Users, color: "green" },
  { value: "BOOK", label: "Library Book", icon: BookOpen, color: "purple" },
  { value: "ASSET", label: "Asset", icon: Package, color: "orange" },
  { value: "RECEIPT", label: "Fee Receipt", icon: CreditCard, color: "emerald" },
  { value: "GATE_PASS", label: "Gate Pass", icon: Shield, color: "red" },
  { value: "CERTIFICATE", label: "Certificate", icon: Award, color: "amber" },
];

const DONUT_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4", "#ef4444", "#f97316"];

export default function QRManager() {
  const [activeTab, setActiveTab] = useState<"generate" | "scan" | "bulk" | "history">("generate");
  const [stats, setStats] = useState<any>({ totalQR: 0, activeQR: 0, scansToday: 0, scansByType: [] });
  const [scanLogs, setScanLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Generate form
  const [genForm, setGenForm] = useState({
    entityType: "STUDENT_ID",
    entityId: "",
    data: "",
    format: "QR",
    size: 200,
  });

  // Bulk form
  const [bulkForm, setBulkForm] = useState({
    entityType: "STUDENT_ID",
    entityIds: "",
    dataTemplate: "{tenantId}:{entityId}",
    format: "QR",
  });

  // Scanner
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanInput, setScanInput] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchScanLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/qr/stats"));
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      console.error("Failed to fetch QR stats:", err);
    }
  };

  const fetchScanLogs = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/qr/scan-logs?limit=20"));
      if (res.data.success) setScanLogs(res.data.data.logs);
    } catch (err) {
      console.error("Failed to fetch scan logs:", err);
    }
  };

  const handleGenerate = async () => {
    if (!genForm.entityType || !genForm.entityId || !genForm.data) return;
    setLoading(true);
    try {
      const res = await axios.post(getFullUrl("/api/qr/generate"), genForm);
      if (res.data.success) {
        fetchStats();
        setShowGenerateModal(false);
        setGenForm({ entityType: "STUDENT_ID", entityId: "", data: "", format: "QR", size: 200 });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(getFullUrl("/api/qr/scan"), {
        data: scanInput.trim(),
        purpose: "VERIFICATION",
      });
      setScanResult(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGenerate = async () => {
    const ids = bulkForm.entityIds.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!ids.length) return;
    setLoading(true);
    try {
      const res = await axios.post(getFullUrl("/api/qr/bulk-generate"), {
        entityType: bulkForm.entityType,
        entityIds: ids,
        dataTemplate: bulkForm.dataTemplate,
        format: bulkForm.format,
      });
      if (res.data.success) {
        alert(`Success: ${res.data.data.successCount}, Skipped: ${res.data.data.skipCount}`);
        fetchStats();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Bulk generation failed");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      alert("Camera access denied");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      setCameraActive(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">QR Code & Barcode Manager</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate, scan, and manage QR codes for all entities</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Generate QR
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total QR Codes"
          value={stats.totalQR}
          icon={<QrCode size={24} />}
          color="blue"
        />
        <StatCard
          title="Active Codes"
          value={stats.activeQR}
          icon={<CheckCircle size={24} />}
          color="green"
        />
        <StatCard
          title="Scans Today"
          value={stats.scansToday}
          icon={<ScanLine size={24} />}
          color="purple"
        />
        <StatCard
          title="Entity Types"
          value={stats.scansByType?.length || 0}
          icon={<BarChart3 size={24} />}
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution by Type */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">QR Distribution by Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.scansByType?.map((s: any) => ({ name: s.type, value: s.count })) || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.scansByType?.map((_: any, i: number) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Scans by Entity Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.scansByType || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex border-b border-gray-200 dark:border-slate-700 px-4">
          {[
            { key: "generate", label: "Generate", icon: QrCode },
            { key: "scan", label: "Scanner", icon: ScanLine },
            { key: "bulk", label: "Bulk Generate", icon: RefreshCw },
            { key: "history", label: "Scan History", icon: History },
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
          {/* Generate Tab */}
          {activeTab === "generate" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ENTITY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setGenForm({ ...genForm, entityType: type.value });
                    setShowGenerateModal(true);
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-slate-600 hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <div className={`w-12 h-12 rounded-lg bg-${type.color}-50 dark:bg-${type.color}-950 flex items-center justify-center`}>
                    <type.icon size={22} className={`text-${type.color}-600`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800 dark:text-white group-hover:text-indigo-600">{type.label}</p>
                    <p className="text-xs text-gray-500">Generate QR/Barcode</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Scanner Tab */}
          {activeTab === "scan" && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enter or paste QR data
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleScan()}
                      placeholder="Scan or type QR code data..."
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleScan}
                      disabled={loading}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? "Scanning..." : "Verify"}
                    </button>
                  </div>
                </div>
                <button
                  onClick={cameraActive ? stopCamera : startCamera}
                  className={`px-4 py-2.5 rounded-lg flex items-center gap-2 ${
                    cameraActive
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Camera size={18} />
                  {cameraActive ? "Stop" : "Camera"}
                </button>
              </div>

              {/* Camera View */}
              {cameraActive && (
                <div className="relative rounded-xl overflow-hidden border-2 border-indigo-200 max-w-md mx-auto">
                  <video ref={videoRef} className="w-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-indigo-400 rounded-lg animate-pulse" />
                  </div>
                </div>
              )}

              {/* Scan Result */}
              {scanResult && (
                <div
                  className={`p-5 rounded-xl border-2 ${
                    scanResult.recognized
                      ? "border-green-200 bg-green-50 dark:bg-green-950/30"
                      : "border-red-200 bg-red-50 dark:bg-red-950/30"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {scanResult.recognized ? (
                      <CheckCircle size={24} className="text-green-600" />
                    ) : (
                      <AlertCircle size={24} className="text-red-600" />
                    )}
                    <h4 className="text-lg font-semibold">
                      {scanResult.recognized ? "QR Code Verified ✓" : "Unknown QR Code"}
                    </h4>
                  </div>
                  {scanResult.qrCode && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <p><span className="font-medium">Type:</span> {scanResult.qrCode.entityType}</p>
                      <p><span className="font-medium">Entity ID:</span> {scanResult.qrCode.entityId}</p>
                      <p><span className="font-medium">Created:</span> {new Date(scanResult.qrCode.createdAt).toLocaleDateString()}</p>
                      <p><span className="font-medium">Total Scans:</span> {scanResult.qrCode.scannedCount}</p>
                    </div>
                  )}
                  {scanResult.entity && (
                    <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                      <p className="font-medium text-gray-800 dark:text-white">
                        {scanResult.entity.name || scanResult.entity.firstName + " " + scanResult.entity.lastName}
                      </p>
                      {scanResult.entity.email && <p className="text-sm text-gray-500">{scanResult.entity.email}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bulk Generate Tab */}
          {activeTab === "bulk" && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity Type</label>
                <select
                  value={bulkForm.entityType}
                  onChange={(e) => setBulkForm({ ...bulkForm, entityType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  {ENTITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Entity IDs (one per line)
                </label>
                <textarea
                  value={bulkForm.entityIds}
                  onChange={(e) => setBulkForm({ ...bulkForm, entityIds: e.target.value })}
                  rows={6}
                  placeholder="Enter entity IDs, one per line..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
                  <select
                    value={bulkForm.format}
                    onChange={(e) => setBulkForm({ ...bulkForm, format: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  >
                    <option value="QR">QR Code Only</option>
                    <option value="BARCODE">Barcode Only</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Template</label>
                  <input
                    type="text"
                    value={bulkForm.dataTemplate}
                    onChange={(e) => setBulkForm({ ...bulkForm, dataTemplate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
              <button
                onClick={handleBulkGenerate}
                disabled={loading || !bulkForm.entityIds.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                {loading ? "Generating..." : "Generate Bulk QR Codes"}
              </button>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Time</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Scanned By</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Data</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Purpose</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {new Date(log.createdAt).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-800 dark:text-white">{log.scannedByName}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-xs max-w-[200px] truncate">
                          {log.data}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                            {log.purpose || "General"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{log.location || "-"}</td>
                      </tr>
                    ))}
                    {scanLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">No scan logs yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate QR Code</h3>
              <button onClick={() => setShowGenerateModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity Type</label>
                <select
                  value={genForm.entityType}
                  onChange={(e) => setGenForm({ ...genForm, entityType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                >
                  {ENTITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity ID</label>
                <input
                  type="text"
                  value={genForm.entityId}
                  onChange={(e) => setGenForm({ ...genForm, entityId: e.target.value })}
                  placeholder="e.g. Student ID or ObjectId"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data to Encode</label>
                <input
                  type="text"
                  value={genForm.data}
                  onChange={(e) => setGenForm({ ...genForm, data: e.target.value })}
                  placeholder="Data string for QR code"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
                  <select
                    value={genForm.format}
                    onChange={(e) => setGenForm({ ...genForm, format: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  >
                    <option value="QR">QR Code</option>
                    <option value="BARCODE">Barcode</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Size (px)</label>
                  <input
                    type="number"
                    value={genForm.size}
                    onChange={(e) => setGenForm({ ...genForm, size: parseInt(e.target.value) || 200 })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || !genForm.entityId || !genForm.data}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Card Component ──
function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}
