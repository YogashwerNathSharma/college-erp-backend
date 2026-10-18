import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { HiMenu, HiX, HiUser, HiLogout } from "react-icons/hi";

//////////////////////////////////////////////////////
// 🧭 NAVBAR COMPONENT
//////////////////////////////////////////////////////

const navLinks = [
  { path: "/", label: "Dashboard" },
  { path: "/attendance", label: "Attendance" },
  { path: "/results", label: "Results" },
  { path: "/fees", label: "Fees" },
  { path: "/timetable", label: "Timetable" },
  { path: "/notices", label: "Notices" },
  { path: "/documents", label: "Documents" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary-600">
              Student Portal
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/profile"
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-primary-600"
            >
              <HiUser className="w-5 h-5" />
              <span>{user?.name || "Student"}</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
            >
              <HiLogout className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50"
            >
              Profile
            </Link>
            <button
              onClick={logout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
