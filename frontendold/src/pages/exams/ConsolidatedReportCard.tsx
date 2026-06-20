
import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import PrintSignature from "../../components/PrintSignature";

// ============================================================
// Types
// ============================================================
interface TenantInfo {
  name: string;
  address: string;
  logoUrl: string;
  phone: string;
}

interface StudentInfo {
  name: string;
  admissionNo: string;
  className: string;
  section?: string;
  fatherName: string;
  motherName?: string;
  rollNo?: string;
  dob?: string;
  photoUrl?: string;
}

interface ExamInfo {
  id: string;
  name: string;
  type: string;
  totalMaxMarks: number;
}

interface ExamMarkEntry {
  examId: string;
  marks: number;
  maxMarks: number;
  grade: string | null;
  isAbsent: boolean;
}

interface SubjectReport {
  subjectName: string;
  examMarks: ExamMarkEntry[];
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  finalGrade: string | null;
}

interface GrandTotal {
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string | null;
  rank: number;
}

interface ReportData {
  tenant: TenantInfo;
  student: StudentInfo;
  academicYear: string;
  exams: ExamInfo[];
  subjects: SubjectReport[];
  grandTotal: GrandTotal;
}

// ============================================================
// API Config
// ============================================================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const getFullUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${path}`;
  return `/uploads/${path}`;
};

