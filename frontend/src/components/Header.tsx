import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* LEFT LOGO */}
      <div className="flex items-center gap-3">
  <img src={logo} className="h-16 w-auto object-contain" />
  <span className="font-semibold text-gray-800 text-lg">
    R.M.S Academy
  </span>
</div>

        {/* CENTER MENU */}
        <nav className="hidden md:flex gap-6 text-gray-600 font-medium">
          <Link to="/" className="text-blue-600 bg-blue-100 px-3 py-1 rounded-md">
            Home
          </Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/payment">Pay Fees</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        {/* RIGHT */}
        <div className="text-sm text-gray-600">
          Admin Login
        </div>

      </div>
    </header>
  );
}