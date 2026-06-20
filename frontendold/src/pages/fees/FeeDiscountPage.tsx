
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface FeeHead {
  id: string;
  name: string;
}

interface FeeDiscount {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  description: string | null;
  applicableHeadIds: string[];
  isActive: boolean;
  createdAt: string;
}

const FeeDiscountPage: React.FC = () => {
  const [discounts, setDiscounts] = useState<FeeDiscount[]>([]);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<FeeDiscount | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: "",
    description: "",
    applicableHeadIds: [] as string[],
  });

  useEffect(() => {
    fetchDiscounts();
    fetchFeeHeads();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const res = await axios.get("/api/fees/discounts");
      setDiscounts(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch discounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeHeads = async () => {
    try {
      const res = await axios.get("/api/fees/heads");
            const data = res.data.data || res.data;
      setFeeHeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch fee heads");
    }
  };

  const openCreateModal = () => {
    setEditingDiscount(null);
    setFormData({
      name: "",
      type: "PERCENTAGE",
      value: "",
      description: "",
      applicableHeadIds: [],
    });
    setShowModal(true);
  };

  const openEditModal = (discount: FeeDiscount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      type: discount.type,
      value: discount.value.toString(),
      description: discount.description || "",
      applicableHeadIds: discount.applicableHeadIds,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.value) {
      toast.error("Name and value are required");
      return;
    }

    const payload = {
      name: formData.name,
      type: formData.type,
      value: parseFloat(formData.value),
      description: formData.description || undefined,
      applicableHeadIds: formData.applicableHeadIds,
    };

    try {
      if (editingDiscount) {
        await axios.put(`/api/fees/discounts/${editingDiscount.id}`, payload);
        toast.success("Discount updated successfully");
      } else {
        await axios.post("/api/fees/discounts", payload);
        toast.success("Discount created successfully");
      }
      setShowModal(false);
      fetchDiscounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this discount?")) return;

    try {
      await axios.delete(`/api/fees/discounts/${id}`);
      toast.success("Discount deleted successfully");
      fetchDiscounts();
    } catch (error) {
      toast.error("Failed to delete discount");
    }
  };

  const toggleActive = async (discount: FeeDiscount) => {
    try {
      await axios.put(`/api/fees/discounts/${discount.id}`, {
        isActive: !discount.isActive,
      });
      toast.success(`Discount ${discount.isActive ? "deactivated" : "activated"}`);
      fetchDiscounts();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleHeadToggle = (headId: string) => {
    setFormData((prev) => ({
      ...prev,
      applicableHeadIds: prev.applicableHeadIds.includes(headId)
        ? prev.applicableHeadIds.filter((id) => id !== headId)
        : [...prev.applicableHeadIds, headId],
    }));
  };

  const formatValue = (type: string, value: number) => {
    return type === "PERCENTAGE" ? `${value}%` : `₹${value}`;
  };

  const getHeadNames = (headIds: string[]) => {
    if (!headIds.length) return "All Heads";
    return headIds
      .map((id) => feeHeads.find((h) => h.id === id)?.name || "Unknown")
      .join(", ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Discounts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage discount rules for fee concessions and scholarships
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Discount
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applicable Heads
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {discounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No discounts found. Click "Add Discount" to create one.
                </td>
              </tr>
            ) : (
              discounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{discount.name}</div>
                    {discount.description && (
                      <div className="text-sm text-gray-500">{discount.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        discount.type === "PERCENTAGE"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {discount.type === "PERCENTAGE" ? "Percentage" : "Fixed"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatValue(discount.type, discount.value)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {getHeadNames(discount.applicableHeadIds)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(discount)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        discount.isActive ? "bg-primary-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          discount.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(discount)}
                      className="text-primary-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(discount.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingDiscount ? "Edit Discount" : "Add Discount"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Sibling Discount, Merit Scholarship"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as "PERCENTAGE" | "FIXED" })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value {formData.type === "PERCENTAGE" ? "(%)" : "(₹)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={formData.type === "PERCENTAGE" ? "100" : undefined}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={formData.type === "PERCENTAGE" ? "e.g., 10" : "e.g., 500"}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={2}
                    placeholder="Brief description of this discount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Applicable Fee Heads
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                    {feeHeads.length === 0 ? (
                      <p className="text-sm text-gray-500">No fee heads available</p>
                    ) : (
                      feeHeads.map((head) => (
                        <label key={head.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.applicableHeadIds.includes(head.id)}
                            onChange={() => handleHeadToggle(head.id)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">{head.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to apply to all fee heads
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingDiscount ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeDiscountPage;

