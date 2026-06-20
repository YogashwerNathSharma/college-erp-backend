import { useState, useEffect } from "react";
import axios from "axios";
import { Palette, Check, RotateCcw, Save, Loader2, Sun, Moon } from "lucide-react";
import toast from "react-hot-toast";

// ============================================================
// PRESET THEMES
// ============================================================
const presetThemes = [
  { name: "Indigo", color: "#4f46e5", description: "Default professional look" },
  { name: "Blue", color: "#2563eb", description: "Classic corporate blue" },
  { name: "Purple", color: "#7c3aed", description: "Creative & modern" },
  { name: "Teal", color: "#0d9488", description: "Fresh & calm" },
  { name: "Green", color: "#16a34a", description: "Nature & growth" },
  { name: "Orange", color: "#ea580c", description: "Energetic & warm" },
  { name: "Red", color: "#dc2626", description: "Bold & powerful" },
  { name: "Pink", color: "#db2777", description: "Vibrant & playful" },
  { name: "Cyan", color: "#0891b2", description: "Cool & refreshing" },
  { name: "Amber", color: "#d97706", description: "Warm & inviting" },
  { name: "Emerald", color: "#059669", description: "Rich & elegant" },
  { name: "Slate", color: "#475569", description: "Minimal & neutral" },
  { name: "Rose", color: "#e11d48", description: "Passionate & striking" },
  { name: "Violet", color: "#7c3aed", description: "Luxurious & creative" },
  { name: "Sky", color: "#0284c7", description: "Open & friendly" },
  { name: "Fuchsia", color: "#c026d3", description: "Bold & unique" },
];

// ============================================================
// THEME PAGE COMPONENT
// ============================================================
export default function ThemePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#4f46e5");
  const [customColor, setCustomColor] = useState("#4f46e5");
  const [originalColor, setOriginalColor] = useState("#4f46e5");

  // ============================================================
  // FETCH CURRENT THEME
  // ============================================================
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const url = user?.role === "SUPER_ADMIN" ? "/api/super-admin/settings" : "/api/settings";
        
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const data = res.data?.data;
        const color = data?.platform?.primaryColor || data?.tenant?.primaryColor || "#4f46e5";
        setSelectedColor(color);
        setCustomColor(color);
        setOriginalColor(color);
      } catch (err) {
        console.error("Failed to fetch theme:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTheme();
  }, []);

  // ============================================================
  // APPLY THEME LIVE (preview before save)
  // ============================================================
  const applyThemePreview = (color: string) => {
    setSelectedColor(color);
    setCustomColor(color);
    document.documentElement.style.setProperty("--primary-color", color);
  };

  // ============================================================
  // SAVE THEME
  // ============================================================
  const saveTheme = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const url = "/api/settings/theme";

      // Save to localStorage first (instant, works offline)
      localStorage.setItem("themeColor", selectedColor);
      document.documentElement.style.setProperty("--primary-color", selectedColor);
      setOriginalColor(selectedColor);

      // Then try backend save
      try {
        await axios.put(
          url,
          { primaryColor: selectedColor },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (backendErr) {
        console.warn("Backend theme save failed, using localStorage:", backendErr);
      }

      toast.success("Theme saved successfully! 🎨");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RESET TO DEFAULT
  // ============================================================
  const resetToDefault = () => {
    applyThemePreview("#4f46e5");
    toast.success("Reset to default Indigo theme");
  };

  // ============================================================
  // CANCEL (revert to saved)
  // ============================================================
  const cancelChanges = () => {
    applyThemePreview(originalColor);
    toast("Changes reverted", { icon: "↩️" });
  };

  const hasChanges = selectedColor !== originalColor;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: selectedColor }}>
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Theme Settings</h1>
            <p className="text-sm text-gray-500">Customize the look and feel of your entire ERP</p>
          </div>
        </div>
      </div>

      {/* Live Preview Banner */}
      <div className="mb-6 rounded-xl overflow-hidden shadow-sm border border-gray-200">
        <div className="p-4" style={{ backgroundColor: selectedColor }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Sun className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Live Preview</p>
                <p className="text-white/70 text-xs">This is how your ERP header will look</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-white/20 text-white text-xs rounded-lg font-medium">
                Button
              </button>
              <button className="px-3 py-1.5 bg-white text-xs rounded-lg font-medium" style={{ color: selectedColor }}>
                Active
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <span className="px-3 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: selectedColor }}>
                Tab Active
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                Tab Inactive
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: selectedColor }}></div>
              <span className="text-xs text-gray-600">Card accent</span>
            </div>
            <div className="h-4 w-px bg-gray-200"></div>
            <a href="#" className="text-xs font-medium underline" style={{ color: selectedColor }}>
              Link color
            </a>
          </div>
        </div>
      </div>

      {/* Preset Themes Grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Preset Themes</h2>
        <p className="text-sm text-gray-500 mb-4">Click any theme to preview instantly</p>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {presetThemes.map((theme) => (
            <button
              key={theme.name}
              onClick={() => applyThemePreview(theme.color)}
              className={`group relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedColor === theme.color
                  ? "border-gray-900 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              title={theme.description}
            >
              <div
                className="w-10 h-10 rounded-full shadow-inner flex items-center justify-center"
                style={{ backgroundColor: theme.color }}
              >
                {selectedColor === theme.color && (
                  <Check className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-[10px] font-medium text-gray-600 group-hover:text-gray-900">
                {theme.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Custom Color</h2>
        <p className="text-sm text-gray-500 mb-4">Pick any color you want or enter a hex code</p>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={customColor}
              onChange={(e) => applyThemePreview(e.target.value)}
              className="w-14 h-14 rounded-xl cursor-pointer border-2 border-gray-200"
            />
            <div>
              <label className="text-xs text-gray-500 block mb-1">Hex Code</label>
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomColor(val);
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    applyThemePreview(val);
                  }
                }}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                placeholder="#4f46e5"
              />
            </div>
          </div>

          <div className="flex-1"></div>

          {/* Current vs New */}
          {hasChanges && (
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 mb-1">Current</p>
                <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: originalColor }}></div>
              </div>
              <span className="text-gray-300">→</span>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 mb-1">New</p>
                <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: selectedColor }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What Changes Section */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">What changes with theme?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            "Buttons & CTAs",
            "Active tabs",
            "Selected items",
            "Links & badges",
            "Form focus rings",
            "Progress bars",
            "Card accents",
            "Header highlights",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Check className="w-4 h-4" style={{ color: selectedColor }} />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm sticky bottom-4">
        <div className="flex gap-2">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Default
          </button>
          {hasChanges && (
            <button
              onClick={cancelChanges}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <button
          onClick={saveTheme}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          style={{ backgroundColor: hasChanges ? selectedColor : "#9ca3af" }}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Theme"}
        </button>
      </div>
    </div>
  );
}
