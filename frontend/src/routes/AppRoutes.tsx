import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import GalleryPage from "../pages/GalleryPage";
import PaymentPage from "../pages/PaymentPage";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🌐 Website */}
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/payment" element={<PaymentPage />} />

        {/* ERP */}
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}