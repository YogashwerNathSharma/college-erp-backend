import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { X, User, GraduationCap, Users } from "lucide-react";
import type { Student, StudentFormData, Class, Section } from "./students.types";

const API_BASE = "http://localhost:5000";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student?: Student | null; // If provided, opens in Edit mode
}

const initialFormData: StudentFormData = {
  firstName: "",
  lastName: "",
  gender: "MALE",
  dob: "",
  email: "",
  phone: "",
  address: "",
  admissionNo: "",
  rollNumber: "",
  classId: "",
  sectionId: "",
  fatherName: "",
  motherName: "",
  parentPhone: "",
};

type FormSection = "personal" | "academic" | "parent";

const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  student,
}) => {
  const [formData, setFormData] = useState<StudentFormData>(initialFormData);
  const [classes, setClasses] = useState<Class[]>([]);
  const [activeSection, setActiveSection] = useState<FormSection>("personal");
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);

  const isEditMode = Boolean(student);

  const getToken = () => localStorage.getItem("token") || "";

  // Fetch classes for dropdown
  const fetchClasses = useCallback(async () => {
    setClassesLoading(true);
    try {
      const res = await axios.get<ApiResponse<Class[]>>(`${API_BASE}/api/class`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data.success) {
        setClasses(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    } finally {
      setClassesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      if (student) {
        const enrollment = student.enrollments?.[0];
        setFormData({
          firstName: student.firstName,
          lastName: student.lastName,
          gender: student.gender,
          dob: student.dob ? student.dob.split("T")[0] : "",
          email: student.email,
          phone: student.phone,
          address: student.address,
          admissionNo: student.admissionNo,
          rollNumber: student.rollNumber || "",
          classId: enrollment?.classId || "",
          sectionId: enrollment?.sectionId || "",
          fatherName: student.fatherName,
          motherName: student.motherName,
          parentPhone: student.parentPhone,
        });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
      setActiveSection("personal");
    }
  }, [isOpen, student, fetchClasses]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "classId" ? { sectionId: "" } : {}),
    }));
    if (errors[name as keyof StudentFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StudentFormData, string>> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.admissionNo.trim()) newErrors.admissionNo = "Admission No is required";
    if (!formData.classId) newErrors.classId = "Class is required";
    if (!formData.sectionId) newErrors.sectionId = "Section is required";
    if (!formData.fatherName.trim()) newErrors.fatherName = "Father's name is required";
    if (!formData.parentPhone.trim()) newErrors.parentPhone = "Parent phone is required";

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone must be 10 digits";
    }

    setErrors(newErrors);

    // Navigate to the section with the first error
    if (Object.keys(newErrors).length > 0) {
      const personalFields: (keyof StudentFormData)[] = [
        "firstName", "lastName", "gender", "dob", "email", "phone", "address",
      ];
      const academicFields: (keyof StudentFormData)[] = [
        "admissionNo", "rollNumber", "classId", "sectionId",
      ];
      const firstErrorKey = Object.keys(newErrors)[0] as keyof StudentFormData;

      if (personalFields.includes(firstErrorKey)) setActiveSection("personal");
      else if (academicFields.includes(firstErrorKey)) setActiveSection("academic");
      else setActiveSection("parent");
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.rollNumber) delete payload.rollNumber;

      if (isEditMode && student) {
        await axios.put(`${API_BASE}/api/students/${student.id}`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
      } else {
        await axios.post(`${API_BASE}/api/students`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || "Something went wrong";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === formData.classId);
  const sections = selectedClass?.sections || [];

  if (!isOpen) return null;

  const sectionTabs: { key: FormSection; label: string; icon: React.ReactNode }[] = [
    { key: "personal", label: "Personal Info", icon: <User size={16} /> },
    { key: "academic", label: "Academic Info", icon: <GraduationCap size={16} /> },
    { key: "parent", label: "Parent Info", icon: <Users size={16} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? "Edit Student" : "Add New Student"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {sectionTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === tab.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Personal Info Section */}
          {activeSection === "personal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                required
              />
              <FormField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.gender ? "border-red-400" : "border-gray-200"
                  }`}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                )}
              </div>
              <FormField
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                error={errors.dob}
                required
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />
              <FormField
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
                placeholder="10-digit phone number"
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Full address"
                />
              </div>
            </div>
          )}

          {/* Academic Info Section */}
          {activeSection === "academic" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Admission No"
                name="admissionNo"
                value={formData.admissionNo}
                onChange={handleChange}
                error={errors.admissionNo}
                required
              />
              <FormField
                label="Roll Number"
                name="rollNumber"
                value={formData.rollNumber || ""}
                onChange={handleChange}
                placeholder="Optional"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleChange}
                  disabled={classesLoading}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.classId ? "border-red-400" : "border-gray-200"
                  }`}
                >
                  <option value="">
                    {classesLoading ? "Loading..." : "Select Class"}
                  </option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                {errors.classId && (
                  <p className="text-red-500 text-xs mt-1">{errors.classId}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section <span className="text-red-500">*</span>
                </label>
                <select
                  name="sectionId"
                  value={formData.sectionId}
                  onChange={handleChange}
                  disabled={!formData.classId}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.sectionId ? "border-red-400" : "border-gray-200"
                  }`}
                >
                  <option value="">
                    {!formData.classId ? "Select class first" : "Select Section"}
                  </option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
                {errors.sectionId && (
                  <p className="text-red-500 text-xs mt-1">{errors.sectionId}</p>
                )}
              </div>
            </div>
          )}

          {/* Parent Info Section */}
          {activeSection === "parent" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Father's Name"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                error={errors.fatherName}
                required
              />
              <FormField
                label="Mother's Name"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
                error={errors.motherName}
              />
              <FormField
                label="Parent Phone"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                error={errors.parentPhone}
                required
                placeholder="10-digit phone number"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading
              ? "Saving..."
              : isEditMode
              ? "Update Student"
              : "Add Student"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- Reusable Form Field Component ----
interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  required,
  placeholder,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        error ? "border-red-400" : "border-gray-200"
      }`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export default AddStudentModal;