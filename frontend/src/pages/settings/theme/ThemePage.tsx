import { useState } from "react";
import { Palette, Check, RotateCcw, Sun, Moon, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useThemeContext, themePresets, ThemePreset } from "../../../context/ThemeContext";

// ============================================================
// THEME PAGE COMPONENT - Full ERP Theme System
// ============================================================
export default function ThemePage() {
  const { currentTheme, setTheme, darkMode, toggleDarkMode } = useThemeContext();
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  // ============================================================
  // APPLY THEME
  // ============================================================
  const applyTheme = (preset: ThemePreset) => {
    setTheme(preset.id);
    toast.success(`Theme changed to "${preset.name}" 🎨`);
  };

  // ============================================================
  // RESET TO DEFAULT
  // ============================================================
  const resetToDefault = () => {
    setTheme("navy-amber");
    toast.success("Reset to default Navy & Amber theme");
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: currentTheme.sidebarActiveBg }}
          >
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Theme Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Customize the look and feel of your entire ERP with one click
            </p>
          </div>
        </div>
      </div>

      {/* Current Theme Banner */}
      <div className="mb-8 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg"
              style={{ background: currentTheme.sidebarActiveBg }}
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Current: <span className="font-bold">{currentTheme.name}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentTheme.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-gray-700 dark:text-gray-300"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              {darkMode ? "Light" : "Dark"}
            </button>
            {/* Reset */}
            <button
              onClick={resetToDefault}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-gray-700 dark:text-gray-300"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Theme Presets Grid */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose a Theme</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Click any theme to apply instantly. Changes sidebar, buttons, and accent colors across the entire ERP.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {themePresets.map((preset) => {
            const isActive = currentTheme.id === preset.id;
            const isHovered = hoveredTheme === preset.id;

            return (
              <button
                key={preset.id}
                onClick={() => applyTheme(preset)}
                onMouseEnter={() => setHoveredTheme(preset.id)}
                onMouseLeave={() => setHoveredTheme(null)}
                className={`relative group rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                  isActive
                    ? "border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-[1.02]"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:scale-[1.02]"
                }`}
                title={preset.description}
              >
                {/* Mini Sidebar Preview */}
                <div className="h-28 p-2 flex gap-1.5" style={{ background: preset.sidebarGradient }}>
                  {/* Fake sidebar nav */}
                  <div className="flex flex-col gap-1.5 w-full">
                    {/* Logo area */}
                    <div className="flex items-center gap-1.5 px-1.5 py-1">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ background: preset.sidebarActiveBg }}
                      />
                      <div className="h-2 w-10 rounded bg-white/30" />
                    </div>
                    {/* Nav items */}
                    <div className="flex flex-col gap-1 px-1">
                      <div
                        className="h-5 rounded-md px-1.5 flex items-center gap-1.5"
                        style={{ background: preset.sidebarActiveBg }}
                      >
                        <div className="w-2 h-2 rounded-sm bg-white/80" />
                        <div className="h-1.5 w-8 rounded bg-white/60" />
                      </div>
                      <div className="h-5 rounded-md px-1.5 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm bg-white/20" />
                        <div className="h-1.5 w-10 rounded bg-white/15" />
                      </div>
                      <div className="h-5 rounded-md px-1.5 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm bg-white/20" />
                        <div className="h-1.5 w-7 rounded bg-white/15" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme Name */}
                <div className="p-2.5 bg-white dark:bg-gray-800 text-center">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {preset.name}
                  </p>
                </div>

                {/* Active Check */}
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center">
                    <Check size={12} className="text-gray-900" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          What changes with each theme?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: currentTheme.sidebarActiveBg }} />
            Sidebar background & gradient
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: currentTheme.sidebarActiveBg }} />
            Active navigation highlights
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: currentTheme.sidebarActiveBg }} />
            Buttons & primary actions
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: currentTheme.sidebarActiveBg }} />
            Accent colors & badges
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: currentTheme.sidebarActiveBg }} />
            Logo borders & highlights
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: currentTheme.sidebarActiveBg }} />
            Hover states throughout ERP
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
          💡 Tip: Dark/Light mode works independently with any theme. Theme is saved per browser.
        </p>
      </div>
    </div>
  );
}
