import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Zap,
  User,
  Calendar,
  Phone,
  GraduationCap,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import PageHeader from "../../components/enterprise/PageHeader";
import LoadingSkeleton from "../../components/enterprise/LoadingSkeleton";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DropdownItem {
  id: string;
  name: string;
}

interface QuickFormData {
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  fatherName: string;
  fatherPhone: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
}

interface AdmissionResult {
  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
  };
  enrollment: {
    id: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const GENDER_OPTIONS = [
  { value: "", label: "Select Gender" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const inputClasses =
  "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base";
const labelClasses =
  "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2";
const selectClasses =
  "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base appearance-none";

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function QuickAdmissionForm() {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<AdmissionResult | null>(null);
  const [classes, setClasses] = useState<DropdownItem[]>([]);
  const [sections, setSections] = useState<DropdownItem[]>([]);
  const [academicYears, setAcademicYears] = useState<DropdownItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<QuickFormData>({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    fatherName: "",
    fatherPhone: "",
    classId: "",
    sectionId: "",
    academicYearId: "",
  });

  // ─── Load Dropdown Data ─────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, yearRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/classes`, authHeaders()),
          axios.get(`${API_BASE_URL}/api/academic-years`, authHeaders()),
        ]);

        setClasses(classRes.data.data || classRes.data || []);
        const years = yearRes.data.data || yearRes.data || [];
        setAcademicYears(years);

        // Auto-select active academic year
        const activeYear = years.find((y: any) => y.isActive || y.isCurrent);
        if (activeYear) {
          setFormData((prev) => ({ ...prev, academicYearId: activeYear.id }));
        }
      } catch (err: any) {
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Load Sections when Class changes ───────────────────────
  useEffect(() => {
    if (!formData.classId) {
      setSections([]);
      return;
    }
    const fetchSections = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/sections?classId=${formData.classId}`,
          authHeaders()
        );
        setSections(res.data.data || res.data || []);
      } catch {
        setSections([]);
      }
    };
    fetchSections();
  }, [formData.classId]);

  // ─── Validation ─────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.fatherName.trim()) newErrors.fatherName = "Father's name is required";
    if (!formData.fatherPhone.trim()) {
      newErrors.fatherPhone = "Father's phone is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.fatherPhone)) {
      newErrors.fatherPhone = "Invalid phone number";
    }
    if (!formData.classId) newErrors.classId = "Class is required";
    if (!formData.sectionId) newErrors.sectionId = "Section is required";
    if (!formData.academicYearId) newErrors.academicYearId = "Academic year is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Handle Input Change ────────────────────────────────────
  const handleChange = (field: keyof QuickFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ─── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        dob: formData.dob,
        fatherName: formData.fatherName.trim(),
        fatherPhone: formData.fatherPhone.trim(),
        motherName: "N/A",
        classId: formData.classId,
        sectionId: formData.sectionId,
        academicYearId: formData.academicYearId,
        address: "N/A",
        admissionType: "quick",
      };

      const res = await axios.post(`${API_BASE_URL}/api/students`, payload, authHeaders());

      if (res.data.success) {
        setSuccess(res.data.data);
        toast.success(`Student admitted successfully! Admission No: ${res.data.data.student.admissionNo}`);
      } else {
        toast.error(res.data.message || "Admission failed");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to create student";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Reset form for another admission ──────────────────────
  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      gender: "",
      dob: "",
      fatherName: "",
      fatherPhone: "",
      classId: formData.classId,
      sectionId: formData.sectionId,
      academicYearId: formData.academicYearId,
    });
    setSuccess(null);
    setErrors({});
  };

  // ─── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="form" count={6} />
      </div>
    );
  }

  // ─── Success State ──────────────────────────────────────────
  if (success) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Admission Successful!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Student has been admitted with the following details:
          </p>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Name</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {success.student.firstName} {success.student.lastName}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Admission No</span>
                <p className="font-semibold text-indigo-600 dark:text-indigo-400 text-lg">
                  {success.student.admissionNo}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/students/${success.student.id}`)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-4 py-3 transition-colors"
            >
              View Profile
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl px-4 py-3 transition-colors"
            >
              Add Another
            </button>
            <button
              onClick={() => navigate("/students")}
              className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium rounded-xl px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Student List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Form ──────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Quick Admission"
        subtitle="Fast-track student admission with minimal required fields"
        icon={<Zap className="w-6 h-6" />}
        actions={
          <button
            onClick={() => navigate("/students/admission")}
            className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Complete Admission
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 space-y-6">
          {/* Student Info Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-indigo-500" />
              Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className={labelClasses}>
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Enter first name"
                  className={`${inputClasses} ${errors.firstName ? "ring-2 ring-red-500 border-red-500" : ""}`}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className={labelClasses}>
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Enter last name"
                  className={`${inputClasses} ${errors.lastName ? "ring-2 ring-red-500 border-red-500" : ""}`}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className={labelClasses}>
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className={`${selectClasses} ${errors.gender ? "ring-2 ring-red-500 border-red-500" : ""}`}
                >
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <p className="text-xs text-red-500 mt-1">{errors.gender}</p>
                )}
              </div>

              {/* DOB */}
              <div>
                <label className={labelClasses}>
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleChange("dob", e.target.value)}
                    className={`${inputClasses} pl-10 ${errors.dob ? "ring-2 ring-red-500 border-red-500" : ""}`}
                  />
                </div>
                {errors.dob && (
                  <p className="text-xs text-red-500 mt-1">{errors.dob}</p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-slate-700" />

          {/* Parent Info Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-indigo-500" />
              Parent Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Father Name */}
              <div>
                <label className={labelClasses}>
                  Father's Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => handleChange("fatherName", e.target.value)}
                  placeholder="Enter father's name"
                  className={`${inputClasses} ${errors.fatherName ? "ring-2 ring-red-500 border-red-500" : ""}`}
                />
                {errors.fatherName && (
                  <p className="text-xs text-red-500 mt-1">{errors.fatherName}</p>
                )}
              </div>

              {/* Father Phone */}
              <div>
                <label className={labelClasses}>
                  Father's Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.fatherPhone}
                    onChange={(e) => handleChange("fatherPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className={`${inputClasses} pl-10 ${errors.fatherPhone ? "ring-2 ring-red-500 border-red-500" : ""}`}
                  />
                </div>
                {errors.fatherPhone && (
                  <p className="text-xs text-red-500 mt-1">{errors.fatherPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-slate-700" />

          {/* Academic Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-indigo-500" />
              Academic Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Academic Year */}
              <div>
                <label className={labelClasses}>
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.academicYearId}
                  onChange={(e) => handleChange("academicYearId", e.target.value)}
                  className={`${selectClasses} ${errors.academicYearId ? "ring-2 ring-red-500 border-red-500" : ""}`}
                >
                  <option value="">Select Year</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
                {errors.academicYearId && (
                  <p className="text-xs text-red-500 mt-1">{errors.academicYearId}</p>
                )}
              </div>

              {/* Class */}
              <div>
                <label className={labelClasses}>
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => {
                    handleChange("classId", e.target.value);
                    handleChange("sectionId", "");
                  }}
                  className={`${selectClasses} ${errors.classId ? "ring-2 ring-red-500 border-red-500" : ""}`}
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.classId && (
                  <p className="text-xs text-red-500 mt-1">{errors.classId}</p>
                )}
              </div>

              {/* Section */}
              <div>
                <label className={labelClasses}>
                  Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sectionId}
                  onChange={(e) => handleChange("sectionId", e.target.value)}
                  disabled={!formData.classId}
                  className={`${selectClasses} ${errors.sectionId ? "ring-2 ring-red-500 border-red-500" : ""} ${!formData.classId ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="">Select Section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.sectionId && (
                  <p className="text-xs text-red-500 mt-1">{errors.sectionId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl px-6 py-3.5 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Admission...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Quick Admit Student
                </>
              )}
            </button>
          </div>

          {/* Info Note */}
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            This creates an admission with minimal details. You can complete the full profile later via Edit.
          </p>
        </div>
      </form>
    </div>
  );
}
