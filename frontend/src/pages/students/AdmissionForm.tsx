import { useState, useEffect, useRef, useCallback } from "react";


import { useNavigate } from "react-router-dom";


import axios from "axios";


import { getFullUrl } from "../../utils/url";


import toast from "react-hot-toast";


import {


  User,


  GraduationCap,


  Users,


  MapPin,


  Plus,


  ChevronLeft,


  ChevronRight,


  Check,


  Upload,


  X,


  Camera,


  FileText,


  Heart,


  Bus,


  Home,


  Edit3,


  Save,


  Trash2,


} from "lucide-react";


import PageHeader from "../../components/enterprise/PageHeader";


import LoadingSkeleton from "../../components/enterprise/LoadingSkeleton";





// ═══════════════════════════════════════════════════════


// TYPES


// ═══════════════════════════════════════════════════════





interface DropdownItem {


  id: string;


  name: string;


}





interface FormDataType {


  // Step 1 - Personal


  firstName: string;


  middleName: string;


  lastName: string;


  gender: string;


  dob: string;


  bloodGroup: string;


  religion: string;


  category: string;


  nationality: string;


  motherTongue: string;


  aadhaarNumber: string;


  email: string;


  mobile: string;


  emergencyContact: string;


  identificationMarks: string;





  // Step 2 - Academic


  admissionNo: string;


  admissionDate: string;


  academicYearId: string;


  classId: string;


  sectionId: string;


  rollNumber: string;


  previousSchool: string;


  previousClass: string;


  previousResult: string;


  medium: string;


  stream: string;


  group: string;





  // Step 3 - Parent/Guardian


  fatherName: string;


  fatherPhone: string;


  fatherOccupation: string;


  fatherQualification: string;


  fatherEmail: string;


  motherName: string;


  motherPhone: string;


  motherOccupation: string;


  motherQualification: string;


  motherEmail: string;


  guardianName: string;


  guardianPhone: string;


  guardianRelation: string;


  guardianAddress: string;


  annualIncome: string;





  // Step 4 - Address


  permanentAddress: string;


  permanentCity: string;


  permanentState: string;


  permanentDistrict: string;


  permanentPinCode: string;


  permanentCountry: string;


  sameAsPermanent: boolean;


  correspondenceAddress: string;


  correspondenceCity: string;


  correspondenceState: string;


  correspondenceDistrict: string;


  correspondencePinCode: string;


  correspondenceCountry: string;





  // Step 5 - Additional


  transportRoute: string;


  transportPickupPoint: string;


  hostelName: string;


  hostelRoom: string;


  medicalConditions: string[];


  allergies: string[];


  height: string;


  weight: string;


}





// ═══════════════════════════════════════════════════════


// CONSTANTS


// ═══════════════════════════════════════════════════════





const STEPS = [


  { id: 1, title: "Personal", icon: User },


  { id: 2, title: "Academic", icon: GraduationCap },


  { id: 3, title: "Parents", icon: Users },


  { id: 4, title: "Address", icon: MapPin },


  { id: 5, title: "Additional", icon: Plus },


  { id: 6, title: "Review", icon: Check },


];








// Categories, Blood Groups, Religions etc. are fetched from master data API





const DRAFT_KEY = "admission_form_draft";





const inputClasses =


  "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm";


const labelClasses =


  "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";


const sectionClasses =


  "bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8";





const authHeaders = () => ({


  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },


});





// ═══════════════════════════════════════════════════════


// COMPONENT


// ═══════════════════════════════════════════════════════








const getDefaultFormData = (): FormDataType => ({


  firstName: "",


  middleName: "",


  lastName: "",


  gender: "",


  dob: "",


  bloodGroup: "",


  religion: "",


  category: "",


  nationality: "Indian",


  motherTongue: "",


  aadhaarNumber: "",


  email: "",


  mobile: "",


  emergencyContact: "",


  identificationMarks: "",


  admissionNo: "",


  admissionDate: new Date().toISOString().split("T")[0],


  academicYearId: "",


  classId: "",


  sectionId: "",


  rollNumber: "",


  previousSchool: "",


  previousClass: "",


  previousResult: "",


  medium: "",


  stream: "",


  group: "",


  fatherName: "",


  fatherPhone: "",


  fatherOccupation: "",


  fatherQualification: "",


  fatherEmail: "",


  motherName: "",


  motherPhone: "",


  motherOccupation: "",


  motherQualification: "",


  motherEmail: "",


  guardianName: "",


  guardianPhone: "",


  guardianRelation: "",


  guardianAddress: "",


  annualIncome: "",


  permanentAddress: "",


  permanentCity: "",


  permanentState: "",


  permanentDistrict: "",


  permanentPinCode: "",


  permanentCountry: "India",


  sameAsPermanent: false,


  correspondenceAddress: "",


  correspondenceCity: "",


  correspondenceState: "",


  correspondenceDistrict: "",


  correspondencePinCode: "",


  correspondenceCountry: "India",


  transportRoute: "",


  transportPickupPoint: "",


  hostelName: "",


  hostelRoom: "",


  medicalConditions: [],


  allergies: [],


  height: "",


  weight: "",


});





