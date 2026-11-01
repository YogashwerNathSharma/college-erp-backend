import { useState, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}
function normalizeId(item: any): string { return item?.id || item?._id || ""; }
function Spinner() { return (<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>); }

function getCurrentUser() {
  try { const raw = localStorage.getItem("user"); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

export default function MyProfilePage() {
  const user = useMemo(() => getCurrentUser(), []);
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleChangePassword() {
    if (!passwords.current || !passwords.newPass) { toast.error("Please fill in all password fields"); return; }
    if (passwords.newPass !== passwords.confirm) { toast.error("New passwords don't match"); return; }
    if (passwords.newPass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setChangingPassword(true);
    try {
      await axios.put(getFullUrl("/api/auth/change-password"), { currentPassword: passwords.current, newPassword: passwords.newPass }, { headers: getAuthHeaders() });
      toast.success("Password changed successfully!");
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to change password"); }
    finally { setChangingPassword(false); }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">{user?.name?.[0] || "T"}</div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{user?.name || "Teacher"}</h3>
            <p className="text-sm text-gray-500">{user?.email || "-"}</p>
            <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium capitalize">{user?.role || "teacher"}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div><p className="text-xs text-gray-500 uppercase tracking-wide">Name</p><p className="text-sm font-medium text-gray-800 mt-1">{user?.name || "-"}</p></div>
          <div><p className="text-xs text-gray-500 uppercase tracking-wide">Email</p><p className="text-sm font-medium text-gray-800 mt-1">{user?.email || "-"}</p></div>
          <div><p className="text-xs text-gray-500 uppercase tracking-wide">Role</p><p className="text-sm font-medium text-gray-800 mt-1 capitalize">{user?.role || "-"}</p></div>
          <div><p className="text-xs text-gray-500 uppercase tracking-wide">User ID</p><p className="text-sm font-medium text-gray-800 mt-1 font-mono text-xs">{user?.id || "-"}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label><input type="password" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password</label><input type="password" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={passwords.newPass} onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label><input type="password" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} /></div>
          <button onClick={handleChangePassword} disabled={changingPassword} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">{changingPassword ? "Changing..." : "Change Password"}</button>
        </div>
      </div>
    </div>
  );
}
