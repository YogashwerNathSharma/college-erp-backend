import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import {
  UserCog,
  Mail,
  Phone,
  Shield,
  Save,
  Loader2,
  Users,
  Calendar,
} from "lucide-react";

// ─── Types ───
interface ParentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  className: string;
  sectionName: string;
  relation: string;
  isPrimary: boolean;
}

function ParentProfilePage() {
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchChildren();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/parent/profile"));
      if (res.data?.success) {
        const p = res.data.data;
        setProfile(p);
        setEditName(p.name || "");
        setEditPhone(p.phone || "");
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/parent/my-children"));
      if (res.data?.success) {
        setChildren(res.data.data || []);
      }
    } catch {}
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(getFullUrl("/api/parent/profile"), {
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      if (res.data?.success) {
        setProfile(res.data.data);
        toast.success("Profile updated successfully!");

        // Update localStorage user too
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          user.name = editName.trim();
          localStorage.setItem("user", JSON.stringify(user));
        } catch {}
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <UserCog className="text-teal-600" size={24} />
        My Profile
      </h1>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Avatar & Info */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {profile?.name?.charAt(0)?.toUpperCase() || "P"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{profile?.name}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                <Shield size={12} />
                Parent
              </span>
              {profile?.isActive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
              <Mail size={16} />
              {profile?.email}
              <span className="text-xs text-gray-400 ml-auto">(Cannot be changed)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {profile?.createdAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Created
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                <Calendar size={16} />
                {formatDate(profile.createdAt)}
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Linked Children */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Users className="text-teal-600" size={18} />
          Linked Children
        </h3>
        {children.length === 0 ? (
          <p className="text-sm text-gray-400">No children linked yet.</p>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold flex-shrink-0">
                  {child.firstName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {child.firstName} {child.lastName}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-gray-500">
                      Adm: <span className="font-medium">{child.admissionNo}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      Class: <span className="font-medium">{child.className} - {child.sectionName}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 capitalize">
                    {child.relation.toLowerCase()}
                  </span>
                  {child.isPrimary && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      Primary
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ParentProfilePage;
