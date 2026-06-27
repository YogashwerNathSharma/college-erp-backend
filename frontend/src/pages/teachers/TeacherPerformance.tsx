
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { FiStar, FiSave } from "react-icons/fi";

const API = `${API_BASE_URL}/api`;

interface Parameter {
  name: string;
  rating: number;
  remarks: string;
}

const DEFAULT_PARAMETERS: Parameter[] = [
  { name: "Subject Knowledge", rating: 0, remarks: "" },
  { name: "Communication Skills", rating: 0, remarks: "" },
  { name: "Punctuality", rating: 0, remarks: "" },
  { name: "Classroom Management", rating: 0, remarks: "" },
  { name: "Use of Technology", rating: 0, remarks: "" },
];

const TeacherPerformance = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [parameters, setParameters] = useState<Parameter[]>(DEFAULT_PARAMETERS);
  const [overallRemarks, setOverallRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const fetchOptions = async () => {
    try {
      const [teacherRes, yearRes] = await Promise.all([
        axios.get(`${API}/teacher`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/academic`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (teacherRes.data.success) setTeachers(teacherRes.data.data?.data || []);
      setAcademicYears(yearRes.data.data?.data || yearRes.data.data || []);
    } catch (err) {
      toast.error("Failed to load options");
    }
  };

  const fetchPerformance = async () => {
    if (!selectedTeacher || !selectedYear) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API}/teacher-performance/${selectedTeacher}?academicYearId=${selectedYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.data) {
        setParameters(res.data.data.parameters || DEFAULT_PARAMETERS);
        setOverallRemarks(res.data.data.remarks || "");
      } else {
        setParameters(DEFAULT_PARAMETERS);
        setOverallRemarks("");
      }
    } catch (err) {
      setParameters(DEFAULT_PARAMETERS);
      setOverallRemarks("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchPerformance();
  }, [selectedTeacher, selectedYear]);

  const updateRating = (index: number, rating: number) => {
    const updated = [...parameters];
    updated[index].rating = rating;
    setParameters(updated);
  };

  const updateRemarks = (index: number, remarks: string) => {
    const updated = [...parameters];
    updated[index].remarks = remarks;
    setParameters(updated);
  };

  const overallRating =
    parameters.length > 0
      ? (parameters.reduce((sum, p) => sum + p.rating, 0) / parameters.length).toFixed(1)
      : "0.0";

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 3.5) return "Very Good";
    if (rating >= 2.5) return "Good";
    if (rating >= 1.5) return "Average";
    return "Needs Improvement";
  };

  const handleSave = async () => {
    if (!selectedTeacher) return toast.error("Select a teacher");
    if (!selectedYear) return toast.error("Select academic year");

    const hasRatings = parameters.some((p) => p.rating > 0);
    if (!hasRatings) return toast.error("Please provide at least one rating");

    setSaving(true);
    try {
      const res = await axios.post(
        `${API}/teacher-performance`,
        {
          teacherId: selectedTeacher,
          academicYearId: selectedYear,
          parameters,
          remarks: overallRemarks,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Performance saved successfully");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Performance</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Select Year</option>
              {academicYears.map((y: any) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      {selectedTeacher && selectedYear && (
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Parameter</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Rating (1-5)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parameters.map((param, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{param.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => updateRating(index, star)}
                                className={`p-1 transition ${
                                  star <= param.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              >
                                <FiStar
                                  size={20}
                                  fill={star <= param.rating ? "currentColor" : "none"}
                                />
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={param.remarks}
                            onChange={(e) => updateRemarks(index, e.target.value)}
                            placeholder="Enter remarks"
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Overall Rating & Remarks */}
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-primary-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Overall Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-primary-600">{overallRating}</span>
                      <span className="text-sm text-gray-500">/ 5</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {getRatingLabel(parseFloat(overallRating))}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Overall Remarks
                    </label>
                    <textarea
                      value={overallRemarks}
                      onChange={(e) => setOverallRemarks(e.target.value)}
                      rows={3}
                      placeholder="Enter overall remarks..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    <FiSave size={16} /> {saving ? "Saving..." : "Save Evaluation"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherPerformance;

