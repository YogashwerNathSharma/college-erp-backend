

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface AcademicYear {
  id: string;
  name: string;
}
interface ClassItem {
  id: string;
  name: string;
}
interface Section {
  id: string;
  name: string;
}
interface EligibleStudent {
  id: string;
  studentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
    srNo: string;
    fatherName: string;
    gender: string;
  };
  class: { id: string; name: string };
  section: { id: string; name: string };
}

const PromotionPage = () => {
  const navigate = useNavigate();

  // Source filters
  const [fromYearId, setFromYearId] = useState("");
  const [fromClassId, setFromClassId] = useState("");
  const [fromSectionId, setFromSectionId] = useState("");

  // Target filters
  const [toYearId, setToYearId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [toSectionId, setToSectionId] = useState("");

  // Data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [fromSections, setFromSections] = useState<Section[]>([]);
  const [toSections, setToSections] = useState<Section[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promotionType, setPromotionType] = useState("promotion");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Fetch academic years and classes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [yearRes, classRes] = await Promise.all([
          axios.get("/api/academic"),
          axios.get("/api/class"),
        ]);
        setAcademicYears(yearRes.data.data || []);
        setClasses(classRes.data.data || []);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    fetchData();
  }, []);

  // Fetch FROM sections when fromClassId changes
  useEffect(() => {
    if (!fromClassId) {
      setFromSections([]);
      return;
    }
    axios
      .get(`/api/section?classId=${fromClassId}`)
      .then((res) => setFromSections(res.data.data || []))
      .catch(() => setFromSections([]));
  }, [fromClassId]);

  // Fetch TO sections when toClassId changes
  useEffect(() => {
    if (!toClassId) {
      setToSections([]);
      return;
    }
    axios
      .get(`/api/section?classId=${toClassId}`)
      .then((res) => setToSections(res.data.data || []))
      .catch(() => setToSections([]));
  }, [toClassId]);

  // Fetch eligible students
  const fetchEligible = async () => {
    if (!fromClassId || !fromSectionId || !fromYearId) {
      showToast("Select all FROM fields (Year, Class, Section)", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/students/promotion/eligible?classId=${fromClassId}&sectionId=${fromSectionId}&academicYearId=${fromYearId}`
      );
      setEligibleStudents(res.data.data || []);
      setSelectedStudents([]);
      if ((res.data.data || []).length === 0) {
        showToast("No eligible students found in this class/section/year", "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to fetch students", "error");
    } finally {
      setLoading(false);
    }
  };

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (selectedStudents.length === eligibleStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(eligibleStudents.map((e) => e.student.id));
    }
  };

  // Toggle individual student
  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // PROMOTE
  const handlePromote = async () => {
    if (!toClassId || !toSectionId || !toYearId) {
      showToast("Select all TO fields (Year, Class, Section)", "error");
      return;
    }
    if (selectedStudents.length === 0) {
      showToast("Select at least one student", "error");
      return;
    }

    setPromoting(true);
    try {
      const res = await axios.post("/api/students/promote/bulk", {
        fromClassId,
        fromSectionId,
        fromYearId,
        toClassId,
        toSectionId,
        toYearId,
        studentIds: selectedStudents,
        promotionType,
      });

      const data = res.data.data;
      showToast(
        `✅ Promoted: ${data.promoted}, Failed: ${data.failed}`,
        data.failed > 0 ? "error" : "success"
      );

      // Refresh eligible list
      fetchEligible();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Promotion failed", "error");
    } finally {
      setPromoting(false);
    }
  };

  // PROMOTE ALL (entire class)
  const handlePromoteAll = async () => {
    if (!toClassId || !toSectionId || !toYearId) {
      showToast("Select all TO fields (Year, Class, Section)", "error");
      return;
    }
    if (eligibleStudents.length === 0) {
      showToast("No students to promote", "error");
      return;
    }

    if (!confirm(`Promote ALL ${eligibleStudents.length} students? This cannot be easily undone for bulk operations.`)) {
      return;
    }

    setPromoting(true);
    try {
      const res = await axios.post("/api/students/promote/bulk", {
        fromClassId,
        fromSectionId,
        fromYearId,
        toClassId,
        toSectionId,
        toYearId,
        // No studentIds = promote ALL
        promotionType,
      });

      const data = res.data.data;
      showToast(
        `✅ Promoted: ${data.promoted}, Failed: ${data.failed}`,
        data.failed > 0 ? "error" : "success"
      );
      setEligibleStudents([]);
      setSelectedStudents([]);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Bulk promotion failed", "error");
    } finally {
      setPromoting(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🎓 Student Promotion</h1>
          <p className="text-gray-500 text-sm mt-1">
            Promote students from one class/year to another
          </p>
        </div>
        <button
          onClick={() => navigate("/students")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ← Back to Students
        </button>
      </div>

      {/* FROM and TO Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* FROM */}
        <div className="bg-white p-5 rounded-xl shadow border border-orange-200">
          <h2 className="text-lg font-semibold text-orange-700 mb-4">📤 FROM (Current)</h2>
          <div className="space-y-3">
            <select
              value={fromYearId}
              onChange={(e) => setFromYearId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
            <select
              value={fromClassId}
              onChange={(e) => { setFromClassId(e.target.value); setFromSectionId(""); }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={fromSectionId}
              onChange={(e) => setFromSectionId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300"
            >
              <option value="">Select Section</option>
              {fromSections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchEligible}
            disabled={loading}
            className="mt-4 w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "🔍 Find Eligible Students"}
          </button>
        </div>

        {/* TO */}
        <div className="bg-white p-5 rounded-xl shadow border border-green-200">
          <h2 className="text-lg font-semibold text-green-700 mb-4">📥 TO (Promote To)</h2>
          <div className="space-y-3">
            <select
              value={toYearId}
              onChange={(e) => setToYearId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
            <select
              value={toClassId}
              onChange={(e) => { setToClassId(e.target.value); setToSectionId(""); }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={toSectionId}
              onChange={(e) => setToSectionId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300"
            >
              <option value="">Select Section</option>
              {toSections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Promotion Type */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-600 mb-1 block">Promotion Type:</label>
            <select
              value={promotionType}
              onChange={(e) => setPromotionType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="promotion">Normal Promotion (Next Class)</option>
              <option value="jump">Jump/Skip Class</option>
              <option value="detention">Detention (Same Class, Repeat)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Eligible Students Table */}
      {eligibleStudents.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === eligibleStudents.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">
                  Select All ({eligibleStudents.length} students)
                </span>
              </label>
              {selectedStudents.length > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {selectedStudents.length} selected
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePromote}
                disabled={promoting || selectedStudents.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {promoting ? "Promoting..." : `Promote Selected (${selectedStudents.length})`}
              </button>
              <button
                onClick={handlePromoteAll}
                disabled={promoting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {promoting ? "Promoting..." : `Promote ALL (${eligibleStudents.length})`}
              </button>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left w-10"></th>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Admission No</th>
                <th className="p-3 text-left">Student Name</th>
                <th className="p-3 text-left">Father Name</th>
                <th className="p-3 text-left">Gender</th>
                <th className="p-3 text-left">SR No</th>
              </tr>
            </thead>
            <tbody>
              {eligibleStudents.map((e, idx) => (
                <tr
                  key={e.id}
                  className={`border-b hover:bg-gray-50 ${
                    selectedStudents.includes(e.student.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(e.student.id)}
                      onChange={() => toggleStudent(e.student.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-mono text-xs">{e.student.admissionNo}</td>
                  <td className="p-3 font-medium">
                    {e.student.firstName} {e.student.lastName}
                  </td>
                  <td className="p-3">{e.student.fatherName}</td>
                  <td className="p-3">{e.student.gender}</td>
                  <td className="p-3">{e.student.srNo || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {eligibleStudents.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-lg font-medium">Select FROM Year, Class & Section</p>
          <p className="text-sm mt-1">Then click "Find Eligible Students" to see who can be promoted</p>
        </div>
      )}
    </div>
  );
};

export default PromotionPage;


