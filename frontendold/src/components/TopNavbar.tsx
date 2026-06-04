
import { LogOut, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

//////////////////////////////////////////////////////
// HELPER — Full URL for logo
//////////////////////////////////////////////////////
const getFullUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `http://localhost:5000${path}`;
};

type TopNavbarProps = {
  tenant?: any;
};

export default function TopNavbar({ tenant }: TopNavbarProps) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const safeTenant = tenant || {};

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenant");
    navigate("/");
  };

  // ✅ FIXED — getFullUrl for tenant logo
  const tenantLogoSrc = getFullUrl(safeTenant?.logoUrl);

  return (
    <div className="w-full bg-white px-6 py-3 rounded-xl shadow flex justify-between items-center mb-6">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        {user?.role === "SUPER_ADMIN" ? (
          <>
            <img
              src="/ynlogo.png"
              alt="brand"
              className="w-10 h-10 object-contain"
            />
            <div>
              <p className="text-gray text-xl font-bold">
                Manage All Tenants
              </p>
            </div>
          </>
        ) : (
          <>
            {/* TENANT LOGO — FIXED ✅ */}
            {tenantLogoSrc ? (
              <img
                src={tenantLogoSrc}
                alt="tenant logo"
                className="w-10 h-10 rounded-lg object-cover border"
                onError={(e: any) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center rounded-lg font-bold">
                {safeTenant?.name?.charAt(0) || "T"}
              </div>
            )}

            {/* TENANT NAME */}
            <div>
              <p className="font-semibold">
                {safeTenant?.name || "Tenant Panel"}
              </p>
              <p className="text-xs text-gray-500">
                {safeTenant?.type || "School Panel"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <UserCircle size={20} />
          <span>
            {user?.name} ({user?.role})
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

    </div>
  );
}

