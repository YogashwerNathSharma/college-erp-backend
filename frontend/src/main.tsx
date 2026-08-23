import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./responsive.css";

//////////////////////////////////////////////////////
// LOAD THEME EARLY (before React renders — no flash)
//////////////////////////////////////////////////////
// Theme presets inline (must match ThemeContext.tsx)
const THEME_DEFAULTS: Record<string, { gradient: string; activeBg: string; accentText: string; accentBorder: string; primary: string; primaryHover: string; badge: string }> = {
  "navy-amber": { gradient: "linear-gradient(180deg, #1e2a4a 0%, #152038 50%, #0f1729 100%)", activeBg: "linear-gradient(to right, #f59e0b, #d97706)", accentText: "#fbbf24", accentBorder: "rgba(251, 191, 36, 0.4)", primary: "#4f46e5", primaryHover: "#4338ca", badge: "#f43f5e" },
  "indigo": { gradient: "linear-gradient(180deg, #312e81 0%, #1e1b4b 50%, #0f0e2e 100%)", activeBg: "linear-gradient(to right, #6366f1, #4f46e5)", accentText: "#a5b4fc", accentBorder: "rgba(165, 180, 252, 0.4)", primary: "#4f46e5", primaryHover: "#4338ca", badge: "#f43f5e" },
  "emerald": { gradient: "linear-gradient(180deg, #064e3b 0%, #022c22 50%, #011a14 100%)", activeBg: "linear-gradient(to right, #10b981, #059669)", accentText: "#6ee7b7", accentBorder: "rgba(110, 231, 183, 0.4)", primary: "#059669", primaryHover: "#047857", badge: "#f43f5e" },
  "purple": { gradient: "linear-gradient(180deg, #4c1d95 0%, #2e1065 50%, #1a0840 100%)", activeBg: "linear-gradient(to right, #a855f7, #7c3aed)", accentText: "#c4b5fd", accentBorder: "rgba(196, 181, 253, 0.4)", primary: "#7c3aed", primaryHover: "#6d28d9", badge: "#f43f5e" },
  "ocean-blue": { gradient: "linear-gradient(180deg, #164e63 0%, #0c3547 50%, #071e2e 100%)", activeBg: "linear-gradient(to right, #06b6d4, #0891b2)", accentText: "#67e8f9", accentBorder: "rgba(103, 232, 249, 0.4)", primary: "#0891b2", primaryHover: "#0e7490", badge: "#f43f5e" },
  "rose": { gradient: "linear-gradient(180deg, #4c0519 0%, #300211 50%, #1a010a 100%)", activeBg: "linear-gradient(to right, #fb7185, #e11d48)", accentText: "#fda4af", accentBorder: "rgba(253, 164, 175, 0.4)", primary: "#e11d48", primaryHover: "#be123c", badge: "#f97316" },
  "sunset-orange": { gradient: "linear-gradient(180deg, #431407 0%, #27080a 50%, #1a0505 100%)", activeBg: "linear-gradient(to right, #f97316, #ea580c)", accentText: "#fdba74", accentBorder: "rgba(253, 186, 116, 0.4)", primary: "#ea580c", primaryHover: "#c2410c", badge: "#f43f5e" },
  "teal": { gradient: "linear-gradient(180deg, #134e4a 0%, #0a302e 50%, #051c1b 100%)", activeBg: "linear-gradient(to right, #14b8a6, #0d9488)", accentText: "#5eead4", accentBorder: "rgba(94, 234, 212, 0.4)", primary: "#0d9488", primaryHover: "#0f766e", badge: "#f43f5e" },
  "slate-minimal": { gradient: "linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #020617 100%)", activeBg: "linear-gradient(to right, #64748b, #475569)", accentText: "#94a3b8", accentBorder: "rgba(148, 163, 184, 0.4)", primary: "#475569", primaryHover: "#334155", badge: "#f43f5e" },
  "blue-classic": { gradient: "linear-gradient(180deg, #1e3a5f 0%, #122a47 50%, #0a1929 100%)", activeBg: "linear-gradient(to right, #3b82f6, #2563eb)", accentText: "#93c5fd", accentBorder: "rgba(147, 197, 253, 0.4)", primary: "#2563eb", primaryHover: "#1d4ed8", badge: "#f43f5e" },
};

const savedThemeId = localStorage.getItem("erpThemeId") || "navy-amber";
const t = THEME_DEFAULTS[savedThemeId] || THEME_DEFAULTS["navy-amber"];
const root = document.documentElement;
root.style.setProperty("--primary-color", t.primary);
root.style.setProperty("--primary-hover", t.primaryHover);
root.style.setProperty("--sidebar-gradient", t.gradient);
root.style.setProperty("--sidebar-active-bg", t.activeBg);
root.style.setProperty("--sidebar-active-text", "#ffffff");
root.style.setProperty("--sidebar-accent-text", t.accentText);
root.style.setProperty("--sidebar-accent-border", t.accentBorder);
root.style.setProperty("--badge-color", t.badge);

// Dark mode
const savedDarkMode = localStorage.getItem("darkMode");
if (savedDarkMode === null || savedDarkMode === "true") {
  document.documentElement.classList.add("dark");
}

//////////////////////////////////////////////////////
// APP
//////////////////////////////////////////////////////
ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
