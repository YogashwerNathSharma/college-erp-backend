
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
    const unassigned = students.filter((s) => s.assignmentStatus === "NOT_ASSIGNED").map((s) => s.id);
    setSelectedStudents(unassigned);
  };

  const handleAssign = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select students to assign fees");
      return;
    }
    setAssigning(true);
    try {
      const res = await axios.post(`${API}/fees/assign/students`, { enrollmentIds: selectedStudents });
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
    setAssigning(true);
    try {
      const res = await axios.post(`${API}/fees/collection/assign/class`, {
        classId: selectedClass,
        academicYearId: selectedYear,
      });
      toast.success(res.data.message || "Fees assigned to class");
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to assign");
    } finally { setAssigning(false); }
  };

  // All fee items across structures
  const allItems = feeStructures.flatMap((s) => s.items || []);
  const totalStructureAmount = feeStructures.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assign Fee Structure</h1>
        <p className="text-sm text-gray-500 mt-1">Assign fee structures to students class-wise</p>
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
          {/* LEFT — Fee Structure */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-primary-50 border-b border-primary-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-blue-900">Fee Structure</h3>
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fee Head</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allItems.map((item, i) => (
                        <tr key={item.id || i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-600">{i + 1}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.feeHead?.name || "-"}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{item.frequency?.replace("_", " ") || "-"}</td>
                          <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">₹{item.amount?.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-primary-50 border-t px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-primary-700">Total Amount</span>
                  <span className="text-lg font-bold text-blue-900">₹{totalStructureAmount.toLocaleString("en-IN")}</span>
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
                  Select Unassigned
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
                          <input type="checkbox" checked={selectedStudents.length === students.filter(s => s.assignmentStatus === "NOT_ASSIGNED").length && selectedStudents.length > 0} onChange={(e) => e.target.checked ? selectAllUnassigned() : setSelectedStudents([])} className="w-3.5 h-3.5 text-primary-600 rounded" />
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
                            {student.assignmentStatus === "NOT_ASSIGNED" ? (
                              <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleStudentSelection(student.id)} className="w-3.5 h-3.5 text-primary-600 rounded" />
                            ) : (
                              <span className="text-green-500 text-sm">✓</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">{i + 1}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{student.rollNumber}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{student.studentName}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${student.assignmentStatus === "ASSIGNED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {student.assignmentStatus === "ASSIGNED" ? "Assigned" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedStudents.length > 0 && `${selectedStudents.length} selected`}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={handleAssignAll} disabled={assigning || summary.unassignedCount === 0} className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
                      {assigning ? "Assigning..." : `Assign All (${summary.unassignedCount})`}
                    </button>
                    <button onClick={handleAssign} disabled={assigning || selectedStudents.length === 0} className="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
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