export default function AdmissionForm() {


  const navigate = useNavigate();


  const [currentStep, setCurrentStep] = useState(1);

  // Master data from database
  const [CATEGORIES, setCategories] = useState<string[]>([]);
  const [BLOOD_GROUPS, setBloodGroups] = useState<string[]>([]);
  const [RELIGIONS, setReligions] = useState<string[]>([]);
  const [CASTES, setCastes] = useState<string[]>([]);
  const [NATIONALITIES, setNationalities] = useState<string[]>([]);



  const [loading, setLoading] = useState(false);


  const [submitting, setSubmitting] = useState(false);


  const [errors, setErrors] = useState<Record<string, string>>({});





  // Photo


  const [photoPreview, setPhotoPreview] = useState<string | null>(null);


  const [photoFile, setPhotoFile] = useState<File | null>(null);


  const [fatherPhotoFile, setFatherPhotoFile] = useState<File | null>(null);


  const [fatherPhotoPreview, setFatherPhotoPreview] = useState<string | null>(null);


  const photoInputRef = useRef<HTMLInputElement>(null);


  const fatherPhotoRef = useRef<HTMLInputElement>(null);





  // Documents


  const [documents, setDocuments] = useState<{ file: File; type: string; name: string }[]>([]);


  const docInputRef = useRef<HTMLInputElement>(null);





  // Dropdowns


  const [academicYears, setAcademicYears] = useState<DropdownItem[]>([]);


  const [classes, setClasses] = useState<DropdownItem[]>([]);


  const [sections, setSections] = useState<DropdownItem[]>([]);


  const [routes, setRoutes] = useState<DropdownItem[]>([]);


  const [pickupPoints, setPickupPoints] = useState<DropdownItem[]>([]);


  const [hostels, setHostels] = useState<DropdownItem[]>([]);





  // Tag inputs


  // Optional section toggles


  const [showTransport, setShowTransport] = useState(false);


  const [showHostel, setShowHostel] = useState(false);





  const [conditionInput, setConditionInput] = useState("");


  const [allergyInput, setAllergyInput] = useState("");





  // Admission number edit


  const [admissionNoEditable, setAdmissionNoEditable] = useState(false);





  // Form data


  const [formData, setFormData] = useState<FormDataType>(() => {


    const draft = localStorage.getItem(DRAFT_KEY);


    if (draft) {


      try {


        const parsed = JSON.parse(draft);


        // Merge with defaults to handle missing fields from old drafts


        return { ...getDefaultFormData(), ...parsed, medicalConditions: parsed.medicalConditions || [], allergies: parsed.allergies || [] };


      } catch {


        // ignore


      }


    }


    return getDefaultFormData();


  });





  // ─── Autosave Draft ───


  // ✅ Regenerate admission number when academic year changes
  useEffect(() => {
    if (formData.academicYearId) {
      const generateAdmissionNo = async () => {
        try {
          const res = await axios.get(
            getFullUrl(`/api/students/next-admission-no?academicYearId=${formData.academicYearId}`),
            authHeaders()
          );
          if (res.data?.admissionNo) {
            setFormData((prev) => ({
              ...prev,
              admissionNo: res.data.admissionNo,
            }));
          }
        } catch (err) {
          // console.error("Error generating admission number:", err);
        }
      };
      generateAdmissionNo();
    }
  }, [formData.academicYearId]);

  useEffect(() => {


    const timer = setTimeout(() => {


      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));


    }, 1000);


    return () => clearTimeout(timer);


  }, [formData]);





  
  // ─── Fetch Master Data from DB ───
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [catRes, bgRes, relRes, casRes, natRes] = await Promise.all([
          axios.get(getFullUrl("/api/masters/category-master/dropdown"), authHeaders()).catch(() => ({data:{data:[]}})),
          axios.get(getFullUrl("/api/masters/blood-group-master/dropdown"), authHeaders()).catch(() => ({data:{data:[]}})),
          axios.get(getFullUrl("/api/masters/religion-master/dropdown"), authHeaders()).catch(() => ({data:{data:[]}})),
          axios.get(getFullUrl("/api/masters/caste-master/dropdown"), authHeaders()).catch(() => ({data:{data:[]}})),
          axios.get(getFullUrl("/api/masters/nationality-master/dropdown"), authHeaders()).catch(() => ({data:{data:[]}})),
        ]);
        setCategories((catRes?.data?.data || []).map((c: any) => c.name));
        setBloodGroups((bgRes?.data?.data || []).map((c: any) => c.name));
        setReligions((relRes?.data?.data || []).map((c: any) => c.name));
        setCastes((casRes?.data?.data || []).map((c: any) => c.name));
        setNationalities((natRes?.data?.data || []).map((c: any) => c.name));
      } catch (e) {
        console.error("Failed to fetch master data:", e);
      }
    };
    fetchMasterData();
  }, []);

