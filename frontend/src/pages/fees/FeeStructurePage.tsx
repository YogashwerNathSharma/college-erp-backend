
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
  installmentType: string;
  totalInstallments: number;
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

// Fee head config (common structure - which heads are selected, their type)
interface FeeHeadConfig {
  feeHeadId: string;
  name: string;
  code: string;
  selected: boolean;
  frequency: string;
  installmentType: string;
  totalInstallments: number;
}

// Per-class amount for each fee head
interface ClassFeeData {
  classId: string;
  className: string;
  amounts: { [feeHeadId: string]: number };
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
  const [applyMode, setApplyMode] = useState<"single" | "multiple">("single");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    classId: "",
    academicYearId: "",
    dueDay: 10,
  });

  // Fee head config (common selections, frequency, installment type)
  const [feeHeadConfigs, setFeeHeadConfigs] = useState<FeeHeadConfig[]>([]);

  // Per-class amounts (for multiple classes mode)
  const [classFeeData, setClassFeeData] = useState<ClassFeeData[]>([]);

  // For single class mode - amounts stored here
  const [singleClassAmounts, setSingleClassAmounts] = useState<{ [feeHeadId: string]: number }>({});

  // Active class tab in multiple mode
  const [activeClassTab, setActiveClassTab] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Computed total for single mode
  const singleTotalAmount = useMemo(() => {
    return feeHeadConfigs
      .filter((c) => c.selected)
      .reduce((sum, c) => sum + (Number(singleClassAmounts[c.feeHeadId]) || 0), 0);
  }, [feeHeadConfigs, singleClassAmounts]);

  // Initialize fee head configs whenever feeHeads changes
  useEffect(() => {
    if (feeHeads.length > 0) {
      setFeeHeadConfigs(
        feeHeads.map((head) => ({
          feeHeadId: head.id,
          name: head.name,
          code: head.code,
          selected: false,
          frequency: "PER_INSTALLMENT",
          installmentType: "MONTHLY",
          totalInstallments: 12,
        }))
      );
    }
  }, [feeHeads]);

  // Update classFeeData when selectedClassIds change
  useEffect(() => {
    if (applyMode === "multiple") {
      setClassFeeData((prev) => {
        const newData: ClassFeeData[] = selectedClassIds.map((classId) => {
          const existing = prev.find((d) => d.classId === classId);
          const className = classes.find((c) => c.id === classId)?.name || "";
          if (existing) {
            return { ...existing, className };
          }
          return { classId, className, amounts: {} };
        });
        return newData;
      });
      // Set active tab to first selected class
      if (selectedClassIds.length > 0 && !selectedClassIds.includes(activeClassTab)) {
        setActiveClassTab(selectedClassIds[0]);
      }
    }
  }, [selectedClassIds, applyMode, classes]);

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

  // Toggle fee head selection
  const toggleFeeHead = (index: number) => {
    const updated = [...feeHeadConfigs];
    updated[index] = { ...updated[index], selected: !updated[index].selected };
    setFeeHeadConfigs(updated);
  };

  // Select/Deselect all fee heads
  const toggleAllFeeHeads = (selectAll: boolean) => {
    setFeeHeadConfigs((prev) =>
      prev.map((row) => ({ ...row, selected: selectAll }))
    );
  };

  // Update fee head config
  const updateFeeHeadConfig = (index: number, field: string, value: any) => {
    const updated = [...feeHeadConfigs];
    if (field === "installmentType") {
      const typeConfig = INSTALLMENT_TYPES.find((t) => t.value === value);
      updated[index] = {
        ...updated[index],
        installmentType: value,
        totalInstallments: typeConfig?.defaultInstallments || updated[index].totalInstallments,
      };
    } else if (field === "totalInstallments") {
      updated[index] = { ...updated[index], totalInstallments: Number(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setFeeHeadConfigs(updated);
  };

  // Update amount for single class mode
  const updateSingleAmount = (feeHeadId: string, amount: number) => {
    setSingleClassAmounts((prev) => ({ ...prev, [feeHeadId]: amount }));
  };

  // Update amount for a specific class in multiple mode
  const updateClassAmount = (classId: string, feeHeadId: string, amount: number) => {
    setClassFeeData((prev) =>
      prev.map((d) =>
        d.classId === classId
          ? { ...d, amounts: { ...d.amounts, [feeHeadId]: amount } }
          : d
      )
    );
  };

  // Copy amounts from one class to another
  const copyAmountsFromClass = (sourceClassId: string, targetClassId: string) => {
    const sourceData = classFeeData.find((d) => d.classId === sourceClassId);
    if (!sourceData) return;
    setClassFeeData((prev) =>
      prev.map((d) =>
        d.classId === targetClassId
          ? { ...d, amounts: { ...sourceData.amounts } }
          : d
      )
    );
    toast.success("Amounts copied!");
  };

  // Copy amounts to all classes
  const copyAmountsToAll = (sourceClassId: string) => {
    const sourceData = classFeeData.find((d) => d.classId === sourceClassId);
    if (!sourceData) return;
    setClassFeeData((prev) =>
      prev.map((d) =>
        d.classId === sourceClassId ? d : { ...d, amounts: { ...sourceData.amounts } }
      )
    );
    toast.success("Amounts copied to all classes!");
  };

  // Toggle class selection
  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  // Select/Deselect all classes
  const toggleAllClasses = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedClassIds(classes.map((c) => c.id));
    } else {
      setSelectedClassIds([]);
    }
  };

  // Open modal for create
  const handleAdd = () => {
    setEditingStructure(null);
    setApplyMode("single");
    setSelectedClassIds([]);
    setActiveClassTab("");
    setFormData({ classId: "", academicYearId: "", dueDay: 10 });
    setSingleClassAmounts({});
    setClassFeeData([]);
    setFeeHeadConfigs(
      feeHeads.map((head) => ({
        feeHeadId: head.id,
        name: head.name,
        code: head.code,
        selected: false,
        frequency: "PER_INSTALLMENT",
        installmentType: "MONTHLY",
        totalInstallments: 12,
      }))
    );
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setApplyMode("single");
    setSelectedClassIds([]);
    setActiveClassTab("");
    setFormData({
      classId: structure.classId,
      academicYearId: structure.academicYearId,
      dueDay: structure.dueDay,
    });

    const amounts: { [feeHeadId: string]: number } = {};
    setFeeHeadConfigs(
      feeHeads.map((head) => {
        const existingItem = structure.items.find((item) => item.feeHeadId === head.id);
        if (existingItem) {
          amounts[head.id] = existingItem.amount;
        }
        return {
          feeHeadId: head.id,
          name: head.name,
          code: head.code,
          selected: !!existingItem,
          frequency: existingItem?.frequency || "PER_INSTALLMENT",
          installmentType: existingItem?.installmentType || structure.installmentType || "MONTHLY",
          totalInstallments: existingItem?.totalInstallments || structure.totalInstallments || 12,
        };
      })
    );
    setSingleClassAmounts(amounts);
    setShowModal(true);
  };

  // Generate name
  const generateName = (classId: string, academicYearId: string) => {
    const selectedClass = classes.find((c) => c.id === classId);
    const selectedYear = academicYears.find((y) => y.id === academicYearId);
    if (selectedClass && selectedYear) {
      return `${selectedClass.name} Fee ${selectedYear.name}`;
    }
    return "";
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.academicYearId) {
      toast.error("Please select Academic Year");
      return;
    }

    if (applyMode === "single" && !formData.classId) {
      toast.error("Please select a Class");
      return;
    }

    if (applyMode === "multiple" && selectedClassIds.length === 0) {
      toast.error("Please select at least one class");
      return;
    }

    const selectedHeads = feeHeadConfigs.filter((c) => c.selected);
    if (selectedHeads.length === 0) {
      toast.error("Please select at least one fee head");
      return;
    }

    setSubmitting(true);
    try {
      if (applyMode === "multiple") {
        // Create for multiple classes with per-class amounts
        let successCount = 0;
        let failCount = 0;

        for (const classId of selectedClassIds) {
          const classData = classFeeData.find((d) => d.classId === classId);
          const items = selectedHeads.map((head) => ({
            feeHeadId: head.feeHeadId,
            amount: Number(classData?.amounts[head.feeHeadId]) || 0,
            frequency: head.frequency,
            installmentType: head.installmentType,
            totalInstallments: head.totalInstallments,
          }));

          // Check if any amount is 0
          const hasZeroAmount = items.some((item) => item.amount <= 0);
          if (hasZeroAmount) {
            const className = classes.find((c) => c.id === classId)?.name || classId;
            toast.error(`Please fill amounts for ${className}`);
            setActiveClassTab(classId);
            setSubmitting(false);
            return;
          }

          const installmentTypes = [...new Set(selectedHeads.map((h) => h.installmentType))];
          const overallInstallmentType = installmentTypes.length === 1 ? installmentTypes[0] : "CUSTOM";
          const overallTotalInstallments = installmentTypes.length === 1 ? selectedHeads[0].totalInstallments : 1;

          const className = classes.find((c) => c.id === classId)?.name || "";
          const yearName = academicYears.find((y) => y.id === formData.academicYearId)?.name || "";

          try {
            const payload = {
              name: `${className} Fee ${yearName}`,
              classId,
              academicYearId: formData.academicYearId,
              installmentType: overallInstallmentType,
              totalInstallments: overallTotalInstallments,
              dueDay: formData.dueDay,
              items,
            };
            const response = await axios.post("/api/fees/structures", payload);
            if (response.data.success) successCount++;
          } catch (error: any) {
            failCount++;
            console.error(`Failed for class ${classId}:`, error);
          }
        }

        if (successCount > 0) {
          toast.success(
            `Fee structure created for ${successCount} class${successCount > 1 ? "es" : ""}${failCount > 0 ? ` (${failCount} failed)` : ""}`
          );
        } else {
          toast.error("Failed to create fee structures");
        }
      } else {
        // Single class
        const items = selectedHeads.map((head) => ({
          feeHeadId: head.feeHeadId,
          amount: Number(singleClassAmounts[head.feeHeadId]) || 0,
          frequency: head.frequency,
          installmentType: head.installmentType,
          totalInstallments: head.totalInstallments,
        }));

        const invalidItems = items.some((item) => item.amount <= 0);
        if (invalidItems) {
          toast.error("Please enter valid amounts for all selected fee heads");
          setSubmitting(false);
          return;
        }

        const installmentTypes = [...new Set(selectedHeads.map((h) => h.installmentType))];
        const overallInstallmentType = installmentTypes.length === 1 ? installmentTypes[0] : "CUSTOM";
        const overallTotalInstallments = installmentTypes.length === 1 ? selectedHeads[0].totalInstallments : 1;

        const payload = {
          name: generateName(formData.classId, formData.academicYearId),
          classId: formData.classId,
          academicYearId: formData.academicYearId,
          installmentType: overallInstallmentType,
          totalInstallments: overallTotalInstallments,
          dueDay: formData.dueDay,
          items,
        };

        if (editingStructure) {
          const response = await axios.put(`/api/fees/structures/${editingStructure.id}`, payload);
          if (response.data.success) toast.success("Fee structure updated successfully");
        } else {
          const response = await axios.post("/api/fees/structures", payload);
          if (response.data.success) toast.success("Fee structure created successfully");
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

  const allFeeHeadsSelected = feeHeadConfigs.length > 0 && feeHeadConfigs.every((r) => r.selected);
  const someFeeHeadsSelected = feeHeadConfigs.some((r) => r.selected) && !allFeeHeadsSelected;
  const selectedHeads = feeHeadConfigs.filter((c) => c.selected);

  // Get total for a specific class in multiple mode
  const getClassTotal = (classId: string) => {
    const classData = classFeeData.find((d) => d.classId === classId);
    if (!classData) return 0;
    return selectedHeads.reduce(
      (sum, head) => sum + (Number(classData.amounts[head.feeHeadId]) || 0),
      0
    );
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
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Academic Years</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feeStructures.map((structure) => (
                  <tr key={structure.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{structure.name}</div>
                      <div className="text-xs text-gray-500">{structure.items.length} fee heads</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{structure.class?.name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{structure.academicYear?.name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₹{structure.totalAmount.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {structure.installmentType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${structure.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {structure.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => handleEdit(structure)} className="text-primary-600 hover:text-primary-800 font-medium mr-3">Edit</button>
                      <button onClick={() => handleDelete(structure.id, structure.name)} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== CREATE/EDIT MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen px-4 pt-6 pb-20">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)} />

            <div className="relative bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editingStructure ? "Edit Fee Structure" : "Create Fee Structure"}
                    </h2>
                    <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="px-6 py-4 space-y-5">
                  {/* ===== STEP 1: Mode + Basic Info ===== */}
                  {!editingStructure && (
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-blue-900 mb-2">Apply To</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="applyMode" value="single" checked={applyMode === "single"} onChange={() => setApplyMode("single")} className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-medium text-gray-700">Single Class</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="applyMode" value="multiple" checked={applyMode === "multiple"} onChange={() => setApplyMode("multiple")} className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-medium text-gray-700">Multiple Classes (Class-wise Amounts)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year <span className="text-red-500">*</span></label>
                      <select value={formData.academicYearId} onChange={(e) => setFormData((prev) => ({ ...prev, academicYearId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" required>
                        <option value="">Select Academic Year</option>
                        {academicYears.map((year) => (
                          <option key={year.id} value={year.id}>{year.name}</option>
                        ))}
                      </select>
                    </div>
                    {applyMode === "single" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class <span className="text-red-500">*</span></label>
                        <select value={formData.classId} onChange={(e) => setFormData((prev) => ({ ...prev, classId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" required>
                          <option value="">Select Class</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Day (1-28)</label>
                      <input type="number" value={formData.dueDay} onChange={(e) => setFormData({ ...formData, dueDay: Number(e.target.value) })} min={1} max={28} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>

                  {/* Multiple Classes Selection */}
                  {applyMode === "multiple" && !editingStructure && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Select Classes <span className="text-red-500">*</span></h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={selectedClassIds.length === classes.length && classes.length > 0} onChange={(e) => toggleAllClasses(e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
                          <span className="text-xs font-medium text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {classes.map((cls) => (
                          <label key={cls.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${selectedClassIds.includes(cls.id) ? "bg-primary-50 border-primary-300" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
                            <input type="checkbox" checked={selectedClassIds.includes(cls.id)} onChange={() => toggleClassSelection(cls.id)} className="w-4 h-4 text-primary-600 rounded" />
                            <span className="text-sm font-medium text-gray-700">{cls.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ===== STEP 2: Fee Heads Config (Select + Installment Type) ===== */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Fee Heads Configuration
                      </h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allFeeHeadsSelected}
                          ref={(el) => { if (el) el.indeterminate = someFeeHeadsSelected; }}
                          onChange={(e) => toggleAllFeeHeads(e.target.checked)}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <span className="text-xs font-medium text-gray-600">Select All</span>
                      </label>
                    </div>

                    {/* Header */}
                    <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase">
                      <div className="col-span-1"></div>
                      <div className="col-span-3">Fee Head</div>
                      <div className="col-span-2">{applyMode === "single" ? "Amount (₹)" : ""}</div>
                      <div className="col-span-2">Frequency</div>
                      <div className="col-span-2">Installment Type</div>
                      <div className="col-span-2">Installments</div>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                      {feeHeadConfigs.map((config, index) => (
                        <div key={config.feeHeadId} className={`px-4 py-2.5 transition-colors ${config.selected ? "bg-primary-50/50" : "hover:bg-gray-50"}`}>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                            {/* Checkbox */}
                            <div className="md:col-span-1">
                              <input type="checkbox" checked={config.selected} onChange={() => toggleFeeHead(index)} className="w-4 h-4 text-primary-600 rounded" />
                            </div>

                            {/* Name */}
                            <div className="md:col-span-3">
                              <span className={`text-sm font-medium ${config.selected ? "text-gray-900" : "text-gray-500"}`}>
                                {config.name}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">({config.code})</span>
                            </div>

                            {/* Amount (only in single mode) */}
                            <div className="md:col-span-2">
                              {applyMode === "single" && (
                                <input
                                  type="number"
                                  value={singleClassAmounts[config.feeHeadId] || ""}
                                  onChange={(e) => updateSingleAmount(config.feeHeadId, Number(e.target.value))}
                                  placeholder="0"
                                  min={0}
                                  disabled={!config.selected}
                                  className={`w-full border rounded-lg px-2 py-1.5 text-sm ${config.selected ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                                />
                              )}
                            </div>

                            {/* Frequency */}
                            <div className="md:col-span-2">
                              <select
                                value={config.frequency}
                                onChange={(e) => updateFeeHeadConfig(index, "frequency", e.target.value)}
                                disabled={!config.selected}
                                className={`w-full border rounded-lg px-2 py-1.5 text-sm ${config.selected ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                              >
                                {FREQUENCY_OPTIONS.map((freq) => (
                                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                                ))}
                              </select>
                            </div>

                            {/* Installment Type */}
                            <div className="md:col-span-2">
                              <select
                                value={config.installmentType}
                                onChange={(e) => updateFeeHeadConfig(index, "installmentType", e.target.value)}
                                disabled={!config.selected}
                                className={`w-full border rounded-lg px-2 py-1.5 text-sm ${config.selected ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                              >
                                {INSTALLMENT_TYPES.map((type) => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                            </div>

                            {/* Installments */}
                            <div className="md:col-span-2">
                              <input
                                type="number"
                                value={config.totalInstallments}
                                onChange={(e) => updateFeeHeadConfig(index, "totalInstallments", e.target.value)}
                                min={1}
                                max={24}
                                disabled={!config.selected}
                                className={`w-full border rounded-lg px-2 py-1.5 text-sm ${config.selected ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Single mode total */}
                    {applyMode === "single" && (
                      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {selectedHeads.length} of {feeHeadConfigs.length} fee heads selected
                        </span>
                        <div className="bg-primary-100 border border-primary-200 rounded-lg px-4 py-2 inline-flex items-center gap-2">
                          <span className="text-sm font-medium text-primary-700">Total:</span>
                          <span className="text-lg font-bold text-blue-900">₹{singleTotalAmount.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ===== STEP 3: Class-wise Amounts (Only in Multiple Mode) ===== */}
                  {applyMode === "multiple" && selectedClassIds.length > 0 && selectedHeads.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-green-900">
                          Class-wise Amounts
                          <span className="text-green-700 font-normal ml-2">
                            (Set amount for each class separately)
                          </span>
                        </h3>
                      </div>

                      {/* Class Tabs */}
                      <div className="flex border-b border-gray-200 overflow-x-auto bg-white">
                        {selectedClassIds.map((classId) => {
                          const className = classes.find((c) => c.id === classId)?.name || "";
                          const classTotal = getClassTotal(classId);
                          return (
                            <button
                              key={classId}
                              type="button"
                              onClick={() => setActiveClassTab(classId)}
                              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                activeClassTab === classId
                                  ? "border-primary-600 text-primary-600 bg-primary-50/50"
                                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              {className}
                              {classTotal > 0 && (
                                <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                  ₹{classTotal.toLocaleString("en-IN")}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Active class amounts */}
                      {activeClassTab && (
                        <div className="p-4">
                          {/* Copy buttons */}
                          <div className="flex items-center gap-2 mb-3">
                            <button
                              type="button"
                              onClick={() => copyAmountsToAll(activeClassTab)}
                              className="text-xs px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 font-medium"
                            >
                              📋 Copy this to all classes
                            </button>
                            {selectedClassIds.length > 1 && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    copyAmountsFromClass(e.target.value, activeClassTab);
                                    e.target.value = "";
                                  }
                                }}
                                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5"
                              >
                                <option value="">Copy from...</option>
                                {selectedClassIds
                                  .filter((id) => id !== activeClassTab)
                                  .map((id) => (
                                    <option key={id} value={id}>
                                      {classes.find((c) => c.id === id)?.name}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </div>

                          {/* Amount inputs for this class */}
                          <div className="space-y-2">
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
                              <div className="col-span-6">Fee Head</div>
                              <div className="col-span-3">Installment Type</div>
                              <div className="col-span-3">Amount (₹)</div>
                            </div>
                            {selectedHeads.map((head) => {
                              const classData = classFeeData.find((d) => d.classId === activeClassTab);
                              const amount = classData?.amounts[head.feeHeadId] || "";
                              return (
                                <div key={head.feeHeadId} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg px-3 py-2">
                                  <div className="col-span-6">
                                    <span className="text-sm font-medium text-gray-900">{head.name}</span>
                                    <span className="text-xs text-gray-400 ml-1">({head.code})</span>
                                  </div>
                                  <div className="col-span-3">
                                    <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                                      {INSTALLMENT_TYPES.find((t) => t.value === head.installmentType)?.label || head.installmentType}
                                      {head.totalInstallments > 1 && ` × ${head.totalInstallments}`}
                                    </span>
                                  </div>
                                  <div className="col-span-3">
                                    <input
                                      type="number"
                                      value={amount}
                                      onChange={(e) => updateClassAmount(activeClassTab, head.feeHeadId, Number(e.target.value))}
                                      placeholder="0"
                                      min={0}
                                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Class total */}
                          <div className="mt-3 flex justify-end">
                            <div className="bg-green-100 border border-green-200 rounded-lg px-4 py-2 inline-flex items-center gap-2">
                              <span className="text-sm font-medium text-green-700">
                                {classes.find((c) => c.id === activeClassTab)?.name} Total:
                              </span>
                              <span className="text-lg font-bold text-green-900">
                                ₹{getClassTotal(activeClassTab).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {applyMode === "multiple" && selectedClassIds.length > 0 && (
                      <span>Will create for {selectedClassIds.length} class{selectedClassIds.length > 1 ? "es" : ""}</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                      {editingStructure ? "Update" : applyMode === "multiple" ? `Create for ${selectedClassIds.length} Classes` : "Create Fee Structure"}
                    </button>
                  </div>
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

