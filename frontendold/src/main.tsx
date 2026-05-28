import React from "react";

import ReactDOM from "react-dom/client";

import App from "./App.tsx";

import "./index.css";

//////////////////////////////////////////////////////
// LOAD RAZORPAY SCRIPT
//////////////////////////////////////////////////////

const razorpayScript =
  document.createElement("script");

razorpayScript.src =
  "https://checkout.razorpay.com/v1/checkout.js";

razorpayScript.async = true;

document.body.appendChild(
  razorpayScript
);

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