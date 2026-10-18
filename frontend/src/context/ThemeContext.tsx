import { createContext, useContext, useState, useEffect, ReactNode } from "react";

//////////////////////////////////////////////////////
// 🎨 THEME PRESETS
//////////////////////////////////////////////////////

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  sidebarGradient: string; // CSS linear-gradient for sidebar bg
  sidebarActiveBg: string; // gradient or solid for active nav item
  sidebarActiveText: string; // text color for active item
  sidebarAccentText: string; // accent text (section headers, active parent)
  sidebarAccentBorder: string; // border/logo accent color
  primaryColor: string; // main brand color (buttons, links, headers)
  primaryHover: string; // hover state for primary
  badgeColor: string; // notification badges
}

export const themePresets: ThemePreset[] = [
  {
    id: "navy-amber",
    name: "Navy & Amber",
    description: "Classic dark navy with golden accents",
    sidebarGradient: "linear-gradient(180deg, #1e2a4a 0%, #152038 50%, #0f1729 100%)",
    sidebarActiveBg: "linear-gradient(to right, #f59e0b, #d97706)",
    sidebarActiveText: "#ffffff",
    sidebarAccentText: "#fbbf24",
    sidebarAccentBorder: "rgba(251, 191, 36, 0.4)",
    primaryColor: "#4f46e5",
    primaryHover: "#4338ca",
    badgeColor: "#f43f5e",
  },
  {
    id: "indigo",
    name: "Royal Indigo",
    description: "Deep indigo with violet accents",
    sidebarGradient: "linear-gradient(180deg, #312e81 0%, #1e1b4b 50%, #0f0e2e 100%)",
    sidebarActiveBg: "linear-gradient(to right, #6366f1, #4f46e5)",
    sidebarActiveText: "#ffffff",
    sidebarAccentText: "#a5b4fc",
    sidebarAccentBorder: "rgba(165, 180, 252, 0.4)",
    primaryColor: "#4f46e5",
    primaryHover: "#4338ca",
    badgeColor: "#f43f5e",
  },
  {
    id: "emerald",
    name: "Forest Green",
    description: "Rich emerald with fresh green highlights",
    sidebarGradient: "linear-gradient(180deg, #064e3b 0%, #022c22 50%, #011a14 100%)",
    sidebarActiveBg: "linear-gradient(to right, #10b981, #059669)",
    sidebarActiveText: "#ffffff",
    sidebarAccentText: "#6ee7b7",
    sidebarAccentBorder: "rgba(110, 231, 183, 0.4)",
    primaryColor: "#059669",
    primaryHover: "#047857",
    badgeColor: "#f43f5e",
  },
  {
    id: "purple",
    name: "Royal Purple",
    description: "Luxurious purple with violet glow",
    sidebarGradient: "linear-gradient(180deg, #4c1d95 0%, #2e1065 50%, #1a0840 100%)",
    sidebarActiveBg: "linear-gradient(to right, #a855f7, #7c3aed)",
    sidebarActiveText: "#ffffff",
    sidebarAccentText: "#c4b5fd",
    sidebarAccentBorder: "rgba(196, 181, 253, 0.4)",
    primaryColor: "#7c3aed",
    primaryHover: "#6d28d9",
    badgeColor: "#f43f5e",
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Deep ocean blue with cyan accents",
    sidebarGradient: "linear-gradient(180deg, #164e63 0%, #0c3547 50%, #071e2e 100%)",
    sidebarActiveBg: "linear-gradient(to right, #06b6d4, #0891b2)",
    sidebarActiveText: "#ffffff",
    sidebarAccentText: "#67e8f9",
    sidebarAccentBorder: "rgba(103, 232, 249, 0.4)",
    primaryColor: "#0891b2",
    primaryHover: "#0e7490",
    badgeColor: "#f43f5e",
  },
  {
    id: "rose",
    name: "Rose & Blush",
    description: "Elegant dark with rose pink accents",
    sidebarGradient: "linear-gradient(180deg, #4c0519 0%, #300211 50%, #1a010a 100%)",
    sidebarActiveBg: "linear-gradient(to right, #fb7185, #e11d48)",
    sidebarActiveText: "#ffffff",
    sidebarAccentText: "#fda4af",
    sidebarAccentBorder: "rgba(253, 164, 175, 0.4)",
    primaryColor: "#e11d48",
    primaryHover: "#be123c",
    badgeColor: "#f97316",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    description: "Warm dark slate with fiery orange",
    sidebarGradient: "linear-gradient(180deg, #431407 0%, #27080a 50%, #1a0505 100%)",
    sidebarActiveBg: "linear-gradient(to right, #f97316, #ea580c)",
    sidebarActiveText: "#ffffff",
    sidebarAccentText: "#fdba74",
    sidebarAccentBorder: "rgba(253, 186, 116, 0.4)",
    primaryColor: "#ea580c",
    primaryHover: "#c2410c",
    badgeColor: "#f43f5e",
  },
  {
    id: "teal",
    name: "Teal & Mint",
    description: "Calming teal with mint highlights",
    sidebarGradient: "linear-gradient(180deg, #134e4a 0%, #0a302e 50%, #051c1b 100%)",
    sidebarActiveBg: "linear-gradient(to right, #14b8a6, #0d9488)",
    sidebarActiveText: "#ffffff",
    sidebarAccentText: "#5eead4",
    sidebarAccentBorder: "rgba(94, 234, 212, 0.4)",
    primaryColor: "#0d9488",
    primaryHover: "#0f766e",
    badgeColor: "#f43f5e",
  },
  {
    id: "slate-minimal",
    name: "Slate Minimal",
    description: "Clean minimal dark with cool gray",
    sidebarGradient: "linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #020617 100%)",
    sidebarActiveBg: "linear-gradient(to right, #64748b, #475569)",
    sidebarActiveText: "#ffffff",
    sidebarAccentText: "#94a3b8",
    sidebarAccentBorder: "rgba(148, 163, 184, 0.4)",
    primaryColor: "#475569",
    primaryHover: "#334155",
    badgeColor: "#f43f5e",
  },
  {
    id: "blue-classic",
    name: "Classic Blue",
    description: "Corporate blue with bright accents",
    sidebarGradient: "linear-gradient(180deg, #1e3a5f 0%, #122a47 50%, #0a1929 100%)",
    sidebarActiveBg: "linear-gradient(to right, #3b82f6, #2563eb)",
    sidebarActiveText: "#ffffff",
    sidebarAccentText: "#93c5fd",
    sidebarAccentBorder: "rgba(147, 197, 253, 0.4)",
    primaryColor: "#2563eb",
    primaryHover: "#1d4ed8",
    badgeColor: "#f43f5e",
  },
];

