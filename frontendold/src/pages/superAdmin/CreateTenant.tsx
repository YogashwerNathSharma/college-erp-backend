
import { useState, useRef } from "react";
import axios from "axios";
import { X, Building2, Save, Loader2, Upload, Image } from "lucide-react";
import toast from "react-hot-toast";

//////////////////////////////////////////////////////
// 🚀 TYPES
//////////////////////////////////////////////////////

interface CreateTenantProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

//////////////////////////////////////////////////////
// 🚀 CREATE TENANT MODAL
//////////////////////////////////////////////////////

export default function CreateTenant({ isOpen, onClose, onSuccess }: CreateTenantProps) {
  //////////////////////////////////////////////////////
  // STATE
  //////////////////////////////////////////////////////

  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string>("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "school",
    email: "",
    phone: "",
    address: "",
    maxStudents: 100,
    maxTeachers: 20,
    maxAdmins: 5,
    maxStorageInGB: 5,
  });

  //////////////////////////////////////////////////////
  // HANDLE CHANGE
  //////////////////////////////////////////////////////

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  //////////////////////////////////////////////////////
  // HANDLE FILE SELECT
  //////////////////////////////////////////////////////

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo must be less than 2MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBgSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Background must be less than 5MB");
        return;
      }
      setBgFile(file);
      setBgPreview(URL.createObjectURL(file));
    }
  };

  //////////////////////////////////////////////////////
  // SUBMIT
  //////////////////////////////////////////////////////

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Tenant name is required");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Use FormData for file upload
      const data = new FormData();
      data.append("name", formData.name);
      data.append("type", formData.type);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("address", formData.address);
      data.append("maxStudents", String(formData.maxStudents));
      data.append("maxTeachers", String(formData.maxTeachers));
      data.append("maxAdmins", String(formData.maxAdmins));
      data.append("maxStorageInGB", String(formData.maxStorageInGB));

      if (logoFile) {
        data.append("logo", logoFile);
      }
      if (bgFile) {
        data.append("background", bgFile);
      }

      await axios.post(
        "http://localhost:5000/api/super-admin/tenants",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Tenant created successfully! 🎉");
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create tenant");
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // RESET
  //////////////////////////////////////////////////////

  const resetForm = () => {
    setFormData({
      name: "",
      type: "school",
      email: "",
      phone: "",
      address: "",
      maxStudents: 100,
      maxTeachers: 20,
      maxAdmins: 5,
      maxStorageInGB: 5,
    });
    setLogoFile(null);
    setLogoPreview("");
    setBgFile(null);
    setBgPreview("");
  };

  //////////////////////////////////////////////////////
  // IF NOT OPEN
  //////////////////////////////////////////////////////

  if (!isOpen) return null;

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Create New Tenant</h2>
              <p className="text-sm text-slate-500">Add a new school/college to the platform</p>
            </div>
          </div>

          <button
            onClick={() => { onClose(); resetForm(); }}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* BASIC INFO */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tenant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Delhi Public School"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="school">School</option>
                  <option value="college">College</option>
                  <option value="university">University</option>
                  <option value="coaching">Coaching Center</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@school.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Full address..."
                rows={2}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* BRANDING - FILE UPLOAD */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Branding</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LOGO UPLOAD */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo <span className="text-slate-400">(Max 2MB)</span>
                </label>

                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoSelect}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
                >
                  {logoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-indigo-400"
                      />
                      <span className="text-xs text-indigo-600 font-medium">
                        {logoFile?.name}
                      </span>
                      <span className="text-xs text-slate-400">Click to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Upload size={24} className="text-slate-400" />
                      <span className="text-sm text-slate-500">Click to upload logo</span>
                      <span className="text-xs text-slate-400">PNG, JPG up to 2MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* BACKGROUND UPLOAD */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Background <span className="text-slate-400">(Max 5MB)</span>
                </label>

                <input
                  type="file"
                  ref={bgInputRef}
                  onChange={handleBgSelect}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onClick={() => bgInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
                >
                  {bgPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={bgPreview}
                        alt="Background preview"
                        className="w-full h-16 rounded-lg object-cover border border-indigo-300"
                      />
                      <span className="text-xs text-indigo-600 font-medium">
                        {bgFile?.name}
                      </span>
                      <span className="text-xs text-slate-400">Click to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Image size={24} className="text-slate-400" />
                      <span className="text-sm text-slate-500">Click to upload background</span>
                      <span className="text-xs text-slate-400">PNG, JPG up to 5MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* LIMITS */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Subscription Limits</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Students</label>
                <input
                  type="number"
                  name="maxStudents"
                  value={formData.maxStudents}
                  onChange={handleChange}
                  min={0}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Teachers</label>
                <input
                  type="number"
                  name="maxTeachers"
                  value={formData.maxTeachers}
                  onChange={handleChange}
                  min={0}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Admins</label>
                <input
                  type="number"
                  name="maxAdmins"
                  value={formData.maxAdmins}
                  onChange={handleChange}
                  min={0}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Storage (GB)</label>
                <input
                  type="number"
                  name="maxStorageInGB"
                  value={formData.maxStorageInGB}
                  onChange={handleChange}
                  min={0}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => { onClose(); resetForm(); }}
              className="px-6 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Create Tenant
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

