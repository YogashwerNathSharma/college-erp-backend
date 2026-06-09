
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft, Loader2 } from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name : string;
}

interface ExamFormData {
  name: string;
  type: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  resultType: string;
}

const CreateEditExam: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [formData, setFormData] = useState<ExamFormData>({
    name: "",
    type: "",
    classId: "",
    sectionId: "",
    academicYearId: "",
    startDate: "",
    endDate: "",
    resultType: "MARKS",
  });

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingExam, setFetchingExam] = useState(false);

  useEffect(() => {
    fetchDropdowns();
    if (isEditMode) {
      fetchExam();
    }
  }, [id]);

  useEffect(() => {
    if (formData.classId) {
      fetchSections(formData.classId);
    } else {
      setSections([]);
    }
  }, [formData.classId]);

  const fetchDropdowns = async () => {
    setLoading(true);
    try {
      const [classRes, yearRes] = await Promise.all([
        axios.get("http://localhost:5000/api/class", { headers }),
        axios.get("http://localhost:5000/api/academic", { headers }),
      ]);
      setClasses(classRes.data?.data || classRes.data || []);
      setAcademicYears(yearRes.data?.data || yearRes.data || []);
    } catch (error) {
      toast.error("Failed to load form options");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/section?classId=${classId}`,
        { headers }
      );
      setSections(res.data?.data || res.data || []);
    } catch (error) {
      setSections([]);
    }
  };

  const fetchExam = async () => {
    setFetchingExam(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/exam/${id}`, {
        headers,
      });
      const exam = res.data?.data || res.data;
      setFormData({
        name: exam.name || "",
        type: exam.type || "",
        classId: exam.class?._id || exam.classId || "",
        sectionId: exam.section?._id || exam.sectionId || "",
        academicYearId: exam.academicYear?._id || exam.academicYearId || "",
        startDate: exam.startDate
          ? new Date(exam.startDate).toISOString().split("T")[0]
          : "",
        endDate: exam.endDate
          ? new Date(exam.endDate).toISOString().split("T")[0]
          : "",
        resultType: exam.resultType || "MARKS",
      });
    } catch (error) {
      toast.error("Failed to fetch exam details");
      navigate("/exams");
    } finally {
      setFetchingExam(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.classId || !formData.academicYearId) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        classId: formData.classId,
        sectionId: formData.sectionId || undefined,
        academicYearId: formData.academicYearId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        resultType: formData.resultType,
      };

      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/exam/${id}`, payload, {
          headers,
        });
        toast.success("Exam updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/exam", payload, { headers });
        toast.success("Exam created successfully");
      }
      navigate("/exams");
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        `Failed to ${isEditMode ? "update" : "create"} exam`;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchingExam || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/exams")}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Exam" : "Create New Exam"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditMode
                ? "Update exam details below"
                : "Fill in the details to create a new examination"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Exam Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., First Term Examination 2025"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                required
              />
            </div>

            {/* Type and Class */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="TERM">Term Exam</option>
                  <option value="UNIT_TEST">Unit Test</option>
                  <option value="PRACTICAL">Practical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
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
            </div>

            {/* Section and Academic Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section (Optional)
                </label>
                <select
                  name="sectionId"
                  value={formData.sectionId}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  disabled={!formData.classId}
                >
                  <option value="">All Sections</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
                {!formData.classId && (
                  <p className="mt-1 text-xs text-gray-400">
                    Select a class first
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <select
                  name="academicYearId"
                  value={formData.academicYearId}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  required
                >
                  <option value="">Select Year</option>
                  {academicYears.map((yr) => (
                    <option key={yr.id} value={yr.id}>
                      {yr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>
            </div>

            {/* Result Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Result Type <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-6">
                {[
                  { value: "MARKS", label: "Marks Only" },
                  { value: "GRADE", label: "Grade Only" },
                  { value: "BOTH", label: "Both Marks & Grade" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="inline-flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="resultType"
                      value={option.value}
                      checked={formData.resultType === option.value}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/exams")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isEditMode ? "Update Exam" : "Create Exam"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditExam;

