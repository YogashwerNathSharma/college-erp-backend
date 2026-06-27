import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

//////////////////////////////////////////////////////
// 📄 ADMISSION DETAIL PAGE
//////////////////////////////////////////////////////

interface AdmissionDetail {
  id: string;
  applicationNo: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  class: string;
  section: string;
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  previousSchool: string;
  appliedDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ENROLLED";
  documents: Array<{ name: string; url: string }>;
}

export default function AdmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [admission, setAdmission] = useState<AdmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axios.get(`/api/admissions/${id}`);
        setAdmission(res.data.data);
      } catch (error) {
        console.error("Error fetching admission:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleStatusChange = async (status: string) => {
    try {
      await axios.patch(`/api/admissions/${id}`, { status });
      setAdmission((prev) => prev ? { ...prev, status: status as any } : null);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!admission) {
    return <div className="text-center py-12 text-gray-500">Admission not found</div>;
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    ENROLLED: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate("/admissions")} className="text-indigo-600 hover:text-indigo-800 text-sm mb-2">← Back to Admissions</button>
          <h1 className="text-2xl font-bold text-gray-800">Application: {admission.applicationNo}</h1>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[admission.status]}`}>
          {admission.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="space-y-3">
            <InfoRow label="Name" value={`${admission.firstName} ${admission.lastName}`} />
            <InfoRow label="Gender" value={admission.gender} />
            <InfoRow label="Date of Birth" value={admission.dateOfBirth} />
            <InfoRow label="Father" value={`${admission.fatherName} (${admission.fatherPhone})`} />
            <InfoRow label="Mother" value={admission.motherName} />
          </div>
        </div>

        {/* Academic Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Academic Information</h3>
          <div className="space-y-3">
            <InfoRow label="Class Applied" value={admission.class} />
            <InfoRow label="Section" value={admission.section} />
            <InfoRow label="Previous School" value={admission.previousSchool || "—"} />
            <InfoRow label="Applied On" value={admission.appliedDate} />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Address</h3>
          <p className="text-gray-700">{admission.address}, {admission.city}, {admission.state} - {admission.pincode}</p>
        </div>
      </div>

      {/* Actions */}
      {admission.status === "PENDING" && (
        <div className="flex gap-3">
          <button onClick={() => handleStatusChange("APPROVED")} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Approve
          </button>
          <button onClick={() => handleStatusChange("REJECTED")} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Reject
          </button>
        </div>
      )}
      {admission.status === "APPROVED" && (
        <button onClick={() => handleStatusChange("ENROLLED")} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Enroll Student
        </button>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
