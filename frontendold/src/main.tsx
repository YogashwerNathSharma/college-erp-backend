import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
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
// AXIOS GLOBAL CONFIG
//////////////////////////////////////////////////////

axios.defaults.baseURL = "";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//////////////////////////////////////////////////////
// LOAD RAZORPAY SCRIPT
//////////////////////////////////////////////////////

const razorpayScript = document.createElement("script");
razorpayScript.src = "https://checkout.razorpay.com/v1/checkout.js";
razorpayScript.async = true;
document.body.appendChild(razorpayScript);

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