import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyAttendance from "./pages/MyAttendance";
import MyResults from "./pages/MyResults";
import MyFees from "./pages/MyFees";
import MyTimetable from "./pages/MyTimetable";
import Notices from "./pages/Notices";
import DownloadDocuments from "./pages/DownloadDocuments";
import Profile from "./pages/Profile";

//////////////////////////////////////////////////////
// 🔒 PROTECTED ROUTE WRAPPER
//////////////////////////////////////////////////////
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

//////////////////////////////////////////////////////
// 🚀 APP ROUTES
//////////////////////////////////////////////////////
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="results" element={<MyResults />} />
        <Route path="fees" element={<MyFees />} />
        <Route path="timetable" element={<MyTimetable />} />
        <Route path="notices" element={<Notices />} />
        <Route path="documents" element={<DownloadDocuments />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
