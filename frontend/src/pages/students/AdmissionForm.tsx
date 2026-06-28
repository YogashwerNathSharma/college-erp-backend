
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

  const [ageValidation, setAgeValidation] = useState<any>(null);
  const [ageChecking, setAgeChecking] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<
    { file: File; type: string; name: string }[]
  >([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState(0);

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

  const steps = [
    { label: "Academic", icon: <FiBook /> },
    { label: "Personal", icon: <FiUser /> },
    { label: "Contact", icon: <FiPhone /> },
    { label: "Parents", icon: <FiShield /> },
    { label: "Documents", icon: <FiFileText /> },
  ];

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
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get("/api/class");
      setClasses(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await axios.get(`/api/section?classId=${classId}`);
      setSections(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Photo size must be less than 2MB");
        return;
      }
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
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max 5MB allowed.`);
          return;
        }
        setDocuments((prev) => [...prev, { file, type: "other", name: file.name }]);
      });
    }
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDocType = (index: number, type: string) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, type } : doc))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ageValidation && !ageValidation.isValid && !formData.skipAgeValidation) {
      toast.error(`Age validation failed: ${ageValidation.message}`);
      return;
    }

    setLoading(true);
    try {
      // 1. Create student
      const res = await axios.post("/api/students", formData);
      const student = res.data.data.student;

      // 2. Upload photo if selected
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append("photo", photoFile);
        try {
          await axios.post(`/api/students/${student.id}/photo`, photoFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (err) {
          console.error("Photo upload failed:", err);
        }
      }

      // 3. Upload documents if any
      if (documents.length > 0) {
        for (const doc of documents) {
          const docFormData = new FormData();
          docFormData.append("document", doc.file);
          docFormData.append("type", doc.type);
          docFormData.append("name", doc.name);
          try {
            await axios.post(`/api/students/${student.id}/documents`, docFormData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch (err) {
            console.error("Document upload failed:", err);
          }
        }
      }

      toast.success(`Student admitted! Admission No: ${student.admissionNo}`);
      navigate("/students");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Admission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-600 bg-clip-text text-transparent">
              New Student Admission
            </h1>
            <p className="text-gray-500 mt-1">Fill in the student details to complete admission</p>
          </div>
          <button
            onClick={() => navigate("/students")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
          >
            ← Back to List
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8 bg-white rounded-2xl p-4 shadow-sm border">
          {steps.map((step, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveStep(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeStep === i
                  ? "bg-primary-600 text-white shadow-lg shadow-blue-200"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {step.icon}
              <span className="hidden md:inline">{step.label}</span>
            </button>
          ))}
        </div>

        {/* Age Validation Alert */}
        {ageValidation && (
          <div
            className={`mb-6 p-4 rounded-2xl border-2 backdrop-blur-sm ${
              ageValidation.isValid
                ? "bg-emerald-50/80 border-emerald-200"
                : "bg-red-50/80 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                ageValidation.isValid ? "bg-emerald-100" : "bg-red-100"
              }`}>
                <span className="text-xl">{ageValidation.isValid ? "✅" : "❌"}</span>
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${ageValidation.isValid ? "text-emerald-800" : "text-red-800"}`}>
                  {ageValidation.message}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  Board: {ageValidation.board} • Class: {ageValidation.className} • Age: {ageValidation.studentAge} yrs • Allowed: {ageValidation.minAge} - {ageValidation.maxAge} yrs
                </p>
              </div>
            </div>
            {!ageValidation.isValid && (
              <label className="flex items-center gap-2 mt-3 ml-13 text-sm text-red-700 cursor-pointer">
                <input type="checkbox" name="skipAgeValidation" checked={formData.skipAgeValidation} onChange={handleChange} className="rounded" />
                Override age validation (Admin only)
              </label>
            )}
          </div>
        )}
        {ageChecking && (
          <div className="mb-4 flex items-center gap-2 text-sm text-primary-600">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            Checking age eligibility...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 0: Academic Information */}
          <div className={activeStep === 0 ? "block" : "hidden"}>
            <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <FiBook className="text-primary-600 text-lg" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Academic Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year <span className="text-red-500">*</span></label>
                  <select name="academicYearId" value={formData.academicYearId} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
                    <option value="">Select Year</option>
                    {academicYears.map((ay) => (<option key={ay.id} value={ay.id}>{ay.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Class <span className="text-red-500">*</span></label>
                  <select name="classId" value={formData.classId} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
                    <option value="">Select Class</option>
                    {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Section <span className="text-red-500">*</span></label>
                  <select name="sectionId" value={formData.sectionId} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
                    <option value="">Select Section</option>
                    {sections.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Personal Information */}
          <div className={activeStep === 1 ? "block" : "hidden"}>
            <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FiUser className="text-purple-600 text-lg" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
              </div>

              {/* Photo Upload */}
              <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-xl">
                <div className="relative">
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-primary-50 transition-all overflow-hidden"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <FiCamera className="mx-auto text-gray-400 text-2xl" />
                        <p className="text-xs text-gray-400 mt-1">Add Photo</p>
                      </div>
                    )}
                  </div>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-700">Student Photo</p>
                  <p className="text-sm text-gray-500">Upload a clear passport-size photo</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG • Max 2MB</p>
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Enter first name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Enter last name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender <span className="text-red-500">*</span></label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">Select</option>
                    {masterBloodGroups.map(bg => <option key={bg.id} value={bg.name}>{bg.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">Select</option>
                    {masterCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Religion</label>
                  <select name="religion" value={formData.religion} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">Select Religion</option>
                    {masterReligions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Caste</label>
                  <select name="caste" value={formData.caste} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">Select Caste</option>
                    {masterCastes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Aadhar No</label>
                  <input type="text" name="aadharNo" value={formData.aadharNo} onChange={handleChange} maxLength={12} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="12 digit number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nationality</label>
                  <select name="nationality" value={formData.nationality} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">Select Nationality</option>
                    {masterNationalities.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Contact Information */}
          <div className={activeStep === 2 ? "block" : "hidden"}>
            <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <FiMapPin className="text-emerald-600 text-lg" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Contact Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="student@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Mobile number" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address <span className="text-red-500">*</span></label>
                  <textarea name="address" value={formData.address} onChange={handleChange} required rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" placeholder="Full residential address" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Parent / Guardian */}
          <div className={activeStep === 3 ? "block" : "hidden"}>
            <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FiShield className="text-amber-600 text-lg" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Parent / Guardian Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Father's Name <span className="text-red-500">*</span></label>
                  <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Father's Phone <span className="text-red-500">*</span></label>
                  <input type="tel" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Father's Occupation</label>
                  <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mother's Name <span className="text-red-500">*</span></label>
                  <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mother's Phone</label>
                  <input type="tel" name="motherPhone" value={formData.motherPhone} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mother's Occupation</label>
                  <input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Guardian Name</label>
                  <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Guardian Phone</label>
                  <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Relation to Student</label>
                  <input type="text" name="guardianRelation" value={formData.guardianRelation} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="e.g. Uncle, Aunt" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Documents */}
          <div className={activeStep === 4 ? "block" : "hidden"}>
            <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <FiFileText className="text-primary-600 text-lg" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Upload Documents</h2>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FiUpload className="text-primary-600 text-xl" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Upload Supporting Documents</p>
                    <p className="text-sm text-gray-500">Birth Certificate, Aadhar, Transfer Certificate, etc.</p>
                  </div>
                  <input ref={docInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleDocUpload} className="hidden" />
                </label>
              </div>

              {documents.length > 0 && (
                <div className="space-y-3">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select value={doc.type} onChange={(e) => updateDocType(idx, e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                          <option value="other">Other</option>
                          <option value="aadhar_card">Aadhar Card</option>
                          <option value="birth_certificate">Birth Certificate</option>
                          <option value="tc">Transfer Certificate</option>
                          <option value="marksheet">Marksheet</option>
                        </select>
                        <button type="button" onClick={() => removeDocument(idx)} className="text-red-600 hover:text-red-700">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation & Submit */}
          <div className="flex justify-between gap-4 mt-8">
            <button
              type="button"
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              ← Previous
            </button>
            {activeStep === steps.length - 1 ? (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-medium"
              >
                {loading ? "Creating..." : "Complete Admission"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium"
              >
                Next →
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
