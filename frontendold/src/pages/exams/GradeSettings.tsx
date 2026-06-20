
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Loader2, Settings } from "lucide-react";

interface GradeRow {
  _id?: string;
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint: number;
  remarks: string;
}

const DEFAULT_GRADES: GradeRow[] = [
  { grade: "A+", minPercentage: 91, maxPercentage: 100, gradePoint: 10, remarks: "Outstanding" },
  { grade: "A", minPercentage: 81, maxPercentage: 90, gradePoint: 9, remarks: "Excellent" },
  { grade: "B+", minPercentage: 71, maxPercentage: 80, gradePoint: 8, remarks: "Very Good" },
  { grade: "B", minPercentage: 61, maxPercentage: 70, gradePoint: 7, remarks: "Good" },
  { grade: "C+", minPercentage: 51, maxPercentage: 60, gradePoint: 6, remarks: "Above Average" },
  { grade: "C", minPercentage: 41, maxPercentage: 50, gradePoint: 5, remarks: "Average" },
  { grade: "D", minPercentage: 33, maxPercentage: 40, gradePoint: 4, remarks: "Below Average" },
  { grade: "F", minPercentage: 0, maxPercentage: 32, gradePoint: 0, remarks: "Fail" },
];

const GradeSettings: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/grade", {
        headers,
      });
      const existingGrades = res.data?.data || res.data || [];
      if (existingGrades.length > 0) {
        setGrades(
          existingGrades.map((g: any) => ({
            _id: g._id,
            grade: g.grade,
            minPercentage: g.minPercentage,
            maxPercentage: g.maxPercentage,
            gradePoint: g.gradePoint,
            remarks: g.remarks || "",
          }))
        );
      } else {
        // Pre-populate with default Indian grading system
        setGrades(DEFAULT_GRADES);
      }
    } catch (error) {
      // If API fails, pre-populate with defaults
      setGrades(DEFAULT_GRADES);
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    setGrades((prev) => [
      ...prev,
      { grade: "", minPercentage: 0, maxPercentage: 0, gradePoint: 0, remarks: "" },
    ]);
  };

  const removeRow = (index: number) => {
    if (grades.length === 1) {
      toast.error("At least one grade is required");
      return;
    }
    setGrades((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (
    index: number,
    field: keyof GradeRow,
    value: string | number
  ) => {
    setGrades((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSave = async () => {
    // Validation
    for (let i = 0; i < grades.length; i++) {
      const g = grades[i];
      if (!g.grade.trim()) {
        toast.error(`Row ${i + 1}: Grade name is required`);
        return;
      }
      if (g.minPercentage < 0 || g.maxPercentage < 0) {
        toast.error(`Row ${i + 1}: Percentage cannot be negative`);
        return;
      }
      if (g.minPercentage > g.maxPercentage) {
        toast.error(`Row ${i + 1}: Min percentage cannot exceed max percentage`);
        return;
      }
      if (g.maxPercentage > 100) {
        toast.error(`Row ${i + 1}: Max percentage cannot exceed 100`);
        return;
      }
    }

    // Check for duplicate grades
    const gradeNames = grades.map((g) => g.grade.toUpperCase());
    if (new Set(gradeNames).size !== gradeNames.length) {
      toast.error("Duplicate grade names found");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        grades: grades.map((g) => ({
          grade: g.grade,
          minPercent: Number(g.minPercentage),
          maxPercent: Number(g.maxPercentage),
          gradePoint: Number(g.gradePoint),
          remarks: g.remarks,
        })),
      };

      await axios.post("/api/grade/bulk", payload, {
        headers,
      });
      toast.success("Grade settings saved successfully");
      fetchGrades();
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to save grade settings";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (
      window.confirm(
        "Reset to default Indian grading system? Unsaved changes will be lost."
      )
    ) {
      setGrades(DEFAULT_GRADES);
      toast.success("Reset to defaults");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="text-gray-600">Loading grade settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/exams")}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Grade Settings
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Configure grading scale for exam results
              </p>
            </div>
          </div>
          <button
            onClick={resetToDefaults}
            className="mt-4 sm:mt-0 text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Grade Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Grading Scale
              </h2>
            </div>
            <button
              onClick={addRow}
              className="inline-flex items-center px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Grade
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Min %
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Max %
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Grade Point
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {grades.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.grade}
                        onChange={(e) =>
                          updateRow(index, "grade", e.target.value)
                        }
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm font-medium"
                        placeholder="A+"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={row.minPercentage ?? ""}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "minPercentage",
                            Number(e.target.value)
                          )
                        }
                        min={0}
                        max={100}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={row.maxPercentage ?? ""}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "maxPercentage",
                            Number(e.target.value)
                          )
                        }
                        min={0}
                        max={100}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        placeholder="100"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={row.gradePoint ?? ""}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "gradePoint",
                            Number(e.target.value)
                          )
                        }
                        min={0}
                        max={10}
                        step={0.5}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        placeholder="10"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={(e) =>
                          updateRow(index, "remarks", e.target.value)
                        }
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        placeholder="Outstanding"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => removeRow(index)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-500">
              {grades.length} grade(s) configured
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save All Grades
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-primary-50 border border-primary-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            ℹ️ About Grade Settings
          </h3>
          <ul className="text-sm text-primary-700 space-y-1 list-disc list-inside">
            <li>
              Grades are used to automatically calculate student grades based on
              percentage.
            </li>
            <li>
              Ensure percentage ranges don't overlap and cover 0-100% completely.
            </li>
            <li>
              Grade Points follow the CBSE 10-point scale by default.
            </li>
            <li>
              Changes will apply to all future result generations.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GradeSettings;

