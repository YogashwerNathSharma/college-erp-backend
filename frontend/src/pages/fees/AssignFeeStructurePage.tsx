
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";

const API = `${API_BASE_URL}/api`;

interface ClassOption { id: string; name: string; }
interface AcademicYearOption { id: string; name: string; }
interface FeeStructureItem { id: string; feeHeadId: string; amount: number; frequency: string; feeHead: { name: string; code: string; }; }
interface FeeStructure { id: string; name: string; totalAmount: number; installmentType: string; totalInstallments: number; items: FeeStructureItem[]; }
interface StudentRow { id: string; rollNumber: string; studentName: string; admissionNo: string; section: string; assignmentStatus: "ASSIGNED" | "NOT_ASSIGNED" | "PARTIAL"; totalFees: number; }

const AssignFeeStructurePage: React.FC = () => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [summary, setSummary] = useState({ totalStudents: 0, assignedCount: 0, unassignedCount: 0 });

  const [loadingStructures, setLoadingStructures] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // ═══ NEW: Per-student fee head selection ═══
  const [selectedFeeHeads, setSelectedFeeHeads] = useState<Record<string, boolean>>({});

  // ═══ Student detail view (shows what's assigned to a student) ═══
  const [viewingStudent, setViewingStudent] = useState<{ id: string; name: string; items: any[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedYear) {
      fetchFeeStructures();
      fetchStudents();
    }
  }, [selectedClass, selectedYear]);

  // When fee structures load, default all items to selected
  useEffect(() => {
    if (feeStructures.length > 0) {
      const defaultSelection: Record<string, boolean> = {};
      feeStructures.forEach((s) => {
        s.items?.forEach((item) => {
          // Auto-select all items by default
          defaultSelection[item.feeHeadId] = true;
        });
      });
      setSelectedFeeHeads(defaultSelection);
    }
  }, [feeStructures]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API}/class`);
      if (res.data.success) setClasses(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await axios.get(`${API}/academic`);
      if (res.data.success) setAcademicYears(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchFeeStructures = async () => {
    setLoadingStructures(true);
    try {
      const res = await axios.get(`${API}/fees/structures`, {
        params: { classId: selectedClass, academicYearId: selectedYear },
      });
      if (res.data.success) setFeeStructures(res.data.data);
      else setFeeStructures([]);
    } catch (e) { setFeeStructures([]); }
    finally { setLoadingStructures(false); }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await axios.get(`${API}/fees/assign/students`, {
        params: { classId: selectedClass, academicYearId: selectedYear },
      });
      if (res.data.success) {
        setStudents(res.data.data.students);
        setSummary(res.data.data.summary);
      }
    } catch (e) { setStudents([]); }
    finally { setLoadingStudents(false); }
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectAllUnassigned = () => {
    // Select ALL students (for re-assignment too)
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  // Fetch what's assigned to a specific student
  const viewStudentAssignment = async (student: StudentRow) => {
    if (student.assignmentStatus !== "ASSIGNED") {
      setViewingStudent({ id: student.id, name: student.studentName, items: [] });
      return;
    }
    setLoadingDetail(true);
    try {
      const res = await axios.get(`${API}/fees/collection/student/${student.id}`);
      const fees = res.data?.fees || [];
      // Collect ALL fee items across all installments
      let items: { name: string; amount: number }[] = [];
      const firstFee = fees[0] || {};
      // Try StudentFeeItems first, then FeeStructure items
      if (firstFee.items && firstFee.items.length > 0) {
        items = firstFee.items.map((i: any) => ({ name: i.feeHeadName || i.name || i.feeHead?.name || "Fee", amount: i.amount || 0 }));
      } else if (firstFee.feeStructure?.items && firstFee.feeStructure.items.length > 0) {
        items = firstFee.feeStructure.items.map((i: any) => ({ name: i.feeHead?.name || i.name || "Fee", amount: i.amount || 0 }));
      } else {
        // Last fallback: show from the fee structure on this page
        items = allItems.map((item) => ({ name: item.feeHead?.name || "Fee", amount: item.amount || 0 }));
      }
      setViewingStudent({ id: student.id, name: student.studentName, items, totalFee: firstFee.totalAmount || firstFee.netAmount || items.reduce((s: number, i: any) => s + i.amount, 0) });
    } catch (e) {
      // API fail — show items from fee structure on page as fallback
      const items = allItems.map((item) => ({ name: item.feeHead?.name || "Fee", amount: item.amount || 0 }));
      setViewingStudent({ id: student.id, name: student.studentName, items });
    } finally { setLoadingDetail(false); }
  };

  // Toggle fee head selection
  const toggleFeeHead = (feeHeadId: string) => {
    setSelectedFeeHeads((prev) => ({
      ...prev,
      [feeHeadId]: !prev[feeHeadId],
    }));
  };

  // Build selectedItems array from checkboxes
  const getSelectedItems = () => {
    const items: Array<{ feeHeadId: string; amount: number; feeHeadName: string; frequency: string }> = [];
    feeStructures.forEach((s) => {
      s.items?.forEach((item) => {
        if (selectedFeeHeads[item.feeHeadId]) {
          items.push({
            feeHeadId: item.feeHeadId,
            amount: item.amount,
            feeHeadName: item.feeHead?.name || "Fee",
            frequency: item.frequency || "PER_INSTALLMENT",
          });
        }
      });
    });
    return items;
  };

  // Check if all fee heads are selected (to determine if we should send selectedItems or not)
  const allFeeHeadsSelected = () => {
    const allItems = feeStructures.flatMap((s) => s.items || []);
    return allItems.every((item) => selectedFeeHeads[item.feeHeadId]);
  };

  // Calculate total of selected items
  const getSelectedTotal = () => {
    return getSelectedItems().reduce((sum, item) => sum + item.amount, 0);
  };

  const handleAssign = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select students to assign fees");
      return;
    }

    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      toast.error("Please select at least one fee head to assign");
      return;
    }

    setAssigning(true);
    try {
      const payload: any = { enrollmentIds: selectedStudents };

      // Only send selectedItems if not all items are selected
      // This maintains backward compatibility
      if (!allFeeHeadsSelected()) {
        payload.selectedItems = selectedItems;
      }

      const res = await axios.post(`${API}/fees/assign/students`, payload);
      if (res.data.success) {
        toast.success(res.data.data.message || "Fees assigned successfully");
        setSelectedStudents([]);
        fetchStudents();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to assign fees");
    } finally { setAssigning(false); }
  };

  const handleAssignAll = async () => {
    if (!selectedClass || !selectedYear) return;

    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      toast.error("Please select at least one fee head to assign");
      return;
    }

    setAssigning(true);
    try {
      const payload: any = {
        classId: selectedClass,
        academicYearId: selectedYear,
      };
      if (!allFeeHeadsSelected()) {
        payload.selectedItems = selectedItems;
      }
      const res = await axios.post(`${API}/fees/collection/assign/class`, payload);
      toast.success(res.data.message || "Fees assigned to class");
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to assign");
    } finally { setAssigning(false); }
  };

  // All fee items across structures
  const allItems = feeStructures.flatMap((s) => s.items || []);
  const totalStructureAmount = feeStructures.reduce((sum, s) => sum + s.totalAmount, 0);
  const selectedTotal = getSelectedTotal();
  const selectedCount = getSelectedItems().length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assign Fee Structure</h1>
        <p className="text-sm text-gray-500 mt-1">Assign fee structures to students — select which fee heads apply per student</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
              <option value="">Select Session</option>
              {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedClass && selectedYear && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT — Fee Structure with Checkboxes */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-primary-50 border-b border-primary-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-blue-900">Fee Structure — Select Applicable Heads</h3>
              <a href="/fees/structures" className="text-xs text-primary-600 hover:underline font-medium">+ Create Fee Structure</a>
            </div>

            {loadingStructures ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : feeStructures.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 text-sm">No fee structure found for this class.</p>
                <a href="/fees/structures" className="text-primary-600 text-sm mt-2 inline-block hover:underline">+ Create Fee Structure</a>
              </div>
            ) : (
              <div>
                {/* Info banner */}
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
                  <p className="text-xs text-blue-700">
                    ✓ Check the fee heads that apply to selected students. Unchecked items won't be assigned.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-10">
                          <input
                            type="checkbox"
                            checked={allItems.length > 0 && allItems.every((item) => selectedFeeHeads[item.feeHeadId])}
                            onChange={(e) => {
                              const newState: Record<string, boolean> = {};
                              allItems.forEach((item) => { newState[item.feeHeadId] = e.target.checked; });
                              setSelectedFeeHeads(newState);
                            }}
                            className="w-4 h-4 text-primary-600 rounded"
                            title="Select/Deselect All"
                          />
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fee Head</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allItems.map((item, i) => {
                        const isSelected = !!selectedFeeHeads[item.feeHeadId];
                        const isTransport = item.feeHead?.name?.toLowerCase().includes("transport");
                        const isHostel = item.feeHead?.name?.toLowerCase().includes("hostel");

                        return (
                          <tr
                            key={item.id || i}
                            className={`hover:bg-gray-50 cursor-pointer transition-all ${isSelected ? "bg-green-50/50" : "bg-gray-50/30 opacity-60"}`}
                            onClick={() => toggleFeeHead(item.feeHeadId)}
                          >
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleFeeHead(item.feeHeadId)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300"
                              />
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">{i + 1}</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {item.feeHead?.name || "-"}
                              {isTransport && (
                                <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                  🚌 Transport
                                </span>
                              )}
                              {isHostel && (
                                <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                                  🏠 Hostel
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                item.frequency === "ONE_TIME" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                              }`}>
                                {item.frequency?.replace("_", " ") || "PER INSTALLMENT"}
                              </span>
                            </td>
                            <td className={`px-4 py-2 text-sm text-right font-semibold ${isSelected ? "text-gray-900" : "text-gray-400 line-through"}`}>
                              ₹{item.amount?.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Selected Total */}
                <div className="bg-primary-50 border-t px-4 py-3">
                  {/* Installment Type from Fee Structure */}
                  {feeStructures.length > 0 && (
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-600">Payment Frequency:</span>
                      <span className="text-xs font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                        {feeStructures[0].installmentType?.replace("_", " ") || "MONTHLY"} — {feeStructures[0].totalInstallments} installments
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">
                      {selectedCount} of {allItems.length} fee heads selected
                    </span>
                    {selectedCount < allItems.length && (
                      <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                        ⚠️ Partial Assignment
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-primary-700">Selected Total (per installment)</span>
                    <span className="text-lg font-bold text-blue-900">₹{selectedTotal.toLocaleString("en-IN")}</span>
                  </div>
                  {selectedTotal !== totalStructureAmount && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Full structure total: ₹{totalStructureAmount.toLocaleString("en-IN")} — Excluded: ₹{(totalStructureAmount - selectedTotal).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Students */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-green-900">
                Students ({summary.totalStudents})
                <span className="text-xs font-normal text-green-600 ml-2">
                  Assigned: {summary.assignedCount} | Pending: {summary.unassignedCount}
                </span>
              </h3>
              <div className="flex gap-2">
                <button onClick={selectAllUnassigned} className="text-xs px-2 py-1 bg-white border border-green-300 rounded text-green-700 hover:bg-green-50">
                  Select All / None
                </button>
              </div>
            </div>

            {loadingStudents ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No students enrolled in this class.</div>
            ) : (
              <div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-8">
                          <input type="checkbox" checked={selectedStudents.length === students.length && students.length > 0} onChange={() => selectAllUnassigned()} className="w-3.5 h-3.5 text-primary-600 rounded" />
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Roll No.</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map((student, i) => (
                        <tr key={student.id} className={`hover:bg-gray-50 ${selectedStudents.includes(student.id) ? "bg-primary-50/50" : ""}`}>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              className="w-3.5 h-3.5 text-primary-600 rounded"
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">{i + 1}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{student.rollNumber}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            <button onClick={() => viewStudentAssignment(student)} className="text-left hover:text-primary-600 hover:underline transition-colors" title="Click to view assigned fee heads">
                              {student.studentName}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${student.assignmentStatus === "ASSIGNED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {student.assignmentStatus === "ASSIGNED" ? "Assigned ✏️" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ═══ Student Assignment Detail Panel ═══ */}
                {viewingStudent && (
                  <div className="border-t bg-blue-50 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-blue-900">
                        📋 {viewingStudent.name} — Assigned Fee Heads
                      </h4>
                      <button onClick={() => setViewingStudent(null)} className="text-xs text-gray-500 hover:text-red-500">✕ Close</button>
                    </div>
                    {loadingDetail ? (
                      <p className="text-xs text-gray-500">Loading...</p>
                    ) : viewingStudent.items.length === 0 ? (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">⚠️ No fee heads assigned yet — select items and assign.</p>
                    ) : (
                      <div className="space-y-1">
                        {viewingStudent.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs bg-white rounded px-3 py-1.5 border border-blue-100">
                            <span className="text-gray-800 font-medium">{item.name}</span>
                            <span className="font-bold text-gray-900">₹{item.amount?.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs font-bold text-blue-900 pt-1 border-t border-blue-200 mt-1">
                          <span>Total per Installment</span>
                          <span>₹{viewingStudent.items.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedStudents.length > 0 && (
                      <>
                        {selectedStudents.length} selected
                        {!allFeeHeadsSelected() && (
                          <span className="ml-2 text-xs text-amber-600">
                            ({selectedCount} fee heads)
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={handleAssignAll} disabled={assigning || summary.unassignedCount === 0} className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
                      {assigning ? "Assigning..." : `Assign All (${summary.unassignedCount})`}
                    </button>
                    <button onClick={handleAssign} disabled={assigning || selectedStudents.length === 0 || selectedCount === 0} className="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                      {assigning ? "Assigning..." : `Assign Selected (${selectedStudents.length})`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignFeeStructurePage;
