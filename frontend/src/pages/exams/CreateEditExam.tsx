
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft, Loader2, Plus, Trash2, Calendar, CheckSquare, Square } from "lucide-react";

import { getFullUrl } from "../../utils/url";

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
  name: string;
}

interface ScheduleEntry {
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  shift: string;
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

  // Form data (used in edit mode or single-class create)
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

  // Multi-class selection (create mode)
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Schedule entries (create mode)
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);

  // Dropdowns
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [examTerms, setExamTerms] = useState<{ id: string; name: string }[]>([]);

  // Loading states
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
    if (formData.classId && isEditMode) {
      fetchSections(formData.classId);
    } else {
      setSections([]);
    }
  }, [formData.classId]);

  const fetchDropdowns = async () => {
    setLoading(true);
    try {
      const [classRes, yearRes, termRes] = await Promise.all([
        axios.get(getFullUrl("/api/class"), { headers }),
        axios.get(getFullUrl("/api/academic"), { headers }),
        axios.get(getFullUrl("/api/masters/exam-term-master/dropdown"), { headers }).catch((err) => {
          console.warn("Exam terms fetch failed:", err?.response?.status, err?.message);
          return { data: { data: [] } };
        }),
      ]);
      setClasses(classRes.data?.data || classRes.data || []);
      setAcademicYears(yearRes.data?.data || yearRes.data || []);
      setExamTerms(termRes.data?.data || termRes.data || []);
    } catch (error) {
      toast.error("Failed to load form options");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await axios.get(getFullUrl(`/api/section?classId=${classId}`), { headers });
      setSections(res.data?.data || res.data || []);
    } catch (error) {
      setSections([]);
    }
  };

  const fetchExam = async () => {
    setFetchingExam(true);
    try {
      const res = await axios.get(getFullUrl(`/api/exam/${id}`), { headers });
      const exam = res.data?.data || res.data;
      setFormData({
        name: exam.name || "",
        type: exam.type || "",
        classId: exam.class?._id || exam.classId || "",
        sectionId: exam.section?._id || exam.sectionId || "",
        academicYearId: exam.academicYear?._id || exam.academicYearId || "",
        startDate: exam.startDate ? new Date(exam.startDate).toISOString().split("T")[0] : "",
        endDate: exam.endDate ? new Date(exam.endDate).toISOString().split("T")[0] : "",
        resultType: exam.resultType || "MARKS",
      });
    } catch (error) {
      toast.error("Failed to fetch exam details");
      navigate("/exams");
    } finally {
      setFetchingExam(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ─── Multi-class selection handlers ───
  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const toggleAllClasses = () => {
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classes.map((c) => c.id));
    }
  };

  // ─── Schedule entry handlers ───
  const addScheduleEntry = () => {
    setScheduleEntries((prev) => [
      ...prev,
      { subjectName: "", examDate: "", startTime: "", endTime: "", shift: "1" },
    ]);
  };

  const removeScheduleEntry = (index: number) => {
    setScheduleEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateScheduleEntry = (index: number, field: keyof ScheduleEntry, value: string) => {
    setScheduleEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    );
  };

  // ─── Submit handler ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.academicYearId) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    // Edit mode — same as before
    if (isEditMode) {
      if (!formData.classId) {
        toast.error("Please select a class");
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
        await axios.put(getFullUrl(`/api/exam/${id}`), payload, { headers });
        toast.success("Exam updated successfully");
        navigate("/exams");
      } catch (error: any) {
        const msg = error.response?.data?.message || "Failed to update exam";
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Create mode — bulk or single
    if (selectedClassIds.length === 0) {
      toast.error("Please select at least one class");
      return;
    }

    // Validate schedule entries if any
    for (const sched of scheduleEntries) {
      if (!sched.subjectName || !sched.examDate) {
        toast.error("Please fill Subject and Date in all schedule entries");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (selectedClassIds.length === 1) {
        // Single class — use existing endpoint
        const payload = {
          name: formData.name,
          type: formData.type,
          classId: selectedClassIds[0],
          academicYearId: formData.academicYearId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          resultType: formData.resultType,
        };
        const examRes = await axios.post(getFullUrl("/api/exam"), payload, { headers });
        const examId = examRes.data?.data?.id;

        // If schedules exist, create them one by one
        if (examId && scheduleEntries.length > 0) {
          for (const sched of scheduleEntries) {
            await axios.post(
              getFullUrl("/api/exam/schedule"),
              { ...sched, examId },
              { headers }
            );
          }
        }
        toast.success("Exam created successfully with schedule");
      } else {
        // Multiple classes — use bulk endpoint
        const payload = {
          name: formData.name,
          type: formData.type,
          classIds: selectedClassIds,
          academicYearId: formData.academicYearId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          resultType: formData.resultType,
          schedules: scheduleEntries.length > 0 ? scheduleEntries : undefined,
        };
        const res = await axios.post(getFullUrl("/api/exam/bulk-create"), payload, { headers });
        const data = res.data?.data;
        toast.success(
          `Exam created for ${data?.examsCreated || selectedClassIds.length} classes` +
            (data?.schedulesCreated ? ` with ${data.schedulesCreated} schedules` : "")
        );
      }
      navigate(`/exam-schedule-print?examName=${encodeURIComponent(formData.name)}`);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create exam";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchingExam || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
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
                : "Create exam for one or all classes with schedule"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* ═══ Basic Exam Details ═══ */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
              Exam Details
            </h2>

            {/* Exam Name (from Exam Term Master) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Term <span className="text-red-500">*</span>
              </label>
              <select
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                required
              >
                <option value="">-- Select Exam Term --</option>
                {examTerms.map((term) => (
                  <option key={term.id} value={term.name}>
                    {term.name}
                  </option>
                ))}
              </select>
              {examTerms.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">No exam terms found. Add them in Masters → Exam Term Master</p>
              )}
            </div>

            {/* Type and Result Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
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
                  Result Type
                </label>
                <select
                  name="resultType"
                  value={formData.resultType}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                  <option value="MARKS">Marks Only</option>
                  <option value="GRADE">Grade Only</option>
                  <option value="BOTH">Both (Marks + Grade)</option>
                </select>
              </div>
            </div>

            {/* Academic Year + Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <select
                  name="academicYearId"
                  value={formData.academicYearId}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  required
                >
                  <option value="">Select Year</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
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
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* ═══ Class Selection ═══ */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
              {isEditMode ? "Class" : "Select Classes"}{" "}
              <span className="text-red-500">*</span>
            </h2>

            {isEditMode ? (
              /* Edit mode — single class dropdown (same as before) */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
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
                    Section (Optional)
                  </label>
                  <select
                    name="sectionId"
                    value={formData.sectionId}
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  >
                    <option value="">All Sections</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              /* Create mode — multi-class checkboxes */
              <div>
                {/* Select All */}
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={toggleAllClasses}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                  >
                    {selectedClassIds.length === classes.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    {selectedClassIds.length === classes.length
                      ? "Deselect All"
                      : "Select All Classes"}
                  </button>
                  <span className="ml-3 text-sm text-gray-500">
                    {selectedClassIds.length} of {classes.length} selected
                  </span>
                </div>

                {/* Class grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {classes.map((cls) => {
                    const isSelected = selectedClassIds.includes(cls.id);
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => toggleClass(cls.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-primary-50 border-primary-300 text-primary-700 ring-1 ring-primary-200"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                        {cls.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ═══ Exam Schedule (Create Mode Only) ═══ */}
          {!isEditMode && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 mb-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Exam Schedule
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add subject-wise date/time (same schedule applies to all selected classes)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addScheduleEntry}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Subject
                </button>
              </div>

              {scheduleEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No schedule added yet. Click "Add Subject" to add exam schedule.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    (Optional — you can also add schedule later from Exam Schedule page)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduleEntries.map((entry, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-end p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      {/* Subject */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Hindi, English, Maths"
                          value={entry.subjectName}
                          onChange={(e) => updateScheduleEntry(index, "subjectName", e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        />
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={entry.examDate}
                          onChange={(e) => updateScheduleEntry(index, "examDate", e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        />
                      </div>

                      {/* Start Time */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Start
                        </label>
                        <input
                          type="time"
                          value={entry.startTime}
                          onChange={(e) => updateScheduleEntry(index, "startTime", e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        />
                      </div>

                      {/* End Time */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          End
                        </label>
                        <input
                          type="time"
                          value={entry.endTime}
                          onChange={(e) => updateScheduleEntry(index, "endTime", e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        />
                      </div>

                      {/* Shift */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Shift
                        </label>
                        <select
                          value={entry.shift}
                          onChange={(e) => updateScheduleEntry(index, "shift", e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        >
                          <option value="1">Shift 1</option>
                          <option value="2">Shift 2</option>
                          <option value="3">Shift 3</option>
                        </select>
                      </div>

                      {/* Delete */}
                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={() => removeScheduleEntry(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ Schedule Preview (shows class × subject table) ═══ */}
          {!isEditMode && scheduleEntries.length > 0 && selectedClassIds.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3 mb-4">
                📋 Schedule Preview
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                This schedule will be created for {selectedClassIds.length} classes × {scheduleEntries.filter(e => e.subjectName).length} subjects
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-primary-50">
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-primary-700">#</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-primary-700">Class</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-primary-700">Subject</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-primary-700">Date</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-primary-700">Time</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-primary-700">Shift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClassIds.map((classId) => {
                      const cls = classes.find((c) => c.id === classId);
                      return scheduleEntries
                        .filter((e) => e.subjectName)
                        .map((entry, idx) => (
                          <tr
                            key={`${classId}-${idx}`}
                            className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="border border-gray-200 px-3 py-1.5 text-gray-500">
                              {idx + 1}
                            </td>
                            <td className="border border-gray-200 px-3 py-1.5 font-medium text-gray-800">
                              {cls?.name || "—"}
                            </td>
                            <td className="border border-gray-200 px-3 py-1.5 text-gray-700">
                              {entry.subjectName}
                            </td>
                            <td className="border border-gray-200 px-3 py-1.5 text-gray-600">
                              {entry.examDate || "—"}
                            </td>
                            <td className="border border-gray-200 px-3 py-1.5 text-gray-600">
                              {entry.startTime && entry.endTime ? `${entry.startTime} – ${entry.endTime}` : "—"}
                            </td>
                            <td className="border border-gray-200 px-3 py-1.5 text-gray-600">
                              Shift {entry.shift || "1"}
                            </td>
                          </tr>
                        ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ Submit ═══ */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/exams")}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode
                    ? "Update Exam"
                    : selectedClassIds.length > 1
                    ? `Create for ${selectedClassIds.length} Classes`
                    : "Create Exam"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditExam;
