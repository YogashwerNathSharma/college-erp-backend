import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// ✅ Lazy load pages (even for marketing site — Gallery/Payment can be heavy)
const Home = lazy(() => import("../pages/Home"));
const GalleryPage = lazy(() => import("../pages/GalleryPage"));
const PaymentPage = lazy(() => import("../pages/PaymentPage"));
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 🌐 Website */}
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/payment" element={<PaymentPage />} />

        {/* ERP */}
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}
