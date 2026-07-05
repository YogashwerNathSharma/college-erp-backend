
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import { toast } from "react-hot-toast";
import {
  FiUser,
  FiBook,
  FiPhone,
  FiMapPin,
  FiCamera,
  FiUpload,
  FiX,
  FiFileText,
  FiShield,
} from "react-icons/fi";

// ═══ Fallback dropdown data if API fails ═══
const FALLBACK_BLOOD_GROUPS = [
  { id: "A+", name: "A+" }, { id: "A-", name: "A-" },
  { id: "B+", name: "B+" }, { id: "B-", name: "B-" },
  { id: "AB+", name: "AB+" }, { id: "AB-", name: "AB-" },
  { id: "O+", name: "O+" }, { id: "O-", name: "O-" },
];
const FALLBACK_CASTES = [
  { id: "General", name: "General" }, { id: "OBC", name: "OBC" },
  { id: "SC", name: "SC" }, { id: "ST", name: "ST" },
  { id: "EWS", name: "EWS" }, { id: "Other", name: "Other" },
];

// ═══ Shared class constants ═══
const inputClasses = "w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all";
const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
const sectionClasses = "bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8";

export default function AdmissionForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // ── Master Dropdown Data ──
  const [masterBloodGroups, setMasterBloodGroups] = useState<{id:string,name:string}[]>([]);
  const [masterReligions, setMasterReligions] = useState<{id:string,name:string}[]>([]);
  const [masterCategories, setMasterCategories] = useState<{id:string,name:string}[]>([]);
  const [masterNationalities, setMasterNationalities] = useState<{id:string,name:string}[]>([]);
  const [masterCastes, setMasterCastes] = useState<{id:string,name:string}[]>([]);

  useEffect(() => {
    const fetchMasterDropdowns = async () => {
      try {
        const endpoints = [
          "blood-group-master", "religion-master", "category-master",
          "nationality-master", "caste-master"
        ];
        const results = await Promise.all(
          endpoints.map(e => axios.get(getFullUrl(`/api/masters/${e}/dropdown`)).catch(() => ({ data: { data: [] } })))
        );
        setMasterBloodGroups(results[0]?.data?.data || []);
        setMasterReligions(results[1]?.data?.data || []);
        setMasterCategories(results[2]?.data?.data || []);
        setMasterNationalities(results[3]?.data?.data || []);
        setMasterCastes(results[4]?.data?.data || []);
      } catch (err) { console.error("Master dropdowns fetch failed:", err); }
    };
    fetchMasterDropdowns();
  }, []);

  // Effective dropdowns (master data or fallback)
  const effectiveBloodGroups = masterBloodGroups.length > 0 ? masterBloodGroups : FALLBACK_BLOOD_GROUPS;
  const effectiveCastes = masterCastes.length > 0 ? masterCastes : FALLBACK_CASTES;

  const [ageValidation, setAgeValidation] = useState<any>(null);
  const [ageChecking, setAgeChecking] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<{ file: File; type: string; name: string }[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    bloodGroup: "",
    religion: "",
    caste: "",
    category: "",
    nationality: "Indian",
    aadharNo: "",
    email: "",
    phone: "",
    address: "",
    admissionNo: "",
    rollNumber: "",
    admissionDate: new Date().toISOString().split("T")[0],
    fatherName: "",
    motherName: "",
    fatherPhone: "",
    motherPhone: "",
    fatherOccupation: "",
    motherOccupation: "",
    guardianName: "",
    guardianPhone: "",
    guardianRelation: "",
    classId: "",
    sectionId: "",
    academicYearId: "",
    isCustomAdmissionNo: false,
    skipAgeValidation: false,
  });

  useEffect(() => {
    fetchAcademicYears();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (formData.classId) fetchSections(formData.classId);
    else setSections([]);
  }, [formData.classId]);

  useEffect(() => {
    if (formData.dob && formData.classId && formData.academicYearId) {
      validateAge();
    } else {
      setAgeValidation(null);
    }
  }, [formData.dob, formData.classId, formData.academicYearId]);

  const fetchAcademicYears = async () => {
    try {
      const res = await axios.get("/api/academic");
      setAcademicYears(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get("/api/class");
      setClasses(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await axios.get(`/api/section?classId=${classId}`);
      setSections(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const validateAge = async () => {
    setAgeChecking(true);
    try {
      const ay = academicYears.find((a) => a.id === formData.academicYearId);
      const startYear = ay ? parseInt(ay.name.split("-")[0]) : new Date().getFullYear();
      const res = await axios.get("/api/students/age-config/validate", {
        params: { classId: formData.classId, dob: formData.dob, academicYearStart: startYear },
      });
      setAgeValidation(res.data.data);
    } catch (err) {
      setAgeValidation(null);
    } finally {
      setAgeChecking(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size < 39 * 1024) {
        toast.error("Photo size must be at least 39KB. Please use a better quality image.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) { toast.error("Photo size must not exceed 2MB"); return; }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large. Max 5MB allowed.`); return; }
        setDocuments((prev) => [...prev, { file, type: "other", name: file.name }]);
      });
    }
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const removeDocument = (index: number) => setDocuments((prev) => prev.filter((_, i) => i !== index));
  const updateDocType = (index: number, type: string) => setDocuments((prev) => prev.map((doc, i) => (i === index ? { ...doc, type } : doc)));

  // Prevent Enter key from submitting form
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };

  // Validate all required fields
  const validateBeforeSubmit = (): boolean => {
    const requiredChecks = [
      { field: "academicYearId", label: "Academic Year" },
      { field: "classId", label: "Class" },
      { field: "sectionId", label: "Section" },
      { field: "firstName", label: "First Name" },
      { field: "lastName", label: "Last Name" },
      { field: "gender", label: "Gender" },
      { field: "dob", label: "Date of Birth" },
      { field: "fatherName", label: "Father's Name" },
      { field: "fatherPhone", label: "Father's Phone" },
    ];
    for (const check of requiredChecks) {
      if (!formData[check.field as keyof typeof formData]) {
        toast.error(`Please fill required field: ${check.label}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;

    if (ageValidation && !ageValidation.isValid && !formData.skipAgeValidation) {
      toast.error(`Age validation failed: ${ageValidation.message}`);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/students", formData);
      const student = res.data.data?.student || res.data.data;

      if (!student?.id) {
        toast.success("✅ Student Created Successfully!");
        navigate("/students");
        return;
      }

      // Upload photo
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append("photo", photoFile);
        try {
          await axios.post(`/api/students/${student.id}/photo`, photoFormData, { headers: { "Content-Type": "multipart/form-data" } });
        } catch (err) { console.error("Photo upload failed:", err); }
      }

      // Upload documents
      if (documents.length > 0) {
        for (const doc of documents) {
          const docFormData = new FormData();
          docFormData.append("document", doc.file);
          docFormData.append("type", doc.type);
          docFormData.append("name", doc.name);
          try {
            await axios.post(`/api/students/${student.id}/documents`, docFormData, { headers: { "Content-Type": "multipart/form-data" } });
          } catch (err) { console.error("Document upload failed:", err); }
        }
      }

      toast.success(`✅ Student Created Successfully! Admission No: ${student.admissionNo || "Auto-generated"}`);
      navigate("/students");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Admission failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
              New Student Admission
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Fill all details and click Complete Admission</p>
          </div>
          <button
            onClick={() => navigate("/students")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
          >
            ← Back to List
          </button>
        </div>

        {/* ═══ SINGLE SCROLLABLE FORM — All sections visible ═══ */}
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">

          {/* ━━━ Section 1: Academic Information ━━━ */}
          <div className={sectionClasses}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <FiBook className="text-primary-600 dark:text-primary-400 text-lg" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Academic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className={labelClasses}>Academic Year <span className="text-red-500">*</span></label>
                <select name="academicYearId" value={formData.academicYearId} onChange={handleChange} className={inputClasses}>
                  <option value="">Select Year</option>
                  {academicYears.map((ay) => (<option key={ay.id} value={ay.id}>{ay.name}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Class <span className="text-red-500">*</span></label>
                <select name="classId" value={formData.classId} onChange={handleChange} className={inputClasses}>
                  <option value="">Select Class</option>
                  {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Section <span className="text-red-500">*</span></label>
                <select name="sectionId" value={formData.sectionId} onChange={handleChange} className={inputClasses}>
                  <option value="">Select Section</option>
                  {sections.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
            </div>
          </div>

          {/* ━━━ Section 2: Personal Information ━━━ */}
          <div className={sectionClasses}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <FiUser className="text-purple-600 dark:text-purple-400 text-lg" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Personal Information</h2>
              </div>

              {/* Photo — right side like teacher page */}
              <div className="flex flex-col items-center">
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="w-28 h-32 border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-all bg-gray-50 dark:bg-slate-700 flex items-center justify-center"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Student" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <FiCamera className="mx-auto text-gray-400 dark:text-gray-500 text-2xl" />
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Upload</p>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => photoInputRef.current?.click()} className="text-xs text-primary-600 dark:text-primary-400 mt-1.5 hover:underline">
                  {photoPreview ? "Change Photo" : "Add Photo"}
                </button>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">Min 39KB • Max 2MB</p>
                {photoPreview && (
                  <button type="button" onClick={() => { setPhotoPreview(null); setPhotoFile(null); }} className="text-[10px] text-red-500 mt-0.5 hover:underline">
                    Remove
                  </button>
                )}
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
            </div>

            {/* Age Configuration */}
            <div className="mb-6">
                {ageChecking && (
                  <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 mb-2">
                    <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    Checking age eligibility...
                  </div>
                )}
                {ageValidation && formData.classId && formData.dob && (
                  <div className={`p-3 rounded-lg border text-xs inline-block ${ageValidation.isValid ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700" : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700"}`}>
                    <div className="flex items-center gap-2">
                      <span>{ageValidation.isValid ? "✅" : "❌"}</span>
                      <span className={`font-medium ${ageValidation.isValid ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                        {ageValidation.message}
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 ml-5">
                      Age: {ageValidation.studentAge} yrs • Allowed: {ageValidation.minAge}-{ageValidation.maxAge} yrs
                    </p>
                    {!ageValidation.isValid && (
                      <label className="flex items-center gap-1.5 mt-1.5 ml-5 text-red-600 dark:text-red-400 cursor-pointer">
                        <input type="checkbox" name="skipAgeValidation" checked={formData.skipAgeValidation} onChange={handleChange} className="rounded w-3 h-3" />
                        Override (Admin only)
                      </label>
                    )}
                  </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className={labelClasses}>First Name <span className="text-red-500">*</span></label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClasses} placeholder="Enter first name" />
              </div>
              <div>
                <label className={labelClasses}>Last Name <span className="text-red-500">*</span></label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClasses} placeholder="Enter last name" />
              </div>
              <div>
                <label className={labelClasses}>Gender <span className="text-red-500">*</span></label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={inputClasses}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Date of Birth <span className="text-red-500">*</span></label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={inputClasses}>
                  <option value="">Select</option>
                  {effectiveBloodGroups.map(bg => <option key={bg.id} value={bg.name}>{bg.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className={inputClasses}>
                  <option value="">Select</option>
                  {masterCategories.length > 0 ? masterCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>) : (
                    <>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Religion</label>
                <select name="religion" value={formData.religion} onChange={handleChange} className={inputClasses}>
                  <option value="">Select Religion</option>
                  {masterReligions.length > 0 ? masterReligions.map(r => <option key={r.id} value={r.name}>{r.name}</option>) : (
                    <>
                      <option value="Hindu">Hindu</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Christian">Christian</option>
                      <option value="Sikh">Sikh</option>
                      <option value="Buddhist">Buddhist</option>
                      <option value="Jain">Jain</option>
                      <option value="Other">Other</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Caste</label>
                <select name="caste" value={formData.caste} onChange={handleChange} className={inputClasses}>
                  <option value="">Select Caste</option>
                  {effectiveCastes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Aadhar No</label>
                <input type="text" name="aadharNo" value={formData.aadharNo} onChange={handleChange} maxLength={12} className={inputClasses} placeholder="12 digit number" />
              </div>
              <div>
                <label className={labelClasses}>Nationality</label>
                <select name="nationality" value={formData.nationality} onChange={handleChange} className={inputClasses}>
                  <option value="Indian">Indian</option>
                  {masterNationalities.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Admission Date</label>
                <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} className={inputClasses} />
              </div>
            </div>
          </div>

          {/* ━━━ Section 3: Contact Information ━━━ */}
          <div className={sectionClasses}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <FiMapPin className="text-emerald-600 dark:text-emerald-400 text-lg" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className={labelClasses}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} placeholder="student@email.com" />
              </div>
              <div>
                <label className={labelClasses}>Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} placeholder="Mobile number" />
              </div>
              <div className="md:col-span-3">
                <label className={labelClasses}>Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className={`${inputClasses} resize-none`} placeholder="Full residential address" />
              </div>
            </div>
          </div>

          {/* ━━━ Section 4: Parent / Guardian Details ━━━ */}
          <div className={sectionClasses}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <FiShield className="text-amber-600 dark:text-amber-400 text-lg" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Parent / Guardian Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className={labelClasses}>Father's Name <span className="text-red-500">*</span></label>
                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Father's Phone <span className="text-red-500">*</span></label>
                <input type="tel" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Father's Occupation</label>
                <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Mother's Name</label>
                <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Mother's Phone</label>
                <input type="tel" name="motherPhone" value={formData.motherPhone} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Mother's Occupation</label>
                <input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Guardian Name</label>
                <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Guardian Phone</label>
                <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Relation to Student</label>
                <input type="text" name="guardianRelation" value={formData.guardianRelation} onChange={handleChange} className={inputClasses} placeholder="e.g. Uncle, Aunt" />
              </div>
            </div>
          </div>

          {/* ━━━ Section 5: Documents ━━━ */}
          <div className={sectionClasses}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <FiFileText className="text-primary-600 dark:text-primary-400 text-lg" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Upload Documents</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">(Optional)</span>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <FiUpload className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">Click to upload documents</p>
                  <p className="text-xs text-gray-400">Birth Certificate, Aadhar, TC, Marksheet (PDF/JPG/PNG, Max 5MB each)</p>
                </div>
                <input ref={docInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleDocUpload} className="hidden" />
              </label>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{doc.name}</p>
                    <div className="flex items-center gap-2">
                      <select value={doc.type} onChange={(e) => updateDocType(idx, e.target.value)} className="px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                        <option value="other">Other</option>
                        <option value="aadhar_card">Aadhar Card</option>
                        <option value="birth_certificate">Birth Certificate</option>
                        <option value="tc">Transfer Certificate</option>
                        <option value="marksheet">Marksheet</option>
                      </select>
                      <button type="button" onClick={() => removeDocument(idx)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ━━━ SUBMIT BUTTON ━━━ */}
          <div className="flex justify-end pt-2 pb-8">
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-3.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-semibold text-lg shadow-lg shadow-primary-200 dark:shadow-primary-900/30 transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : "✅ Complete Admission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
