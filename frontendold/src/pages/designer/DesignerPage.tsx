
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  Loader2,
  PenTool,
  Palette,
  Layout,
  IdCard,
  Eye,
  RotateCcw,
} from "lucide-react";

//////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////

interface DesignSettings {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  showLogo: boolean;
  showName: boolean;
  footerText: string;
  // Certificate specific
  borderColor?: string;
  // Report specific
  headerColor?: string;
  tableHeaderColor?: string;
  // Report Card specific
  headerBgColor?: string;
  gradeColorScheme?: string;
  borderStyle?: string;
  showWatermark?: boolean;
  // ID Card specific
  bgColor?: string;
  textColor?: string;
  borderRadius?: string;
  showPhotoBorder?: boolean;
  orientation?: string;
}

//////////////////////////////////////////////////////
// DEFAULTS PER TYPE
//////////////////////////////////////////////////////

const defaultSettings: Record<string, DesignSettings> = {
  certificate: {
    primaryColor: "#1e40af",
    secondaryColor: "#f59e0b",
    fontFamily: "serif",
    showLogo: true,
    showName: true,
    borderColor: "#d4af37",
    footerText: "",
  },
  report: {
    primaryColor: "#4f46e5",
    secondaryColor: "#6366f1",
    fontFamily: "sans-serif",
    showLogo: true,
    showName: true,
    headerColor: "#4f46e5",
    tableHeaderColor: "#f3f4f6",
    footerText: "",
  },
  "report-card": {
    primaryColor: "#4f46e5",
    secondaryColor: "#10b981",
    fontFamily: "sans-serif",
    showLogo: true,
    showName: true,
    headerBgColor: "#1e3a5f",
    gradeColorScheme: "green",
    borderStyle: "solid",
    showWatermark: false,
    footerText: "",
  },
  "id-card": {
    primaryColor: "#1e3a5f",
    secondaryColor: "#ffffff",
    fontFamily: "sans-serif",
    showLogo: true,
    showName: true,
    bgColor: "#1e3a5f",
    textColor: "#ffffff",
    borderRadius: "12px",
    showPhotoBorder: true,
    orientation: "portrait",
    footerText: "",
  },
};

//////////////////////////////////////////////////////
// TYPE INFO
//////////////////////////////////////////////////////

const typeInfo: Record<string, { title: string; icon: any; description: string }> = {
  certificate: {
    title: "Certificate Designer",
    icon: PenTool,
    description: "Customize certificate colors, borders, and layout",
  },
  report: {
    title: "Report Designer",
    icon: Palette,
    description: "Design report headers, tables, and color scheme",
  },
  "report-card": {
    title: "Report Card Designer",
    icon: Layout,
    description: "Customize report card colors, grades, and layout",
  },
  "id-card": {
    title: "ID Card Designer",
    icon: IdCard,
    description: "Design student & teacher ID cards",
  },
};

//////////////////////////////////////////////////////
// COMPONENT
//////////////////////////////////////////////////////

