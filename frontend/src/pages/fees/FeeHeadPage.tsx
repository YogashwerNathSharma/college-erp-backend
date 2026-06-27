
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";

interface FeeHead {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  type: "RECURRING" | "ONE_TIME";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FeeHeadFormData {
  name: string;
  code: string;
  description: string;
  type: "RECURRING" | "ONE_TIME";
}

const initialFormData: FeeHeadFormData = {
  name: "",
  code: "",
  description: "",
  type: "RECURRING",
};

const FeeHeadPage: React.FC = () => {
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FeeHeadFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  // Fetch all fee heads
  const fetchFeeHeads = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/fees/heads");
      setFeeHeads(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch fee heads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeHeads();
  }, []);

  // Filtered fee heads based on search
  const filteredFeeHeads = useMemo(() => {
    if (!searchQuery.trim()) return feeHeads;
    const query = searchQuery.toLowerCase();
    return feeHeads.filter(
      (fh) =>
        fh.name.toLowerCase().includes(query) ||
        fh.code?.toLowerCase().includes(query) ||
        fh.description?.toLowerCase().includes(query) ||
        fh.type.toLowerCase().includes(query)
    );
  }, [feeHeads, searchQuery]);

  // Open modal for creating
  const handleAdd = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (feeHead: FeeHead) => {
    setEditingId(feeHead.id);
    setFormData({
      name: feeHead.name,
      code: feeHead.code || "",
      description: feeHead.description || "",
      type: feeHead.type,
    });
    setIsModalOpen(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  // Submit create/update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Fee head name is required");
      return;
    }

    try {
      setSubmitting(true);

      if (editingId) {
        await axios.put(`/api/fees/heads/${editingId}`, formData);
        toast.success("Fee head updated successfully");
      } else {
        await axios.post("/api/fees/heads", formData);
        toast.success("Fee head created successfully");
      }

      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
      fetchFeeHeads();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete
  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await axios.delete(`/api/fees/heads/${deletingId}`);
      toast.success("Fee head deleted successfully");
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      fetchFeeHeads();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete fee head");
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (feeHead: FeeHead) => {
    try {
      await axios.put(`/api/fees/heads/${feeHead.id}`, {
        isActive: !feeHead.isActive,
      });
      toast.success(
        `Fee head ${feeHead.isActive ? "deactivated" : "activated"} successfully`
      );
      fetchFeeHeads();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fee Heads</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage fee head categories for fee structure setup
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
        >
          <FiPlus className="w-4 h-4" />
          Add Fee Head
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, code, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">
                  Name
                </th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">
                  Code
                </th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 hidden md:table-cell">
                  Description
                </th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">
                  Type
                </th>
                <th className="text-center px-6 py-3 font-semibold text-gray-600">
                  Status
                </th>
                <th className="text-center px-6 py-3 font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : filteredFeeHeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    {searchQuery
                      ? "No fee heads match your search"
                      : "No fee heads found. Click 'Add Fee Head' to create one."}
                  </td>
                </tr>
              ) : (
                filteredFeeHeads.map((feeHead) => (
                  <tr
                    key={feeHead.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {feeHead.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {feeHead.code ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {feeHead.code}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 hidden md:table-cell max-w-xs truncate">
                      {feeHead.description || (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          feeHead.type === "RECURRING"
                            ? "bg-primary-100 text-primary-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {feeHead.type === "RECURRING" ? "Recurring" : "One-Time"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(feeHead)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          feeHead.isActive
                            ? "text-green-700 hover:bg-green-50"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                        title={
                          feeHead.isActive
                            ? "Click to deactivate"
                            : "Click to activate"
                        }
                      >
                        {feeHead.isActive ? (
                          <>
                            <FiToggleRight className="w-5 h-5" />
                            Active
                          </>
                        ) : (
                          <>
                            <FiToggleLeft className="w-5 h-5" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(feeHead)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(feeHead.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with count */}
        {!loading && filteredFeeHeads.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Showing {filteredFeeHeads.length} of {feeHeads.length} fee head
            {feeHeads.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingId ? "Edit Fee Head" : "Add Fee Head"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Tuition Fee"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  required
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., TF"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Short code for reference (optional)
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this fee head..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-none"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "RECURRING" | "ONE_TIME",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                >
                  <option value="RECURRING">Recurring</option>
                  <option value="ONE_TIME">One-Time</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Recurring fees repeat each term; one-time fees are charged once
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Saving..."
                    : editingId
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <FiTrash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
                Delete Fee Head
              </h3>
              <p className="text-sm text-gray-500 text-center">
                Are you sure you want to delete this fee head? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeHeadPage;

