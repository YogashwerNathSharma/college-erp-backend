
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";

// Types
interface FeeHead {
  id: string;
  name: string;
  code: string;
}

interface FeeStructureItem {
  id?: string;
  feeHeadId: string;
  amount: number;
  frequency: string;
  feeHead?: FeeHead;
}

interface FeeStructure {
  id: string;
  name: string;
  classId: string;
  academicYearId: string;
  installmentType: string;
  totalInstallments: number;
  totalAmount: number;
  dueDay: number;
  isActive: boolean;
  items: FeeStructureItem[];
  class?: { id: string; name: string };
  academicYear?: { id: string; name: string };
}

interface ClassOption {
  id: string;
  name: string;
}

interface AcademicYearOption {
  id: string;
  name: string;
}

const INSTALLMENT_TYPES = [
  { value: "MONTHLY", label: "Monthly", defaultInstallments: 12 },
  { value: "QUARTERLY", label: "Quarterly", defaultInstallments: 4 },
  { value: "HALF_YEARLY", label: "Half Yearly", defaultInstallments: 2 },
  { value: "YEARLY", label: "Yearly", defaultInstallments: 1 },
  { value: "ONE_TIME", label: "One Time", defaultInstallments: 1 },
  { value: "CUSTOM", label: "Custom", defaultInstallments: 1 },
];

const FREQUENCY_OPTIONS = [
  { value: "PER_INSTALLMENT", label: "Per Installment" },
  { value: "ONE_TIME", label: "One Time" },
  { value: "ANNUAL", label: "Annual" },
];

