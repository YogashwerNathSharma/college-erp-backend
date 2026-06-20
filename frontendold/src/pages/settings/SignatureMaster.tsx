
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  PenTool,
  Plus,
  Edit3,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Upload,
  Eye,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────

interface Signature {
  id: string;
  title: string;
  personName: string;
  designation: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  title: string;
  personName: string;
  designation: string;
  isActive: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────

const API_BASE = "";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Component ─────────────────────────────────────────────────────────

const SignatureMaster: React.FC = () => {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSignature, setEditingSignature] = useState<Signature | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    personName: "",
    designation: "",
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Fetch Signatures ──────────────────────────────────────────────────

  const fetchSignatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/signature");
      if (response.data.success) {
        setSignatures(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load signatures");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignatures();
  }, [fetchSignatures]);

  // ─── Auto-clear messages ──────────────────────────────────────────────

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ─── Modal Controls ────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingSignature(null);
    setFormData({ title: "", personName: "", designation: "", isActive: true });
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (sig: Signature) => {
    setEditingSignature(sig);
    setFormData({
      title: sig.title,
      personName: sig.personName,
      designation: sig.designation,
      isActive: sig.isActive,
    });
    setImageFile(null);
    setImagePreview(sig.imageUrl ? `${API_BASE}${sig.imageUrl}` : null);
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSignature(null);
    setFormData({ title: "", personName: "", designation: "", isActive: true });
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
  };

  // ─── Image Handler ─────────────────────────────────────────────────────

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ─── Submit Handler ────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.title.trim() || !formData.personName.trim() || !formData.designation.trim()) {
      setFormError("All fields are required");
      return;
    }

    if (!editingSignature && !imageFile) {
      setFormError("Signature image is required");
      return;
    }

    try {
      setSubmitting(true);

      const submitData = new FormData();
      submitData.append("title", formData.title.trim());
      submitData.append("personName", formData.personName.trim());
      submitData.append("designation", formData.designation.trim());
      submitData.append("isActive", String(formData.isActive));

      if (imageFile) {
        submitData.append("image", imageFile);
      }

      if (editingSignature) {
        await api.put(`/api/signature/${editingSignature.id}`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccessMsg("Signature updated successfully");
      } else {
        await api.post("/api/signature", submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccessMsg("Signature created successfully");
      }

      closeModal();
      fetchSignatures();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to save signature");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Handler ────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(true);
      await api.delete(`/api/signature/${id}`);
      setSuccessMsg("Signature deleted successfully");
      setDeleteConfirm(null);
      fetchSignatures();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete signature");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <PenTool className="text-primary-600" size={28} />
            Signature Master
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage authorized signatures for reports, certificates & ID cards
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Signature
        </button>
      </div>

      {/* Toast Messages */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary-600" size={32} />
          <span className="ml-3 text-gray-500">Loading signatures...</span>
        </div>
      ) : signatures.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <PenTool className="mx-auto text-gray-300" size={48} />
          <p className="mt-4 text-gray-500 text-lg">No signatures added yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Click "Add Signature" to create your first signature
          </p>
        </div>
      ) : (
        /* Table */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Person Name
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {signatures.map((sig) => (
                  <tr key={sig.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-20 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                        {sig.imageUrl ? (
                          <img
                            src={`${API_BASE}${sig.imageUrl}`}
                            alt={sig.title}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Eye className="text-gray-400" size={16} />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800">{sig.title}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{sig.personName}</td>
                    <td className="px-6 py-4 text-gray-600">{sig.designation}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sig.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {sig.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(sig)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(sig.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">
                {editingSignature ? "Edit Signature" : "Add New Signature"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Principal, Director, Manager"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              {/* Person Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Person Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.personName}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Principal, Head of Department"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signature Image{" "}
                  {!editingSignature && <span className="text-red-500">*</span>}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="w-full h-24 flex items-center justify-center bg-gray-50 rounded-lg">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-20 max-w-full object-contain"
                        />
                      </div>
                      <label className="cursor-pointer text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload className="mx-auto text-gray-400" size={32} />
                      <p className="mt-2 text-sm text-gray-500">
                        Click to upload signature image
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WEBP (max 5MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-gray-700">Active Status</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    formData.isActive ? "bg-primary-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      formData.isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  {editingSignature ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Signature</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this signature? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleteLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleteLoading && <Loader2 className="animate-spin" size={16} />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureMaster;
