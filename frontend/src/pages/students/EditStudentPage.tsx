
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function EditStudentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
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
        setPhotoPreview(`/uploads/${s.photoUrl}`);
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
      setPhotoPreview(`/uploads/${res.data.data.photoUrl}`);
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
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Loading student data...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Student</h1>
        <button onClick={() => navigate("/students")} className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
          ← Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Photo Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Student Photo</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div
                onClick={() => photoRef.current?.click()}
                className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-primary-50 transition-all overflow-hidden"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <p className="text-2xl">📷</p>
                    <p className="text-xs text-gray-400 mt-1">Upload</p>
                  </div>
                )}
              </div>
              {photoPreview && (
                <button type="button" onClick={handleDeletePhoto} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">
                  ✕
                </button>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Click to change photo</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG • Max 2MB</p>
              {uploading && <p className="text-xs text-primary-500 mt-1">Uploading...</p>}
            </div>
            <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">First Name *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Last Name *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth *</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Blood Group</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">Select</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">Select</option>
                <option value="General">General</option><option value="OBC">OBC</option>
                <option value="SC">SC</option><option value="ST">ST</option><option value="EWS">EWS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Religion</label>
              <input type="text" name="religion" value={formData.religion} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Caste</label>
              <input type="text" name="caste" value={formData.caste} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Aadhar No</label>
              <input type="text" name="aadharNo" value={formData.aadharNo} onChange={handleChange} maxLength={12} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nationality</label>
              <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="left">Left</option>
                <option value="tc_issued">TC Issued</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
          </div>
        </div>

        {/* Parent / Guardian */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Parent / Guardian</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Father's Name *</label>
              <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Father's Phone *</label>
              <input type="tel" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Father's Occupation</label>
              <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Mother's Name *</label>
              <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Mother's Phone</label>
              <input type="tel" name="motherPhone" value={formData.motherPhone} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Mother's Occupation</label>
              <input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Guardian Name</label>
              <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Guardian Phone</label>
              <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Relation</label>
              <input type="text" name="guardianRelation" value={formData.guardianRelation} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Documents</h2>
            <div className="flex items-center gap-2">
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
                <option value="aadhar_card">Aadhar Card</option>
                <option value="birth_certificate">Birth Certificate</option>
                <option value="tc">Transfer Certificate (TC)</option>
                <option value="marksheet">Marksheet</option>
                <option value="photo">Photo</option>
                <option value="other">Other</option>
              </select>
              <button type="button" onClick={() => docRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 text-sm font-medium disabled:opacity-50 transition-colors">
                {uploading ? "Uploading..." : "📎 Upload"}
              </button>
              <input ref={docRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleDocUpload} className="hidden" />
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <p className="text-gray-400 text-lg">📄</p>
              <p className="text-gray-400 font-medium mt-2">No documents uploaded</p>
              <p className="text-xs text-gray-300 mt-1">PDF, JPG, PNG, DOC • Max 5MB each</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center">
                      {doc.mimeType?.includes("pdf") ? "📕" : doc.mimeType?.includes("image") ? "🖼️" : "📄"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                      <p className="text-xs text-gray-400">
                        {getDocTypeLabel(doc.type)} • {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ""} • {new Date(doc.uploadedAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`/uploads/${doc.url}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 font-medium">
                      View
                    </a>
                    <button type="button" onClick={() => handleDeleteDoc(doc.id)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate("/students")} className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
