

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiArrowLeft, FiEdit2, FiDownload } from "react-icons/fi";

const API = `${API_BASE_URL}/api`;

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  address?: string;
  bloodGroup?: string;
  aadharNo?: string;
  panNo?: string;
  qualification?: string;
  experience?: string;
  employeeId?: string;
  joiningDate?: string;
  academicYearId: string;
  subjects: any[];
  classes: any[];
  createdAt: string;
}

const TABS = [
  "Personal Info",
  "Professional Info",
  "Subjects",
  "Classes",
  "Documents",
  "Salary",
  "Attendance",
];

const TeacherProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [activeTab, setActiveTab] = useState("Personal Info");
  const [documents, setDocuments] = useState<any[]>([]);
  const [salary, setSalary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchTeacher = async () => {
    try {
      const res = await axios.get(`${API}/teacher/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setTeacher(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load teacher");
      navigate("/teachers");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API}/teacher-document?teacherId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setDocuments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSalary = async () => {
    const now = new Date();
    try {
      const res = await axios.get(
        `${API}/teacher-salary/${id}/slip?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setSalary(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeacher();
    fetchDocuments();
    fetchSalary();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!teacher) return null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/teachers")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Teacher Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-600">
              {teacher.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{teacher.name}</h2>
                <p className="text-sm text-gray-500">Employee ID: {teacher.employeeId || "N/A"}</p>
                <p className="text-sm text-gray-500">
                  Department: {teacher.subjects?.[0]?.name || "N/A"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/teachers/edit/${teacher.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  <FiEdit2 size={16} /> Edit Profile
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <FiDownload size={16} /> Download Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-400">Joining Date</p>
                <p className="text-sm text-gray-700">{teacher.joiningDate || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm text-gray-700">{teacher.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Mobile</p>
                <p className="text-sm text-gray-700">{teacher.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b overflow-x-auto">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === tab
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Personal Info Tab */}
          {activeTab === "Personal Info" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400">Date of Birth</p>
                <p className="text-sm font-medium text-gray-700">{teacher.dateOfBirth || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Gender</p>
                <p className="text-sm font-medium text-gray-700">{teacher.gender || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Marital Status</p>
                <p className="text-sm font-medium text-gray-700">{teacher.maritalStatus || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Address</p>
                <p className="text-sm font-medium text-gray-700">{teacher.address || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Blood Group</p>
                <p className="text-sm font-medium text-gray-700">{teacher.bloodGroup || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Aadhar No.</p>
                <p className="text-sm font-medium text-gray-700">{teacher.aadharNo || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">PAN No.</p>
                <p className="text-sm font-medium text-gray-700">{teacher.panNo || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-700">{teacher.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <p className="text-sm font-medium text-gray-700">{teacher.phone}</p>
              </div>
            </div>
          )}

          {/* Professional Info Tab */}
          {activeTab === "Professional Info" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400">Department</p>
                <p className="text-sm font-medium text-gray-700">
                  {teacher.subjects?.[0]?.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Qualification</p>
                <p className="text-sm font-medium text-gray-700">{teacher.qualification || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Experience (Years)</p>
                <p className="text-sm font-medium text-gray-700">{teacher.experience || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Employee ID</p>
                <p className="text-sm font-medium text-gray-700">{teacher.employeeId || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Joining Date</p>
                <p className="text-sm font-medium text-gray-700">{teacher.joiningDate || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Active
                </span>
              </div>
            </div>
          )}

          {/* Subjects Tab */}
          {activeTab === "Subjects" && (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teacher.subjects?.map((sub: any, i: number) => (
                    <tr key={sub.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">{sub.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!teacher.subjects || teacher.subjects.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        No subjects assigned
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === "Classes" && (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Class</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teacher.classes?.map((cls: any, i: number) => (
                    <tr key={cls.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">{cls.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!teacher.classes || teacher.classes.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        No classes assigned
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "Documents" && (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Document</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Upload Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, i) => (
                    <tr key={doc.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">{doc.name}</td>
                      <td className="px-4 py-3 text-sm">{doc.type}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          className="text-primary-600 hover:underline text-sm"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No documents uploaded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Salary Tab */}
          {activeTab === "Salary" && (
            <div>
              {salary ? (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-primary-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500">Basic Salary</p>
                      <p className="text-lg font-bold text-primary-600">₹{salary.basicSalary?.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500">Allowances</p>
                      <p className="text-lg font-bold text-green-600">₹{salary.totalAllowances?.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500">Deductions</p>
                      <p className="text-lg font-bold text-red-600">₹{salary.totalDeductions?.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500">Net Salary</p>
                      <p className="text-lg font-bold text-purple-600">₹{salary.netSalary?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No salary record found</p>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === "Attendance" && (
            <div className="text-center py-8 text-gray-500">
              <p>Attendance details are available in the Attendance section</p>
              <button
                onClick={() => navigate("/teacher-attendance")}
                className="mt-2 text-primary-600 hover:underline"
              >
                Go to Attendance →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;

