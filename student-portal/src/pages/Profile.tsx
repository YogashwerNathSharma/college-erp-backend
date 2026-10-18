import { useState, useEffect } from "react";
import { portalService } from "../services/portal.service";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { HiUser, HiPhone, HiMail, HiLocationMarker } from "react-icons/hi";

//////////////////////////////////////////////////////
// 👤 PROFILE PAGE
//////////////////////////////////////////////////////

interface ProfileData {
  personal: {
    name: string;
    admissionNo: string;
    rollNo: string;
    class: string;
    section: string;
    dob: string;
    gender: string;
    bloodGroup: string;
    photo?: string;
  };
  parents: {
    fatherName: string;
    fatherPhone: string;
    motherName: string;
    motherPhone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  contact: {
    phone: string;
    email: string;
  };
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await portalService.getProfile();
        setProfile(data);
        setPhone(data?.contact?.phone || "");
        setEmail(data?.contact?.email || "");
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      await portalService.updateProfile({ phone, email });
      toast.success("Profile updated!");
      setEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
        >
          {editing ? "Save Changes" : "Edit Contact"}
        </button>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            {profile?.personal?.photo ? (
              <img src={profile.personal.photo} className="w-20 h-20 rounded-full object-cover" alt="Profile" />
            ) : (
              <HiUser className="w-10 h-10 text-primary-600" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile?.personal?.name}</h2>
            <p className="text-gray-500">
              {profile?.personal?.class} - {profile?.personal?.section} | Roll No: {profile?.personal?.rollNo}
            </p>
            <p className="text-sm text-gray-400">Admission No: {profile?.personal?.admissionNo}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <InfoItem label="Date of Birth" value={profile?.personal?.dob || "—"} />
          <InfoItem label="Gender" value={profile?.personal?.gender || "—"} />
          <InfoItem label="Blood Group" value={profile?.personal?.bloodGroup || "—"} />
          <InfoItem label="Class" value={`${profile?.personal?.class} - ${profile?.personal?.section}`} />
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              <HiPhone className="w-4 h-4 inline mr-1" /> Phone
            </label>
            {editing ? (
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            ) : (
              <p className="font-medium text-gray-900">{profile?.contact?.phone || "—"}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              <HiMail className="w-4 h-4 inline mr-1" /> Email
            </label>
            {editing ? (
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            ) : (
              <p className="font-medium text-gray-900">{profile?.contact?.email || "—"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Parents Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Father's Name" value={profile?.parents?.fatherName || "—"} />
          <InfoItem label="Father's Phone" value={profile?.parents?.fatherPhone || "—"} />
          <InfoItem label="Mother's Name" value={profile?.parents?.motherName || "—"} />
          <InfoItem label="Mother's Phone" value={profile?.parents?.motherPhone || "—"} />
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <HiLocationMarker className="w-5 h-5 inline mr-1" /> Address
        </h3>
        <p className="text-gray-700">
          {profile?.address?.street}, {profile?.address?.city}, {profile?.address?.state} - {profile?.address?.pincode}
        </p>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}