// ─── Fetch Dropdowns ───


  useEffect(() => {


    const fetchData = async () => {


      setLoading(true);


      try {


        const [yearRes, classRes] = await Promise.all([


          axios.get(getFullUrl("/api/academic"), authHeaders()).catch(() => ({ data: { data: [] } })),


          axios.get(getFullUrl("/api/class"), authHeaders()).catch(() => ({ data: { data: [] } })),


        ]);


        setAcademicYears(yearRes.data?.data || yearRes.data || []);


        setClasses(classRes.data?.data || classRes.data || []);





        // Auto-generate admission number


        try {


          const admRes = await axios.get(getFullUrl("/api/students/next-admission-no"), authHeaders());


          if (admRes.data?.admissionNo) {


            setFormData((prev) => ({ ...prev, admissionNo: admRes.data.admissionNo }));


          }


        } catch {


          // Will be filled manually


        }





        // ✅ Auto-generate initial admission number
        if (yearRes.data?.data?.length > 0) {
          const firstYear = yearRes.data.data[0];
          if (firstYear?.id) {
            try {
              const admRes = await axios.get(
                getFullUrl(`/api/students/next-admission-no?academicYearId=${firstYear.id}`),
                authHeaders()
              );
              if (admRes.data?.admissionNo) {
                setFormData((prev) => ({
                  ...prev,
                  admissionNo: admRes.data.admissionNo,
                  academicYearId: firstYear.id,
                }));
              }
            } catch (err) {
              // Will be generated when user selects year
            }
          }
        }

        // Transport routes


        try {


          const routeRes = await axios.get(getFullUrl("/api/transport/routes"), authHeaders());


          setRoutes(routeRes.data?.data || []);


        } catch {


          // optional


        }





        // Hostels


        try {


          const hostelRes = await axios.get(getFullUrl("/api/hostel"), authHeaders());


          setHostels(hostelRes.data?.data || []);


        } catch {


          // optional


        }


      } catch (err) {


        console.error("Failed to fetch dropdown data:", err);


      } finally {


        setLoading(false);


      }


    };


    fetchData();


  }, []);





  // Fetch sections when class changes


  useEffect(() => {


    if (formData.classId) {


      axios


        .get(getFullUrl(`/api/section?classId=${formData.classId}`), authHeaders())


        .then((res) => setSections(res.data?.data || res.data || []))


        .catch(() => setSections([]));


    } else {


      setSections([]);


    }


  }, [formData.classId]);





  // Fetch pickup points when route changes


  useEffect(() => {


    if (formData.transportRoute) {


      axios


        .get(getFullUrl(`/api/transport/stops/route/${formData.transportRoute}`), authHeaders())


        .then((res) => setPickupPoints(res.data?.data || []))


        .catch(() => setPickupPoints([]));


    } else {


      setPickupPoints([]);


    }


  }, [formData.transportRoute]);





  // Same as permanent logic


  useEffect(() => {


    if (formData.sameAsPermanent) {


      setFormData((prev) => ({


        ...prev,


        correspondenceAddress: prev.permanentAddress,


        correspondenceCity: prev.permanentCity,


        correspondenceState: prev.permanentState,


        correspondenceDistrict: prev.permanentDistrict,


        correspondencePinCode: prev.permanentPinCode,


        correspondenceCountry: prev.permanentCountry,


      }));


    }


  }, [


    formData.sameAsPermanent,


    formData.permanentAddress,


    formData.permanentCity,


    formData.permanentState,


    formData.permanentDistrict,


    formData.permanentPinCode,


    formData.permanentCountry,


  ]);





  // ─── Handlers ───


  const handleChange = (


    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>


  ) => {


    const { name, value, type } = e.target;


    // Restrict phone/aadhar fields to digits only
    const phoneFields = ["mobile", "fatherPhone", "motherPhone", "guardianPhone", "emergencyContact"];
    const aadharFields = ["aadhaarNumber"];
    
    let finalValue: string | boolean = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    if (phoneFields.includes(name)) {
      finalValue = value.replace(/\D/g, "").slice(0, 10);
    } else if (aadharFields.includes(name)) {
      finalValue = value.replace(/\D/g, "").slice(0, 12);
    }


    setFormData((prev) => ({ ...prev, [name]: finalValue }));


    // Clear error and validate on change
    if (errors[name]) {


      setErrors((prev) => {


        const copy = { ...prev };


        delete copy[name];


        return copy;


      });


    }


  };





  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {


    const file = e.target.files?.[0];


    if (!file) return;


    if (file.size > 2 * 1024 * 1024) {


      toast.error("Photo must not exceed 2MB");


      return;


    }


    setPhotoFile(file);


    const reader = new FileReader();


    reader.onload = () => setPhotoPreview(reader.result as string);


    reader.readAsDataURL(file);


  };





  const handleFatherPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {


    const file = e.target.files?.[0];


    if (!file) return;


    if (file.size > 2 * 1024 * 1024) {


      toast.error("Photo must not exceed 2MB");


      return;


    }


    setFatherPhotoFile(file);


    const reader = new FileReader();


    reader.onload = () => setFatherPhotoPreview(reader.result as string);


    reader.readAsDataURL(file);


  };





  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {


    const files = e.target.files;


    if (!files) return;


    Array.from(files).forEach((file) => {


      if (file.size > 5 * 1024 * 1024) {


        toast.error(`${file.name} exceeds 5MB limit`);


        return;


      }


      setDocuments((prev) => [...prev, { file, type: "other", name: file.name }]);


    });


    if (docInputRef.current) docInputRef.current.value = "";


  };





  const removeDocument = (index: number) => {


    setDocuments((prev) => prev.filter((_, i) => i !== index));


  };





  const addTag = (field: "medicalConditions" | "allergies", value: string) => {


    if (!value.trim()) return;


    setFormData((prev) => ({


      ...prev,


      [field]: [...prev[field], value.trim()],


    }));


    if (field === "medicalConditions") setConditionInput("");


    else setAllergyInput("");


  };





  const removeTag = (field: "medicalConditions" | "allergies", index: number) => {


    setFormData((prev) => ({


      ...prev,


      [field]: prev[field].filter((_, i) => i !== index),


    }));


  };





  // ─── Validation ───


  const validateStep = useCallback(


    (step: number): boolean => {


      const newErrors: Record<string, string> = {};





      if (step === 1) {


        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";


        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";


        if (!formData.gender) newErrors.gender = "Gender is required";


        if (!formData.dob) newErrors.dob = "Date of birth is required";


        if (formData.mobile && formData.mobile.length !== 10) newErrors.mobile = "Mobile must be exactly 10 digits";


        if (formData.aadhaarNumber && formData.aadhaarNumber.length !== 12) newErrors.aadhaarNumber = "Aadhaar must be exactly 12 digits";


        if (formData.emergencyContact && formData.emergencyContact.length !== 10) newErrors.emergencyContact = "Phone must be exactly 10 digits";


      }





      if (step === 2) {


        if (!formData.admissionDate) newErrors.admissionDate = "Admission date is required";


        if (!formData.academicYearId) newErrors.academicYearId = "Academic year is required";


        if (!formData.classId) newErrors.classId = "Class is required";


      }





      if (step === 3) {


        if (!formData.fatherName.trim()) newErrors.fatherName = "Father's name is required";


        if (!formData.fatherPhone.trim()) newErrors.fatherPhone = "Father's phone is required";


        else if (formData.fatherPhone.length !== 10) newErrors.fatherPhone = "Phone must be exactly 10 digits";


        if (formData.motherPhone && formData.motherPhone.length !== 10) newErrors.motherPhone = "Phone must be exactly 10 digits";


        if (formData.guardianPhone && formData.guardianPhone.length !== 10) newErrors.guardianPhone = "Phone must be exactly 10 digits";


      }





      setErrors(newErrors);


      return Object.keys(newErrors).length === 0;


    },


    [formData]


  );





  const goNext = () => {


    if (validateStep(currentStep)) {


      setCurrentStep((prev) => Math.min(prev + 1, 6));


    } else {


      toast.error("Please fill in all required fields");


    }


  };





  const goPrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));





  // ─── Submit ───


  const handleSubmit = async () => {


    console.log("[Admission] Submit clicked! formData:", { firstName: formData.firstName, classId: formData.classId, academicYearId: formData.academicYearId, sectionId: formData.sectionId });


    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {


      toast.error("Please complete all required fields");


      return;


    }





    // Extra safety: ensure critical IDs are present


    if (!formData.classId || !formData.academicYearId) {


      toast.error("Class and Academic Year are required");


      return;


    }





    setSubmitting(true);


    try {


      // Step 1: Create student with JSON payload


      const jsonPayload = {


        firstName: formData.firstName,


        lastName: formData.lastName,


        gender: formData.gender || "Male",


        dob: formData.dob,


        email: formData.email || "",


        phone: formData.mobile || "",


        address: formData.permanentAddress || "N/A",


        admissionNo: formData.admissionNo || "",


        bloodGroup: formData.bloodGroup || "",


        religion: formData.religion || "",


        caste: formData.category || "",


        category: formData.category || "",


        nationality: formData.nationality || "Indian",


        aadharNo: formData.aadhaarNumber || "",


        fatherName: formData.fatherName || "N/A",


        fatherPhone: formData.fatherPhone || "",


        fatherOccupation: formData.fatherOccupation || "",


        motherName: formData.motherName || "N/A",


        motherPhone: formData.motherPhone || "",


        motherOccupation: formData.motherOccupation || "",


        guardianName: formData.guardianName || undefined,


        guardianPhone: formData.guardianPhone || undefined,


        guardianRelation: formData.guardianRelation || undefined,


        classId: formData.classId,


        sectionId: formData.sectionId || undefined,


        academicYearId: formData.academicYearId,


        rollNumber: formData.rollNumber || undefined,


      };





      const res = await axios.post(getFullUrl("/api/students"), jsonPayload, authHeaders());


      const studentId = res.data?.data?.student?.id || res.data?.data?.id;





      // Step 2: Upload photo if provided


      if (photoFile && studentId) {


        const photoFormData = new FormData();


        photoFormData.append("photo", photoFile);


        await axios.post(getFullUrl(`/api/students/${studentId}/photo`), photoFormData, {


          headers: {


            Authorization: `Bearer ${localStorage.getItem("token")}`,


            "Content-Type": "multipart/form-data",


          },


        }).catch(() => {}); // Photo upload is optional, don't block admission


      }





      toast.success("Student admitted successfully!");


      localStorage.removeItem(DRAFT_KEY);


      // Small delay so user sees the success toast before redirect


      setTimeout(() => navigate("/students"), 1000);


    } catch (err: any) {


      console.error("Admission submit error:", err.response?.data || err.message || err);


      const msg = err.response?.data?.message || err.message || "Failed to submit admission form";


      toast.error(msg);


      toast.error("Check console (F12) for details", { duration: 5000 });


    } finally {


      setSubmitting(false);


    }


  };





  // ─── Photo Drop Handler ───


  const handlePhotoDrop = (e: React.DragEvent) => {


    e.preventDefault();


    const file = e.dataTransfer.files?.[0];


    if (!file || !file.type.startsWith("image/")) {


      toast.error("Please drop an image file");


      return;


    }


    if (file.size > 2 * 1024 * 1024) {


      toast.error("Photo must not exceed 2MB");


      return;


    }


    setPhotoFile(file);


    const reader = new FileReader();


    reader.onload = () => setPhotoPreview(reader.result as string);


    reader.readAsDataURL(file);


  };





  if (loading) {


    return (


      <div className="p-6">


        <LoadingSkeleton variant="card" count={4} />


      </div>


    );


  }





  // ═══════════════════════════════════════════════════════


  // RENDER HELPERS


  // ═══════════════════════════════════════════════════════





  const renderInput = (


    label: string,


    name: keyof FormDataType,


    opts?: {


      type?: string;


      placeholder?: string;


      required?: boolean;


      disabled?: boolean;


      maxLength?: number;


      minLength?: number;


      numbersOnly?: boolean;


    }


  ) => (


    <div>


      <label className={labelClasses}>


        {label}


        {opts?.required && <span className="text-red-500 ml-1">*</span>}


      </label>


      <input


        type={opts?.type || "text"}


        name={name}


        value={formData[name] as string}


        onChange={handleChange}


        placeholder={opts?.placeholder || ""}


        disabled={opts?.disabled}


        maxLength={opts?.maxLength}


        onKeyDown={opts?.numbersOnly ? (e) => { if (!/[0-9]|Backspace|Tab|Delete|Arrow/.test(e.key)) e.preventDefault(); } : undefined}


        onBlur={() => {
          if (opts?.minLength && (formData[name] as string)?.length > 0 && (formData[name] as string).length < opts.minLength) {
            setErrors((prev) => ({ ...prev, [name]: `Must be exactly ${opts.minLength} digits` }));
          }
        }}


        className={`${inputClasses} ${errors[name] ? "border-red-400 dark:border-red-500 ring-1 ring-red-400" : ""}`}


      />


      {errors[name] && (


        <p className="text-xs text-red-500 mt-1">{errors[name]}</p>


      )}


    </div>


  );





  const renderSelect = (


    label: string,


    name: keyof FormDataType,


    options: DropdownItem[] | string[] | any,


    opts?: { required?: boolean; placeholder?: string }


  ) => (


    <div>


      <label className={labelClasses}>


        {label}


        {opts?.required && <span className="text-red-500 ml-1">*</span>}


      </label>


      <select


        name={name}


        value={formData[name] as string}


        onChange={handleChange}


        className={`${inputClasses} ${errors[name] ? "border-red-400 dark:border-red-500 ring-1 ring-red-400" : ""}`}


      >


        <option value="">{opts?.placeholder || `Select ${label}`}</option>


        {(Array.isArray(options) ? options : []).map((opt) =>


          typeof opt === "string" ? (


            <option key={opt} value={opt}>


              {opt}


            </option>


          ) : (


            <option key={opt.id} value={opt.id}>


              {opt.name}


            </option>


          )


        )}


      </select>


      {errors[name] && (


        <p className="text-xs text-red-500 mt-1">{errors[name]}</p>


      )}


    </div>


  );





  // ═══════════════════════════════════════════════════════


  // STEP 1 - Personal Information


  // ═══════════════════════════════════════════════════════





  const renderStep1 = () => (


    <div className={sectionClasses}>


      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">


        <User className="w-5 h-5 text-indigo-500" />


        Personal Information


      </h3>





      {/* Photo Upload */}


      <div className="flex justify-center mb-8">


        <div


          className="relative w-32 h-32 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors overflow-hidden group"


          onClick={() => photoInputRef.current?.click()}


          onDrop={handlePhotoDrop}


          onDragOver={(e) => e.preventDefault()}


        >


          {photoPreview ? (


            <>


              <img


                src={photoPreview}


                alt="Student"


                className="w-full h-full object-cover"


              />


              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">


                <Camera className="w-6 h-6 text-white" />


              </div>


            </>


          ) : (


            <div className="text-center">


              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1" />


              <span className="text-xs text-slate-500 dark:text-slate-400">


                Drop photo


              </span>


            </div>


          )}


          <input


            ref={photoInputRef}


            type="file"


            accept="image/*"


            onChange={handlePhotoChange}


            className="hidden"


          />


        </div>


      </div>





      {/* Name Fields */}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">


        {renderInput("First Name", "firstName", { required: true, placeholder: "Enter first name" })}


        {renderInput("Middle Name", "middleName", { placeholder: "Enter middle name" })}


        {renderInput("Last Name", "lastName", { required: true, placeholder: "Enter last name" })}


      </div>





      {/* Gender */}


      <div className="mb-4">


        <label className={labelClasses}>


          Gender <span className="text-red-500">*</span>


        </label>


        <div className="flex gap-6">


          {["Male", "Female", "Other"].map((g) => (


            <label key={g} className="flex items-center gap-2 cursor-pointer">


              <input


                type="radio"


                name="gender"


                value={g}


                checked={formData.gender === g}


                onChange={handleChange}


                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"


              />


              <span className="text-sm text-slate-700 dark:text-slate-300">{g}</span>


            </label>


          ))}


        </div>


        {errors.gender && (


          <p className="text-xs text-red-500 mt-1">{errors.gender}</p>


        )}


      </div>





      {/* DOB + Blood Group */}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">


        {renderInput("Date of Birth", "dob", { type: "date", required: true })}


        {renderSelect("Blood Group", "bloodGroup", BLOOD_GROUPS)}


        {renderSelect("Religion", "religion", RELIGIONS)}


      </div>





      {/* Category + Nationality */}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">


        {renderSelect("Category", "category", CATEGORIES)}


        {renderSelect("Nationality", "nationality", NATIONALITIES.length > 0 ? NATIONALITIES : ["Indian"])}


        {renderInput("Mother Tongue", "motherTongue", { placeholder: "Mother tongue" })}


      </div>





      {/* Aadhaar + Contact */}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">


        {renderInput("Aadhaar Number", "aadhaarNumber", { placeholder: "12-digit Aadhaar", maxLength: 12, minLength: 12, numbersOnly: true })}


        {renderInput("Email", "email", { type: "email", placeholder: "student@email.com" })}


        {renderInput("Mobile", "mobile", { placeholder: "10-digit mobile", maxLength: 10, minLength: 10, numbersOnly: true })}


      </div>





      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">


        {renderInput("Emergency Contact", "emergencyContact", { placeholder: "10-digit phone", maxLength: 10, minLength: 10, numbersOnly: true })}


        <div>


          <label className={labelClasses}>Identification Marks</label>


          <textarea


            name="identificationMarks"


            value={formData.identificationMarks}


            onChange={handleChange}


            rows={2}


            placeholder="Any identification marks..."


            className={inputClasses}


          />


        </div>


      </div>


    </div>


  );





  // ═══════════════════════════════════════════════════════


  // STEP 2 - Academic Information


  // ═══════════════════════════════════════════════════════





  const renderStep2 = () => (


    <div className={sectionClasses}>


      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">


        <GraduationCap className="w-5 h-5 text-indigo-500" />


        Academic Information


      </h3>





      {/* Admission No */}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">


        <div>


          <label className={labelClasses}>


            Admission No <span className="text-red-500">*</span>


          </label>


          <div className="flex gap-2">


            <input


              type="text"


              name="admissionNo"


              value={formData.admissionNo}


              onChange={handleChange}


              disabled={!admissionNoEditable}


              className={`${inputClasses} flex-1 ${!admissionNoEditable ? "bg-slate-50 dark:bg-slate-600" : ""} ${errors.admissionNo ? "border-red-400 ring-1 ring-red-400" : ""}`}


              placeholder="Auto-generated"


            />


            <button


              type="button"


              onClick={() => setAdmissionNoEditable(!admissionNoEditable)}


              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"


              title={admissionNoEditable ? "Lock" : "Edit"}


            >


              <Edit3 className="w-4 h-4 text-slate-500" />


            </button>


          </div>


          {errors.admissionNo && (


            <p className="text-xs text-red-500 mt-1">{errors.admissionNo}</p>


          )}


        </div>


        {renderInput("Admission Date", "admissionDate", { type: "date", required: true })}


        {renderSelect("Academic Year", "academicYearId", academicYears, { required: true })}


      </div>





      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">


        {renderSelect("Class", "classId", classes, { required: true })}


        {renderSelect("Section", "sectionId", sections)}


        {renderInput("Roll Number", "rollNumber", { placeholder: "Roll number" })}


      </div>





      {/* Previous School Info */}


      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">


        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">


          Previous School Details


        </h4>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">


          {renderInput("Previous School", "previousSchool", { placeholder: "School name" })}


          {renderInput("Previous Class", "previousClass", { placeholder: "Class/Grade" })}


          {renderInput("Previous Result / %", "previousResult", { placeholder: "Result or percentage" })}


        </div>


      </div>





      {/* Medium, Stream, Group */}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


        {renderSelect("Medium", "medium", [


          { id: "English", name: "English" },


          { id: "Hindi", name: "Hindi" },


          { id: "Regional", name: "Regional" },


        ])}


        {renderSelect("Stream", "stream", [


          { id: "Science", name: "Science" },


          { id: "Commerce", name: "Commerce" },


          { id: "Arts", name: "Arts" },


          { id: "General", name: "General" },


        ])}


        {renderInput("Group", "group", { placeholder: "E.g. PCM, PCB" })}


      </div>


    </div>


  );





  // ═══════════════════════════════════════════════════════


  // STEP 3 - Parent/Guardian


  // ═══════════════════════════════════════════════════════





  const renderStep3 = () => (


    <div className={sectionClasses}>


      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">


        <Users className="w-5 h-5 text-indigo-500" />


        Parent / Guardian Information


      </h3>





      {/* Father */}


      <div className="mb-6">


        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wide">


          Father's Details


        </h4>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">


          {renderInput("Father's Name", "fatherName", { required: true, placeholder: "Full name" })}


          {renderInput("Phone", "fatherPhone", { required: true, placeholder: "10-digit phone", maxLength: 10, minLength: 10, numbersOnly: true })}


          {renderInput("Occupation", "fatherOccupation", { placeholder: "Occupation" })}


        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


          {renderInput("Qualification", "fatherQualification", { placeholder: "Education" })}


          {renderInput("Email", "fatherEmail", { type: "email", placeholder: "Email address" })}


          <div>


            <label className={labelClasses}>Photo</label>


            <div


              className="flex items-center gap-3 cursor-pointer"


              onClick={() => fatherPhotoRef.current?.click()}


            >


              {fatherPhotoPreview ? (


                <img


                  src={fatherPhotoPreview}


                  alt="Father"


                  className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"


                />


              ) : (


                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">


                  <Camera className="w-4 h-4 text-slate-400" />


                </div>


              )}


              <span className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">


                Upload photo


              </span>


            </div>


            <input


              ref={fatherPhotoRef}


              type="file"


              accept="image/*"


              onChange={handleFatherPhotoChange}


              className="hidden"


            />


          </div>


        </div>


      </div>





      {/* Mother */}


      <div className="mb-6 border-t border-slate-200 dark:border-slate-700 pt-4">


        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wide">


          Mother's Details


        </h4>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">


          {renderInput("Mother's Name", "motherName", { placeholder: "Full name" })}


          {renderInput("Phone", "motherPhone", { placeholder: "10-digit phone", maxLength: 10, minLength: 10, numbersOnly: true })}


          {renderInput("Occupation", "motherOccupation", { placeholder: "Occupation" })}


        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


          {renderInput("Qualification", "motherQualification", { placeholder: "Education" })}


          {renderInput("Email", "motherEmail", { type: "email", placeholder: "Email address" })}


        </div>


      </div>





      {/* Guardian */}


      <div className="mb-4 border-t border-slate-200 dark:border-slate-700 pt-4">


        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wide">


          Guardian Details (if applicable)


        </h4>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">


          {renderInput("Guardian Name", "guardianName", { placeholder: "Full name" })}


          {renderInput("Phone", "guardianPhone", { placeholder: "10-digit phone", maxLength: 10, minLength: 10, numbersOnly: true })}


          {renderInput("Relation", "guardianRelation", { placeholder: "E.g. Uncle, Aunt" })}


        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


          <div>


            <label className={labelClasses}>Guardian Address</label>


            <textarea


              name="guardianAddress"


              value={formData.guardianAddress}


              onChange={handleChange}


              rows={2}


              placeholder="Complete address"


              className={inputClasses}


            />


          </div>


          {renderInput("Annual Income", "annualIncome", { placeholder: "₹ Annual family income" })}


        </div>


      </div>


    </div>


  );





  // ═══════════════════════════════════════════════════════


  // STEP 4 - Address


  // ═══════════════════════════════════════════════════════





  const renderStep4 = () => (


    <div className={sectionClasses}>


      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">


        <MapPin className="w-5 h-5 text-indigo-500" />


        Address Details


      </h3>





      {/* Permanent Address */}


      <div className="mb-6">


        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wide">


          Permanent Address


        </h4>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">


          <div className="md:col-span-2">


            <label className={labelClasses}>Address Line</label>


            <textarea


              name="permanentAddress"


              value={formData.permanentAddress}


              onChange={handleChange}


              rows={2}


              placeholder="House No, Street, Landmark..."


              className={inputClasses}


            />


          </div>


        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">


          {renderInput("City", "permanentCity", { placeholder: "City / Town" })}


          {renderInput("State", "permanentState", { placeholder: "State" })}


          {renderInput("District", "permanentDistrict", { placeholder: "District" })}


        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


          {renderInput("Pin Code", "permanentPinCode", { placeholder: "6-digit PIN" })}


          {renderInput("Country", "permanentCountry", { placeholder: "Country" })}


        </div>


      </div>





      {/* Same As Permanent */}


      <div className="mb-6">


        <label className="flex items-center gap-3 cursor-pointer py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">


          <input


            type="checkbox"


            name="sameAsPermanent"


            checked={formData.sameAsPermanent}


            onChange={handleChange}


            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"


          />


          <span className="text-sm text-slate-700 dark:text-slate-300">


            Correspondence address same as permanent address


          </span>


        </label>


      </div>





      {/* Correspondence Address */}


      {!formData.sameAsPermanent && (


        <div>


          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wide">


            Correspondence Address


          </h4>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">


            <div className="md:col-span-2">


              <label className={labelClasses}>Address Line</label>


              <textarea


                name="correspondenceAddress"


                value={formData.correspondenceAddress}


                onChange={handleChange}


                rows={2}


                placeholder="House No, Street, Landmark..."


                className={inputClasses}


              />


            </div>


          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">


            {renderInput("City", "correspondenceCity", { placeholder: "City / Town" })}


            {renderInput("State", "correspondenceState", { placeholder: "State" })}


            {renderInput("District", "correspondenceDistrict", { placeholder: "District" })}


          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


            {renderInput("Pin Code", "correspondencePinCode", { placeholder: "6-digit PIN" })}


            {renderInput("Country", "correspondenceCountry", { placeholder: "Country" })}


          </div>


        </div>


      )}


    </div>


  );





  // ═══════════════════════════════════════════════════════


  // STEP 5 - Additional


  // ═══════════════════════════════════════════════════════





  const renderStep5 = () => (


    <div className="space-y-6">


      {/* Transport */}


      <div className={sectionClasses}>


        <label className="flex items-center gap-3 cursor-pointer">


          <input


            type="checkbox"


            checked={showTransport}


            onChange={(e) => {


              setShowTransport(e.target.checked);


              if (!e.target.checked) {


                setFormData((prev) => ({ ...prev, transportRoute: "", transportPickupPoint: "" }));


              }


            }}


            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"


          />


          <Bus className="w-4 h-4 text-indigo-500" />


          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Transport (Optional)</span>


        </label>


        {showTransport && (


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">


          {renderSelect("Route", "transportRoute", routes)}


          {renderSelect("Pickup Point", "transportPickupPoint", pickupPoints)}


        </div>


        )}


      </div>





      {/* Hostel */}


      <div className={sectionClasses}>


        <label className="flex items-center gap-3 cursor-pointer">


          <input


            type="checkbox"


            checked={showHostel}


            onChange={(e) => {


              setShowHostel(e.target.checked);


              if (!e.target.checked) {


                setFormData((prev) => ({ ...prev, hostelName: "", hostelRoom: "" }));


              }


            }}


            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"


          />


          <Home className="w-4 h-4 text-indigo-500" />


          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Hostel (Optional)</span>


        </label>


        {showHostel && (


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">


          {renderSelect("Hostel Name", "hostelName", hostels)}


          {renderInput("Room", "hostelRoom", { placeholder: "Room number" })}


        </div>


        )}


      </div>





      {/* Medical */}


      <div className={sectionClasses}>


        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">


          <Heart className="w-4 h-4 text-indigo-500" />


          Medical Information


        </h4>





        {/* Conditions Tag Input */}


        <div className="mb-4">


          <label className={labelClasses}>Medical Conditions</label>


          <div className="flex gap-2 mb-2">


            <input


              type="text"


              value={conditionInput}


              onChange={(e) => setConditionInput(e.target.value)}


              onKeyDown={(e) => {


                if (e.key === "Enter") {


                  e.preventDefault();


                  addTag("medicalConditions", conditionInput);


                }


              }}


              placeholder="Type and press Enter"


              className={inputClasses}


            />


            <button


              type="button"


              onClick={() => addTag("medicalConditions", conditionInput)}


              className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"


            >


              <Plus className="w-4 h-4" />


            </button>


          </div>


          <div className="flex flex-wrap gap-2">


            {(formData.medicalConditions || []).map((tag, i) => (


              <span


                key={i}


                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"


              >


                {tag}


                <button type="button" onClick={() => removeTag("medicalConditions", i)}>


                  <X className="w-3 h-3" />


                </button>


              </span>


            ))}


          </div>


        </div>





        {/* Allergies Tag Input */}


        <div className="mb-4">


          <label className={labelClasses}>Allergies</label>


          <div className="flex gap-2 mb-2">


            <input


              type="text"


              value={allergyInput}


              onChange={(e) => setAllergyInput(e.target.value)}


              onKeyDown={(e) => {


                if (e.key === "Enter") {


                  e.preventDefault();


                  addTag("allergies", allergyInput);


                }


              }}


              placeholder="Type and press Enter"


              className={inputClasses}


            />


            <button


              type="button"


              onClick={() => addTag("allergies", allergyInput)}


              className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"


            >


              <Plus className="w-4 h-4" />


            </button>


          </div>


          <div className="flex flex-wrap gap-2">


            {(formData.allergies || []).map((tag, i) => (


              <span


                key={i}


                className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium"


              >


                {tag}


                <button type="button" onClick={() => removeTag("allergies", i)}>


                  <X className="w-3 h-3" />


                </button>


              </span>


            ))}


          </div>


        </div>





        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


          {renderInput("Height (cm)", "height", { placeholder: "Height in cm" })}


          {renderInput("Weight (kg)", "weight", { placeholder: "Weight in kg" })}


        </div>


      </div>





      {/* Documents */}


      <div className={sectionClasses}>


        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">


          <FileText className="w-4 h-4 text-indigo-500" />


          Documents Upload


        </h4>


        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">


          Upload Birth Certificate, Transfer Certificate, Aadhaar Card, Passport Photo, etc. (Max 5MB each)


        </p>





        <div


          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors mb-4"


          onClick={() => docInputRef.current?.click()}


        >


          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />


          <p className="text-sm text-slate-600 dark:text-slate-400">


            Click to upload or drag and drop


          </p>


          <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 5MB</p>


        </div>


        <input


          ref={docInputRef}


          type="file"


          multiple


          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"


          onChange={handleDocUpload}


          className="hidden"


        />





        {documents.length > 0 && (


          <div className="space-y-2">


            {documents.map((doc, idx) => (


              <div


                key={idx}


                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"


              >


                <div className="flex items-center gap-3">


                  <FileText className="w-4 h-4 text-slate-400" />


                  <div>


                    <p className="text-sm text-slate-700 dark:text-slate-300">{doc.name}</p>


                    <p className="text-xs text-slate-400">


                      {(doc.file.size / 1024).toFixed(1)} KB


                    </p>


                  </div>


                </div>


                <div className="flex items-center gap-2">


                  <select


                    value={doc.type}


                    onChange={(e) => {


                      const updated = [...documents];


                      updated[idx].type = e.target.value;


                      setDocuments(updated);


                    }}


                    className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300"


                  >


                    <option value="other">Other</option>


                    <option value="birth_cert">Birth Certificate</option>


                    <option value="tc">Transfer Certificate</option>


                    <option value="aadhaar">Aadhaar Card</option>


                    <option value="marksheet">Marksheet</option>


                    <option value="photo">Passport Photo</option>


                    <option value="caste_cert">Caste Certificate</option>


                    <option value="medical">Medical Certificate</option>


                  </select>


                  <button


                    type="button"


                    onClick={() => removeDocument(idx)}


                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"


                  >


                    <Trash2 className="w-4 h-4" />


                  </button>


                </div>


              </div>


            ))}


          </div>


        )}


      </div>


    </div>


  );





  // ═══════════════════════════════════════════════════════


  // STEP 6 - Review & Submit


  // ═══════════════════════════════════════════════════════





  const renderReviewField = (label: string, value: string | undefined) => {


    if (!value) return null;


    return (


      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0">


        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>


        <span className="text-sm font-medium text-slate-900 dark:text-white text-right max-w-[60%]">


          {value}


        </span>


      </div>


    );


  };





  const renderStep6 = () => (


    <div className="space-y-6">


      {/* Personal Summary */}


      <div className={sectionClasses}>


        <div className="flex items-center justify-between mb-4">


          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">


            <User className="w-4 h-4 text-indigo-500" />


            Personal Information


          </h4>


          <button


            type="button"


            onClick={() => setCurrentStep(1)}


            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"


          >


            Edit


          </button>


        </div>


        <div className="flex items-center gap-4 mb-4">


          {photoPreview && (


            <img src={photoPreview} alt="Student" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600" />


          )}


          <div>


            <p className="text-lg font-semibold text-slate-900 dark:text-white">


              {formData.firstName} {formData.middleName} {formData.lastName}


            </p>


            <p className="text-sm text-slate-500 dark:text-slate-400">


              {formData.gender} • DOB: {formData.dob}


            </p>


          </div>


        </div>


        {renderReviewField("Blood Group", formData.bloodGroup)}


        {renderReviewField("Religion", formData.religion)}


        {renderReviewField("Category", formData.category)}


        {renderReviewField("Nationality", formData.nationality)}


        {renderReviewField("Mother Tongue", formData.motherTongue)}


        {renderReviewField("Aadhaar", formData.aadhaarNumber)}


        {renderReviewField("Email", formData.email)}


        {renderReviewField("Mobile", formData.mobile)}


        {renderReviewField("Emergency Contact", formData.emergencyContact)}


      </div>





      {/* Academic Summary */}


      <div className={sectionClasses}>


        <div className="flex items-center justify-between mb-4">


          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">


            <GraduationCap className="w-4 h-4 text-indigo-500" />


            Academic Information


          </h4>


          <button


            type="button"


            onClick={() => setCurrentStep(2)}


            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"


          >


            Edit


          </button>


        </div>


        {renderReviewField("Admission No", formData.admissionNo)}


        {renderReviewField("Admission Date", formData.admissionDate)}


        {renderReviewField("Academic Year", academicYears.find((a) => a.id === formData.academicYearId)?.name)}


        {renderReviewField("Class", classes.find((c) => c.id === formData.classId)?.name)}


        {renderReviewField("Section", sections.find((s) => s.id === formData.sectionId)?.name)}


        {renderReviewField("Roll Number", formData.rollNumber)}


        {renderReviewField("Previous School", formData.previousSchool)}


        {renderReviewField("Previous Result", formData.previousResult)}


        {renderReviewField("Medium", formData.medium)}


        {renderReviewField("Stream", formData.stream)}


      </div>





      {/* Parent Summary */}


      <div className={sectionClasses}>


        <div className="flex items-center justify-between mb-4">


          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">


            <Users className="w-4 h-4 text-indigo-500" />


            Parent / Guardian


          </h4>


          <button


            type="button"


            onClick={() => setCurrentStep(3)}


            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"


          >


            Edit


          </button>


        </div>


        {renderReviewField("Father's Name", formData.fatherName)}


        {renderReviewField("Father's Phone", formData.fatherPhone)}


        {renderReviewField("Father's Occupation", formData.fatherOccupation)}


        {renderReviewField("Mother's Name", formData.motherName)}


        {renderReviewField("Mother's Phone", formData.motherPhone)}


        {renderReviewField("Guardian", formData.guardianName)}


        {renderReviewField("Annual Income", formData.annualIncome)}


      </div>





      {/* Address Summary */}


      <div className={sectionClasses}>


        <div className="flex items-center justify-between mb-4">


          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">


            <MapPin className="w-4 h-4 text-indigo-500" />


            Address


          </h4>


          <button


            type="button"


            onClick={() => setCurrentStep(4)}


            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"


          >


            Edit


          </button>


        </div>


        {renderReviewField(


          "Permanent",


          [formData.permanentAddress, formData.permanentCity, formData.permanentState, formData.permanentPinCode]


            .filter(Boolean)


            .join(", ")


        )}


        {renderReviewField(


          "Correspondence",


          formData.sameAsPermanent


            ? "Same as permanent"


            : [formData.correspondenceAddress, formData.correspondenceCity, formData.correspondenceState, formData.correspondencePinCode]


                .filter(Boolean)


                .join(", ")


        )}


      </div>





      {/* Additional Summary */}


      <div className={sectionClasses}>


        <div className="flex items-center justify-between mb-4">


          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">


            <Plus className="w-4 h-4 text-indigo-500" />


            Additional


          </h4>


          <button


            type="button"


            onClick={() => setCurrentStep(5)}


            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"


          >


            Edit


          </button>


        </div>


        {renderReviewField("Transport Route", (Array.isArray(routes) ? routes : []).find((r) => r.id === formData.transportRoute)?.name)}


        {renderReviewField("Hostel", (Array.isArray(hostels) ? hostels : []).find((h) => h.id === formData.hostelName)?.name)}


        {renderReviewField("Height", formData.height ? `${formData.height} cm` : undefined)}


        {renderReviewField("Weight", formData.weight ? `${formData.weight} kg` : undefined)}


        {(formData.medicalConditions || []).length > 0 &&


          renderReviewField("Medical Conditions", (formData.medicalConditions || []).join(", "))}


        {(formData.allergies || []).length > 0 &&


          renderReviewField("Allergies", (formData.allergies || []).join(", "))}


        {documents.length > 0 &&


          renderReviewField("Documents", `${documents.length} file(s) attached`)}


      </div>


    </div>


  );





  // ═══════════════════════════════════════════════════════


  // MAIN RENDER


  // ═══════════════════════════════════════════════════════





  return (


    <div className="p-4 md:p-6 max-w-5xl mx-auto">


      <PageHeader


        title="New Admission"


        subtitle="Complete the admission form to register a new student"


        icon={<GraduationCap className="w-5 h-5" />}


        breadcrumbs={[


          { label: "Students", path: "/students" },


          { label: "New Admission" },


        ]}


        actions={


          <button


            type="button"


            onClick={() => {


              localStorage.removeItem(DRAFT_KEY);


              window.location.reload();


            }}


            className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"


          >


            <X className="w-4 h-4" />


            Clear Draft


          </button>


        }


      />





      {/* ─── Step Indicator ─── */}


      <div className="mb-8">


        <div className="flex items-center justify-between">


          {STEPS.map((step, idx) => {


            const Icon = step.icon;


            const isActive = currentStep === step.id;


            const isCompleted = currentStep > step.id;





            return (


              <div key={step.id} className="flex items-center flex-1 last:flex-none">


                <div className="flex flex-col items-center">


                  <button


                    type="button"


                    onClick={() => {


                      if (isCompleted || isActive) setCurrentStep(step.id);


                    }}


                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${


                      isCompleted


                        ? "bg-indigo-600 border-indigo-600 text-white"


                        : isActive


                          ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"


                          : "border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500"


                    }`}


                  >


                    {isCompleted ? (


                      <Check className="w-5 h-5" />


                    ) : (


                      <Icon className="w-4 h-4" />


                    )}


                  </button>


                  <span


                    className={`text-xs mt-1.5 font-medium hidden sm:block ${


                      isActive


                        ? "text-indigo-600 dark:text-indigo-400"


                        : isCompleted


                          ? "text-indigo-600 dark:text-indigo-400"


                          : "text-slate-400 dark:text-slate-500"


                    }`}


                  >


                    {step.title}


                  </span>


                </div>


                {idx < STEPS.length - 1 && (


                  <div


                    className={`flex-1 h-0.5 mx-2 rounded ${


                      currentStep > step.id


                        ? "bg-indigo-600"


                        : "bg-slate-200 dark:bg-slate-700"


                    }`}


                  />


                )}


              </div>


            );


          })}


        </div>


      </div>





      {/* ─── Step Content ─── */}


      <div className="mb-8">


        {currentStep === 1 && renderStep1()}


        {currentStep === 2 && renderStep2()}


        {currentStep === 3 && renderStep3()}


        {currentStep === 4 && renderStep4()}


        {currentStep === 5 && renderStep5()}


        {currentStep === 6 && renderStep6()}


      </div>





      {/* ─── Navigation Buttons ─── */}


      <div className="flex items-center justify-between">


        <button


          type="button"


          onClick={goPrev}


          disabled={currentStep === 1}


          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${


            currentStep === 1


              ? "opacity-40 cursor-not-allowed text-slate-400"


              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600"


          }`}


        >


          <ChevronLeft className="w-4 h-4" />


          Previous


        </button>





        <div className="flex items-center gap-3">


          {/* Save Draft indicator */}


          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">


            <Save className="w-3 h-3" />


            Auto-saved


          </span>





          {currentStep < 6 ? (


            <button


              type="button"


              onClick={goNext}


              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"


            >


              Next


              <ChevronRight className="w-4 h-4" />


            </button>


          ) : (


            <button


              type="button"


              onClick={handleSubmit}


              disabled={submitting}


              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"


            >


              {submitting ? (


                <>


                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />


                  Submitting...


                </>


              ) : (


                <>


                  <Check className="w-4 h-4" />


                  Submit Admission


                </>


              )}


            </button>


          )}


        </div>


      </div>


    </div>


  );


}


