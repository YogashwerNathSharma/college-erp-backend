
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import { toast } from "react-hot-toast";
import {
  FiUser,
  FiPhone,
  FiMapPin,
  FiShield,
  FiFileText,
  FiCamera,
  FiUpload,
  FiX,
} from "react-icons/fi";

// ═══ Shared class constants ═══
const inputClasses = "w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all";
const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
const sectionClasses = "bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8";

export default function EditStudentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // ── Master Dropdowns ──
  const [masterBloodGroups, setMasterBloodGroups] = useState<{id:string,name:string}[]>([]);
  const [masterCategories, setMasterCategories] = useState<{id:string,name:string}[]>([]);
  const [masterReligions, setMasterReligions] = useState<{id:string,name:string}[]>([]);
  const [masterNationalities, setMasterNationalities] = useState<{id:string,name:string}[]>([]);
  const [masterCastes, setMasterCastes] = useState<{id:string,name:string}[]>([]);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [bg, cat, rel, nat, cas] = await Promise.all([
          axios.get(getFullUrl("/api/masters/blood-group-master/dropdown")).catch(() => ({data:{data:[]}})),
          axios.get(getFullUrl("/api/masters/category-master/dropdown")).catch(() => ({data:{data:[]}})),
          axios.get(getFullUrl("/api/masters/religion-master/dropdown")).catch(() => ({data:{data:[]}})),
          axios.get(getFullUrl("/api/masters/nationality-master/dropdown")).catch(() => ({data:{data:[]}})),
          axios.get(getFullUrl("/api/masters/caste-master/dropdown")).catch(() => ({data:{data:[]}})),
        ]);
        setMasterBloodGroups(bg?.data?.data || []);
        setMasterCategories(cat?.data?.data || []);
        setMasterReligions(rel?.data?.data || []);
        setMasterNationalities(nat?.data?.data || []);
        setMasterCastes(cas?.data?.data || []);
      } catch(e) {}
    };
    fetchMasters();
  }, []);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("other");

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
    fatherName: "",
    motherName: "",
    fatherPhone: "",
    motherPhone: "",
    fatherOccupation: "",
    motherOccupation: "",
    guardianName: "",
    guardianPhone: "",
    guardianRelation: "",
    status: "active",
  });

  useEffect(() => {
    fetchStudent();
    fetchDocuments();
  }, [id]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/students/${id}`);
      const s = res.data.data;
      setFormData({
        firstName: s.firstName || "",
        lastName: s.lastName || "",
        gender: s.gender || "",
        dob: s.dob ? new Date(s.dob).toISOString().split("T")[0] : "",
        bloodGroup: s.bloodGroup || "",
        religion: s.religion || "",
        caste: s.caste || "",
        category: s.category || "",
        nationality: s.nationality || "Indian",
        aadharNo: s.aadharNo || "",
        email: s.email || "",
        phone: s.phone || "",
        address: s.address || "",
        fatherName: s.fatherName || "",
        motherName: s.motherName || "",
        fatherPhone: s.fatherPhone || "",
        motherPhone: s.motherPhone || "",
        fatherOccupation: s.fatherOccupation || "",
        motherOccupation: s.motherOccupation || "",
        guardianName: s.guardianName || "",
        guardianPhone: s.guardianPhone || "",
        guardianRelation: s.guardianRelation || "",
        status: s.status || "active",
      });
      if (s.photoUrl) {
        setPhotoPreview(s.photoUrl.startsWith("http") ? s.photoUrl : `${axios.defaults.baseURL || ""}${s.photoUrl}`);
      }
    } catch (err: any) {
      toast.error("Failed to load student");
      navigate("/students");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`/api/students/${id}/documents`);
      setDocuments(res.data.data || []);
    } catch (err) {
      console.error("Documents fetch failed:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`/api/students/${id}`, formData);
      toast.success("Student updated successfully!");
      navigate("/students");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size < 39 * 1024) {
      toast.error("Photo size must be at least 39KB. Please use a better quality image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be less than 2MB");
      return;
    }

    const fd = new FormData();
    fd.append("photo", file);
    setUploading(true);
    try {
      const res = await axios.post(`/api/students/${id}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotoPreview(res.data.data.photoUrl.startsWith("http") ? res.data.data.photoUrl : `${axios.defaults.baseURL || ""}${res.data.data.photoUrl}`);
      toast.success("Photo updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Delete Photo
  const handleDeletePhoto = async () => {
    if (!window.confirm("Remove student photo?")) return;
    try {
      await axios.delete(`/api/students/${id}/photo`);
      setPhotoPreview(null);
      toast.success("Photo removed");
    } catch (err: any) {
      toast.error("Failed to remove photo");
    }
  };

  // Document Upload
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Document must be less than 5MB");
      return;
    }

    const fd = new FormData();
    fd.append("document", file);
    fd.append("type", docType);
    fd.append("name", file.name);
    setUploading(true);
    try {
      await axios.post(`/api/students/${id}/documents`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded!");
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (docRef.current) docRef.current.value = "";
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId: string) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await axios.delete(`/api/students/documents/${docId}`);
      toast.success("Document deleted");
      fetchDocuments();
    } catch (err: any) {
      toast.error("Failed to delete document");
    }
  };

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      aadhar_card: "Aadhar Card",
      birth_certificate: "Birth Certificate",
      tc: "Transfer Certificate",
      marksheet: "Marksheet",
      photo: "Photo",
      other: "Other",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 p-4 md:p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Loading student data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
              Edit Student
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Update student details and click Save Changes</p>
          </div>
          <button
            onClick={() => navigate("/students")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
          >
            ← Back to List
          </button>
        </div>

        {/* ═══ SINGLE SCROLLABLE FORM — All sections visible ═══ */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ━━━ Section 1: Personal Information ━━━ */}
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
                  onClick={() => photoRef.current?.click()}
                  className="w-28 h-32 border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-all bg-gray-50 dark:bg-slate-700 flex items-center justify-center"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Student" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <FiCamera className="mx-auto text-gray-400 dark:text-gray-500 text-2xl" />
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">No Photo</p>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => photoRef.current?.click()} className="text-xs text-primary-600 dark:text-primary-400 mt-1.5 hover:underline">
                  {photoPreview ? "Change Photo" : "Add Photo"}
                </button>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">Min 39KB • Max 2MB</p>
                {photoPreview && (
                  <button type="button" onClick={handleDeletePhoto} className="text-[10px] text-red-500 mt-0.5 hover:underline">
                    Remove
                  </button>
                )}
                {uploading && <p className="text-[10px] text-primary-500 mt-0.5">Uploading...</p>}
                <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className={labelClasses}>First Name <span className="text-red-500">*</span></label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClasses} placeholder="Enter first name" />
              </div>
              <div>
                <label className={labelClasses}>Last Name <span className="text-red-500">*</span></label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClasses} placeholder="Enter last name" />
              </div>
              <div>
                <label className={labelClasses}>Gender <span className="text-red-500">*</span></label>
                <select name="gender" value={formData.gender} onChange={handleChange} required className={inputClasses}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Date of Birth <span className="text-red-500">*</span></label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={inputClasses}>
                  <option value="">Select</option>
                  {masterBloodGroups.length > 0 ? masterBloodGroups.map(bg => <option key={bg.id} value={bg.name}>{bg.name}</option>) : (
                    <>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </>
                  )}
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
                  {masterCastes.length > 0 ? masterCastes.map(c => <option key={c.id} value={c.name}>{c.name}</option>) : (
                    <>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="Other">Other</option>
                    </>
                  )}
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
                <label className={labelClasses}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className={inputClasses}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="left">Left</option>
                  <option value="tc_issued">TC Issued</option>
                </select>
              </div>
            </div>
          </div>

          {/* ━━━ Section 2: Contact Information ━━━ */}
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

          {/* ━━━ Section 3: Parent / Guardian Details ━━━ */}
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
                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Father's Phone <span className="text-red-500">*</span></label>
                <input type="tel" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} required className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Father's Occupation</label>
                <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Mother's Name <span className="text-red-500">*</span></label>
                <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required className={inputClasses} />
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

          {/* ━━━ Section 4: Documents ━━━ */}
          <div className={sectionClasses}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <FiFileText className="text-primary-600 dark:text-primary-400 text-lg" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Documents</h2>
            </div>

            {/* Upload Area */}
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => docRef.current?.click()}>
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <FiUpload className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">Click to upload documents</p>
                    <p className="text-xs text-gray-400">Birth Certificate, Aadhar, TC, Marksheet (PDF/JPG/PNG, Max 5MB each)</p>
                  </div>
                </label>
                <div className="flex items-center gap-2">
                  <select value={docType} onChange={(e) => setDocType(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500">
                    <option value="aadhar_card">Aadhar Card</option>
                    <option value="birth_certificate">Birth Certificate</option>
                    <option value="tc">Transfer Certificate (TC)</option>
                    <option value="marksheet">Marksheet</option>
                    <option value="photo">Photo</option>
                    <option value="other">Other</option>
                  </select>
                  <button type="button" onClick={() => docRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 text-sm font-medium disabled:opacity-50 transition-colors">
                    {uploading ? "Uploading..." : "📎 Upload"}
                  </button>
                </div>
              </div>
              <input ref={docRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleDocUpload} className="hidden" />
            </div>

            {/* Existing Documents List */}
            {documents.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl p-8 text-center">
                <FiFileText className="mx-auto text-gray-300 dark:text-gray-600 text-3xl" />
                <p className="text-gray-400 dark:text-gray-500 font-medium mt-2">No documents uploaded</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">PDF, JPG, PNG, DOC • Max 5MB each</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-slate-600 rounded-lg border border-gray-200 dark:border-slate-500 flex items-center justify-center">
                        {doc.mimeType?.includes("pdf") ? "📕" : doc.mimeType?.includes("image") ? "🖼️" : "📄"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{doc.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {getDocTypeLabel(doc.type)} • {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ""} • {new Date(doc.uploadedAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`/uploads/${doc.url}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 font-medium">
                        View
                      </a>
                      <button type="button" onClick={() => handleDeleteDoc(doc.id)} className="px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ━━━ SUBMIT BUTTONS ━━━ */}
          <div className="flex justify-end gap-4 pt-2 pb-8">
            <button
              type="button"
              onClick={() => navigate("/students")}
              className="px-8 py-3.5 text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 font-semibold text-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-10 py-3.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-semibold text-lg shadow-lg shadow-primary-200 dark:shadow-primary-900/30 transition-all"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
