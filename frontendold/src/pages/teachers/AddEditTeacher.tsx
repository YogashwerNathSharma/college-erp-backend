

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSave, FiUpload } from "react-icons/fi";



interface SubjectOption {
  id: string;
  name: string;
  classId: string;
  class?: { id: string; name: string };
}

interface ClassOption {
  id: string;
  name: string;
}

interface AcademicYearOption {
  id: string;
  name: string;
}

const AddEditTeacher = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Form state — Personal Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Academic
  const [academicYearId, setAcademicYearId] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Options from DB
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<SubjectOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);



  // Fetch dropdown options
  const fetchOptions = async () => {
    try {
      const [subRes, classRes, yearRes] = await Promise.all([
        axios.get("/api/subjects"),
        axios.get("/api/class"),
        axios.get("/api/academic"),
      ]);

      const subs = subRes.data.data?.data || subRes.data.data || [];
      setAllSubjects(Array.isArray(subs) ? subs : []);

      const cls = classRes.data.data?.data || classRes.data.data || [];
      setClasses(Array.isArray(cls) ? cls : []);

      const years = yearRes.data.data?.data || yearRes.data.data || [];
      const yearArray = Array.isArray(years) ? years : [];
      setAcademicYears(yearArray);

      if (!isEdit && yearArray.length > 0) {
        const current = yearArray.find(
          (y: any) =>
            y.isCurrent === true ||
            y.isActive === true ||
            y.status === "ACTIVE"
        );
        if (current) {
          setAcademicYearId(current.id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch options:", err);
      toast.error("Failed to load form data");
    }
  };

  // Filter subjects when classes change
  useEffect(() => {
    if (selectedClasses.length === 0) {
      setFilteredSubjects([]);
      return;
    }
    const filtered = allSubjects.filter((s) =>
      selectedClasses.includes(s.classId)
    );
    setFilteredSubjects(filtered);

    setSelectedSubjects((prev) =>
      prev.filter((id) => filtered.some((s) => s.id === id))
    );
  }, [selectedClasses, allSubjects]);

  // Fetch teacher data for edit
  const fetchTeacher = async () => {
    if (!id) return;
    setFetching(true);
    try {
      const res = await axios.get(`/api/teacher/${id}`);

      if (res.data.success) {
        const t = res.data.data;
        setFirstName(t.firstName || "");
        setLastName(t.lastName || "");
        setEmployeeId(t.employeeId || "");
        setEmail(t.email || "");
        setPhone(t.phone || "");
        setGender(t.gender || "");
        setDob(t.dob ? t.dob.split("T")[0] : "");
        setMaritalStatus(t.maritalStatus || "");
        setAcademicYearId(t.academicYearId || "");
        setSelectedSubjects(
          t.subjects?.map((s: any) => s.id || s.subjectId) || []
        );
        setSelectedClasses(
          t.classes?.map((c: any) => c.id || c.classId) || []
        );
        if (t.photoUrl) {
          const fullUrl = t.photoUrl.startsWith("http")
            ? t.photoUrl
            : `${t.photoUrl}`;
          setPhotoPreview(fullUrl);
        }
      }
    } catch (err: any) {
      toast.error("Failed to fetch teacher data");
      navigate("/teachers");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    if (isEdit) fetchTeacher();
  }, [id]);

  // Handle photo change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName.trim()) return toast.error("First Name is required");
    if (!lastName.trim()) return toast.error("Last Name is required");
    if (!email.trim()) return toast.error("Email is required");
    if (!phone.trim()) return toast.error("Phone is required");
    if (!gender) return toast.error("Gender is required");
    if (!dob) return toast.error("Date of Birth is required");
    if (!academicYearId) return toast.error("Academic Year is required");
    if (selectedClasses.length === 0)
      return toast.error("Please assign at least one class");

    setLoading(true);

    // Use FormData for file upload
    const formData = new FormData();
    formData.append("firstName", firstName.trim());
    formData.append("lastName", lastName.trim());
    formData.append("name", `${firstName.trim()} ${lastName.trim()}`);
    formData.append("email", email.trim());
    formData.append("phone", phone.trim());
    formData.append("gender", gender);
    formData.append("dob", dob);
    formData.append("maritalStatus", maritalStatus);
    formData.append("academicYearId", academicYearId);
    if (employeeId.trim()) formData.append("employeeId", employeeId.trim());

    // Arrays
    selectedSubjects.forEach((id) => formData.append("subjectIds[]", id));
    selectedClasses.forEach((id) => formData.append("classIds[]", id));

    // Photo
    if (photo) {
      formData.append("photo", photo);
    }

    try {
      let res;
      if (isEdit) {
        res = await axios.put(`/api/teacher/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await axios.post("/api/teacher", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (res.data.success) {
        toast.success(
          isEdit
            ? "Teacher updated successfully"
            : "Teacher created successfully"
        );
        navigate("/teachers");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subId) ? prev.filter((s) => s !== subId) : [...prev, subId]
    );
  };

  const toggleClass = (clsId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(clsId)
        ? prev.filter((c) => c !== clsId)
        : [...prev, clsId]
    );
  };

  const selectAllClasses = () => {
    if (selectedClasses.length === classes.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(classes.map((c) => c.id));
    }
  };

  const selectAllSubjects = () => {
    if (selectedSubjects.length === filteredSubjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(filteredSubjects.map((s) => s.id));
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/teachers")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? "Edit Teacher" : "Add Teacher"}
        </h1>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 space-y-6"
      >
        {/* ─────────── Personal Information ─────────── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Photo Upload - Right Side */}
            <div className="md:col-span-3 flex justify-end">
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <FiUpload size={24} className="mx-auto mb-1" />
                      <p className="text-xs">Choose Photo</p>
                    </div>
                  )}
                </div>
                <label className="mt-2 text-xs text-primary-600 hover:underline cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  {photoPreview ? "Change Photo" : "Upload Photo"}
                </label>
              </div>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Auto-generated or enter manually"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Mobile No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter mobile number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email ID <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Marital Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marital Status
              </label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─────────── Academic Information ─────────── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
            Academic Information
          </h2>

          {/* Academic Year */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          {/* Classes */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Assign Classes <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 ml-1">
                  (Select classes first, then subjects will appear)
                </span>
              </label>
              {classes.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllClasses}
                  className="text-xs text-green-600 hover:underline"
                >
                  {selectedClasses.length === classes.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {classes.length === 0 ? (
                <p className="text-sm text-gray-400">No classes available</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {classes.map((cls) => (
                    <label
                      key={cls.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition ${
                        selectedClasses.includes(cls.id)
                          ? "bg-green-50 border-green-300"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(cls.id)}
                        onChange={() => toggleClass(cls.id)}
                        className="rounded text-green-600"
                      />
                      <span className="text-sm">{cls.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedClasses.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedClasses.length} class(es) assigned
              </p>
            )}
          </div>

          {/* Subjects */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Subjects
                <span className="text-xs text-gray-400 ml-1">
                  (Shows subjects for selected classes)
                </span>
              </label>
              {filteredSubjects.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllSubjects}
                  className="text-xs text-primary-600 hover:underline"
                >
                  {selectedSubjects.length === filteredSubjects.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {selectedClasses.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Select classes first to see subjects
                </p>
              ) : filteredSubjects.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No subjects available for selected classes
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredSubjects.map((sub) => (
                    <label
                      key={sub.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition ${
                        selectedSubjects.includes(sub.id)
                          ? "bg-primary-50 border-primary-300"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(sub.id)}
                        onChange={() => toggleSubject(sub.id)}
                        className="rounded text-primary-600"
                      />
                      <span className="text-sm">
                        {sub.name}
                        {sub.class?.name && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({sub.class.name})
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedSubjects.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedSubjects.length} subject(s) selected
              </p>
            )}
          </div>
        </div>

        {/* ─────────── Submit Buttons ─────────── */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            <FiSave size={18} />
            {loading
              ? "Saving..."
              : isEdit
              ? "Update Teacher"
              : "Save Teacher"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/teachers")}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditTeacher;

