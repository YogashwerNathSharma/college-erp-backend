import { useState, useEffect } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Globe,
  Languages,
  Download,
  Upload,
  Plus,
  Save,
  Search,
  CheckCircle,
  AlertCircle,
  Edit3,
  Trash2,
  Settings,
  BarChart3,
} from "lucide-react";

// ══════════════════════════════════════════════════
// LANGUAGE MANAGER - Multi-Language Administration
// ══════════════════════════════════════════════════

const MODULES = [
  "common",
  "dashboard",
  "students",
  "teachers",
  "fees",
  "attendance",
  "exams",
  "transport",
  "library",
  "hostel",
  "hr",
  "communication",
  "certificates",
  "inventory",
  "reports",
  "settings",
];

export default function LanguageManager() {
  const [activeTab, setActiveTab] = useState<"translations" | "config" | "stats">("translations");
  const [config, setConfig] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedLocale, setSelectedLocale] = useState("en");
  const [selectedModule, setSelectedModule] = useState("common");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [editedKeys, setEditedKeys] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState({ key: "", value: "" });

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTranslations();
  }, [selectedLocale, selectedModule]);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/i18n/config"));
      if (res.data.success) setConfig(res.data.data);
    } catch (err) {
      console.error("Config fetch error:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/i18n/stats"));
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const fetchTranslations = async () => {
    try {
      const res = await axios.get(getFullUrl(`/api/i18n/${selectedLocale}/${selectedModule}`));
      if (res.data.success) {
        setTranslations(res.data.data);
        setEditedKeys({});
      }
    } catch (err) {
      console.error("Translations fetch error:", err);
    }
  };

  const handleSave = async () => {
    if (Object.keys(editedKeys).length === 0) return;
    setLoading(true);
    try {
      const translationsToSave = Object.entries(editedKeys).map(([key, value]) => ({
        module: selectedModule,
        key,
        value,
      }));

      const res = await axios.put(getFullUrl(`/api/i18n/${selectedLocale}`), {
        translations: translationsToSave,
      });

      if (res.data.success) {
        setEditedKeys({});
        fetchTranslations();
        fetchStats();
      }
    } catch (err: any) {
      alert("Save failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async () => {
    if (!newKey.key || !newKey.value) return;
    setLoading(true);
    try {
      await axios.put(getFullUrl(`/api/i18n/${selectedLocale}`), {
        translations: [{ module: selectedModule, key: newKey.key, value: newKey.value }],
      });
      fetchTranslations();
      setShowAddModal(false);
      setNewKey({ key: "", value: "" });
    } catch (err: any) {
      alert("Add failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await axios.get(getFullUrl(`/api/i18n/export/${selectedLocale}`));
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `translations_${selectedLocale}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          const res = await axios.post(getFullUrl("/api/i18n/import"), {
            locale: selectedLocale,
            data,
          });
          if (res.data.success) {
            alert(`Imported ${res.data.data.count} translations`);
            fetchTranslations();
            fetchStats();
          }
        } catch (err) {
          alert("Import failed. Check JSON format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleConfigSave = async () => {
    if (!config) return;
    setLoading(true);
    try {
      await axios.put(getFullUrl("/api/i18n/config"), {
        defaultLocale: config.defaultLocale,
        availableLocales: config.availableLocales,
        rtlLocales: config.rtlLocales,
        showLanguageSelector: config.showLanguageSelector,
        fallbackLocale: config.fallbackLocale,
      });
      alert("Config saved!");
    } catch (err) {
      alert("Config save failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredKeys = Object.entries(translations).filter(
    ([key, value]) =>
      key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Language Manager</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage translations and multi-language support</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleImport} className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm">
            <Upload size={16} /> Import JSON
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Language Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {stats.locales?.map((loc: any) => (
            <div key={loc.locale} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{loc.flag}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{loc.nativeName}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${loc.completionPercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500">{loc.completionPercent}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex border-b border-gray-200 dark:border-slate-700 px-4">
          {[
            { key: "translations", label: "Translations", icon: Languages },
            { key: "config", label: "Configuration", icon: Settings },
            { key: "stats", label: "Statistics", icon: BarChart3 },
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
          {/* Translations Tab */}
          {activeTab === "translations" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
                  <select
                    value={selectedLocale}
                    onChange={(e) => setSelectedLocale(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                  >
                    {config?.supportedLocales?.map((l: any) => (
                      <option key={l.code} value={l.code}>{l.flag} {l.name} ({l.nativeName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Module</label>
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                  >
                    {MODULES.map((m) => (
                      <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search keys or values..."
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                  >
                    <Plus size={14} /> Add Key
                  </button>
                  {Object.keys(editedKeys).length > 0 && (
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      <Save size={14} /> Save ({Object.keys(editedKeys).length})
                    </button>
                  )}
                </div>
              </div>

              {/* Translation Editor Table */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700/50">
                      <th className="text-left py-2.5 px-4 font-medium text-gray-600 dark:text-gray-400 w-1/3">Key</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-600 dark:text-gray-400">Value</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKeys.map(([key, value]) => (
                      <tr key={key} className="border-t border-gray-100 dark:border-slate-700/50">
                        <td className="py-2 px-4 font-mono text-xs text-gray-700 dark:text-gray-300 align-top pt-3">
                          {key}
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            value={editedKeys[key] !== undefined ? editedKeys[key] : value}
                            onChange={(e) => setEditedKeys({ ...editedKeys, [key]: e.target.value })}
                            className={`w-full px-3 py-1.5 border rounded-lg text-sm ${
                              editedKeys[key] !== undefined
                                ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-950/30"
                                : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                            }`}
                          />
                        </td>
                        <td className="py-2 px-2">
                          {editedKeys[key] !== undefined && (
                            <button
                              onClick={() => {
                                const { [key]: _, ...rest } = editedKeys;
                                setEditedKeys(rest);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredKeys.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-400">
                          No translations found. Add some!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Config Tab */}
          {activeTab === "config" && config && (
            <div className="max-w-xl space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Language</label>
                <select
                  value={config.defaultLocale}
                  onChange={(e) => setConfig({ ...config, defaultLocale: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                >
                  {config.supportedLocales?.map((l: any) => (
                    <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available Languages</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {config.supportedLocales?.map((l: any) => (
                    <label key={l.code} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={config.availableLocales?.includes(l.code)}
                        onChange={(e) => {
                          const locales = e.target.checked
                            ? [...config.availableLocales, l.code]
                            : config.availableLocales.filter((c: string) => c !== l.code);
                          setConfig({ ...config, availableLocales: locales });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{l.flag} {l.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showLanguageSelector}
                  onChange={(e) => setConfig({ ...config, showLanguageSelector: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show language selector in top bar</span>
              </label>
              <button
                onClick={handleConfigSave}
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === "stats" && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-5 text-center">
                  <p className="text-3xl font-bold text-indigo-600">{stats.totalKeys}</p>
                  <p className="text-sm text-indigo-500 mt-1">Total Keys (English)</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-5 text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.locales?.length || 0}</p>
                  <p className="text-sm text-green-500 mt-1">Active Languages</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-5 text-center">
                  <p className="text-3xl font-bold text-purple-600">{stats.modules?.length || 0}</p>
                  <p className="text-sm text-purple-500 mt-1">Modules</p>
                </div>
              </div>

              {/* Completion by Language */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Translation Completion</h4>
                <div className="space-y-3">
                  {stats.locales?.map((loc: any) => (
                    <div key={loc.locale} className="flex items-center gap-3">
                      <span className="text-lg w-6">{loc.flag}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">{loc.name}</span>
                      <div className="flex-1 h-2.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            loc.completionPercent >= 80 ? "bg-green-500" :
                            loc.completionPercent >= 50 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${loc.completionPercent}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-16 text-right">{loc.keys} keys</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-10">{loc.completionPercent}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keys by Module */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Keys by Module</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {stats.modules?.map((m: any) => (
                    <div key={m.module} className="bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-3 text-center">
                      <p className="text-lg font-bold text-gray-800 dark:text-white">{m.keys}</p>
                      <p className="text-xs text-gray-500 capitalize">{m.module}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Translation Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Key (snake_case)
                </label>
                <input
                  type="text"
                  value={newKey.key}
                  onChange={(e) => setNewKey({ ...newKey, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  placeholder="e.g. total_students"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value ({selectedLocale.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={newKey.value}
                  onChange={(e) => setNewKey({ ...newKey, value: e.target.value })}
                  placeholder="Translation text..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>
              <p className="text-xs text-gray-400">
                Module: <strong>{selectedModule}</strong> | Locale: <strong>{selectedLocale}</strong>
              </p>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddKey}
                disabled={loading || !newKey.key || !newKey.value}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
