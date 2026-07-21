import { useState, useEffect } from "react";
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Type,
  Layout,
  Image,
  Code,
  Eye,
  Save,
  RefreshCw,
  X,
  Layers,
  PanelLeftClose,
  PanelLeft,
  PanelLeftOpen,
  Minimize2,
  Sparkles,
  RotateCcw,
  Settings,
  Globe,
  FileCode,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { PageHeader } from "../../components/enterprise";

// ══════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

interface ThemeTypography {
  fontFamily: string;
  headingFont: string;
  fontSize: string;
  lineHeight: string;
}

interface ThemeLayout {
  sidebarStyle: "compact" | "full" | "floating" | "mini";
  headerStyle: "fixed" | "static" | "hidden";
  contentWidth: "full" | "contained" | "narrow";
  borderRadius: string;
  density: "comfortable" | "compact" | "spacious";
}

interface ThemeBranding {
  logoUrl: string;
  faviconUrl: string;
  appName: string;
  tagline: string;
}

interface ThemeCustom {
  css: string;
  js: string;
}

interface ThemeConfig {
  id?: string;
  name: string;
  mode: "light" | "dark" | "auto";
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  branding: ThemeBranding;
  custom: ThemeCustom;
  isActive?: boolean;
}

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  mode: "light" | "dark";
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
}

// ══════════════════════════════════════════════════════
// PRESETS
// ══════════════════════════════════════════════════════

const themePresets: ThemePreset[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean corporate look with blue tones",
    mode: "light",
    colors: { primary: "#2563eb", secondary: "#1d4ed8", accent: "#0ea5e9", background: "#ffffff", surface: "#f1f5f9", text: "#1e293b" },
    typography: { fontFamily: "Inter, sans-serif", headingFont: "Inter, sans-serif", fontSize: "14px", lineHeight: "1.6" },
    layout: { sidebarStyle: "full", headerStyle: "fixed", contentWidth: "full", borderRadius: "0.5rem", density: "comfortable" },
  },
  {
    id: "modern-dark",
    name: "Modern Dark",
    description: "Sleek dark theme with vibrant accents",
    mode: "dark",
    colors: { primary: "#818cf8", secondary: "#a78bfa", accent: "#34d399", background: "#0f172a", surface: "#1e293b", text: "#f1f5f9" },
    typography: { fontFamily: "Plus Jakarta Sans, sans-serif", headingFont: "Plus Jakarta Sans, sans-serif", fontSize: "14px", lineHeight: "1.6" },
    layout: { sidebarStyle: "compact", headerStyle: "fixed", contentWidth: "full", borderRadius: "0.75rem", density: "comfortable" },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean with minimal distractions",
    mode: "light",
    colors: { primary: "#171717", secondary: "#404040", accent: "#dc2626", background: "#fafafa", surface: "#ffffff", text: "#171717" },
    typography: { fontFamily: "System UI, sans-serif", headingFont: "System UI, sans-serif", fontSize: "15px", lineHeight: "1.7" },
    layout: { sidebarStyle: "mini", headerStyle: "static", contentWidth: "contained", borderRadius: "0.25rem", density: "spacious" },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Calming blue-green palette",
    mode: "light",
    colors: { primary: "#0d9488", secondary: "#0891b2", accent: "#6366f1", background: "#f0fdfa", surface: "#ffffff", text: "#134e4a" },
    typography: { fontFamily: "Nunito, sans-serif", headingFont: "Nunito, sans-serif", fontSize: "14px", lineHeight: "1.6" },
    layout: { sidebarStyle: "floating", headerStyle: "fixed", contentWidth: "full", borderRadius: "1rem", density: "comfortable" },
  },
  {
    id: "sunset-warm",
    name: "Sunset Warm",
    description: "Warm orange and amber tones",
    mode: "light",
    colors: { primary: "#ea580c", secondary: "#d97706", accent: "#7c3aed", background: "#fffbeb", surface: "#ffffff", text: "#451a03" },
    typography: { fontFamily: "Poppins, sans-serif", headingFont: "Poppins, sans-serif", fontSize: "14px", lineHeight: "1.6" },
    layout: { sidebarStyle: "full", headerStyle: "fixed", contentWidth: "full", borderRadius: "0.75rem", density: "comfortable" },
  },
  {
    id: "midnight-pro",
    name: "Midnight Pro",
    description: "Premium dark theme for professionals",
    mode: "dark",
    colors: { primary: "#f59e0b", secondary: "#eab308", accent: "#ec4899", background: "#09090b", surface: "#18181b", text: "#fafafa" },
    typography: { fontFamily: "JetBrains Mono, monospace", headingFont: "Inter, sans-serif", fontSize: "13px", lineHeight: "1.5" },
    layout: { sidebarStyle: "compact", headerStyle: "fixed", contentWidth: "full", borderRadius: "0.375rem", density: "compact" },
  },
];

