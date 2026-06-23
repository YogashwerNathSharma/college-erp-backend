

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { FiSave, FiSettings } from "react-icons/fi";

const API = `${API_BASE_URL}/api`;

const TABS = [
  "General Settings",
  "Attendance Settings",
  "Leave Settings",
  "Salary Settings",
  "Notification Settings",
];

interface Settings {
  dateFormat: string;
  timeFormat: string;
  attendanceRequired: boolean;
  lateMarkTime: string;
  halfDayTime: string;
  casualLeavePerYear: number;
  medicalLeavePerYear: number;
  earnedLeavePerYear: number;
  payDay: number;
  salarySlipTemplate: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

const TeacherSettings = () => {
  const [activeTab, setActiveTab] = useState("General Settings");
  const [settings, setSettings] = useState<Settings>({
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24 Hour",
    attendanceRequired: true,
    lateMarkTime: "09:30",
    halfDayTime: "13:00",
    casualLeavePerYear: 12,
    medicalLeavePerYear: 10,
    earnedLeavePerYear: 15,
    payDay: 1,
    salarySlipTemplate: "default",
    emailNotifications: true,
    smsNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/teacher-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.data) {
        setSettings((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/teacher-settings`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        toast.success("Settings saved successfully");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FiSettings className="text-gray-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b overflow-x-auto">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === tab
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === "General Settings" && (
            <div className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  <option>2024-25</option>
                  <option>2025-26</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
                <select
                  value={settings.timeFormat}
                  onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="24 Hour">24 Hour</option>
                  <option value="12 Hour">12 Hour</option>
                </select>
              </div>
            </div>
          )}

          {/* Attendance Settings */}
          {activeTab === "Attendance Settings" && (
            <div className="space-y-6 max-w-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Attendance Required</p>
                  <p className="text-xs text-gray-400">Make attendance mandatory for teachers</p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, attendanceRequired: !settings.attendanceRequired })
                  }
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.attendanceRequired ? "bg-primary-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${
                      settings.attendanceRequired ? "left-6" : "left-0.5"
                    }`}
                  ></div>
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Late Mark Time
                </label>
                <input
                  type="time"
                  value={settings.lateMarkTime}
                  onChange={(e) => setSettings({ ...settings, lateMarkTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Half Day Time
                </label>
                <input
                  type="time"
                  value={settings.halfDayTime}
                  onChange={(e) => setSettings({ ...settings, halfDayTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Leave Settings */}
          {activeTab === "Leave Settings" && (
            <div className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Casual Leave Per Year
                </label>
                <input
                  type="number"
                  value={settings.casualLeavePerYear}
                  onChange={(e) =>
                    setSettings({ ...settings, casualLeavePerYear: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Leave Per Year
                </label>
                <input
                  type="number"
                  value={settings.medicalLeavePerYear}
                  onChange={(e) =>
                    setSettings({ ...settings, medicalLeavePerYear: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Earned Leave Per Year
                </label>
                <input
                  type="number"
                  value={settings.earnedLeavePerYear}
                  onChange={(e) =>
                    setSettings({ ...settings, earnedLeavePerYear: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Salary Settings */}
          {activeTab === "Salary Settings" && (
            <div className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pay Day (Day of Month)
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={settings.payDay}
                  onChange={(e) =>
                    setSettings({ ...settings, payDay: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Slip Template
                </label>
                <select
                  value={settings.salarySlipTemplate}
                  onChange={(e) =>
                    setSettings({ ...settings, salarySlipTemplate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="default">Default Template</option>
                  <option value="detailed">Detailed Template</option>
                  <option value="simple">Simple Template</option>
                </select>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "Notification Settings" && (
            <div className="space-y-6 max-w-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Enable Email Notifications</p>
                  <p className="text-xs text-gray-400">
                    Send email notifications for leave, salary etc.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, emailNotifications: !settings.emailNotifications })
                  }
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.emailNotifications ? "bg-primary-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${
                      settings.emailNotifications ? "left-6" : "left-0.5"
                    }`}
                  ></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Enable SMS Notifications</p>
                  <p className="text-xs text-gray-400">
                    Send SMS notifications to teachers
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, smsNotifications: !settings.smsNotifications })
                  }
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.smsNotifications ? "bg-primary-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${
                      settings.smsNotifications ? "left-6" : "left-0.5"
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-8 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              <FiSave size={16} /> {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSettings;

