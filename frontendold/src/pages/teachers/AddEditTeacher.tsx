
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSave } from "react-icons/fi";

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

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Options from DB
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]); // all subjects from API
  const [filteredSubjects, setFilteredSubjects] = useState<SubjectOption[]>([]); // filtered by selected classes
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fetch dropdown options from database
  const fetchOptions = async () => {
    try {
      const [subRes, classRes, yearRes] = await Promise.all([
        axios.get("/api/subjects"),
        axios.get("/api/class"),
        axios.get("/api/academic"),
      ]);

      // Subjects (store all, filter later based on selected classes)
      const subs = subRes.data.data?.data || subRes.data.data || [];
      setAllSubjects(Array.isArray(subs) ? subs : []);

      // Classes
      const cls = classRes.data.data?.data || classRes.data.data || [];
      setClasses(Array.isArray(cls) ? cls : []);

      // Academic Years
      const years = yearRes.data.data?.data || yearRes.data.data || [];
      const yearArray = Array.isArray(years) ? years : [];
      setAcademicYears(yearArray);

      // Auto-select active year if creating new teacher
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

  // Filter subjects whenever selected classes change
  useEffect(() => {
    if (selectedClasses.length === 0) {
      setFilteredSubjects([]);
      return;
    }
    const filtered = allSubjects.filter((s) =>
      selectedClasses.includes(s.classId)
    );
    setFilteredSubjects(filtered);

    // Remove any selected subjects that are no longer in filtered list
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
        setName(t.name || "");
        setEmail(t.email || "");
        setPhone(t.phone || "");
        setAcademicYearId(t.academicYearId || "");
        setSelectedSubjects(
          t.subjects?.map((s: any) => s.id || s.subjectId) || []
        );
        setSelectedClasses(
          t.classes?.map((c: any) => c.id || c.classId) || []
        );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) return toast.error("Name is required");
    if (!email.trim()) return toast.error("Email is required");
    if (!phone.trim()) return toast.error("Phone is required");
    if (!academicYearId) return toast.error("Academic Year is required");
    if (selectedClasses.length === 0)
      return toast.error("Please assign at least one class");

    setLoading(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      academicYearId,
      subjectIds: selectedSubjects,
      classIds: selectedClasses,
    };

    try {
      let res;
      if (isEdit) {
        res = await axios.put(`/api/teacher/${id}`, payload);
      } else {
        res = await axios.post("/api/teacher", payload);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
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
        className="bg-white rounded-lg shadow p-6 space-y-5"
      >
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter teacher's full name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Academic Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year <span className="text-red-500">*</span>
          </label>
          <select
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">Select Academic Year</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        {/* Classes - Multi Select (SELECT FIRST) */}
        <div>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

        {/* Subjects - Multi Select (DEPENDENT ON CLASSES) */}
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
                className="text-xs text-blue-600 hover:underline"
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
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(sub.id)}
                      onChange={() => toggleSubject(sub.id)}
                      className="rounded text-blue-600"
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

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <FiSave size={18} />
            {loading
              ? "Saving..."
              : isEdit
              ? "Update Teacher"
              : "Create Teacher"}
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