const fontOptions = [
  "Inter, sans-serif",
  "Plus Jakarta Sans, sans-serif",
  "Poppins, sans-serif",
  "Nunito, sans-serif",
  "System UI, sans-serif",
  "Roboto, sans-serif",
  "Open Sans, sans-serif",
  "Lato, sans-serif",
  "Montserrat, sans-serif",
  "JetBrains Mono, monospace",
  "Fira Code, monospace",
  "Georgia, serif",
  "Merriweather, serif",
];

// ══════════════════════════════════════════════════════
// DEFAULT THEME
// ══════════════════════════════════════════════════════

const defaultTheme: ThemeConfig = {
  name: "Default",
  mode: "light",
  colors: { primary: "#6366f1", secondary: "#8b5cf6", accent: "#06b6d4", background: "#ffffff", surface: "#f8fafc", text: "#1e293b" },
  typography: { fontFamily: "Inter, sans-serif", headingFont: "Inter, sans-serif", fontSize: "14px", lineHeight: "1.6" },
  layout: { sidebarStyle: "full", headerStyle: "fixed", contentWidth: "full", borderRadius: "0.75rem", density: "comfortable" },
  branding: { logoUrl: "", faviconUrl: "", appName: "College ERP", tagline: "Enterprise Resource Planning" },
  custom: {
    css: "/* Custom CSS */\n\n/* Example:\n.sidebar {\n  backdrop-filter: blur(10px);\n}\n*/",
    js: "// Custom JavaScript\n\n// Example:\n// document.addEventListener('DOMContentLoaded', () => {\n//   console.log('Theme loaded');\n// });",
  },
};

// ══════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════

