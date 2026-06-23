
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";

const API = `${API_BASE_URL}/api`;

interface FeeSettings {
  general: {
    fineAfterDays: number;
    gracePeriod: number;
    roundingOff: boolean;
    defaultPaymentMode: string;
    enableOnlinePayment: boolean;
    enableSmsReminder: boolean;
  };
  receipt: {
    receiptPrefix: string;
    showSchoolLogo: boolean;
    showStudentPhoto: boolean;
    receiptNote: string;
  };
  paymentModes: Record<string, boolean>;
}

const DEFAULT_SETTINGS: FeeSettings = {
  general: {
    fineAfterDays: 0,
    gracePeriod: 0,
    roundingOff: false,
    defaultPaymentMode: "CASH",
    enableOnlinePayment: false,
    enableSmsReminder: false,
  },
  receipt: {
    receiptPrefix: "RCP",
    showSchoolLogo: true,
    showStudentPhoto: false,
    receiptNote: "This is a computer generated receipt.",
  },
  paymentModes: {
    CASH: true,
    ONLINE: true,
    UPI: true,
    CHEQUE: true,
    BANK_TRANSFER: true,
    DD: true,
  },
};

const TABS = [
  { key: "general", label: "General Settings" },
  { key: "receipt", label: "Receipt Settings" },
  { key: "paymentModes", label: "Payment Modes" },
];

const FeeSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<FeeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/fees/settings`);
      if (res.data.success && res.data.data) {
        setSettings({
          general: { ...DEFAULT_SETTINGS.general, ...res.data.data.general },
          receipt: { ...DEFAULT_SETTINGS.receipt, ...res.data.data.receipt },
          paymentModes: { ...DEFAULT_SETTINGS.paymentModes, ...res.data.data.paymentModes },
        });
      }
    } catch (e) {
      // Use defaults if API fails
      console.error("Using default settings");
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/fees/settings`, settings);
      if (res.data.success) {
        toast.success("Settings saved successfully");
        // Also save to localStorage as backup
        localStorage.setItem("feeSettings", JSON.stringify(settings));
      }
    } catch (error: any) {
      // Fallback: save to localStorage
      localStorage.setItem("feeSettings", JSON.stringify(settings));
      toast.success("Settings saved locally");
    } finally { setSaving(false); }
  };

  const updateGeneral = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, [key]: value },
    }));
  };

  const updateReceipt = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      receipt: { ...prev.receipt, [key]: value },
    }));
  };

  const togglePaymentMode = (mode: string) => {
    setSettings((prev) => ({
      ...prev,
      paymentModes: { ...prev.paymentModes, [mode]: !prev.paymentModes[mode] },
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure fee module settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium flex items-center gap-2"
        >
          {saving ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Saving...</>
          ) : (
            "💾 Save Settings"
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600 bg-primary-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Late Fee Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apply Fine After (Days)</label>
                    <input type="number" value={settings.general.fineAfterDays} onChange={(e) => updateGeneral("fineAfterDays", Number(e.target.value))} min={0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
                    <p className="text-xs text-gray-400 mt-1">0 = No fine</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (Days)</label>
                    <input type="number" value={settings.general.gracePeriod} onChange={(e) => updateGeneral("gracePeriod", Number(e.target.value))} min={0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
                    <p className="text-xs text-gray-400 mt-1">Days after due date before fine starts</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Payment Mode</label>
                  <select value={settings.general.defaultPaymentMode} onChange={(e) => updateGeneral("defaultPaymentMode", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Rounding Off</p>
                    <p className="text-xs text-gray-400">Round amounts to nearest integer</p>
                  </div>
                  <button onClick={() => updateGeneral("roundingOff", !settings.general.roundingOff)} className={`relative w-11 h-6 rounded-full transition-colors ${settings.general.roundingOff ? "bg-primary-600" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.general.roundingOff ? "translate-x-5" : ""}`}></span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Enable Online Payment</p>
                    <p className="text-xs text-gray-400">Allow parents to pay fees online</p>
                  </div>
                  <button onClick={() => updateGeneral("enableOnlinePayment", !settings.general.enableOnlinePayment)} className={`relative w-11 h-6 rounded-full transition-colors ${settings.general.enableOnlinePayment ? "bg-primary-600" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.general.enableOnlinePayment ? "translate-x-5" : ""}`}></span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Enable SMS Reminder</p>
                    <p className="text-xs text-gray-400">Auto-send SMS before due date</p>
                  </div>
                  <button onClick={() => updateGeneral("enableSmsReminder", !settings.general.enableSmsReminder)} className={`relative w-11 h-6 rounded-full transition-colors ${settings.general.enableSmsReminder ? "bg-primary-600" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.general.enableSmsReminder ? "translate-x-5" : ""}`}></span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Receipt Settings */}
          {activeTab === "receipt" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Prefix</label>
                <input type="text" value={settings.receipt.receiptPrefix} onChange={(e) => updateReceipt("receiptPrefix", e.target.value)} className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="e.g. RCP" />
                <p className="text-xs text-gray-400 mt-1">Receipt format: PREFIX/YEAR/XXXXX</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Show School Logo</p>
                    <p className="text-xs text-gray-400">Display logo in receipt header</p>
                  </div>
                  <button onClick={() => updateReceipt("showSchoolLogo", !settings.receipt.showSchoolLogo)} className={`relative w-11 h-6 rounded-full transition-colors ${settings.receipt.showSchoolLogo ? "bg-primary-600" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.receipt.showSchoolLogo ? "translate-x-5" : ""}`}></span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Show Student Photo</p>
                    <p className="text-xs text-gray-400">Display student photo in receipt</p>
                  </div>
                  <button onClick={() => updateReceipt("showStudentPhoto", !settings.receipt.showStudentPhoto)} className={`relative w-11 h-6 rounded-full transition-colors ${settings.receipt.showStudentPhoto ? "bg-primary-600" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.receipt.showStudentPhoto ? "translate-x-5" : ""}`}></span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Note</label>
                <textarea value={settings.receipt.receiptNote} onChange={(e) => updateReceipt("receiptNote", e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="Footer note on receipt..." />
              </div>
            </div>
          )}

          {/* Payment Modes */}
          {activeTab === "paymentModes" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">Enable or disable payment methods available during fee collection.</p>
              {Object.entries(settings.paymentModes).map(([mode, enabled]) => (
                <div key={mode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {mode === "CASH" && "💵"}
                      {mode === "ONLINE" && "🌐"}
                      {mode === "UPI" && "📱"}
                      {mode === "CHEQUE" && "📝"}
                      {mode === "BANK_TRANSFER" && "🏦"}
                      {mode === "DD" && "📄"}
                    </span>
                    <p className="text-sm font-medium text-gray-700">{mode.replace("_", " ")}</p>
                  </div>
                  <button onClick={() => togglePaymentMode(mode)} className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-primary-600" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? "translate-x-5" : ""}`}></span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeSettingsPage;