export default function DesignerPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const designerType = type || "certificate";

  const [settings, setSettings] = useState<DesignSettings>(
    defaultSettings[designerType] || defaultSettings.certificate
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantName, setTenantName] = useState("School Name");

  const info = typeInfo[designerType] || typeInfo.certificate;
  const Icon = info.icon;

  // Fetch existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");
        setTenantName(tenant?.name || "School Name");

        const res = await axios.get(`/api/settings/designer?type=${designerType}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.data) {
          setSettings({ ...(defaultSettings[designerType] || {}), ...res.data.data });
        }
      } catch (err) {
        console.log("No existing settings, using defaults");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [designerType]);

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await axios.put(
        "/api/settings/designer",
        { type: designerType, settings },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Design settings saved successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setSettings(defaultSettings[designerType] || defaultSettings.certificate);
    toast.success("Reset to defaults");
  };

  // Update setting helper
  const updateSetting = (key: keyof DesignSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/reports")}
            className="p-2 rounded-lg hover:bg-gray-200 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
            <Icon size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{info.title}</h1>
            <p className="text-sm text-gray-500">{info.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Design"}
          </button>
        </div>
      </div>

      {/* Main Content: Settings + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Settings Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Palette size={18} /> Design Settings
          </h2>

          {/* Common Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">Colors</h3>

            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                label="Primary Color"
                value={settings.primaryColor}
                onChange={(v) => updateSetting("primaryColor", v)}
              />
              <ColorPicker
                label="Secondary Color"
                value={settings.secondaryColor}
                onChange={(v) => updateSetting("secondaryColor", v)}
              />
            </div>

            {/* Type-specific colors */}
            {designerType === "certificate" && (
              <ColorPicker
                label="Border Color"
                value={settings.borderColor || "#d4af37"}
                onChange={(v) => updateSetting("borderColor", v)}
              />
            )}
            {designerType === "report" && (
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Header Color"
                  value={settings.headerColor || "#4f46e5"}
                  onChange={(v) => updateSetting("headerColor", v)}
                />
                <ColorPicker
                  label="Table Header"
                  value={settings.tableHeaderColor || "#f3f4f6"}
                  onChange={(v) => updateSetting("tableHeaderColor", v)}
                />
              </div>
            )}
            {designerType === "report-card" && (
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Header Background"
                  value={settings.headerBgColor || "#1e3a5f"}
                  onChange={(v) => updateSetting("headerBgColor", v)}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Grade Color Scheme
                  </label>
                  <select
                    value={settings.gradeColorScheme || "green"}
                    onChange={(e) => updateSetting("gradeColorScheme", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="green">Green</option>
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="orange">Orange</option>
                  </select>
                </div>
              </div>
            )}
            {designerType === "id-card" && (
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Background Color"
                  value={settings.bgColor || "#1e3a5f"}
                  onChange={(v) => updateSetting("bgColor", v)}
                />
                <ColorPicker
                  label="Text Color"
                  value={settings.textColor || "#ffffff"}
                  onChange={(v) => updateSetting("textColor", v)}
                />
              </div>
            )}
          </div>

          {/* Font & Layout */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">Typography & Layout</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSetting("fontFamily", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="sans-serif">Sans Serif (Modern)</option>
                <option value="serif">Serif (Classic)</option>
                <option value="monospace">Monospace (Technical)</option>
              </select>
            </div>

            {designerType === "id-card" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
                  <select
                    value={settings.borderRadius || "12px"}
                    onChange={(e) => updateSetting("borderRadius", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="0px">Square</option>
                    <option value="8px">Slightly Rounded</option>
                    <option value="12px">Rounded</option>
                    <option value="20px">Very Rounded</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Orientation</label>
                  <select
                    value={settings.orientation || "portrait"}
                    onChange={(e) => updateSetting("orientation", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            )}

            {designerType === "report-card" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Style</label>
                  <select
                    value={settings.borderStyle || "solid"}
                    onChange={(e) => updateSetting("borderStyle", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="solid">Solid</option>
                    <option value="double">Double</option>
                    <option value="dashed">Dashed</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <ToggleSwitch
                  label="Show Watermark"
                  value={settings.showWatermark || false}
                  onChange={(v) => updateSetting("showWatermark", v)}
                />
              </div>
            )}
          </div>

          {/* Display Options */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">Display Options</h3>

            <div className="grid grid-cols-2 gap-4">
              <ToggleSwitch
                label="Show School Logo"
                value={settings.showLogo}
                onChange={(v) => updateSetting("showLogo", v)}
              />
              <ToggleSwitch
                label="Show School Name"
                value={settings.showName}
                onChange={(v) => updateSetting("showName", v)}
              />
            </div>

            {designerType === "id-card" && (
              <ToggleSwitch
                label="Show Photo Border"
                value={settings.showPhotoBorder || false}
                onChange={(v) => updateSetting("showPhotoBorder", v)}
              />
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Footer Text</label>
              <input
                type="text"
                value={settings.footerText}
                onChange={(e) => updateSetting("footerText", e.target.value)}
                placeholder="e.g., Powered by YN Software"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Eye size={18} /> Live Preview
          </h2>
          <div className="border border-gray-200 rounded-lg p-4 min-h-[500px] bg-gray-50 flex items-center justify-center">
            {designerType === "certificate" && (
              <CertificatePreview settings={settings} tenantName={tenantName} />
            )}
            {designerType === "report" && (
              <ReportPreview settings={settings} tenantName={tenantName} />
            )}
            {designerType === "report-card" && (
              <ReportCardPreview settings={settings} tenantName={tenantName} />
            )}
            {designerType === "id-card" && (
              <IdCardPreview settings={settings} tenantName={tenantName} />
            )}
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            Designed by: <span className="font-medium">{tenantName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////
// UTILITY COMPONENTS
//////////////////////////////////////////////////////

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono"
        />
      </div>
    </div>
  );
}

function ToggleSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors ${value ? "bg-primary-600" : "bg-gray-300"}`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

//////////////////////////////////////////////////////
// PREVIEW COMPONENTS
//////////////////////////////////////////////////////

function CertificatePreview({ settings, tenantName }: { settings: DesignSettings; tenantName: string }) {
  return (
    <div
      className="w-full max-w-md p-8 text-center relative"
      style={{
        fontFamily: settings.fontFamily,
        border: `4px ${settings.borderColor || "#d4af37"} double`,
        background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)",
      }}
    >
      {/* Border decoration */}
      <div
        className="absolute inset-2 pointer-events-none"
        style={{ border: `2px ${settings.borderColor || "#d4af37"} solid` }}
      />
      
      {settings.showLogo && (
        <div
          className="w-14 h-14 mx-auto mb-3 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: settings.primaryColor, backgroundColor: settings.primaryColor + "15" }}
        >
          <span className="text-lg font-bold" style={{ color: settings.primaryColor }}>
            {tenantName.charAt(0)}
          </span>
        </div>
      )}
      {settings.showName && (
        <h2 className="text-lg font-bold mb-1" style={{ color: settings.primaryColor }}>
          {tenantName}
        </h2>
      )}
      <p className="text-[10px] text-gray-500 mb-4">Excellence in Education</p>

      <h1
        className="text-2xl font-bold uppercase tracking-wide mb-4"
        style={{ color: settings.secondaryColor }}
      >
        Certificate
      </h1>
      <p className="text-xs text-gray-600 mb-2">This is to certify that</p>
      <p className="text-base font-semibold border-b border-gray-300 pb-1 mb-3" style={{ color: settings.primaryColor }}>
        Student Name
      </p>
      <p className="text-xs text-gray-600 mb-6">
        has successfully completed the course with distinction
      </p>

      <div className="flex justify-between items-end mt-8 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="w-20 border-t border-gray-400 mb-1"></div>
          <p className="text-[9px] text-gray-500">Date</p>
        </div>
        <div className="text-center">
          <div className="w-20 border-t border-gray-400 mb-1"></div>
          <p className="text-[9px] text-gray-500">Principal</p>
        </div>
      </div>
      {settings.footerText && (
        <p className="text-[8px] text-gray-400 mt-4">{settings.footerText}</p>
      )}
    </div>
  );
}

