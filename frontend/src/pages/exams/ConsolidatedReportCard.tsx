
import { getFullUrl } from "../../utils/url";
import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL as CENTRAL_API_URL } from "../../config/api";
import ScaleToFit from "../../components/ScaleToFit";
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
  obtainedMarks?: number;
  percentage?: number;
  grade?: string | null;
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
const API_BASE_URL = `${CENTRAL_API_URL}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});


// ============================================================
// Component
// ============================================================
const ConsolidatedReportCard: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const academicYearId = searchParams.get("academicYearId") || "";
  const classId = searchParams.get("classId") || "";

  // Template toggle — "consolidated-grade" (default) shows grades,
  // "consolidated-no-grade" hides all grade columns/rows.
  const template = searchParams.get("template") || "consolidated-grade";
  const showGrade = !template.includes("no-grade");

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [schoolNameColor, setSchoolNameColor] = useState<string>("#167d3f");
  const printRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isMobile] = useState(() =>
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768
  );

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
    if (isMobile) {
      // Mobile: direct print (no popup — popups are blocked on mobile)
      window.print();
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    const el = printRef.current;
    if (!el) return;

    setDownloadingPdf(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Consolidated-Report-${reportData?.student?.name || "student"}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setDownloadingPdf(false);
    }
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
  // Main Render — R.M.S. Academy style
  // ============================================================
  const pct = Number(grandTotal.percentage) || 0;
  const divisionLabel = pct >= 60 ? "I" : pct >= 45 ? "II" : pct >= 33 ? "III" : "—";

  return (
    <>
      {/* Print/Download buttons */}
      <div className="print:hidden fixed top-4 right-4 z-[100] flex items-center gap-2">
        {isMobile && (
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {downloadingPdf ? "..." : "PDF"}
          </button>
        )}
        <button
          onClick={handlePrint}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          {isMobile ? "Print" : "Print Report"}
        </button>
      </div>

      {/* Template Selector (With / Without Grade) — hidden on print */}
      <div className="print:hidden max-w-[850px] mx-auto px-6 pt-4">
        <div className="mb-2 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Template:</label>
          <select
            value={template}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              next.set("template", e.target.value);
              setSearchParams(next);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="consolidated-grade">Consolidated (With Grade)</option>
            <option value="consolidated-no-grade">Consolidated (Without Grade)</option>
          </select>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={showWatermark}
              onChange={(e) => setShowWatermark(e.target.checked)}
              className="w-4 h-4 accent-primary-600"
            />
            Watermark
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer ml-2">
            School Name Color:
            <input
              type="color"
              value={schoolNameColor}
              onChange={(e) => setSchoolNameColor(e.target.value)}
              className="w-8 h-8 p-0 border border-gray-300 rounded cursor-pointer"
              title="Pick school name color"
            />
          </label>
        </div>
      </div>

      {/* Report Card Container */}
      <div style={{ padding: "72px 0 30px" }}>
       <ScaleToFit contentWidth={850}>
        <div
          ref={printRef}
          id="print-area"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            width: "850px",
            backgroundColor: "#fff",
            border: "2px solid #111",
            padding: "22px 26px",
            position: "relative",
            overflow: "hidden",
            color: "#111",
          }}
        >
        {/* Watermark — real <img> that ALWAYS prints (independent of the browser's
            "Background graphics" option). Centered with transform and constrained
            by max-width/height so the whole logo always shows — never cut, never repeated. */}
        {logoUrl && showWatermark && (
          <img
            className="report-watermark"
            src={logoUrl}
            alt=""
            style={{
              position: "absolute",
              top: "26%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "auto",
              height: "auto",
              maxWidth: "70%",
              maxHeight: "60%",
              opacity: 0.08,
              objectFit: "contain",
              pointerEvents: "none",
              zIndex: 5,
            }}
          />
        )}

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* ====== HEADER ====== */}
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {/* Logo Left */}
            <div style={{ width: "95px", flexShrink: 0, paddingTop: "4px" }}>
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="School Logo"
                  loading="lazy"
                  style={{ width: "80px", height: "80px", objectFit: "contain" }}
                />
              )}
            </div>

            {/* School Name Center */}
            <div style={{ flex: 1, textAlign: "center" }}>
              <h1 className="school-name-title" style={{ fontSize: "40px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", margin: 0, ["--school-color" as any]: schoolNameColor, color: schoolNameColor, lineHeight: 1.05 }}>
                {tenant.name}
              </h1>
              {tenant.address && (
                <p style={{ fontSize: "13px", margin: "4px 0 0 0", color: "#222", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {tenant.address}
                </p>
              )}
              <p style={{ fontSize: "17px", margin: "6px 0 0 0", color: "#167d3f", fontWeight: "bold" }}>
                Progress Report (Annual)
              </p>
              <p style={{ fontSize: "16px", margin: "2px 0 0 0", color: "#444", fontWeight: 600 }}>
                Session : {academicYear}
              </p>
            </div>

            {/* Student Photo Right */}
            <div style={{ width: "95px", flexShrink: 0, textAlign: "right" }}>
              {studentPhotoUrl ? (
                <img
                  src={studentPhotoUrl}
                  alt="Student"
                  loading="lazy"
                  style={{ width: "82px", height: "98px", objectFit: "cover", border: "1px solid #444" }}
                />
              ) : (
                <div style={{ width: "82px", height: "98px", border: "1px solid #444", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: "#999", backgroundColor: "#f9f9f9" }}>
                  Photo
                </div>
              )}
            </div>
          </div>

          {/* ====== STUDENT INFO ====== */}
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: "13px", lineHeight: "1.9", marginTop: "10px", marginBottom: "8px", border: "1.5px solid #111", padding: "8px 14px" }}>
            {[
              ["Name of the Student", student.name, "Class", `${student.className}${student.section ? ` ${student.section}` : ""}`],
              ["Admission Number", student.admissionNo, "Roll No.", student.rollNo || ""],
              ["Date of Birth", student.dob || "", "House", "NA"],
              ["Father's Name", student.fatherName, "Mother's Name", student.motherName || ""],
            ].map(([lLabel, lVal, rLabel, rVal], i) => (
              <React.Fragment key={i}>
                <div style={{ width: "50%", display: "flex", paddingRight: "12px" }}>
                  <span style={{ width: "150px", fontWeight: "bold" }}>{lLabel}</span>
                  <span style={{ width: "10px" }}>:</span>
                  <span style={{ flex: 1, fontWeight: "bold", color: "#1d3b8b", paddingLeft: "6px" }}>{lVal}</span>
                </div>
                <div style={{ width: "50%", display: "flex", paddingLeft: "12px" }}>
                  <span style={{ width: "120px", fontWeight: "bold" }}>{rLabel}</span>
                  <span style={{ width: "10px" }}>:</span>
                  <span style={{ flex: 1, fontWeight: "bold", color: "#1d3b8b", paddingLeft: "6px" }}>{rVal}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* ====== ACADEMIC ACHIEVEMENTS ====== */}
          <p style={{ fontSize: "15px", fontWeight: "bold", margin: "8px 0 6px 0", color: "#1d3b8b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Academic Achievements
          </p>

          {/* ====== MARKS TABLE ====== */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1.5px solid #111", fontFamily: "'Times New Roman', Times, serif" }}>
              <thead>
                {/* Row 1: Subject | each exam name | Grand Total */}
                <tr>
                  <th rowSpan={3} style={{ border: "1px solid #333", padding: "5px 6px", textAlign: "left", fontWeight: "bold", verticalAlign: "middle", width: "110px" }}>
                    SUBJECT
                  </th>
                  {exams.map((exam) => (
                    <th key={exam.id} colSpan={showGrade ? 2 : 1} style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "bold" }}>
                      {exam.name}
                    </th>
                  ))}
                  <th colSpan={showGrade ? 3 : 2} style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "bold" }}>
                    Grand Total
                  </th>
                </tr>
                {/* Row 2: "Marks Obtained" (+ Grade) under each exam + Grand Total headers */}
                <tr>
                  {exams.map((exam) => (
                    <React.Fragment key={`mo-${exam.id}`}>
                      <th style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "10px", fontWeight: "bold" }}>
                        Marks Obtained
                      </th>
                      {showGrade && (
                        <th style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "10px", fontWeight: "bold" }}>
                          Grade
                        </th>
                      )}
                    </React.Fragment>
                  ))}
                  <th style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "10px", fontWeight: "bold" }}>Maximum Marks</th>
                  <th style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "10px", fontWeight: "bold" }}>Marks Obtained</th>
                  {showGrade && (
                    <th style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "10px", fontWeight: "bold" }}>Grade</th>
                  )}
                </tr>
                {/* Row 3: max marks per exam e.g. (20) + Total/Total */}
                <tr>
                  {exams.map((exam) => {
                    const first = subjects[0]?.examMarks.find((em) => em.examId === exam.id);
                    const examMax = first?.maxMarks ?? exam.totalMaxMarks ?? 0;
                    return (
                      <React.Fragment key={`mx-${exam.id}`}>
                        <th style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "10px", fontWeight: "bold" }}>
                          ({examMax})
                        </th>
                        {showGrade && (
                          <th style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "10px", fontWeight: "bold" }}></th>
                        )}
                      </React.Fragment>
                    );
                  })}
                  <th style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "10px", fontWeight: "bold" }}>Total</th>
                  <th style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "10px", fontWeight: "bold" }}>Total</th>
                  {showGrade && (
                    <th style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "10px", fontWeight: "bold" }}>Total</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {subjects.map((subject, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #333", padding: "4px 6px", fontWeight: "600", textTransform: "uppercase" }}>
                      {subject.subjectName}
                    </td>
                    {exams.map((exam) => {
                      const em = subject.examMarks.find((x) => x.examId === exam.id);
                      return (
                        <React.Fragment key={exam.id}>
                          <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center" }}>
                            {em?.isAbsent ? (
                              <span style={{ color: "#b91c1c", fontWeight: "600" }}>AB</span>
                            ) : (
                              <span>{em?.marks ?? "-"}</span>
                            )}
                          </td>
                          {showGrade && (
                            <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "600" }}>
                              {em?.isAbsent ? "AB" : (em?.grade || "—")}
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                    <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center" }}>
                      {subject.totalMaxMarks}
                    </td>
                    <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "bold" }}>
                      {subject.totalMarks}
                    </td>
                    {showGrade && (
                      <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "600" }}>
                        {subject.finalGrade || "—"}
                      </td>
                    )}
                  </tr>
                ))}

                {/* TOTAL */}
                <tr style={{ fontWeight: "bold" }}>
                  <td style={{ border: "1px solid #333", padding: "4px 6px", fontWeight: "bold", textAlign: "center", textTransform: "uppercase" }}>
                    Total
                  </td>
                  {exams.map((exam) => {
                    let examTotal = 0;
                    subjects.forEach((subject) => {
                      const mark = subject.examMarks.find((em) => em.examId === exam.id);
                      if (mark && !mark.isAbsent && mark.marks !== null) examTotal += mark.marks;
                    });
                    return (
                      <React.Fragment key={`total-${exam.id}`}>
                        <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center" }}>{examTotal}</td>
                        {showGrade && (
                          <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "bold" }}>{exam.grade || "—"}</td>
                        )}
                      </React.Fragment>
                    );
                  })}
                  <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center" }}>{grandTotal.totalMaxMarks}</td>
                  <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center" }}>{grandTotal.totalMarks}</td>
                  {showGrade && (
                    <td style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "bold" }}>{grandTotal.grade || "—"}</td>
                  )}
                </tr>

                {/* PERCENTAGE */}
                <tr style={{ fontWeight: "bold" }}>
                  <td style={{ border: "1px solid #333", padding: "4px 6px", fontWeight: "bold", textAlign: "center", textTransform: "uppercase" }}>
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
                    const p = examMax > 0 ? ((examTotal / examMax) * 100).toFixed(2) : "0";
                    return (
                      <td key={`pct-${exam.id}`} colSpan={showGrade ? 2 : 1} style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center" }}>{p}%</td>
                    );
                  })}
                  <td colSpan={showGrade ? 3 : 2} style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center", fontWeight: "bold" }}>
                    {grandTotal.percentage}%
                  </td>
                </tr>

                {/* DIVISION */}
                <tr style={{ fontWeight: "bold" }}>
                  <td style={{ border: "1px solid #333", padding: "4px 6px", fontWeight: "bold", textAlign: "center", textTransform: "uppercase" }}>
                    Division
                  </td>
                  {exams.map((exam) => (
                    <td key={`div-${exam.id}`} colSpan={showGrade ? 2 : 1} style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center" }}>{divisionLabel}</td>
                  ))}
                  <td colSpan={showGrade ? 3 : 2} style={{ border: "1px solid #333", padding: "4px 3px", textAlign: "center" }}>{divisionLabel}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ====== REMARK + ATTENDANCE ====== */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1.5px solid #111", borderTop: "none" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #333", padding: "4px 6px", fontWeight: "bold", width: "55%", textAlign: "center", backgroundColor: "#fff" }}>
                  Class Teacher's Remark
                </td>
                <td colSpan={2} style={{ border: "1px solid #333", padding: "4px 6px", fontWeight: "bold", textAlign: "center", backgroundColor: "#fff" }}>
                  Attendance
                </td>
              </tr>
              <tr>
                <td rowSpan={2} style={{ border: "1px solid #333", padding: "6px 10px", verticalAlign: "top", height: "54px" }}></td>
                <td style={{ border: "1px solid #333", padding: "4px 8px", fontWeight: 600, width: "30%" }}>Total Working Days</td>
                <td style={{ border: "1px solid #333", padding: "4px 8px", textAlign: "center" }}></td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #333", padding: "4px 8px", fontWeight: 600 }}>Total Presents</td>
                <td style={{ border: "1px solid #333", padding: "4px 8px", textAlign: "center" }}></td>
              </tr>
            </tbody>
          </table>

          {/* ====== RESULT STRIP ====== */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1.5px solid #111", borderTop: "none" }}>
            <tbody>
              <tr style={{ backgroundColor: "#fff", fontWeight: "bold" }}>
                <td style={{ border: "1px solid #333", padding: "4px 6px", textAlign: "center" }}>Overall Marks</td>
                <td style={{ border: "1px solid #333", padding: "4px 6px", textAlign: "center" }}>Percentage</td>
                <td style={{ border: "1px solid #333", padding: "4px 6px", textAlign: "center" }}>Result</td>
                <td style={{ border: "1px solid #333", padding: "4px 6px", textAlign: "center" }}>Overall Grade</td>
                <td style={{ border: "1px solid #333", padding: "4px 6px", textAlign: "center" }}>Rank</td>
              </tr>
              <tr style={{ fontWeight: "bold", color: "#1d3b8b" }}>
                <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>{grandTotal.totalMarks} / {grandTotal.totalMaxMarks}</td>
                <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>{grandTotal.percentage}%</td>
                <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>{pct >= 33 ? "Pass" : "Fail"}</td>
                <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>{showGrade ? (grandTotal.grade || "—") : "—"}</td>
                <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>{grandTotal.rank || ""}</td>
              </tr>
            </tbody>
          </table>

          {/* ====== DATE + SIGNATURES ====== */}
          <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 10px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1.5px solid #222", paddingTop: "6px", width: "140px" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", margin: 0 }}>Class Teacher</p>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <PrintSignature inline printOnly={false} />
            </div>
          </div>

        </div>
        </div>
       </ScaleToFit>
      </div>

      {/* Print Styles */}
      <style>{`
        /* School name color must win over the global "#print-area h1 { color:#000 !important }" rule */
        #print-area h1.school-name-title { color: var(--school-color) !important; }
        /* Cream header cells to match the original R.M.S. report card */
        #print-area thead th { background-color: #d9d9d9 !important; color: #000 !important; }
        /* Force all body rows white — kill any global zebra/alternate-row striping */
        #print-area tbody tr,
        #print-area tbody tr td { background-color: #ffffff !important; }
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          .scale-to-fit-box { width: auto !important; height: auto !important; }
          .scale-to-fit-content { width: 100% !important; transform: none !important; }
          #print-area {
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px 26px !important;
            border: 2px solid #111 !important;
            box-shadow: none !important;
            min-width: unset !important;
          }
          body { margin: 0 !important; padding: 0 !important; }
          aside, nav, .sidebar, [class*="sidebar"], [class*="TopNavbar"] { display: none !important; }
          main, [class*="ml-64"], [class*="main-content"] { margin-left: 0 !important; padding: 0 !important; width: 100% !important; }
          tr { page-break-inside: avoid; }
          table { font-size: 10px; }
          /* Watermark stays centered inside the report card (same as on screen),
             always visible whether or not "Background graphics" is enabled. */
          .report-watermark {
            position: absolute !important;
            top: 26% !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: auto !important;
            height: auto !important;
            max-width: 60% !important;
            max-height: 50% !important;
            opacity: 0.08 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
};

export default ConsolidatedReportCard;
