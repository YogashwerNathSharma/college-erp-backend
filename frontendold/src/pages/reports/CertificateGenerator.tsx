
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Printer,
  X,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import PrintSignature from '../../components/PrintSignature';

interface AcademicYear {
  id: string;
  year: string;
  isCurrent?: boolean;
  isActive?: boolean;
}

interface Class {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  admissionNo: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  address: string;
  class: string;
  section: string;
}

interface Tenant {
  name?: string;
  address?: string;
  logo?: string;
  affiliationNo?: string;
  principalName?: string;
  phone?: string;
  email?: string;
}

type CertificateType = 'TC' | 'Bonafide' | 'Character' | 'Birth';

interface CertificateData {
  certificateType: CertificateType;
  student: Student | null;
  academicYear: AcademicYear | null;
  class: Class | null;
  section: Section | null;
  reasonForLeaving?: string;
  dateOfLeaving?: string;
  lastExamAppeared?: string;
  result?: string;
  conductCharacter?: string;
  purpose?: string;
  certificateNumber?: string;
  issueDate?: string;
}

const CertificateGenerator: React.FC = () => {
  const YN_UDP_API = window.location.hostname !== "localhost"
  ? "https://yn-udp.onrender.com/api"
  : "http://localhost:5001/api";

  // State Management
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState<AcademicYear | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [certificateType, setCertificateType] =
    useState<CertificateType>('TC');
  const [useCustomTemplate, setUseCustomTemplate] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<any>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [reasonForLeaving, setReasonForLeaving] = useState('');
  const [dateOfLeaving, setDateOfLeaving] = useState('');
  const [lastExamAppeared, setLastExamAppeared] = useState('');
  const [result, setResult] = useState('');
  const [conductCharacter, setConductCharacter] = useState('');
  const [purpose, setPurpose] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tenant, setTenant] = useState<Tenant>({});
  const [certificateNumber, setCertificateNumber] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch tenant info
  
  // Fetch custom certificate templates from YN-UDP Designer
  useEffect(() => {
    const fetchCustomTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const tenantId = localStorage.getItem("tenantId") || "000000000000000000000000";
        let res = await axios.get(`${YN_UDP_API}/templates?tenantId=${tenantId}&type=certificate`).catch(() => null);
        if (!res?.data?.data?.length) {
          res = await axios.get(`${YN_UDP_API}/templates?tenantId=000000000000000000000000`).catch(() => null);
        }
        if (res?.data?.success) {
          setCustomTemplates(res.data.data || []);
        }
      } catch (err) {
        console.log("YN-UDP templates not available:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchCustomTemplates();
  }, []);

useEffect(() => {
    const tenantData = JSON.parse(localStorage.getItem('tenant') || '{}');
    setTenant(tenantData);
  }, []);

  // Fetch Academic Years
  useEffect(() => {
    fetchAcademicYears();
  }, []);

const fetchAcademicYears = async () => {
  try {
    setLoading(true);
    const response = await axios.get('/api/academic');
    const raw = response.data?.data || response.data || [];
    const yearsList = Array.isArray(raw) ? raw : [];
    setAcademicYears(yearsList);

    // Auto-select current year
    const currentYear =
      yearsList.find((y: any) => y.isCurrent || y.isActive) || yearsList[0]
    if (currentYear) {
      setSelectedAcademicYear(currentYear);
      fetchClasses(currentYear.id);
    }
  } catch (error) {
    console.error('Error fetching academic years:', error);
    toast.error('Failed to load academic years');
  } finally {
    setLoading(false);
  }
};

  const fetchClasses = async (academicYearId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/class?academicYearId=${academicYearId}`
      );
      const rawClasses = response.data?.data || response.data || [];
      setClasses(Array.isArray(rawClasses) ? rawClasses : []);
      setSelectedClass(null);
      setSections([]);
      setSelectedSection(null);
      setStudents([]);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/section?classId=${classId}`);
      const rawSections = response.data?.data || response.data || [];
      setSections(Array.isArray(rawSections) ? rawSections : []);
      setSelectedSection(null);
      setStudents([]);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (
    classId: string,
    sectionId: string,
    academicYearId: string
  ) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/students?classId=${classId}&sectionId=${sectionId}&academicYearId=${academicYearId}`
      );
      const raw = response.data?.data?.students || response.data?.data || response.data?.students || response.data || [];
      setStudents(Array.isArray(raw) ? raw : []);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearChange = (year: AcademicYear) => {
    setSelectedAcademicYear(year);
    setSelectedClass(null);
    setSelectedSection(null);
    setSelectedStudent(null);
    fetchClasses(year.id);
  };

  const handleClassChange = (classItem: Class) => {
    setSelectedClass(classItem);
    setSelectedSection(null);
    setSelectedStudent(null);
    fetchSections(classItem.id);
  };

  const handleSectionChange = (section: Section) => {
    setSelectedSection(section);
    setSelectedStudent(null);
    if (selectedClass && selectedAcademicYear) {
      fetchStudents(
        selectedClass.id,
        section.id,
        selectedAcademicYear.id
      );
    }
  };

  const handleStudentChange = (student: Student) => {
    setSelectedStudent(student);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const numberToWords = (date: string): string => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString('en-IN', { month: 'long' });
    const year = d.getFullYear();

    const dayWords: { [key: number]: string } = {
      1: 'First',
      2: 'Second',
      3: 'Third',
      4: 'Fourth',
      5: 'Fifth',
      6: 'Sixth',
      7: 'Seventh',
      8: 'Eighth',
      9: 'Ninth',
      10: 'Tenth',
      11: 'Eleventh',
      12: 'Twelfth',
      13: 'Thirteenth',
      14: 'Fourteenth',
      15: 'Fifteenth',
      16: 'Sixteenth',
      17: 'Seventeenth',
      18: 'Eighteenth',
      19: 'Nineteenth',
      20: 'Twentieth',
      21: 'Twenty-first',
      22: 'Twenty-second',
      23: 'Twenty-third',
      24: 'Twenty-fourth',
      25: 'Twenty-fifth',
      26: 'Twenty-sixth',
      27: 'Twenty-seventh',
      28: 'Twenty-eighth',
      29: 'Twenty-ninth',
      30: 'Thirtieth',
      31: 'Thirty-first',
    };

    return `${dayWords[day] || day} ${month} ${year}`;
  };

  const generateCertificateNumber = (): string => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `${certificateType}-${year}-${random}`;
  };

  const validateForm = (): boolean => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return false;
    }

    if (certificateType === 'TC') {
      if (!reasonForLeaving.trim()) {
        toast.error('Please enter reason for leaving');
        return false;
      }
      if (!dateOfLeaving) {
        toast.error('Please select date of leaving');
        return false;
      }
      if (!conductCharacter.trim()) {
        toast.error('Please enter conduct/character');
        return false;
      }
    }

    if (certificateType === 'Bonafide') {
      if (!purpose.trim()) {
        toast.error('Please enter purpose');
        return false;
      }
    }

    return true;
  };

  const handleGeneratePreview = () => {
    if (validateForm()) {
      setCertificateNumber(generateCertificateNumber());
      setShowPreview(true);
      toast.success('Certificate generated successfully');
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };

  const getLogoUrl = (): string => {
    if (!tenant.logo) return '';
    if (tenant.logo.startsWith('http')) return tenant.logo;
    return `${tenant.logo}`;
  };

  const renderCertificateContent = (): string => {
    if (!selectedStudent || !selectedAcademicYear || !selectedClass) return '';

    const student = selectedStudent;
    const dob = formatDate(student.dateOfBirth);
    const dobWords = numberToWords(student.dateOfBirth);

    switch (certificateType) {
      case 'TC':
        return `This is to certify that <strong>${student.name}</strong>, son/daughter of Shri <strong>${student.fatherName}</strong>, bearing Admission No. <strong>${student.admissionNo}</strong>, was a bonafide student of this institution. He/She was studying in Class <strong>${selectedClass.name}</strong> Section <strong>${selectedSection?.name || ''}</strong> during the academic session <strong>${selectedAcademicYear.year}</strong>. His/Her date of birth as per school records is <strong>${dob}</strong>. He/She is leaving the school on account of <strong>${reasonForLeaving}</strong>. His/Her character and conduct during the stay in this school was <strong>${conductCharacter}</strong>. He/She has paid all dues to the school.`;

      case 'Bonafide':
        return `This is to certify that <strong>${student.name}</strong>, son/daughter of Shri <strong>${student.fatherName}</strong>, bearing Admission No. <strong>${student.admissionNo}</strong>, is a bonafide student of this institution studying in Class <strong>${selectedClass.name}</strong> Section <strong>${selectedSection?.name || ''}</strong> during the academic session <strong>${selectedAcademicYear.year}</strong>. His/Her date of birth as per school records is <strong>${dobWords}</strong>. This certificate is issued for the purpose of <strong>${purpose}</strong>.`;

      case 'Character':
        return `This is to certify that <strong>${student.name}</strong>, son/daughter of Shri <strong>${student.fatherName}</strong>, bearing Admission No. <strong>${student.admissionNo}</strong>, is/was a student of this institution. He/She was studying in Class <strong>${selectedClass.name}</strong> Section <strong>${selectedSection?.name || ''}</strong>. His/Her character and moral conduct during stay in this institution has been found <strong>GOOD</strong>. He/She bears a good moral character. I wish him/her all success in life.`;

      case 'Birth':
        return `This is to certify that as per our school records, <strong>${student.name}</strong>, son/daughter of Shri <strong>${student.fatherName}</strong> and Smt. <strong>${student.motherName}</strong>, bearing Admission No. <strong>${student.admissionNo}</strong>, studying in Class <strong>${selectedClass.name}</strong> Section <strong>${selectedSection?.name || ''}</strong>, was born on <strong>${dobWords}</strong> (<strong>${dob}</strong>). His/Her place of birth is <strong>${student.address}</strong>.`;

      default:
        return '';
    }
  };

  const getCertificateTitle = (): string => {
    switch (certificateType) {
      case 'TC':
        return 'Transfer Certificate';
      case 'Bonafide':
        return 'Bonafide Certificate';
      case 'Character':
        return 'Character Certificate';
      case 'Birth':
        return 'Birth Certificate';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-primary-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Certificate Generator
            </h1>
          </div>
          <p className="text-gray-600">
            Generate and print official school certificates
          </p>
        </div>

        {!showPreview ? (
          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-primary-600">
            {/* Certificate Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Certificate Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['TC', 'Bonafide', 'Character', 'Birth'] as CertificateType[]).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setCertificateType(type)}
                      className={`p-3 rounded-lg font-medium transition-all ${
                        certificateType === type
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'TC' ? 'Transfer' : type}
                    </button>
                  )
                )}
              </div>
            </div>
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => setUseCustomTemplate(false)} className={`px-3 py-1 text-xs font-medium rounded ${!useCustomTemplate ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Built-in Templates</button>
                  <button onClick={() => setUseCustomTemplate(true)} className={`px-3 py-1 text-xs font-medium rounded ${useCustomTemplate ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>✨ Custom (YN-UDP Designer)</button>
                  <a href="https://yn-udp.onrender.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs font-medium rounded bg-gray-100 text-blue-600 hover:bg-blue-50 border border-blue-200">+ Create New</a>
                </div>
                {useCustomTemplate && (
                  <div>
                    {loadingTemplates ? (
                      <div className="text-center py-6 text-gray-500 text-sm">Loading templates...</div>
                    ) : customTemplates.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {customTemplates.map((tmpl: any) => (
                          <div key={tmpl.id} onClick={() => setSelectedCustomTemplate(tmpl)} className={`cursor-pointer rounded-lg overflow-hidden border-2 transition ${selectedCustomTemplate?.id === tmpl.id ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200 hover:border-gray-400"}`}>
                            <div className="h-16 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center"><span className="text-xl">📜</span></div>
                            <div className="p-2"><div className="text-xs font-medium text-gray-800 truncate">{tmpl.name}</div><div className="text-[10px] text-gray-500">{tmpl.pageWidth}×{tmpl.pageHeight}</div></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500 text-sm mb-2">No custom certificate templates</p>
                        <a href="https://yn-udp.onrender.com" target="_blank" className="inline-flex items-center gap-1 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">✨ Open Designer</a>
                      </div>
                    )}
                  </div>
                )}
              </div>

            {/* Cascading Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* Academic Year */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Academic Year
                </label>
                <div className="relative">
                  <select
                    value={selectedAcademicYear?.id || ''}
                    onChange={(e) => {
                      const year = academicYears.find((y) => y.id === e.target.value);
                      if (year) handleAcademicYearChange(year);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.year}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class
                </label>
                <div className="relative">
                  <select
                    value={selectedClass?.id || ''}
                    onChange={(e) => {
                      const classItem = classes.find((c) => c.id === e.target.value);
                      if (classItem) handleClassChange(classItem);
                    }}
                    disabled={!selectedAcademicYear}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Section
                </label>
                <div className="relative">
                  <select
                    value={selectedSection?.id || ''}
                    onChange={(e) => {
                      const section = sections.find((s) => s.id === e.target.value);
                      if (section) handleSectionChange(section);
                    }}
                    disabled={!selectedClass}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Section</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Student */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student
                </label>
                <div className="relative">
                  <select
                    value={selectedStudent?.id || ''}
                    onChange={(e) => {
                      const student = students.find((s) => s.id === e.target.value);
                      if (student) handleStudentChange(student);
                    }}
                    disabled={!selectedSection}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.admissionNo})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Conditional Fields Based on Certificate Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Transfer Certificate Fields */}
              {certificateType === 'TC' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason for Leaving <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={reasonForLeaving}
                      onChange={(e) => setReasonForLeaving(e.target.value)}
                      placeholder="e.g., Change of residence, Further studies"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Leaving <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dateOfLeaving}
                      onChange={(e) => setDateOfLeaving(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Exam Appeared
                    </label>
                    <input
                      type="text"
                      value={lastExamAppeared}
                      onChange={(e) => setLastExamAppeared(e.target.value)}
                      placeholder="e.g., Final Examination 2024"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Result
                    </label>
                    <input
                      type="text"
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                      placeholder="e.g., Passed"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Conduct/Character <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={conductCharacter}
                      onChange={(e) => setConductCharacter(e.target.value)}
                      placeholder="e.g., Good, Excellent"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Bonafide Certificate Fields */}
              {certificateType === 'Bonafide' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purpose <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g., Admission in college, Scholarship application"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="flex gap-4">
              <button
                onClick={handleGeneratePreview}
                disabled={loading || !selectedStudent}
                className="flex-1 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Generate Certificate
              </button>
            </div>
          </div>
        ) : (
          // Preview Mode
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Preview Controls */}
            <div className="bg-gray-100 p-4 border-b flex gap-3 justify-end">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-all print:hidden"
              >
                <Printer className="w-5 h-5" />
                Print
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all print:hidden"
              >
                <X className="w-5 h-5" />
                Close
              </button>
            </div>

            {/* Certificate Preview */}
            <div
              ref={printRef}
              className="p-12 bg-white print:p-0 print:bg-white"
              style={{
                fontFamily: 'Georgia, serif',
                lineHeight: '1.8',
              }}
            >
              {/* Double Border */}
              <div
                className="border-4 border-gray-800 p-8"
                style={{
                  boxShadow: 'inset 0 0 0 2px white, inset 0 0 0 6px gray',
                }}
              >
                {/* School Header */}
                <div className="text-center mb-8 flex items-center justify-between">
                  {/* Logo Left */}
                  {getLogoUrl() && (
                    <img
                      src={getLogoUrl()}
                      alt="School Logo"
                      className="h-20 w-20 object-contain"
                    />
                  )}

                  {/* School Info Center */}
                  <div className="flex-1 mx-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">
                      {tenant.name || 'School Name'}
                    </h2>
                    <p className="text-sm text-gray-600 mb-1">
                      {tenant.address || 'School Address'}
                    </p>
                    {tenant.affiliationNo && (
                      <p className="text-xs text-gray-600">
                        Affiliation No: {tenant.affiliationNo}
                      </p>
                    )}
                  </div>

                  {/* Seal Right */}
                  <div className="w-20 h-20 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-gray-400 text-center p-2">
                      School Seal
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t-2 border-b-2 border-gray-400 my-6 py-4" />

                {/* Certificate Title */}
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2 uppercase tracking-widest">
                  {getCertificateTitle()}
                </h1>
                <div className="h-1 bg-gray-800 w-40 mx-auto mb-8" />

                {/* Certificate Number and Date */}
                <div className="flex justify-between text-sm text-gray-700 mb-8">
                  <div>
                    <p className="font-semibold">
                      Certificate No: {certificateNumber}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">
                      Date: {formatDate(new Date().toISOString())}
                    </p>
                  </div>
                </div>

                {/* Certificate Body */}
                <p
                  className="text-gray-800 text-justify mb-8 leading-relaxed"
                  style={{ fontSize: '14px' }}
                  dangerouslySetInnerHTML={{ __html: renderCertificateContent() }}
                />

                {/* Signature Area */}
                <div className="flex justify-between items-end mt-16 pt-8 border-t border-gray-300">
                  {/* Place and Date Left */}
                  <div>
                    <p className="text-sm text-gray-700">
                      Place: {tenant.address?.split(',')[0] || 'School'}
                    </p>
                    <p className="text-sm text-gray-700">
                      Date: {formatDate(new Date().toISOString())}
                    </p>
                  </div>

                  {/* Principal Signature Right */}
                  <div className="text-center">
                    <PrintSignature inline={false} printOnly={false} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:p-0 {
            padding: 0 !important;
          }

          .print\\:bg-white {
            background-color: white !important;
          }

          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CertificateGenerator;

