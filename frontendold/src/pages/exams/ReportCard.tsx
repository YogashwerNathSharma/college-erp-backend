
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";

interface SubjectResult {
  subjectName: string;
  maxMarks: number;
  obtainedMarks: number | null;
  grade: string;
  status: string;
  isAbsent: boolean;
}

interface ReportCardData {
  school: {
    name: string;
    address: string;
    logo?: string;
    phone?: string;
    email?: string;
  };
  student: {
    name: string;
    admissionNo: string;
    class: string;
    section?: string;
    fatherName: string;
    motherName?: string;
    rollNo?: string;
    dob?: string;
    photo?: string;
  };
  exam: {
    name: string;
    type: string;
    academicYear: string;
    resultType: string;
  };
  subjects: SubjectResult[];
  summary: {
    totalMarks: number;
    totalMaxMarks: number;
    percentage: number;
    grade: string;
    rank: number;
    division: string;
    result: string;
  };
}

const ReportCard: React.FC = () => {
  const navigate = useNavigate();
  const { examId, studentId } = useParams<{
    examId: string;
    studentId: string;
  }>();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [data, setData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId && studentId) {
      fetchReportCard();
    }
  }, [examId, studentId]);

  const fetchReportCard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/exam/${examId}/report-card/${studentId}`,
        { headers }
      );
      const raw = res.data?.data || res.data;

      const mapped: ReportCardData = {
        school: {
          name: raw.tenant?.name || "",
          address: raw.tenant?.address || "",
          logo: raw.tenant?.logoUrl || "",
          phone: raw.tenant?.phone || "",
          email: raw.tenant?.email || "",
        },
        student: {
          name: raw.student?.name || "",
          admissionNo: raw.student?.admissionNo || "",
          class: raw.student?.className || "",
          section: raw.student?.section || "",
          fatherName: raw.student?.fatherName || "",
          motherName: raw.student?.motherName || "",
          rollNo: raw.student?.rollNo || "",
          dob: raw.student?.dob || "",
          photo: raw.student?.photoUrl || "",
        },
        exam: {
          name: raw.exam?.name || "",
          type: raw.exam?.type || "",
          academicYear: raw.exam?.academicYear || "",
          resultType: raw.exam?.resultType || "BOTH",
        },
        subjects: (raw.subjectMarks || []).map((s: any) => ({
          subjectName: s.subjectName || "",
          maxMarks: s.maxMarks || 0,
          obtainedMarks: s.marksObtained,
          grade: s.grade || "-",
          status: s.status || "-",
          isAbsent: s.isAbsent || false,
        })),
        summary: raw.summary
          ? {
              totalMarks: raw.summary.totalMarks,
              totalMaxMarks: raw.summary.totalMaxMarks,
              percentage: raw.summary.percentage,
              grade: raw.summary.grade || "-",
              rank: raw.summary.rank,
              division: raw.summary.division || "-",
              result: raw.summary.status || "-",
            }
          : {
              totalMarks: 0,
              totalMaxMarks: 0,
              percentage: 0,
              grade: "-",
              rank: 0,
              division: "-",
              result: "-",
            },
      };

      setData(mapped);
    } catch (error) {
      toast.error("Failed to load report card");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getFullUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return `http://localhost:5000${path}`;
    return `http://localhost:5000/uploads/${path}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-gray-600">Loading report card...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Report card not found</h3>
          <button
            onClick={() => navigate(`/exams/${examId}/results`)}
            className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            ← Back to Results
          </button>
        </div>
      </div>
    );
  }

  const logoUrl = getFullUrl(data.school?.logo);
  const studentPhotoUrl = getFullUrl(data.student?.photo);

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white print:min-h-0">
      {/* Action Bar - Hidden on print */}
      <div className="print:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[850px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/exams/${examId}/results`)}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Report Card</h1>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Report Card
          </button>
        </div>
      </div>

      {/* Report Card Content */}
      <div className="max-w-[850px] mx-auto p-6 print:p-0 print:max-w-none print:mx-0">
        <div
          id="report-card-print"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            backgroundColor: "#fff",
            border: "3px solid #222",
            padding: "30px 40px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Watermark - School Logo */}
          {logoUrl && (
            <div
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 0,
              }}
            >
              <img
                src={logoUrl}
                alt=""
                style={{ opacity: 0.05, width: "350px", height: "350px", objectFit: "contain" }}
              />
            </div>
          )}

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1 }}>

            {/* ====== HEADER ====== */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
              {/* Logo Left */}
              <div style={{ width: "85px", flexShrink: 0 }}>
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="School Logo"
                    style={{ width: "75px", height: "75px", objectFit: "contain" }}
                  />
                )}
              </div>

              {/* School Name Center */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <h1 style={{ fontSize: "26px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px", margin: 0, fontFamily: "'Times New Roman', Times, serif" }}>
                  {data.school?.name || "School Name"}
                </h1>
                {data.school?.address && (
                  <p style={{ fontSize: "13px", margin: "2px 0 0 0", color: "#333" }}>
                    {data.school.address}
                  </p>
                )}
                {data.school?.phone && (
                  <p style={{ fontSize: "13px", margin: "1px 0 0 0", color: "#333" }}>
                    Phone No: {data.school.phone}
                  </p>
                )}
              </div>

              {/* Spacer for symmetry */}
              <div style={{ width: "85px", flexShrink: 0 }}></div>
            </div>

            {/* Thick Divider */}
            <hr style={{ border: "none", borderTop: "3px solid #000", margin: "6px 0 14px 0" }} />

            {/* Session & Title */}
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "15px", fontWeight: "bold", margin: 0 }}>
                Session : {data.exam?.academicYear || "—"}
              </p>
              <p style={{ fontSize: "13px", fontWeight: "600", margin: "3px 0 0 0" }}>
                Progress Report Card ({data.exam?.name || "Term"})
              </p>
            </div>

            {/* ====== STUDENT INFO with Photo ====== */}
            <div style={{ display: "flex", marginBottom: "18px" }}>
              {/* Left: Student fields */}
              <div style={{ flex: 1, fontSize: "12px", lineHeight: "2.4" }}>
                {/* Row 1 */}
                <div style={{ display: "flex" }}>
                  <div style={{ flex: 1, display: "flex" }}>
                    <span style={{ width: "115px", fontWeight: "500" }}>Student's Name</span>
                    <span style={{ width: "10px" }}>:</span>
                    <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                      {data.student?.name}
                    </span>
                  </div>
                  <div style={{ width: "24px" }}></div>
                  <div style={{ flex: 1, display: "flex" }}>
                    <span style={{ width: "105px", fontWeight: "500" }}>Admission No.</span>
                    <span style={{ width: "10px" }}>:</span>
                    <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                      {data.student?.admissionNo}
                    </span>
                  </div>
                </div>
                {/* Row 2 */}
                <div style={{ display: "flex" }}>
                  <div style={{ flex: 1, display: "flex" }}>
                    <span style={{ width: "115px", fontWeight: "500" }}>Father's Name</span>
                    <span style={{ width: "10px" }}>:</span>
                    <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                      {data.student?.fatherName}
                    </span>
                  </div>
                  <div style={{ width: "24px" }}></div>
                  <div style={{ flex: 1, display: "flex" }}>
                    <span style={{ width: "105px", fontWeight: "500" }}>Class / Section</span>
                    <span style={{ width: "10px" }}>:</span>
                    <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                      {data.student?.class}{data.student?.section ? `- ${data.student.section}` :""}
                    </span>
                  </div>
                </div>
                {/* Row 3 */}
                <div style={{ display: "flex" }}>
                  <div style={{ flex: 1, display: "flex" }}>
                    <span style={{ width: "115px", fontWeight: "500" }}>Mother's Name</span>
                    <span style={{ width: "10px" }}>:</span>
                    <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                      {data.student?.motherName || "—"}
                    </span>
                  </div>
                  <div style={{ width: "24px" }}></div>
                  <div style={{ flex: 1, display: "flex" }}>
                    <span style={{ width: "105px", fontWeight: "500" }}>Roll No</span>
                    <span style={{ width: "10px" }}>:</span>
                    <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                      {data.student?.rollNo || "—"}
                    </span>
                  </div>
                </div>
                {/* Row 4 */}
                <div style={{ display: "flex" }}>
                  <div style={{ flex: 1, display: "flex" }}>
                    <span style={{ width: "115px", fontWeight: "500" }}>Date of Birth</span>
                    <span style={{ width: "10px" }}>:</span>
                    <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                      {data.student?.dob || "—"}
                    </span>
                  </div>
                  <div style={{ width: "24px" }}></div>
                  <div style={{ flex: 1 }}></div>
                </div>
              </div>

              {/* Right: Student Photo */}
              <div style={{ width: "90px", marginLeft: "16px", flexShrink: 0 }}>
                {studentPhotoUrl ? (
                  <img
                    src={studentPhotoUrl}
                    alt="Student"
                    style={{
                      width: "80px",
                      height: "95px",
                      objectFit: "cover",
                      border: "1.5px solid #444",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "80px",
                      height: "95px",
                      border: "1.5px solid #444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      color: "#999",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    Photo
                  </div>
                )}
              </div>
            </div>

            {/* ====== SCHOLASTIC ACHIEVEMENT ====== */}
            <p style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", textDecoration: "underline" }}>
              Scholastic Achievement
            </p>

            {/* ====== MARKS TABLE ====== */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "2px solid #222", marginBottom: "12px", fontFamily: "'Times New Roman', Times, serif" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1.5px solid #333", padding: "6px 8px", textAlign: "left", fontWeight: "bold" }}>Subject</th>
                  <th style={{ border: "1.5px solid #333", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>Max Marks</th>
                  <th style={{ border: "1.5px solid #333", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>Marks Obtained</th>
                  <th style={{ border: "1.5px solid #333", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>Grade</th>
                  <th style={{ border: "1.5px solid #333", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects?.map((sub, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1.5px solid #333", padding: "5px 8px", fontWeight: "600", textTransform: "uppercase" }}>{sub.subjectName}</td>
                    <td style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center" }}>{sub.maxMarks}</td>
                    <td style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center", fontWeight: "bold" }}>
                      {sub.isAbsent ? "AB" : sub.obtainedMarks ?? "-"}
                    </td>
                    <td style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center", fontWeight: "600" }}>{sub.grade || "-"}</td>
                    <td style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center", fontWeight: "600", color: sub.status?.toLowerCase() === "pass" ? "#15803d" : "#b91c1c" }}>
                      {sub.isAbsent ? "ABSENT" : (sub.status?.toUpperCase() || "-")}
                    </td>
                  </tr>
                ))}
                {/* TOTAL MARKS */}
                <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                  <td style={{ border: "1.5px solid #333", padding: "5px 8px", fontWeight: "bold", textTransform: "uppercase" }}>Total Marks</td>
                  <td style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center" }}>{data.summary?.totalMaxMarks}</td>
                  <td style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center" }}>{data.summary?.totalMarks}</td>
                  <td style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center" }}>{data.summary?.grade}</td>
                  <td style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center" }}>{data.summary?.result?.toUpperCase()}</td>
                </tr>
                {/* PERCENTAGE */}
                <tr style={{ fontWeight: "bold" }}>
                  <td style={{ border: "1.5px solid #333", padding: "5px 8px", fontWeight: "bold", textTransform: "uppercase" }}>Percentage</td>
                  <td colSpan={4} style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center", fontWeight: "bold" }}>
                    {data.summary?.percentage?.toFixed(1)}%
                  </td>
                </tr>
                {/* DIVISION */}
                <tr style={{ fontWeight: "bold" }}>
                  <td style={{ border: "1.5px solid #333", padding: "5px 8px", fontWeight: "bold", textTransform: "uppercase" }}>Division</td>
                  <td colSpan={4} style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center", fontWeight: "bold" }}>
                    {data.summary?.division || "-"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ====== SUMMARY LINE ====== */}
            <div style={{ fontSize: "12px", marginBottom: "6px", display: "flex", gap: "40px" }}>
              <span>Total Marks: <b>{data.summary?.totalMarks} / {data.summary?.totalMaxMarks}</b></span>
              <span>Percentage: <b>{data.summary?.percentage?.toFixed(1)}%</b></span>
              <span>Rank: <b>{data.summary?.rank || "______"}</b></span>
            </div>

            {/* ====== REMARKS ====== */}
            <div style={{ marginBottom: "16px", fontSize: "12px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "4px" }}>Remarks:</p>
              <div style={{ border: "1.5px solid #444", minHeight: "36px", padding: "6px 10px" }}></div>
            </div>

            {/* ====== SIGNATURES ====== */}
            <div style={{ marginTop: "50px", display: "flex", justifyContent: "space-between", padding: "0 20px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ borderTop: "1.5px solid #222", paddingTop: "6px", width: "130px" }}>
                  <p style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", margin: 0 }}>Class Teacher</p>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ borderTop: "1.5px solid #222", paddingTop: "6px", width: "130px" }}>
                  <p style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", margin: 0 }}>Principal</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-card-print, #report-card-print * { visibility: visible !important; }
          #report-card-print {
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px 30px !important;
            border: 3px solid #222 !important;
            box-shadow: none !important;
          }
          body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          aside, nav, .sidebar, [class*="sidebar"], [class*="TopNavbar"] { display: none !important; }
          main, [class*="ml-64"], [class*="main-content"] { margin-left: 0 !important; padding: 0 !important; width: 100% !important; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default ReportCard;

