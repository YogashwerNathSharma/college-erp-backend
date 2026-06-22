import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

//////////////////////////////////////////////////////
// LOAD THEME EARLY (before React renders — no flash)
//////////////////////////////////////////////////////
const savedTheme = localStorage.getItem("themeColor");
if (savedTheme) {
  document.documentElement.style.setProperty("--primary-color", savedTheme);
}

//////////////////////////////////////////////////////
// ❌ REMOVED: Duplicate axios config (already in App.tsx)
// ❌ REMOVED: Razorpay script (now loaded on-demand via useRazorpay hook)
//////////////////////////////////////////////////////

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