const FeeStructurePage: React.FC = () => {
  // State
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterAcademicYear, setFilterAcademicYear] = useState("");
  const [filterClass, setFilterClass] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    classId: "",
    academicYearId: "",
    installmentType: "MONTHLY",
    totalInstallments: 12,
    dueDay: 10,
  });
  const [formItems, setFormItems] = useState<FeeStructureItem[]>([
    { feeHeadId: "", amount: 0, frequency: "PER_INSTALLMENT" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Computed total amount
  const totalAmount = useMemo(
    () => formItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [formItems]
  );

  // Fetch dropdown data
  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
    fetchFeeHeads();
  }, []);

  // Fetch fee structures when filters change
  useEffect(() => {
    fetchFeeStructures();
  }, [filterAcademicYear, filterClass]);

  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterAcademicYear) params.academicYearId = filterAcademicYear;
      if (filterClass) params.classId = filterClass;

      const response = await axios.get("/api/fees/structures", { params });
      if (response.data.success) {
        setFeeStructures(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch fee structures");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get("/api/class");
      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await axios.get("/api/academic");
      if (response.data.success) {
        setAcademicYears(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch academic years:", error);
    }
  };

  const fetchFeeHeads = async () => {
    try {
      const response = await axios.get("/api/fees/heads");
     const data = response.data.data || response.data;
      setFeeHeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch fee heads:", error);
    }
  };

  // Auto-suggest name based on class and academic year
  const generateName = (classId: string, academicYearId: string) => {
    const selectedClass = classes.find((c) => c.id === classId);
    const selectedYear = academicYears.find((y) => y.id === academicYearId);
    if (selectedClass && selectedYear) {
      return `${selectedClass.name} Fee ${selectedYear.name}`;
    }
    return "";
  };

  // Handle installment type change
  const handleInstallmentTypeChange = (type: string) => {
    const typeConfig = INSTALLMENT_TYPES.find((t) => t.value === type);
    setFormData((prev) => ({
      ...prev,
      installmentType: type,
      totalInstallments: typeConfig?.defaultInstallments || prev.totalInstallments,
    }));
  };

  // Open modal for create
  const handleAdd = () => {
    setEditingStructure(null);
    setFormData({
      name: "",
      classId: "",
      academicYearId: "",
      installmentType: "MONTHLY",
      totalInstallments: 12,
      dueDay: 10,
    });
    setFormItems([{ feeHeadId: "", amount: 0, frequency: "PER_INSTALLMENT" }]);
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setFormData({
      name: structure.name,
      classId: structure.classId,
      academicYearId: structure.academicYearId,
      installmentType: structure.installmentType,
      totalInstallments: structure.totalInstallments,
      dueDay: structure.dueDay,
    });
    setFormItems(
      structure.items.map((item) => ({
        feeHeadId: item.feeHeadId,
        amount: item.amount,
        frequency: item.frequency,
      }))
    );
    setShowModal(true);
  };

  // Add item row
  const addItemRow = () => {
    setFormItems([...formItems, { feeHeadId: "", amount: 0, frequency: "PER_INSTALLMENT" }]);
  };

  // Remove item row
  const removeItemRow = (index: number) => {
    if (formItems.length === 1) {
      toast.error("At least one fee head item is required");
      return;
    }
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  // Update item row
  const updateItemRow = (index: number, field: string, value: any) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: field === "amount" ? Number(value) : value };
    setFormItems(updated);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.classId || !formData.academicYearId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const invalidItems = formItems.some((item) => !item.feeHeadId || item.amount <= 0);
    if (invalidItems) {
      toast.error("Please fill in all fee head items with valid amounts");
      return;
    }

    // Check for duplicate fee heads
    const feeHeadIds = formItems.map((item) => item.feeHeadId);
    if (new Set(feeHeadIds).size !== feeHeadIds.length) {
      toast.error("Duplicate fee heads are not allowed");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        items: formItems,
      };

      if (editingStructure) {
        const response = await axios.put(`/api/fees/structures/${editingStructure.id}`, payload);
        if (response.data.success) {
          toast.success("Fee structure updated successfully");
        }
      } else {
        const response = await axios.post("/api/fees/structures", payload);
        if (response.data.success) {
          toast.success("Fee structure created successfully");
        }
      }

      setShowModal(false);
      fetchFeeStructures();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save fee structure");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await axios.delete(`/api/fees/structures/${id}`);
      if (response.data.success) {
        toast.success("Fee structure deleted successfully");
        fetchFeeStructures();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete fee structure");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Structures</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage fee structures for classes and academic years
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Fee Structure
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={filterAcademicYear}
              onChange={(e) => setFilterAcademicYear(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Academic Years</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-500">Loading...</span>
          </div>
        ) : feeStructures.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No fee structures found</p>
            <p className="text-sm text-gray-400 mt-1">Create one to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academic Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Installment Type
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
                {feeStructures.map((structure) => (
                  <tr key={structure.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{structure.name}</div>
                      <div className="text-xs text-gray-500">{structure.items.length} fee heads</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {structure.class?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {structure.academicYear?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{structure.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {structure.installmentType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          structure.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {structure.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleEdit(structure)}
                        className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(structure.id, structure.name)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowModal(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editingStructure ? "Edit Fee Structure" : "Create Fee Structure"}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-4 space-y-5">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Class 1 Fee 2025-26"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.classId}
                        onChange={(e) => {
                          const classId = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            classId,
                            name: generateName(classId, prev.academicYearId) || prev.name,
                          }));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Academic Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.academicYearId}
                        onChange={(e) => {
                          const academicYearId = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            academicYearId,
                            name: generateName(prev.classId, academicYearId) || prev.name,
                          }));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Academic Year</option>
                        {academicYears.map((year) => (
                          <option key={year.id} value={year.id}>
                            {year.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Installment Type
                      </label>
                      <select
                        value={formData.installmentType}
                        onChange={(e) => handleInstallmentTypeChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {INSTALLMENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Installments
                      </label>
                      <input
                        type="number"
                        value={formData.totalInstallments}
                        onChange={(e) =>
                          setFormData({ ...formData, totalInstallments: Number(e.target.value) })
                        }
                        min={1}
                        max={24}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Day (1-28)
                      </label>
                      <input
                        type="number"
                        value={formData.dueDay}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDay: Number(e.target.value) })
                        }
                        min={1}
                        max={28}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Fee Head Items */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Fee Head Items</h3>
                      <button
                        type="button"
                        onClick={addItemRow}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Item
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
                        <div className="col-span-5">Fee Head</div>
                        <div className="col-span-3">Amount (₹)</div>
                        <div className="col-span-3">Frequency</div>
                        <div className="col-span-1"></div>
                      </div>

                      {formItems.map((item, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="sm:col-span-5">
                            <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">
                              Fee Head
                            </label>
                            <select
                              value={item.feeHeadId}
                              onChange={(e) => updateItemRow(index, "feeHeadId", e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Select Fee Head</option>
                              {feeHeads.map((head) => (
                                <option key={head.id} value={head.id}>
                                  {head.name} ({head.code})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-3">
                            <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">
                              Amount
                            </label>
                            <input
                              type="number"
                              value={item.amount || ""}
                              onChange={(e) => updateItemRow(index, "amount", e.target.value)}
                              placeholder="0"
                              min={0}
                              step={0.01}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">
                              Frequency
                            </label>
                            <select
                              value={item.frequency}
                              onChange={(e) => updateItemRow(index, "frequency", e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {FREQUENCY_OPTIONS.map((freq) => (
                                <option key={freq.value} value={freq.value}>
                                  {freq.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeItemRow(index)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Running Total */}
                    <div className="mt-4 flex justify-end">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 inline-flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-700">Total Amount:</span>
                        <span className="text-lg font-bold text-blue-900">
                          ₹{totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {submitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {editingStructure ? "Update" : "Create"} Fee Structure
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

export default FeeStructurePage;

