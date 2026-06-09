
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface FineRule {
  id: string;
  name: string;
  afterDays: number;
  amountPerDay: number;
  maxAmount: number;
  isActive: boolean;
  createdAt: string;
}

const FineRulePage: React.FC = () => {
  const [rules, setRules] = useState<FineRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<FineRule | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    afterDays: "",
    amountPerDay: "",
    maxAmount: "",
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await axios.get("/api/fees/fine-rules");
      setRules(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch fine rules");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setFormData({
      name: "",
      afterDays: "",
      amountPerDay: "",
      maxAmount: "",
    });
    setShowModal(true);
  };

  const openEditModal = (rule: FineRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      afterDays: rule.afterDays.toString(),
      amountPerDay: rule.amountPerDay.toString(),
      maxAmount: rule.maxAmount.toString(),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.afterDays || !formData.amountPerDay || !formData.maxAmount) {
      toast.error("All fields are required");
      return;
    }

    const payload = {
      name: formData.name,
      afterDays: parseInt(formData.afterDays),
      amountPerDay: parseFloat(formData.amountPerDay),
      maxAmount: parseFloat(formData.maxAmount),
    };

    try {
      if (editingRule) {
        await axios.put(`/api/fees/fine-rules/${editingRule.id}`, payload);
        toast.success("Fine rule updated successfully");
      } else {
        await axios.post("/api/fees/fine-rules", payload);
        toast.success("Fine rule created successfully");
      }
      setShowModal(false);
      fetchRules();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this fine rule?")) return;

    try {
      await axios.delete(`/api/fees/fine-rules/${id}`);
      toast.success("Fine rule deleted successfully");
      fetchRules();
    } catch (error) {
      toast.error("Failed to delete fine rule");
    }
  };

  const toggleActive = async (rule: FineRule) => {
    try {
      await axios.put(`/api/fees/fine-rules/${rule.id}`, {
        isActive: !rule.isActive,
      });
      toast.success(`Fine rule ${rule.isActive ? "deactivated" : "activated"}`);
      fetchRules();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getFineDescription = (rule: FineRule) => {
    return `Fine of ₹${rule.amountPerDay}/day starts after ${rule.afterDays} days, maximum ₹${rule.maxAmount}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fine Rules</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure late payment fine rules for fee collections
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Fine Rule
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
                After Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount/Day
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Amount
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
            {rules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No fine rules found. Click "Add Fine Rule" to create one.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{getFineDescription(rule)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{rule.afterDays} days</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">₹{rule.amountPerDay}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-red-600">₹{rule.maxAmount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(rule)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        rule.isActive ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          rule.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(rule)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
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
                {editingRule ? "Edit Fine Rule" : "Add Fine Rule"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Standard Late Fee, Exam Fee Late Fine"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      After Days
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.afterDays}
                      onChange={(e) => setFormData({ ...formData, afterDays: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 10"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ₹ Per Day
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amountPerDay}
                      onChange={(e) => setFormData({ ...formData, amountPerDay: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxAmount}
                      onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 500"
                      required
                    />
                  </div>
                </div>

                {/* Preview */}
                {formData.afterDays && formData.amountPerDay && formData.maxAmount && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">Preview:</span> Fine of ₹
                      {formData.amountPerDay}/day starts after {formData.afterDays} days, maximum ₹
                      {formData.maxAmount}
                    </p>
                  </div>
                )}

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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingRule ? "Update" : "Create"}
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

export default FineRulePage;

