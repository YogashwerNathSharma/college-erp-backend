
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ChevronDown,
  Users,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Printer,
  Loader,
  AlertCircle,
  FileText,
  Heart,
  Home,
} from 'lucide-react';
import PrintSignature from '../../components/PrintSignature';

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  rollNo: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  religion: string;
  caste: string;
  category: string;
  email: string;
  phone: string;
  emergencyContact: string;
  emergencyPhone: string;
  fathersName: string;
  mothersName: string;
  guardianName: string;
  currentAddress: string;
  permanentAddress: string;
  previousSchool: string;
  admissionDate: string;
  status: string;
  profilePhoto: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  className: string;
  sectionName: string;
}

interface TenantInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
}

const StudentProfilePage: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<any>([]);
  const [classes, setClasses] = useState<any>([]);
  const [sections, setSections] = useState<any>([]);
  const [students, setStudents] = useState<any>([]);

  const [selectedYear, setSelectedYear] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  const tenantInfo: TenantInfo = JSON.parse(localStorage.getItem('tenant') || '{}');
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

  const logoUrl = tenantInfo.logoUrl?.startsWith('http')
    ? tenantInfo.logoUrl
    : `${tenantInfo.logoUrl || ''}`;

  // Fetch Academic Years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/academic');
        const rawYears = response.data?.data || response.data || [];
        const years = Array.isArray(rawYears) ? rawYears : [];
        setAcademicYears(years);

        // Auto-select current/active year
        const current = years.find((y: any) => y.isCurrent || y.isActive) || years[0];
        if (current) {
          setSelectedYear(current);
        }
      } catch (error) {
        toast.error('Failed to fetch academic years');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAcademicYears();
  }, []);

  // Fetch Classes when Year changes
  useEffect(() => {
    if (!selectedYear?.id) return;

    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/class?academicYearId=${selectedYear.id}`);
        const rawClasses = response.data?.data || response.data || [];
        const classData = Array.isArray(rawClasses) ? rawClasses : [];
        setClasses(classData);
        setSelectedClass(classData[0] || null);
        setSections([]);
        setSelectedSection(null);
        setStudents([]);
        setSelectedStudent(null);
        setStudentProfile(null);
      } catch (error) {
        toast.error('Failed to fetch classes');
        console.error(error);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [selectedYear]);

  // Fetch Sections when Class changes
  useEffect(() => {
    if (!selectedClass?.id) return;

    const fetchSections = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/section?classId=${selectedClass.id}`);
        const rawSections = response.data?.data || response.data || [];
        const sectionData = Array.isArray(rawSections) ? rawSections : [];
        setSections(sectionData);
        setSelectedSection(sectionData[0] || null);
        setStudents([]);
        setSelectedStudent(null);
        setStudentProfile(null);
      } catch (error) {
        toast.error('Failed to fetch sections');
        console.error(error);
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [selectedClass]);

  // Fetch Students when Section changes
  useEffect(() => {
    if (!selectedClass?.id || !selectedSection?.id || !selectedYear?.id) return;

    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `/api/students?classId=${selectedClass.id}&sectionId=${selectedSection.id}&academicYearId=${selectedYear.id}`
        );
        const rawStudents = response.data?.data?.students || response.data?.data || response.data?.students || response.data || [];
        const studentData = Array.isArray(rawStudents) ? rawStudents : [];
        setStudents(studentData);
        setSelectedStudent(null);
        setStudentProfile(null);
      } catch (error) {
        toast.error('Failed to fetch students');
        console.error(error);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, selectedSection, selectedYear]);

  // Fetch Student Profile when Student selected
  useEffect(() => {
    if (!selectedStudent?.id) return;

    const fetchStudentProfile = async () => {
      try {
        setFetchingProfile(true);
        const response = await axios.get(`/api/students/${selectedStudent.id}`);
        setStudentProfile(response.data.data || null);
        toast.success('Student profile loaded');
      } catch (error) {
        toast.error('Failed to fetch student profile');
        console.error(error);
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchStudentProfile();
  }, [selectedStudent]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Student Profile
          </h1>
          <p className="text-gray-600">View and manage student information</p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Academic Year Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Academic Year
              </label>
              <select
                value={selectedYear?.id || ''}
                onChange={(e) => {
                  const year = academicYears.find((y: any) => y.id === e.target.value);
                  setSelectedYear(year);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year: any) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
              <select
                value={selectedClass?.id || ''}
                onChange={(e) => {
                  const classItem = classes.find((c: any) => c.id === e.target.value);
                  setSelectedClass(classItem);
                }}
                disabled={!selectedYear}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Class</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
              <select
                value={selectedSection?.id || ''}
                onChange={(e) => {
                  const section = sections.find((s: any) => s.id === e.target.value);
                  setSelectedSection(section);
                }}
                disabled={!selectedClass}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Section</option>
                {sections.map((section: any) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Student</label>
              <select
                value={selectedStudent?.id || ''}
                onChange={(e) => {
                  const student = students.find((s: any) => s.id === e.target.value);
                  setSelectedStudent(student);
                }}
                disabled={!selectedSection}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Student</option>
                {students.map((student: any) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {(loading || fetchingProfile) && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading student information...</p>
            </div>
          </div>
        )}

        {/* No Student Selected */}
        {!studentProfile && !loading && !fetchingProfile && (
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-12 text-center">
            <Users className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
            <p className="text-lg text-gray-500">Select a student to view their profile</p>
          </div>
        )}

        {/* Student Profile Card */}
        {studentProfile && !fetchingProfile && (
          <div className="space-y-6">
            {/* Print Button */}
            <div className="flex justify-end">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm font-medium print:hidden"
              >
                <Printer className="w-5 h-5" />
                Print Profile
              </button>
            </div>

            {/* Profile Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                {/* Photo */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-40 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden shadow-md">
                    {studentProfile.profilePhoto ? (
                      <img
                        src={studentProfile.profilePhoto}
                        alt={studentProfile.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-indigo-400" />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Profile Photo</p>
                </div>

                {/* Basic Info */}
                <div className="md:col-span-3">
                  <div className="mb-4">
                    <h2 className="text-3xl font-bold text-gray-800">
                      {studentProfile.firstName} {studentProfile.lastName}
                    </h2>
                    <p className="text-primary-600 font-semibold">Status: {studentProfile.status}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Admission No</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {studentProfile.admissionNo}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Roll No</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {studentProfile.rollNo}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Class</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {studentProfile.className}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Section</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {studentProfile.sectionName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Information */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary-600" />
                Family Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Father's Name</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {studentProfile.fathersName || 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Mother's Name</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {studentProfile.mothersName || 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Guardian Name</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {studentProfile.guardianName || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date of Birth</p>
                  <p className="text-gray-800 font-semibold">
                    {studentProfile.dateOfBirth
                      ? new Date(studentProfile.dateOfBirth).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Gender</p>
                  <p className="text-gray-800 font-semibold">{studentProfile.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Blood Group</p>
                  <p className="text-gray-800 font-semibold">{studentProfile.bloodGroup || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Religion</p>
                  <p className="text-gray-800 font-semibold">{studentProfile.religion || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Caste</p>
                  <p className="text-gray-800 font-semibold">{studentProfile.caste || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Category</p>
                  <p className="text-gray-800 font-semibold">{studentProfile.category || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {studentProfile.phone || 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {studentProfile.email || 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                    Emergency Contact
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {studentProfile.emergencyContact || 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                    Emergency Phone
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {studentProfile.emergencyPhone || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Current Address</p>
                  <p className="text-gray-800 leading-relaxed">
                    {studentProfile.currentAddress || 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Permanent Address</p>
                  <p className="text-gray-800 leading-relaxed">
                    {studentProfile.permanentAddress || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Admission Information */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Admission Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Admission Date</p>
                  <p className="text-gray-800 font-semibold">
                    {studentProfile.admissionDate
                      ? new Date(studentProfile.admissionDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Previous School</p>
                  <p className="text-gray-800 font-semibold">
                    {studentProfile.previousSchool || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Layout */}
        <style>{`
          @media print {
            body {
              background: white;
            }

            .print\\:hidden {
              display: none;
            }

            .print-container {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 20mm;
              background: white;
              page-break-after: always;
            }

            .print-header {
              display: flex;
              align-items: flex-start;
              gap: 20px;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 2px solid #4f46e5;
            }

            .print-logo {
              width: 60px;
              height: 60px;
              object-fit: contain;
            }

            .print-school-info {
              flex: 1;
              text-align: center;
            }

            .print-school-name {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 4px;
            }

            .print-school-details {
              font-size: 11px;
              color: #6b7280;
              line-height: 1.4;
            }

            .print-date {
              text-align: right;
              font-size: 12px;
              color: #6b7280;
            }

            .print-student-photo {
              width: 80px;
              height: 100px;
              object-fit: cover;
              border: 2px solid #e5e7eb;
              border-radius: 4px;
            }

            .print-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-top: 20px;
            }

            .print-table th {
              background: #f3f4f6;
              padding: 8px;
              text-align: left;
              font-weight: 600;
              color: #1f2937;
              border: 1px solid #e5e7eb;
            }

            .print-table td {
              padding: 8px;
              border: 1px solid #e5e7eb;
            }

            .print-table tr:nth-child(even) {
              background: #f9fafb;
            }

            .print-section-title {
              font-size: 14px;
              font-weight: bold;
              color: #1f2937;
              margin-top: 20px;
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 2px solid #4f46e5;
            }

            .print-profile-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 15px;
            }

            .print-field {
              font-size: 11px;
            }

            .print-field-label {
              font-size: 9px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }

            .print-field-value {
              font-size: 12px;
              color: #1f2937;
              font-weight: 500;
            }
          }
        `}</style>
      </div>

      {/* Hidden Print Content */}
      {studentProfile && (
        <div className="hidden print:block print-container">
          {/* Print Header */}
          <div className="print-header">
            {tenantInfo.logoUrl && (
              <img src={logoUrl} alt="School Logo" className="print-logo" />
            )}

            <div className="print-school-info">
              <div className="print-school-name">{tenantInfo.name || 'School Name'}</div>
              <div className="print-school-details">
                <div>{tenantInfo.address || 'Address'}</div>
                <div>{tenantInfo.phone && `Phone: ${tenantInfo.phone}`}</div>
                <div>{tenantInfo.email && `Email: ${tenantInfo.email}`}</div>
              </div>
            </div>

            <div className="print-date">
              <strong>Date:</strong>{' '}
              {new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* Student Profile Section */}
          <div style={{ marginTop: '20px' }}>
            <div className="print-section-title">Student Information</div>

            {/* Header with Photo */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              {studentProfile.profilePhoto && (
                <img
                  src={studentProfile.profilePhoto}
                  alt={studentProfile.firstName}
                  className="print-student-photo"
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {studentProfile.firstName} {studentProfile.lastName}
                </div>
                <table className="print-table">
                  <tbody>
                    <tr>
                      <td>
                        <strong>Admission No:</strong> {studentProfile.admissionNo}
                      </td>
                      <td>
                        <strong>Roll No:</strong> {studentProfile.rollNo}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Class:</strong> {studentProfile.className}
                      </td>
                      <td>
                        <strong>Section:</strong> {studentProfile.sectionName}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Status:</strong> {studentProfile.status}
                      </td>
                      <td>
                        <strong>Admission Date:</strong>{' '}
                        {studentProfile.admissionDate
                          ? new Date(studentProfile.admissionDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Personal Details */}
            <div className="print-section-title">Personal Details</div>
            <table className="print-table">
              <tbody>
                <tr>
                  <td>
                    <strong>Date of Birth:</strong>{' '}
                    {studentProfile.dateOfBirth
                      ? new Date(studentProfile.dateOfBirth).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <strong>Gender:</strong> {studentProfile.gender || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Blood Group:</strong> {studentProfile.bloodGroup || 'N/A'}
                  </td>
                  <td>
                    <strong>Religion:</strong> {studentProfile.religion || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Caste:</strong> {studentProfile.caste || 'N/A'}
                  </td>
                  <td>
                    <strong>Category:</strong> {studentProfile.category || 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Family Information */}
            <div className="print-section-title">Family Information</div>
            <table className="print-table">
              <tbody>
                <tr>
                  <td>
                    <strong>Father's Name:</strong> {studentProfile.fathersName || 'N/A'}
                  </td>
                  <td>
                    <strong>Mother's Name:</strong> {studentProfile.mothersName || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <strong>Guardian Name:</strong> {studentProfile.guardianName || 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Contact Information */}
            <div className="print-section-title">Contact Information</div>
            <table className="print-table">
              <tbody>
                <tr>
                  <td>
                    <strong>Phone:</strong> {studentProfile.phone || 'N/A'}
                  </td>
                  <td>
                    <strong>Email:</strong> {studentProfile.email || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Emergency Contact:</strong> {studentProfile.emergencyContact || 'N/A'}
                  </td>
                  <td>
                    <strong>Emergency Phone:</strong> {studentProfile.emergencyPhone || 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Address Information */}
            <div className="print-section-title">Address Information</div>
            <table className="print-table">
              <tbody>
                <tr>
                  <td>
                    <strong>Current Address:</strong>
                    <div style={{ marginTop: '4px' }}>{studentProfile.currentAddress || 'N/A'}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Permanent Address:</strong>
                    <div style={{ marginTop: '4px' }}>{studentProfile.permanentAddress || 'N/A'}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Previous School */}
            {studentProfile.previousSchool && (
              <>
                <div className="print-section-title">Previous School</div>
                <table className="print-table">
                  <tbody>
                    <tr>
                      <td>{studentProfile.previousSchool}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* Principal Signature */}
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
            <PrintSignature inline printOnly={false} />
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '2px solid #e5e7eb',
              fontSize: '10px',
              color: '#6b7280',
              textAlign: 'center',
            }}
          >
            Generated on{' '}
            {new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfilePage;

