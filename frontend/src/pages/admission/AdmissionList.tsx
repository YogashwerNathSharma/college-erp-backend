import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

//////////////////////////////////////////////////////
// 📋 ADMISSION LIST PAGE
//////////////////////////////////////////////////////

interface Admission {
  id: string;
  applicationNo: string;
  studentName: string;
  fatherName: string;
  class: string;
  appliedDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ENROLLED";
  phone: string;
}

export default function AdmissionList() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const res = await axios.get("/api/admissions", { params: { status: statusFilter } });
        setAdmissions(res.data.data || []);
      } catch (error) {
        console.error("Error fetching admissions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmissions();
  }, [statusFilter]);

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    ENROLLED: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Admissions</h1>
        <button
          onClick={() => navigate("/admissions/new")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          + New Admission
        </button>
      </div>

      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ENROLLED">Enrolled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Applied</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div></td></tr>
            ) : admissions.map((adm) => (
              <tr key={adm.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{adm.applicationNo}</td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium">{adm.studentName}</p>
                  <p className="text-xs text-gray-500">Father: {adm.fatherName}</p>
                </td>
                <td className="px-6 py-4 text-sm text-center">{adm.class}</td>
                <td className="px-6 py-4 text-sm text-center text-gray-500">{adm.appliedDate}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[adm.status]}`}>{adm.status}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => navigate(`/admissions/${adm.id}`)} className="text-indigo-600 hover:text-indigo-800 text-sm">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