function ReportPreview({ settings, tenantName }: { settings: DesignSettings; tenantName: string }) {
  return (
    <div className="w-full max-w-md" style={{ fontFamily: settings.fontFamily }}>
      {/* Header */}
      <div
        className="p-4 rounded-t-lg flex items-center gap-3"
        style={{ backgroundColor: settings.headerColor || settings.primaryColor }}
      >
        {settings.showLogo && (
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">{tenantName.charAt(0)}</span>
          </div>
        )}
        <div>
          {settings.showName && (
            <h2 className="text-white font-bold text-sm">{tenantName}</h2>
          )}
          <p className="text-white/70 text-[10px]">Student Report - 2025-26</p>
        </div>
      </div>

      {/* Table */}
      <div className="border border-t-0 border-gray-200 rounded-b-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: settings.tableHeaderColor || "#f3f4f6" }}>
              <th className="px-3 py-2 text-left font-semibold">Subject</th>
              <th className="px-3 py-2 text-center font-semibold">Max</th>
              <th className="px-3 py-2 text-center font-semibold">Obtained</th>
              <th className="px-3 py-2 text-center font-semibold">Grade</th>
            </tr>
          </thead>
          <tbody>
            {["Hindi", "English", "Mathematics", "Science", "SST"].map((sub, i) => (
              <tr key={sub} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-3 py-1.5">{sub}</td>
                <td className="px-3 py-1.5 text-center">100</td>
                <td className="px-3 py-1.5 text-center font-medium" style={{ color: settings.primaryColor }}>
                  {85 - i * 5}
                </td>
                <td className="px-3 py-1.5 text-center">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: settings.secondaryColor + "20", color: settings.secondaryColor }}>
                    {["A+", "A", "A", "B+", "B"][i]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {settings.footerText && (
          <p className="text-[9px] text-gray-400 text-center py-2 border-t">{settings.footerText}</p>
        )}
      </div>
    </div>
  );
}

function ReportCardPreview({ settings, tenantName }: { settings: DesignSettings; tenantName: string }) {
  const gradeColors: Record<string, string> = {
    green: "#10b981",
    blue: "#3b82f6",
    purple: "#8b5cf6",
    orange: "#f97316",
  };
  const gradeColor = gradeColors[settings.gradeColorScheme || "green"];

  return (
    <div
      className="w-full max-w-md relative"
      style={{
        fontFamily: settings.fontFamily,
        border: settings.borderStyle !== "none" ? `2px ${settings.borderStyle || "solid"} ${settings.primaryColor}` : "none",
      }}
    >
      {/* Watermark */}
      {settings.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <span className="text-6xl font-bold rotate-[-30deg]" style={{ color: settings.primaryColor }}>
            {tenantName}
          </span>
        </div>
      )}

      {/* Header */}
      <div
        className="p-4 text-center text-white"
        style={{ backgroundColor: settings.headerBgColor || "#1e3a5f" }}
      >
        {settings.showLogo && (
          <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">{tenantName.charAt(0)}</span>
          </div>
        )}
        {settings.showName && <h2 className="font-bold text-sm">{tenantName}</h2>}
        <p className="text-[10px] opacity-70">Annual Report Card 2025-26</p>
      </div>

      {/* Student Info */}
      <div className="p-3 bg-gray-50 text-[10px] grid grid-cols-2 gap-1 border-b">
        <p><strong>Name:</strong> Rahul Kumar</p>
        <p><strong>Class:</strong> 8-A</p>
        <p><strong>Roll No:</strong> 12</p>
        <p><strong>Adm No:</strong> 2024001</p>
      </div>

      {/* Marks Table */}
      <table className="w-full text-[10px]">
        <thead>
          <tr style={{ backgroundColor: settings.primaryColor + "15" }}>
            <th className="px-2 py-1.5 text-left">Subject</th>
            <th className="px-2 py-1.5 text-center">Marks</th>
            <th className="px-2 py-1.5 text-center">Grade</th>
          </tr>
        </thead>
        <tbody>
          {["Hindi", "English", "Maths", "Science"].map((sub, i) => (
            <tr key={sub} className="border-t border-gray-100">
              <td className="px-2 py-1">{sub}</td>
              <td className="px-2 py-1 text-center font-medium">{88 - i * 4}/100</td>
              <td className="px-2 py-1 text-center">
                <span className="font-bold" style={{ color: gradeColor }}>
                  {["A+", "A", "A", "B+"][i]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="p-3 text-center border-t">
        <p className="text-[10px] font-bold" style={{ color: settings.primaryColor }}>
          Overall: 85.5% | Grade: A
        </p>
        {settings.footerText && (
          <p className="text-[8px] text-gray-400 mt-1">{settings.footerText}</p>
        )}
      </div>
    </div>
  );
}

function IdCardPreview({ settings, tenantName }: { settings: DesignSettings; tenantName: string }) {
  const isLandscape = settings.orientation === "landscape";

  return (
    <div
      className={`relative overflow-hidden shadow-lg ${isLandscape ? "w-80 h-48" : "w-56 h-80"}`}
      style={{
        fontFamily: settings.fontFamily,
        backgroundColor: settings.bgColor || "#1e3a5f",
        color: settings.textColor || "#ffffff",
        borderRadius: settings.borderRadius || "12px",
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{ backgroundColor: settings.secondaryColor }}
      />

      <div className={`p-4 flex ${isLandscape ? "flex-row gap-4 items-center h-full" : "flex-col items-center justify-center h-full"}`}>
        {/* Logo/Name Area */}
        {settings.showLogo && (
          <div
            className={`${isLandscape ? "w-12 h-12" : "w-16 h-16 mb-2"} rounded-full flex items-center justify-center`}
            style={{
              backgroundColor: settings.secondaryColor + "30",
              border: settings.showPhotoBorder ? `2px solid ${settings.secondaryColor}` : "none",
            }}
          >
            <span className="text-xl font-bold">👤</span>
          </div>
        )}

        <div className={`${isLandscape ? "flex-1" : "text-center"}`}>
          {settings.showName && (
            <p className="text-[9px] opacity-70 mb-0.5">{tenantName}</p>
          )}
          <h3 className="text-sm font-bold">Student Name</h3>
          <p className="text-[10px] opacity-80">Class: 10-A | Roll: 05</p>
          <p className="text-[9px] opacity-60 mt-1">Adm No: 2024-0042</p>
          {settings.showName && (
            <p className="text-[8px] opacity-50 mt-1">ID: STU-2024-0042</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="absolute bottom-0 left-0 right-0 py-1 text-center"
        style={{ backgroundColor: settings.secondaryColor + "40" }}
      >
        <p className="text-[7px] opacity-70">
          {settings.footerText || `${tenantName} | Valid: 2025-26`}
        </p>
      </div>
    </div>
  );
}