// ============================================================
// Component
// ============================================================
const ConsolidatedReportCard: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams] = useSearchParams();
  const academicYearId = searchParams.get("academicYearId") || "";
  const classId = searchParams.get("classId") || "";

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get(
          `/exam/consolidated-report/${studentId}`,
          { params: { academicYearId, classId } }
        );

        if (response.data.success) {
          setReportData(response.data.data);
        } else {
          setError(response.data.message || "Failed to fetch report");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message || err.message || "Failed to fetch consolidated report"
        );
      } finally {
        setLoading(false);
      }
    };
    if (studentId && academicYearId && classId) {
      fetchReport();
    }
  }, [studentId, academicYearId, classId]);

  const handlePrint = () => {
    window.print();
  };

  // ============================================================
  // Render States
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">Loading report card...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold text-lg mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No report data available.</p>
      </div>
    );
  }

  const { tenant, student, academicYear, exams, subjects, grandTotal } = reportData;
  const logoUrl = getFullUrl(tenant.logoUrl);
  const studentPhotoUrl = getFullUrl(student.photoUrl);

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <>
      {/* Print button */}
      <div className="print:hidden fixed top-4 right-4 z-50">
        <button
          onClick={handlePrint}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Print Report
        </button>
      </div>

      {/* Report Card Container */}
      <div
        ref={printRef}
        id="print-area"
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          maxWidth: "850px",
          margin: "30px auto",
          backgroundColor: "#fff",
          border: "3px solid #222",
          padding: "30px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Watermark */}
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
                {tenant.name}
              </h1>
              {tenant.address && (
                <p style={{ fontSize: "13px", margin: "2px 0 0 0", color: "#333" }}>
                  {tenant.address}
                </p>
              )}
              {tenant.phone && (
                <p style={{ fontSize: "13px", margin: "1px 0 0 0", color: "#333" }}>
                  Phone No: {tenant.phone}
                </p>
              )}
            </div>

            {/* Spacer */}
            <div style={{ width: "85px", flexShrink: 0 }}></div>
          </div>

          {/* Divider */}
          <hr style={{ border: "none", borderTop: "3px solid #000", margin: "6px 0 14px 0" }} />

          {/* Session & Title */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <p style={{ fontSize: "15px", fontWeight: "bold", margin: 0 }}>
              Session : {academicYear}
            </p>
            <p style={{ fontSize: "13px", fontWeight: "600", margin: "3px 0 0 0" }}>
              Progress Report Card (Annual)
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
                    {student.name}
                  </span>
                </div>
                <div style={{ width: "24px" }}></div>
                <div style={{ flex: 1, display: "flex" }}>
                  <span style={{ width: "105px", fontWeight: "500" }}>Admission No.</span>
                  <span style={{ width: "10px" }}>:</span>
                  <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                    {student.admissionNo}
                  </span>
                </div>
              </div>
              {/* Row 2 */}
              <div style={{ display: "flex" }}>
                <div style={{ flex: 1, display: "flex" }}>
                  <span style={{ width: "115px", fontWeight: "500" }}>Father's Name</span>
                  <span style={{ width: "10px" }}>:</span>
                  <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                    {student.fatherName}
                  </span>
                </div>
                <div style={{ width: "24px" }}></div>
                <div style={{ flex: 1, display: "flex" }}>
                  <span style={{ width: "105px", fontWeight: "500" }}>Class / Section</span>
                  <span style={{ width: "10px" }}>:</span>
                  <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                    {student.className}{student.section ? ` - ${student.section}` : ""}
                  </span>
                </div>
              </div>
              {/* Row 3 */}
              <div style={{ display: "flex" }}>
                <div style={{ flex: 1, display: "flex" }}>
                  <span style={{ width: "115px", fontWeight: "500" }}>Mother's Name</span>
                  <span style={{ width: "10px" }}>:</span>
                  <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                    {student.motherName || "—"}
                  </span>
                </div>
                <div style={{ width: "24px" }}></div>
                <div style={{ flex: 1, display: "flex" }}>
                  <span style={{ width: "105px", fontWeight: "500" }}>Roll No</span>
                  <span style={{ width: "10px" }}>:</span>
                  <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                    {student.rollNo || "—"}
                  </span>
                </div>
              </div>
              {/* Row 4 */}
              <div style={{ display: "flex" }}>
                <div style={{ flex: 1, display: "flex" }}>
                  <span style={{ width: "115px", fontWeight: "500" }}>Date of Birth</span>
                  <span style={{ width: "10px" }}>:</span>
                  <span style={{ flex: 1, borderBottom: "1px solid #555", fontWeight: "700", paddingLeft: "6px" }}>
                    {student.dob || "—"}
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
          <div style={{ overflowX: "auto", marginBottom: "12px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", border: "2px solid #222", fontFamily: "'Times New Roman', Times, serif" }}>
              <thead>
                {/* Row 1 */}
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th
                    rowSpan={2}
                    style={{ border: "1.5px solid #333", padding: "5px 6px", textAlign: "left", fontWeight: "bold", verticalAlign: "middle", width: "100px" }}
                  >
                    Subject
                  </th>
                  {exams.map((exam) => (
                    <th
                      key={exam.id}
                      style={{ border: "1.5px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "bold" }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: "bold" }}>{exam.name}</div>
                      <div style={{ fontSize: "9px", fontWeight: "normal", fontStyle: "italic", color: "#555" }}>
                        Marks Obtained
                      </div>
                    </th>
                  ))}
                  <th
                    colSpan={2}
                    style={{ border: "1.5px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "bold" }}
                  >
                    Grand Total
                  </th>
                </tr>
                {/* Row 2: Grand Total sub-headers */}
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1.5px solid #333", padding: "3px", textAlign: "center", fontSize: "9px", fontWeight: "bold", fontStyle: "italic" }}>
                    Full Marks
                  </th>
                  <th style={{ border: "1.5px solid #333", padding: "3px", textAlign: "center", fontSize: "9px", fontWeight: "bold", fontStyle: "italic" }}>
                    Marks Obtained
                  </th>
                </tr>
              </thead>

              <tbody>
                {subjects.map((subject, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1.5px solid #333", padding: "4px 6px", fontWeight: "600", textTransform: "uppercase" }}>
                      {subject.subjectName}
                    </td>
                    {subject.examMarks.map((em, emIdx) => (
                      <td key={emIdx} style={{ border: "1.5px solid #333", padding: "4px 3px", textAlign: "center" }}>
                        {em.isAbsent ? (
                          <span style={{ color: "#b91c1c", fontWeight: "600" }}>AB</span>
                        ) : (
                          <span>{em.marks ?? "-"}</span>
                        )}
                      </td>
                    ))}
                    <td style={{ border: "1.5px solid #333", padding: "4px 3px", textAlign: "center" }}>
                      {subject.totalMaxMarks}
                    </td>
                    <td style={{ border: "1.5px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "bold" }}>
                      {subject.totalMarks}
                    </td>
                  </tr>
                ))}

                {/* TOTAL MARKS */}
                <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                  <td style={{ border: "1.5px solid #333", padding: "4px 6px", fontWeight: "bold", textTransform: "uppercase" }}>
                    Total Marks
                  </td>
                  {exams.map((exam) => {
                    let examTotal = 0;
                    subjects.forEach((subject) => {
                      const mark = subject.examMarks.find((em) => em.examId === exam.id);
                      if (mark && !mark.isAbsent && mark.marks !== null) examTotal += mark.marks;
                    });
                    return (
                      <td key={`total-${exam.id}`} style={{ border: "1.5px solid #333", padding: "4px 3px", textAlign: "center" }}>
                        {examTotal}
                      </td>
                    );
                  })}
                  <td style={{ border: "1.5px solid #333", padding: "4px 3px", textAlign: "center" }}>
                    {grandTotal.totalMaxMarks}
                  </td>
                  <td style={{ border: "1.5px solid #333", padding: "4px 3px", textAlign: "center" }}>
                    {grandTotal.totalMarks}
                  </td>
                </tr>

                {/* PERCENTAGE */}
                <tr style={{ fontWeight: "bold" }}>
                  <td style={{ border: "1.5px solid #333", padding: "4px 6px", fontWeight: "bold", textTransform: "uppercase" }}>
                    Percentage
                  </td>
                  {exams.map((exam) => {
                    let examTotal = 0;
                    let examMax = 0;
                    subjects.forEach((subject) => {
                      const mark = subject.examMarks.find((em) => em.examId === exam.id);
                      if (mark) {
                        examMax += mark.maxMarks;
                        if (!mark.isAbsent && mark.marks !== null) examTotal += mark.marks;
                      }
                    });
                    const pct = examMax > 0 ? ((examTotal / examMax) * 100).toFixed(1) : "0";
                    return (
                      <td key={`pct-${exam.id}`} style={{ border: "1.5px solid #333", padding: "4px 3px", textAlign: "center" }}>
                        {pct}%
                      </td>
                    );
                  })}
                  <td colSpan={2} style={{ border: "1.5px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "bold" }}>
                    {grandTotal.percentage}%
                  </td>
                </tr>

                {/* DIVISION */}
                <tr>
                  <td style={{ border: "1.5px solid #333", padding: "4px 6px", fontWeight: "bold", textTransform: "uppercase" }}>
                    Division
                  </td>
                  <td colSpan={exams.length + 2} style={{ border: "1.5px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "bold" }}>
                    {grandTotal.grade || "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ====== SUMMARY ====== */}
          <div style={{ fontSize: "12px", marginBottom: "6px", display: "flex", gap: "40px" }}>
            <span>Total Marks: <b>{grandTotal.totalMarks} / {grandTotal.totalMaxMarks}</b></span>
            <span>Percentage: <b>{grandTotal.percentage}%</b></span>
            <span>Rank: <b>{grandTotal.rank || "______"}</b></span>
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
              <PrintSignature inline printOnly={false} />
            </div>
          </div>

        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area {
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
          table { font-size: 10px; }
        }
      `}</style>
    </>
  );
};

export default ConsolidatedReportCard;