//////////////////////////////////////////////////////
// 🎨 THEME CONTEXT TYPE
//////////////////////////////////////////////////////
interface ThemeContextType {
  currentTheme: ThemePreset;
  setTheme: (themeId: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Load saved theme
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(() => {
    const savedId = localStorage.getItem("erpThemeId");
    return themePresets.find((t) => t.id === savedId) || themePresets[0];
  });

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored === null ? true : stored === "true";
  });

  // Apply CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary-color", currentTheme.primaryColor);
    root.style.setProperty("--primary-hover", currentTheme.primaryHover);
    root.style.setProperty("--sidebar-gradient", currentTheme.sidebarGradient);
    root.style.setProperty("--sidebar-active-bg", currentTheme.sidebarActiveBg);
    root.style.setProperty("--sidebar-active-text", currentTheme.sidebarActiveText);
    root.style.setProperty("--sidebar-accent-text", currentTheme.sidebarAccentText);
    root.style.setProperty("--sidebar-accent-border", currentTheme.sidebarAccentBorder);
    root.style.setProperty("--badge-color", currentTheme.badgeColor);

    // Also keep themeColor in sync for backward compat
    localStorage.setItem("themeColor", currentTheme.primaryColor);
  }, [currentTheme]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const setTheme = (themeId: string) => {
    const found = themePresets.find((t) => t.id === themeId);
    if (found) {
      localStorage.setItem("erpThemeId", themeId);
      setCurrentTheme(found);
    }
  };

  // Backward compat: setPrimaryColor updates theme's primary without switching preset
  const setPrimaryColor = (color: string) => {
    localStorage.setItem("themeColor", color);
    document.documentElement.style.setProperty("--primary-color", color);
  };

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    localStorage.setItem("darkMode", String(newVal));
    setDarkMode(newVal);
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        darkMode,
        toggleDarkMode,
        primaryColor: currentTheme.primaryColor,
        setPrimaryColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useThemeContext must be used within ThemeProvider");
  return context;
}