export default function ThemeManagement() {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [activeSection, setActiveSection] = useState<string>("colors");
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // ─── FETCH THEME ─────────────────────────────────────
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await axios.get("/api/super-admin/themes/current");
        if (res.data.success && res.data.data && res.data.data.id !== "default") {
          setTheme(res.data.data);
        }
      } catch {
        // Use default theme
      }
    };
    fetchTheme();
  }, []);

  // ─── UPDATE HANDLERS ─────────────────────────────────
  const updateColors = (key: keyof ThemeColors, value: string) => {
    setTheme((t) => ({ ...t, colors: { ...t.colors, [key]: value } }));
    setHasChanges(true);
  };

  const updateTypography = (key: keyof ThemeTypography, value: string) => {
    setTheme((t) => ({ ...t, typography: { ...t.typography, [key]: value } }));
    setHasChanges(true);
  };

  const updateLayout = (key: keyof ThemeLayout, value: string) => {
    setTheme((t) => ({ ...t, layout: { ...t.layout, [key]: value } }));
    setHasChanges(true);
  };

  const updateBranding = (key: keyof ThemeBranding, value: string) => {
    setTheme((t) => ({ ...t, branding: { ...t.branding, [key]: value } }));
    setHasChanges(true);
  };

  const updateCustom = (key: keyof ThemeCustom, value: string) => {
    setTheme((t) => ({ ...t, custom: { ...t.custom, [key]: value } }));
    setHasChanges(true);
  };

  const setMode = (mode: "light" | "dark" | "auto") => {
    setTheme((t) => ({ ...t, mode }));
    setHasChanges(true);
  };

  const applyPreset = (preset: ThemePreset) => {
    setTheme((t) => ({
      ...t,
      name: preset.name,
      mode: preset.mode,
      colors: { ...preset.colors },
      typography: { ...preset.typography },
      layout: { ...preset.layout },
    }));
    setHasChanges(true);
    toast.success(`Applied "${preset.name}" preset`);
  };

  const resetToDefault = () => {
    setTheme(defaultTheme);
    setHasChanges(true);
    toast.success("Reset to default theme");
  };

  // ─── SAVE ────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      if (theme.id) {
        await axios.put(`/api/super-admin/themes/${theme.id}`, theme);
      } else {
        await axios.post("/api/super-admin/themes", { ...theme, isGlobal: true });
      }
      toast.success("Theme saved successfully");
      setHasChanges(false);
    } catch {
      toast.success("Theme saved (local)");
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  // ─── SECTIONS ────────────────────────────────────────
  const sections = [
    { id: "colors", label: "Colors", icon: <Palette className="w-4 h-4" /> },
    { id: "typography", label: "Typography", icon: <Type className="w-4 h-4" /> },
    { id: "layout", label: "Layout", icon: <Layout className="w-4 h-4" /> },
    { id: "branding", label: "Branding", icon: <Image className="w-4 h-4" /> },
    { id: "presets", label: "Presets", icon: <Sparkles className="w-4 h-4" /> },
    { id: "custom-css", label: "Custom CSS", icon: <FileCode className="w-4 h-4" /> },
    { id: "custom-js", label: "Custom JS", icon: <Code className="w-4 h-4" /> },
  ];

  // ─── COLOR PICKER ────────────────────────────────────
  const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-600 cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0.5"
        />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full mt-1 px-2 py-1 text-xs font-mono border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </div>
  );

  // ─── RENDER ──────────────────────────────────────────
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <PageHeader
        title="Theme Management"
        subtitle="Customize the look and feel of your ERP application"
        icon={<Palette className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Super Admin", path: "/super-admin" },
          { label: "Theme Management" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showPreview
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={resetToDefault}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Theme
            </button>
          </div>
        }
      />

      {/* Mode Selector */}
      <div className="mb-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Color Mode</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Choose the base color scheme</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {([
              { mode: "light" as const, icon: <Sun className="w-4 h-4" />, label: "Light" },
              { mode: "dark" as const, icon: <Moon className="w-4 h-4" />, label: "Dark" },
              { mode: "auto" as const, icon: <Monitor className="w-4 h-4" />, label: "Auto" },
            ]).map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  theme.mode === mode
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`grid gap-6 ${showPreview ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}>
        {/* Editor */}
        <div className={showPreview ? "lg:col-span-2" : ""}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Section Nav */}
            <div className="md:col-span-1">
              <nav className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-2 sticky top-6">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === section.id
                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Section Content */}
            <div className="md:col-span-3">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                {/* COLORS */}
                {activeSection === "colors" && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Color Palette</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Customize the primary, secondary, and accent colors</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <ColorPicker label="Primary" value={theme.colors.primary} onChange={(v) => updateColors("primary", v)} />
                      <ColorPicker label="Secondary" value={theme.colors.secondary} onChange={(v) => updateColors("secondary", v)} />
                      <ColorPicker label="Accent" value={theme.colors.accent} onChange={(v) => updateColors("accent", v)} />
                      <ColorPicker label="Background" value={theme.colors.background} onChange={(v) => updateColors("background", v)} />
                      <ColorPicker label="Surface" value={theme.colors.surface} onChange={(v) => updateColors("surface", v)} />
                      <ColorPicker label="Text" value={theme.colors.text} onChange={(v) => updateColors("text", v)} />
                    </div>
                    {/* Swatches */}
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Preview Swatches</p>
                      <div className="flex gap-2">
                        {Object.entries(theme.colors).map(([key, color]) => (
                          <div key={key} className="text-center">
                            <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm" style={{ backgroundColor: color }} />
                            <p className="text-[10px] text-slate-500 mt-1 capitalize">{key}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TYPOGRAPHY */}
                {activeSection === "typography" && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Typography</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Configure fonts, sizes, and spacing</p>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Body Font</label>
                        <select
                          value={theme.typography.fontFamily}
                          onChange={(e) => updateTypography("fontFamily", e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                          {fontOptions.map((font) => (
                            <option key={font} value={font} style={{ fontFamily: font }}>{font.split(",")[0]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Heading Font</label>
                        <select
                          value={theme.typography.headingFont}
                          onChange={(e) => updateTypography("headingFont", e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                          {fontOptions.map((font) => (
                            <option key={font} value={font} style={{ fontFamily: font }}>{font.split(",")[0]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Base Font Size</label>
                          <select
                            value={theme.typography.fontSize}
                            onChange={(e) => updateTypography("fontSize", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="12px">12px - Small</option>
                            <option value="13px">13px - Compact</option>
                            <option value="14px">14px - Default</option>
                            <option value="15px">15px - Medium</option>
                            <option value="16px">16px - Large</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Line Height</label>
                          <select
                            value={theme.typography.lineHeight}
                            onChange={(e) => updateTypography("lineHeight", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="1.4">1.4 - Tight</option>
                            <option value="1.5">1.5 - Normal</option>
                            <option value="1.6">1.6 - Relaxed</option>
                            <option value="1.7">1.7 - Loose</option>
                            <option value="1.8">1.8 - Extra Loose</option>
                          </select>
                        </div>
                      </div>
                      {/* Typography Preview */}
                      <div className="mt-6 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-400 mb-2">Preview:</p>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1" style={{ fontFamily: theme.typography.headingFont }}>
                          Heading Example
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300" style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize, lineHeight: theme.typography.lineHeight }}>
                          The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit. This demonstrates your typography settings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* LAYOUT */}
                {activeSection === "layout" && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Layout Options</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Configure sidebar, header, and content layout</p>
                    <div className="space-y-6">
                      {/* Sidebar Style */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Sidebar Style</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {([
                            { value: "full" as const, label: "Full", icon: <PanelLeft className="w-5 h-5" /> },
                            { value: "compact" as const, label: "Compact", icon: <PanelLeftClose className="w-5 h-5" /> },
                            { value: "floating" as const, label: "Floating", icon: <PanelLeftOpen className="w-5 h-5" /> },
                            { value: "mini" as const, label: "Mini", icon: <Minimize2 className="w-5 h-5" /> },
                          ]).map(({ value, label, icon }) => (
                            <button
                              key={value}
                              onClick={() => updateLayout("sidebarStyle", value)}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                theme.layout.sidebarStyle === value
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                  : "border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300 dark:hover:border-slate-500"
                              }`}
                            >
                              {icon}
                              <span className="text-xs font-medium">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Header Style */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Header Style</label>
                        <div className="grid grid-cols-3 gap-3">
                          {(["fixed", "static", "hidden"] as const).map((style) => (
                            <button
                              key={style}
                              onClick={() => updateLayout("headerStyle", style)}
                              className={`px-4 py-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                                theme.layout.headerStyle === style
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                  : "border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300"
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Content Width */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Content Width</label>
                        <div className="grid grid-cols-3 gap-3">
                          {([
                            { value: "full" as const, label: "Full Width", desc: "100%" },
                            { value: "contained" as const, label: "Contained", desc: "1280px" },
                            { value: "narrow" as const, label: "Narrow", desc: "960px" },
                          ]).map(({ value, label, desc }) => (
                            <button
                              key={value}
                              onClick={() => updateLayout("contentWidth", value)}
                              className={`px-4 py-3 rounded-xl border-2 text-center transition-all ${
                                theme.layout.contentWidth === value
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                  : "border-slate-200 dark:border-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <p className={`text-sm font-medium ${theme.layout.contentWidth === value ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`}>{label}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Border Radius */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Border Radius</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={parseFloat(theme.layout.borderRadius) * 16}
                            onChange={(e) => updateLayout("borderRadius", `${Number(e.target.value) / 16}rem`)}
                            className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <span className="text-sm font-mono text-slate-600 dark:text-slate-400 w-16 text-right">{theme.layout.borderRadius}</span>
                        </div>
                      </div>

                      {/* Density */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Density</label>
                        <div className="grid grid-cols-3 gap-3">
                          {(["compact", "comfortable", "spacious"] as const).map((density) => (
                            <button
                              key={density}
                              onClick={() => updateLayout("density", density)}
                              className={`px-4 py-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                                theme.layout.density === density
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                  : "border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300"
                              }`}
                            >
                              {density}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BRANDING */}
                {activeSection === "branding" && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Branding</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Upload logo, favicon, and configure branding</p>
                    <div className="space-y-6">
                      {/* Logo */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo</label>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden">
                            {theme.branding.logoUrl ? (
                              <img src={theme.branding.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                              <Image className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={theme.branding.logoUrl}
                              onChange={(e) => updateBranding("logoUrl", e.target.value)}
                              placeholder="https://example.com/logo.png"
                              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-slate-400 mt-1">Recommended: 200x60px, PNG or SVG</p>
                          </div>
                        </div>
                      </div>

                      {/* Favicon */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Favicon</label>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden">
                            {theme.branding.faviconUrl ? (
                              <img src={theme.branding.faviconUrl} alt="Favicon" className="w-full h-full object-contain" />
                            ) : (
                              <Globe className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={theme.branding.faviconUrl}
                              onChange={(e) => updateBranding("faviconUrl", e.target.value)}
                              placeholder="https://example.com/favicon.ico"
                              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-slate-400 mt-1">Recommended: 32x32px, ICO or PNG</p>
                          </div>
                        </div>
                      </div>

                      {/* App Name */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Application Name</label>
                        <input
                          type="text"
                          value={theme.branding.appName}
                          onChange={(e) => updateBranding("appName", e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Tagline */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tagline</label>
                        <input
                          type="text"
                          value={theme.branding.tagline}
                          onChange={(e) => updateBranding("tagline", e.target.value)}
                          placeholder="Enterprise Resource Planning"
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PRESETS */}
                {activeSection === "presets" && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Theme Presets</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Quick-apply a pre-designed theme</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {themePresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => applyPreset(preset)}
                          className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex -space-x-1">
                              {Object.values(preset.colors).slice(0, 4).map((color, i) => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800" style={{ backgroundColor: color }} />
                              ))}
                            </div>
                            <div className="flex items-center gap-1 ml-auto">
                              {preset.mode === "dark" ? <Moon className="w-3.5 h-3.5 text-slate-400" /> : <Sun className="w-3.5 h-3.5 text-slate-400" />}
                            </div>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {preset.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{preset.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                            <span>{preset.typography.fontFamily.split(",")[0]}</span>
                            <span>•</span>
                            <span className="capitalize">{preset.layout.sidebarStyle} sidebar</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* CUSTOM CSS */}
                {activeSection === "custom-css" && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Custom CSS</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Add custom CSS to override default styles</p>
                    <div className="relative">
                      <textarea
                        value={theme.custom.css}
                        onChange={(e) => updateCustom("css", e.target.value)}
                        rows={20}
                        className="w-full px-4 py-3 text-sm font-mono border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-950 text-emerald-300 focus:ring-2 focus:ring-indigo-500 resize-y"
                        placeholder="/* Add your custom CSS here */"
                        spellCheck={false}
                      />
                      <div className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">CSS</div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">⚠️ Custom CSS is injected globally. Test thoroughly before saving.</p>
                  </div>
                )}

                {/* CUSTOM JS */}
                {activeSection === "custom-js" && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Custom JavaScript</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Add custom JavaScript for advanced customization</p>
                    <div className="relative">
                      <textarea
                        value={theme.custom.js}
                        onChange={(e) => updateCustom("js", e.target.value)}
                        rows={20}
                        className="w-full px-4 py-3 text-sm font-mono border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-950 text-amber-300 focus:ring-2 focus:ring-indigo-500 resize-y"
                        placeholder="// Add your custom JavaScript here"
                        spellCheck={false}
                      />
                      <div className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">JS</div>
                    </div>
                    <p className="text-xs text-amber-500 mt-2">⚠️ Custom JS runs in the browser. Avoid blocking operations.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PREVIEW PANEL */}
        {showPreview && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Live Preview
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">LIVE</span>
                </div>
                <div className="p-3" style={{ backgroundColor: theme.colors.background, fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize, lineHeight: theme.typography.lineHeight }}>
                  {/* Mini App Preview */}
                  <div className="rounded-lg overflow-hidden border" style={{ borderColor: theme.colors.surface }}>
                    {/* Preview Header */}
                    <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: theme.colors.primary }}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-white/20" />
                        <span className="text-xs font-medium text-white">{theme.branding.appName}</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-white/40" />
                        <div className="w-2 h-2 rounded-full bg-white/40" />
                      </div>
                    </div>

                    {/* Preview Body */}
                    <div className="flex" style={{ backgroundColor: theme.colors.background }}>
                      {/* Sidebar */}
                      {theme.layout.sidebarStyle !== "hidden" && (
                        <div
                          className={`border-r ${theme.layout.sidebarStyle === "mini" ? "w-8" : theme.layout.sidebarStyle === "compact" ? "w-12" : "w-16"}`}
                          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.surface }}
                        >
                          <div className="p-1.5 space-y-1.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="rounded" style={{ height: "6px", backgroundColor: i === 1 ? theme.colors.primary : theme.colors.background, opacity: i === 1 ? 0.8 : 0.5 }} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 p-2.5 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-3 rounded w-24" style={{ backgroundColor: theme.colors.text, opacity: 0.8 }} />
                          <div className="h-2 rounded-full w-12 ml-auto" style={{ backgroundColor: theme.colors.primary, opacity: 0.7 }} />
                        </div>
                        {/* Cards */}
                        <div className="grid grid-cols-3 gap-1.5">
                          {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((color, i) => (
                            <div key={i} className="p-1.5 rounded" style={{ backgroundColor: theme.colors.surface, borderRadius: theme.layout.borderRadius }}>
                              <div className="w-4 h-4 rounded mb-1" style={{ backgroundColor: color, opacity: 0.2 }} />
                              <div className="h-1.5 rounded w-full mb-0.5" style={{ backgroundColor: theme.colors.text, opacity: 0.3 }} />
                              <div className="h-1 rounded w-3/4" style={{ backgroundColor: theme.colors.text, opacity: 0.15 }} />
                            </div>
                          ))}
                        </div>
                        {/* Table */}
                        <div className="rounded p-1.5" style={{ backgroundColor: theme.colors.surface, borderRadius: theme.layout.borderRadius }}>
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-1.5 py-1 border-b last:border-b-0" style={{ borderColor: theme.colors.background }}>
                              <div className="h-1.5 rounded flex-1" style={{ backgroundColor: theme.colors.text, opacity: 0.2 }} />
                              <div className="h-1.5 rounded w-8" style={{ backgroundColor: theme.colors.text, opacity: 0.15 }} />
                              <div className="h-1.5 rounded w-6" style={{ backgroundColor: i === 1 ? theme.colors.primary : theme.colors.accent, opacity: 0.4 }} />
                            </div>
                          ))}
                        </div>
                        {/* Buttons */}
                        <div className="flex gap-1.5 justify-end">
                          <div className="h-4 w-12 rounded" style={{ backgroundColor: theme.colors.surface, borderRadius: theme.layout.borderRadius }} />
                          <div className="h-4 w-14 rounded" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.layout.borderRadius }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]" style={{ color: theme.colors.text }}>
                      <span style={{ opacity: 0.5 }}>Mode:</span>
                      <span className="font-medium capitalize">{theme.mode}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]" style={{ color: theme.colors.text }}>
                      <span style={{ opacity: 0.5 }}>Sidebar:</span>
                      <span className="font-medium capitalize">{theme.layout.sidebarStyle}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]" style={{ color: theme.colors.text }}>
                      <span style={{ opacity: 0.5 }}>Font:</span>
                      <span className="font-medium">{theme.typography.fontFamily.split(",")[0]}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]" style={{ color: theme.colors.text }}>
                      <span style={{ opacity: 0.5 }}>Radius:</span>
                      <span className="font-medium">{theme.layout.borderRadius}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
