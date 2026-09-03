import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSave, FiUpload } from "react-icons/fi";
import { getFullUrl } from "../../utils/url";
import { useAcademicYear } from "../../context/AcademicYearContext";

interface SubjectOption { id: string; name: string; classId: string; class?: { id: string; name: string }; }
interface ClassOption { id: string; name: string; }
interface AcademicYearOption { id: string; name: string; startDate?: string; endDate?: string; isActive?: boolean; isCurrent?: boolean; }

const AddEditTeacher = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { academicYears: globalAcademicYears, selectedAcademicYearId, setSelectedAcademicYear } = useAcademicYear();
  const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState(""); const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [gender, setGender] = useState(""); const [dob, setDob] = useState(""); const [maritalStatus, setMaritalStatus] = useState("");
  const [photo, setPhoto] = useState<File | null>(null); const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [academicYearId, setAcademicYearId] = useState(""); const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]); const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]); const [filteredSubjects, setFilteredSubjects] = useState<SubjectOption[]>([]); const [classes, setClasses] = useState<ClassOption[]>([]); const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [loading, setLoading] = useState(false); const [fetching, setFetching] = useState(false);
  const getAuthConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } });

  const fetchOptions = async (yearId?: string) => {
    if (!yearId) { setClasses([]); setAllSubjects([]); setFilteredSubjects([]); return; }
    const params = { academicYearId: yearId };
    const auth = getAuthConfig();
    const [classResult, subjectResult] = await Promise.allSettled([
      axios.get(getFullUrl("/api/class"), { ...auth, params }), axios.get(getFullUrl("/api/subject"), { ...auth, params }),
    ]);
    if (classResult.status === "fulfilled") {
      const p = classResult.value.data; const cls = p?.data?.data || p?.data || p || [];
      setClasses(Array.isArray(cls) ? cls : []);
    } else { console.error("Failed to fetch teacher form classes:", classResult.reason); setClasses([]); }
    if (subjectResult.status === "fulfilled") {
      const p = subjectResult.value.data; const subs = p?.data?.data || p?.data || p || [];
      const normalized = (Array.isArray(subs) ? subs : []).map((s: any) => ({ ...s, classId: s.classId || s.class?.id || "" }));
      setAllSubjects(normalized);
    } else { console.error("Failed to fetch teacher form subjects:", subjectResult.reason); setAllSubjects([]); }
    if (classResult.status === "rejected" && subjectResult.status === "rejected") toast.error("Failed to load classes and subjects");
    else if (classResult.status === "rejected") toast.error("Failed to load classes");
  };

  useEffect(() => {
    if (globalAcademicYears.length > 0) {
      setAcademicYears(globalAcademicYears);
      if (!isEdit && !academicYearId && selectedAcademicYearId) setAcademicYearId(selectedAcademicYearId);
    }
  }, [globalAcademicYears, selectedAcademicYearId, isEdit, academicYearId]);

  // Always load the years on this form as a safety net. The global context may
  // mount before authentication is restored, so relying on it alone can leave
  // this page with an empty dropdown and therefore no class/subject options.
  useEffect(() => {
    let cancelled = false;
    const loadAcademicYears = async () => {
      try {
        const res = await axios.get(getFullUrl("/api/academic"), getAuthConfig());
        const data = res.data?.data || res.data || [];
        if (cancelled || !Array.isArray(data)) return;
        setAcademicYears(data);
        if (!isEdit && !academicYearId) {
          const preferred = (selectedAcademicYearId && data.find((y: AcademicYearOption) => y.id === selectedAcademicYearId))
            || data.find((y: AcademicYearOption) => y.isCurrent)
            || data.find((y: AcademicYearOption) => y.isActive)
            || data[0];
          if (preferred) {
            setAcademicYearId(preferred.id);
            setSelectedAcademicYear(preferred as any);
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch academic years:", err?.response?.data || err);
        if (!cancelled) toast.error(err?.response?.data?.message || "Failed to load academic years");
      }
    };
    loadAcademicYears();
    return () => { cancelled = true; };
  }, [isEdit]);

  useEffect(() => {
    if (academicYearId) fetchOptions(academicYearId); else { setClasses([]); setAllSubjects([]); setFilteredSubjects([]); }
    if (!isEdit) { setSelectedClasses([]); setSelectedSubjects([]); }
  }, [academicYearId, isEdit]);

  // In edit mode, DB assignments are authoritative. Options are only the UI
  // catalogue; they must never clear a saved assignment while loading.
  useEffect(() => {
    if (selectedClasses.length === 0) { setFilteredSubjects([]); if (!isEdit) setSelectedSubjects([]); return; }
    if (allSubjects.length === 0) return;
    const filtered = allSubjects.filter((s) => selectedClasses.includes(s.classId));
    setFilteredSubjects(filtered);
    if (!isEdit) {
      setSelectedSubjects((prev) => prev.filter((subjectId) => filtered.some((s) => s.id === subjectId)));
    }
  }, [selectedClasses, allSubjects, isEdit]);

  const fetchTeacher = async () => {
    if (!id) return;
    setFetching(true);
    try {
      const lookupYear = selectedAcademicYearId || academicYearId || undefined;
      const res = await axios.get(getFullUrl(`/api/teacher/${id}`), { ...getAuthConfig(), params: lookupYear ? { academicYearId: lookupYear } : undefined });
      if (!res.data.success) throw new Error(res.data.message || "Teacher not found");
      const t = res.data.data; const yearId = t.academicYearId || lookupYear || "";
      const rawSubjects = Array.isArray(t.subjects) ? t.subjects : [];
      const teacherSubjects = rawSubjects.map((s: any) => s.id || s.subjectId || s.subject?.id).filter(Boolean);
      const subjectClassIds = rawSubjects.map((s: any) => s.classId || s.class?.id || s.subject?.classId || s.subject?.class?.id).filter(Boolean);
      const teacherClasses = (t.classes || []).map((c: any) => c.id || c.classId || c.class?.id).filter(Boolean);
      const mergedClasses = [...new Set([...teacherClasses, ...subjectClassIds])];
      setFirstName(t.firstName || ""); setLastName(t.lastName || ""); setEmployeeId(t.employeeId || ""); setEmail(t.email || ""); setPhone(t.phone || ""); setGender(t.gender || ""); setDob(t.dob ? t.dob.split("T")[0] : ""); setMaritalStatus(t.maritalStatus || ""); setPhotoPreview(t.photoUrl || null);
      setAcademicYearId(yearId);
      await fetchOptions(yearId);
      setSelectedClasses(mergedClasses);
      setSelectedSubjects([...new Set(teacherSubjects)]);
    } catch (err: any) { console.error("Failed to fetch teacher data:", err?.response?.data || err); toast.error(err?.response?.data?.message || "Failed to fetch teacher data"); navigate("/teachers"); }
    finally { setFetching(false); }
  };
  useEffect(() => { if (isEdit) fetchTeacher(); }, [id]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return toast.error("First Name is required"); if (!lastName.trim()) return toast.error("Last Name is required"); if (!email.trim()) return toast.error("Email is required"); if (!phone.trim()) return toast.error("Phone is required"); if (!gender) return toast.error("Gender is required"); if (!dob) return toast.error("Date of Birth is required"); if (!academicYearId) return toast.error("Academic Year is required"); if (selectedClasses.length === 0) return toast.error("Please assign at least one class");
    setLoading(true);
    const formData = new FormData();
    formData.append("firstName", firstName.trim()); formData.append("lastName", lastName.trim()); formData.append("name", `${firstName.trim()} ${lastName.trim()}`); formData.append("email", email.trim()); formData.append("phone", phone.trim()); formData.append("gender", gender); formData.append("dob", dob); formData.append("maritalStatus", maritalStatus); formData.append("academicYearId", academicYearId);
    if (employeeId.trim()) formData.append("employeeId", employeeId.trim());
    selectedSubjects.forEach((subjectId) => formData.append("subjectIds[]", subjectId)); selectedClasses.forEach((classId) => formData.append("classIds[]", classId)); if (photo) formData.append("photo", photo);
    try {
      const res = isEdit ? await axios.put(getFullUrl(`/api/teacher/${id}`), formData, getAuthConfig()) : await axios.post(getFullUrl("/api/teacher"), formData, getAuthConfig());
      if (res.data?.success) { toast.success(isEdit ? "Teacher updated successfully" : "Teacher created successfully"); navigate("/teachers"); } else toast.error(res.data?.message || "Teacher could not be saved");
    } catch (err: any) { console.error("Teacher save failed:", err?.response?.data || err); toast.error(err?.response?.data?.message || "Something went wrong while saving teacher"); }
    finally { setLoading(false); }
  };

  const toggleSubject = (subId: string) => setSelectedSubjects((prev) => prev.includes(subId) ? prev.filter((s) => s !== subId) : [...prev, subId]);
  const toggleClass = (clsId: string) => setSelectedClasses((prev) => prev.includes(clsId) ? prev.filter((c) => c !== clsId) : [...prev, clsId]);
  const selectAllClasses = () => setSelectedClasses(selectedClasses.length === classes.length ? [] : classes.map((c) => c.id));
  const selectAllSubjects = () => setSelectedSubjects(selectedSubjects.length === filteredSubjects.length ? [] : filteredSubjects.map((s) => s.id));
  if (fetching) return <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (<div className="p-6 max-w-4xl mx-auto">
    <div className="flex items-center gap-4 mb-6"><button onClick={() => navigate("/teachers")} className="p-2 hover:bg-gray-100 rounded-lg transition"><FiArrowLeft size={20} /></button><h1 className="text-2xl font-bold text-gray-800">{isEdit ? "Edit Teacher" : "Add Teacher"}</h1></div>
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      <div><h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Personal Information</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3 flex justify-end"><div className="flex flex-col items-center"><div className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">{photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /> : <div className="text-center text-gray-400"><FiUpload size={24} className="mx-auto mb-1" /><p className="text-xs">Choose Photo</p></div>}</div><label className="mt-2 text-xs text-primary-600 hover:underline cursor-pointer"><input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />{photoPreview ? "Change Photo" : "Upload Photo"}</label></div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Enter first name" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Enter last name" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label><input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Auto-generated or enter manually" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="">Select Gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile No. <span className="text-red-500">*</span></label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter mobile number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email ID <span className="text-red-500">*</span></label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label><select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="">Select Status</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option></select></div>
      </div></div>
      <div><h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Academic Information</h2>
        <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Academic Year <span className="text-red-500">*</span></label><select value={academicYearId} onChange={(e) => { const value = e.target.value; setAcademicYearId(value); const year = academicYears.find((y) => y.id === value); if (year) setSelectedAcademicYear(year as any); }} className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg"><option value="">{academicYears.length === 0 ? "Loading Academic Years..." : "Select Academic Year"}</option>{academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select></div>
        <div className="mb-4"><div className="flex justify-between items-center mb-2"><label className="block text-sm font-medium text-gray-700">Assign Classes <span className="text-red-500">*</span></label>{classes.length > 0 && <button type="button" onClick={selectAllClasses} className="text-xs text-green-600 hover:underline">{selectedClasses.length === classes.length ? "Deselect All" : "Select All"}</button>}</div><div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">{classes.length === 0 ? <p className="text-sm text-gray-400">{academicYearId ? "No classes available for this academic year" : "Select an academic year first"}</p> : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">{classes.map((cls) => <label key={cls.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border ${selectedClasses.includes(cls.id) ? "bg-green-50 border-green-300" : "bg-white border-gray-200"}`}><input type="checkbox" checked={selectedClasses.includes(cls.id)} onChange={() => toggleClass(cls.id)} /><span className="text-sm">{cls.name}</span></label>)}</div>}</div></div>
        <div><div className="flex justify-between items-center mb-2"><label className="block text-sm font-medium text-gray-700">Assigned Subjects</label>{filteredSubjects.length > 0 && <button type="button" onClick={selectAllSubjects} className="text-xs text-green-600 hover:underline">{selectedSubjects.length === filteredSubjects.length ? "Deselect All" : "Select All"}</button>}</div><div className="border border-gray-300 rounded-lg p-3 max-h-56 overflow-y-auto">{selectedClasses.length === 0 ? <p className="text-sm text-gray-400">Select a class first</p> : filteredSubjects.length === 0 ? <p className="text-sm text-gray-400">No subjects available for selected classes</p> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{filteredSubjects.map((subject) => <label key={subject.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedSubjects.includes(subject.id)} onChange={() => toggleSubject(subject.id)} /><span>{subject.name}{subject.class?.name ? ` (${subject.class.name})` : ""}</span></label>)}</div>}</div>{selectedSubjects.length > 0 && <p className="text-xs text-gray-500 mt-1">{selectedSubjects.length} subject(s) assigned</p>}</div>
      </div>
      <div className="flex justify-end gap-3"><button type="button" onClick={() => navigate("/teachers")} className="px-5 py-2 border border-gray-300 rounded-lg">Cancel</button><button type="submit" disabled={loading} className="px-5 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2"><FiSave size={18} />{loading ? "Saving..." : isEdit ? "Update Teacher" : "Save Teacher"}</button></div>
    </form>
  </div>);
};
export default AddEditTeacher;
