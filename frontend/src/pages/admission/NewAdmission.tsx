import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

//////////////////////////////////////////////////////
// 📝 NEW ADMISSION PAGE
//////////////////////////////////////////////////////

export default function NewAdmission() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "MALE",
    dateOfBirth: "",
    classId: "",
    sectionId: "",
    academicYearId: "",
    fatherName: "",
    fatherPhone: "",
    motherName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    previousSchool: "",
    previousClass: "",
  });

  // Fetch classes, sections, and academic years
  useEffect(() => {
    axios.get("/api/class").then((res) => {
      setClasses(res.data?.data || res.data || []);
    }).catch(() => {});

    axios.get("/api/section").then((res) => {
      setSections(res.data?.data || res.data || []);
    }).catch(() => {});

    axios.get("/api/academic").then((res) => {
      const years = res.data?.data || res.data || [];
      setAcademicYears(years);
      // Auto-select active academic year
      const active = years.find((y: any) => y.isCurrent || y.isActive);
      if (active) {
        setForm((prev) => ({ ...prev, academicYearId: active.id }));
      }
    }).catch(() => {});
  }, []);

  const updateForm = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.fatherName || !form.fatherPhone) {
      alert("Please fill all required fields (Name, DOB, Father's Name, Father's Phone)");
      return;
    }
    if (!form.classId || !form.sectionId) {
      alert("Please select Class and Section");
      return;
    }
    if (!form.academicYearId) {
      alert("Please select Academic Year");
      return;
    }

    setSaving(true);
    try {
      // Format data as backend expects
      const payload = {
        student: {
          firstName: form.firstName,
          lastName: form.lastName,
          gender: form.gender,
          dob: form.dateOfBirth,
          fatherName: form.fatherName,
          fatherPhone: form.fatherPhone,
          motherName: form.motherName || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          pincode: form.pincode || undefined,
          previousSchool: form.previousSchool || undefined,
          previousClass: form.previousClass || undefined,
        },
        classId: form.classId,
        sectionId: form.sectionId,
        academicYearId: form.academicYearId,
        feeAmount: 0,
        feeStructureId: undefined,
      };

      await axios.post("/api/admission", payload);
      alert("✅ Student Created Successfully!");
      navigate("/admissions");
    } catch (error: any) {
      console.error("Admission error:", error);
      const msg = error?.response?.data?.message || "Failed to submit admission";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">New Admission</h1>
        <button onClick={() => navigate("/admissions")} className="text-gray-600 hover:text-gray-800 text-sm">
          ← Back to list
        </button>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-indigo-600" : "bg-gray-200"}`} />}
          </div>
        ))}
        <span className="text-sm text-gray-500 ml-2">
          {step === 1 ? "Personal Details" : step === 2 ? "Academic Info" : "Address & Previous School"}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-3xl">
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input type="text" value={form.firstName} onChange={(e) => updateForm("firstName", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input type="text" value={form.lastName} onChange={(e) => updateForm("lastName", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select value={form.gender} onChange={(e) => updateForm("gender", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => updateForm("dateOfBirth", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name *</label>
                <input type="text" value={form.fatherName} onChange={(e) => updateForm("fatherName", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Phone *</label>
                <input type="tel" value={form.fatherPhone} onChange={(e) => updateForm("fatherPhone", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                <input type="text" value={form.motherName} onChange={(e) => updateForm("motherName", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select value={form.classId} onChange={(e) => updateForm("classId", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Class</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                <select value={form.sectionId} onChange={(e) => updateForm("sectionId", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Section</option>
                  {sections
                    .filter((s: any) => !form.classId || s.classId === form.classId)
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <select value={form.academicYearId} onChange={(e) => updateForm("academicYearId", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Year</option>
                  {academicYears.map((y: any) => (
                    <option key={y.id} value={y.id}>{y.name} {y.isCurrent ? "(Current)" : ""}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={form.address} onChange={(e) => updateForm("address", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" value={form.city} onChange={(e) => updateForm("city", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" value={form.state} onChange={(e) => updateForm("state", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input type="text" value={form.pincode} onChange={(e) => updateForm("pincode", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous School</label>
                <input type="text" value={form.previousSchool} onChange={(e) => updateForm("previousSchool", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? "Submitting..." : "Submit Admission"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
