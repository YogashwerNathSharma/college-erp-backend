
import { getFullUrl } from "../../utils/url";
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, Loader2, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import PrintSignature from "../../components/PrintSignature";

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
  const YN_UDP_API = window.location.hostname !== "localhost"
  ? "https://yn-udp.onrender.com/api"
  : "http://localhost:5001/api";

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const template = searchParams.get("template") || "annual-grade";
  const showGrade = !template.includes("no-grade");
  const templateTitle = template.startsWith("half-yearly") ? "Half Yearly Examination" : template.startsWith("consolidated") ? "Consolidated Report" : "Annual Examination";
  const { examId, studentId } = useParams<{
    examId: string;
    studentId: string;
  }>();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [data, setData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customTemplate, setCustomTemplate] = useState<any>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isMobile] = useState(() =>
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768
  );
  const customTemplateId = searchParams.get("customTemplate");

  useEffect(() => {
    if (!examId || !studentId) return;
    
    // Run both fetches in parallel for faster loading
    const promises: Promise<any>[] = [fetchReportCard()];
    
    if (customTemplateId) {
      promises.push(
      axios.get(`${YN_UDP_API}/templates/${customTemplateId}`, { headers })
        .then((res) => {
          const tmpl = res.data?.data || res.data;
          setCustomTemplate(tmpl);
        })
        .catch((err) => console.error("Failed to load custom template:", err))
      );
    }
    
    Promise.all(promises);
  }, [examId, studentId, customTemplateId]);

  const fetchReportCard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/exam/${examId}/report-card/${studentId}`,
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
    if (isMobile) {
      // Mobile: Open report card in a new clean window and print
      const printContent = document.getElementById("report-card-print");
      if (!printContent) return;

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        // Popup blocked, fall back to download
        toast.error("Please allow popups for printing, or use Download PDF.");
        return;
      }

      printWindow.document.write(`
        <html>
        <head><title>Report Card - ${data?.student?.name || "Student"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="format-detection" content="telephone=no">
        <style>
          body { margin: 0; padding: 20px; font-family: 'Times New Roman', Times, serif; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          table { border-collapse: collapse; width: 100%; }
          @media print {
            body { margin: 0; padding: 15px; }
          }
        </style>
        </head>
        <body>${printContent.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();

      // Give mobile browsers more time to render content + images
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.error("Print failed:", e);
        }
        // Don't auto-close on mobile — let user close after printing
      }, 1000);
    } else {
      // Desktop: normal print
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    const printContent = document.getElementById("report-card-print");
    if (!printContent) return;

    setDownloadingPdf(true);
    try {
      const canvas = await html2canvas(printContent, {
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
      pdf.save(`Report-Card-${data?.student?.name || "student"}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF. Try using Print instead.");
    } finally {
      setDownloadingPdf(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
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
            className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            ← Back to Results
          </button>
        </div>
      </div>
    );
  }

  const logoUrl = getFullUrl(data.school?.logo);
  const studentPhotoUrl = getFullUrl(data.student?.photo);

  // Custom Template Renderer using Canvas
  if (customTemplate && customTemplate.canvasJSON) {
    const elements = customTemplate.canvasJSON.elements || [];
    const pageW = customTemplate.pageWidth || 794;
    const pageH = customTemplate.pageHeight || 1123;
    const pageBg = customTemplate.canvasJSON.pageBg || "#ffffff";

    // Replace placeholders with actual student data
    const placeholderMap: Record<string, string> = {
      // School
      school_name: data.school.name || "",
      school_address: data.school.address || "",
      school_phone: data.school.phone || "",
      school_email: data.school.email || "",
      // Student
      student_name: data.student.name || "",
      name: data.student.name || "",
      admission_no: data.student.admissionNo || "",
      adm_no: data.student.admissionNo || "",
      class_name: data.student.class || "",
      class: data.student.class || "",
      section_name: data.student.section || "",
      section: data.student.section || "",
      father_name: data.student.fatherName || "",
      mother_name: data.student.motherName || "",
      roll_no: data.student.rollNo || "",
      roll_number: data.student.rollNo || "",
      dob: data.student.dob || "",
      date_of_birth: data.student.dob || "",
      // Exam
      exam_name: data.exam.name || "",
      exam_type: data.exam.type || "",
      academic_year: data.exam.academicYear || "",
      session: data.exam.academicYear || "",
      // Summary
      total_marks: `${data.summary.totalMarks}/${data.summary.totalMaxMarks}`,
      total_obtained: String(data.summary.totalMarks || 0),
      total_max: String(data.summary.totalMaxMarks || 0),
      percentage: data.summary.percentage?.toFixed(1) || "0",
      grade: data.summary.grade || "",
      division: data.summary.division || "",
      rank: String(data.summary.rank || ""),
      status: data.summary.result || "",
      result: data.summary.result || "",
      result_status: data.summary.result || "",
      remarks: data.summary.result === "PASS" ? "Promoted to next class" : "Needs improvement",
      // Marks table (text version)
      marks_table: data.subjects.map(s => `${s.subjectName}: ${s.obtainedMarks ?? "AB"}/${s.maxMarks}`).join("\n"),
    };

    const fillPlaceholder = (text: string, subjectIndex?: number): string => {
      if (!text) return text;
      let result = text;
      // If this is a repeating subject row, fill subject-specific placeholders
      if (subjectIndex !== undefined && data.subjects[subjectIndex]) {
        const subj = data.subjects[subjectIndex];
        result = result
          .replace(/\{\{subject_name\}\}/g, subj.subjectName || "")
          .replace(/\{\{max_marks\}\}/g, String(subj.maxMarks || ""))
          .replace(/\{\{marks_obtained\}\}/g, subj.obtainedMarks !== null ? String(subj.obtainedMarks) : "AB")
          .replace(/\{\{obtained_marks\}\}/g, subj.obtainedMarks !== null ? String(subj.obtainedMarks) : "AB")
          .replace(/\{\{subject_grade\}\}/g, subj.grade || "")
          .replace(/\{\{subject_status\}\}/g, subj.status || "");
      }
      // Replace all general placeholders
      result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return placeholderMap[key] !== undefined ? placeholderMap[key] : match;
      });
      return result;
    };

    // Detect repeating subject rows in template elements
    const hasSubjectPlaceholder = (el: any) => {
      const text = el.text || "";
      return text.includes("{{subject_name}}") || text.includes("{{max_marks}}") || text.includes("{{marks_obtained}}") || text.includes("{{obtained_marks}}");
    };

    // Expand template: for each element with subject placeholders, create copies for each subject
    const expandedElements: any[] = [];
    const subjectRowElements: any[] = [];
    let subjectRowBaseY = 0;
    let subjectRowHeight = 30;
    
    elements.forEach((el: any) => {
      if (hasSubjectPlaceholder(el)) {
        if (subjectRowElements.length === 0) {
          subjectRowBaseY = el.y;
          subjectRowHeight = el.height || 30;
        }
        subjectRowElements.push(el);
      } else {
        expandedElements.push(el);
      }
    });

    // Now duplicate subject row elements for each subject
    const finalElements: any[] = [];
    let yOffset = 0;

    expandedElements.forEach((el: any) => {
      // If this element is BELOW the subject rows, shift it down based on actual number of subjects
      if (subjectRowElements.length > 0 && el.y > subjectRowBaseY) {
        const extraRows = Math.max(0, data.subjects.length - 1); // -1 because template already has 1 row
        finalElements.push({ ...el, y: el.y + (extraRows * subjectRowHeight) });
      } else {
        finalElements.push(el);
      }
    });

    // Insert subject rows
    if (subjectRowElements.length > 0) {
      data.subjects.forEach((subj, sIdx) => {
        subjectRowElements.forEach((el: any) => {
          finalElements.push({
            ...el,
            id: `${el.id}_subj_${sIdx}`,
            y: subjectRowBaseY + (sIdx * subjectRowHeight),
            _subjectIndex: sIdx,
          });
        });
      });
    }

    return (
      <div className="min-h-screen bg-gray-100 print:bg-white print:min-h-0">
        {/* Action Bar */}
        <div className="print:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-[850px] mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => navigate(`/exams/${examId}/results`)} className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Report Card - {customTemplate.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              {isMobile && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 shadow-sm disabled:opacity-50"
                >
                  {downloadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  {downloadingPdf ? "Generating..." : "Download PDF"}
                </button>
              )}
              <button onClick={handlePrint} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 shadow-sm">
                <Printer className="w-4 h-4 mr-2" />
                {isMobile ? "Print" : "Print Report"}
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Render */}
        <div className="mx-auto py-4 md:py-8 print:py-0 print:max-w-none" style={{
          maxWidth: '850px',
          overflowX: isMobile ? 'auto' : undefined,
          WebkitOverflowScrolling: isMobile ? 'touch' : undefined,
        }}>
          <div id="report-card-print" className="bg-white shadow-lg print:shadow-none mx-auto" style={{ 
            width: pageW, minHeight: pageH, position: "relative", background: pageBg,
            transform: isMobile ? `scale(${Math.min(1, (window.innerWidth - 32) / pageW)})` : undefined,
            transformOrigin: isMobile ? 'top left' : undefined,
          }}>
            {finalElements.map((el: any, idx: number) => {
              const style: React.CSSProperties = {
                position: "absolute",
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                opacity: el.opacity ?? 1,
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              };

              if (el.type === "rect") {
                return (
                  <div key={idx} style={{
                    ...style,
                    backgroundColor: el.fill || "transparent",
                    border: el.stroke && el.stroke !== "transparent" ? `${el.strokeWidth || 1}px solid ${el.stroke}` : undefined,
                    borderRadius: el.borderRadius || 0,
                  }} />
                );
              }

              if (el.type === "text" || el.type === "field") {
                // Handle logo placeholder as image
                const rawText = (el.text || "").trim();
                if (rawText.includes("{{school_logo}}") || rawText.includes("{{logo}}") || rawText === "school_logo") {
                  const logoSrc = getFullUrl(data.school?.logo);
                  if (logoSrc) {
                    return <img key={idx} src={logoSrc} alt="Logo" style={{ ...style, objectFit: "contain" }} />;
                  }
                  return null;
                }
                // Handle student photo placeholder as image
                if (rawText.includes("{{student_photo}}") || rawText.includes("{{photo}}")) {
                  const photoSrc = getFullUrl(data.student?.photo);
                  if (photoSrc) {
                    return <img key={idx} src={photoSrc} alt="Photo" style={{ ...style, objectFit: "cover", borderRadius: 4 }} />;
                  }
                  return <div key={idx} style={{ ...style, border: "1px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#999" }}>Photo</div>;
                }
                const displayText = fillPlaceholder(el.text || "", el._subjectIndex);
                return (
                  <div key={idx} style={{
                    ...style,
                    fontSize: el.fontSize || 12,
                    fontWeight: el.fontWeight || "normal",
                    fontFamily: el.fontFamily || "Arial, sans-serif",
                    color: el.color || "#000000",
                    textAlign: (el.textAlign as any) || "left",
                    display: "flex",
                    alignItems: "flex-start",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.4,
                    overflow: "hidden",
                  }}>
                    {displayText}
                  </div>
                );
              }

              if (el.type === "circle") {
                return (
                  <div key={idx} style={{
                    ...style,
                    borderRadius: "50%",
                    backgroundColor: el.fill || "transparent",
                    border: el.stroke && el.stroke !== "transparent" ? `${el.strokeWidth || 1}px solid ${el.stroke}` : undefined,
                  }} />
                );
              }

              if (el.type === "line") {
                return (
                  <div key={idx} style={{
                    ...style,
                    height: el.strokeWidth || 2,
                    backgroundColor: el.stroke || el.fill || "#000000",
                  }} />
                );
              }

              if (el.type === "image" && el.src) {
                return <img key={idx} src={el.src} style={{ ...style, objectFit: "contain" }} alt="" />;
              }

              return null;
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white print:min-h-0">
      {/* Action Bar - Hidden on print */}
      <div className="print:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-[100]">
        <div className="max-w-[850px] mx-auto px-3 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/exams/${examId}/results`)}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Report Card</h1>
          </div>
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {downloadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {downloadingPdf ? "Generating..." : "Download PDF"}
              </button>
            )}
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              {isMobile ? "Print" : "Print Report Card"}
            </button>
          </div>
        </div>
      </div>

      {/* Template Selector - Hidden on print */}
      <div className="print:hidden max-w-[850px] mx-auto px-6 pt-4">
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Template:</label>
          <select
            value={template}
            onChange={(e) => {
              setSearchParams({ template: e.target.value });
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="half-yearly-grade">Half Yearly (With Grade)</option>
            <option value="half-yearly-no-grade">Half Yearly (Without Grade)</option>
            <option value="annual-grade">Annual (With Grade)</option>
            <option value="annual-no-grade">Annual (Without Grade)</option>
            <option value="consolidated-grade">Consolidated (With Grade)</option>
            <option value="consolidated-no-grade">Consolidated (Without Grade)</option>
          </select>
        </div>
      </div>

      {/* Report Card Content */}
      <div className="mx-auto p-2 md:p-6 print:p-0 print:max-w-none print:mx-0" style={{ maxWidth: '850px' }}>
        <div
          id="report-card-print"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            backgroundColor: "#fff",
            border: "3px solid #222",
            padding: isMobile ? "15px 12px" : "30px 40px",
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
                loading="lazy"
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
                    loading="lazy"
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
                Progress Report Card — {templateTitle}
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
                    loading="lazy"
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
                  {showGrade && <th style={{ border: "1.5px solid #333", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>Grade</th>}
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
                    {showGrade && <td style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center", fontWeight: "600" }}>{sub.grade || "-"}</td>}
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
                  {showGrade && <td style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center" }}>{data.summary?.grade}</td>}
                  <td style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center" }}>{data.summary?.result?.toUpperCase()}</td>
                </tr>
                {/* PERCENTAGE */}
                <tr style={{ fontWeight: "bold" }}>
                  <td style={{ border: "1.5px solid #333", padding: "5px 8px", fontWeight: "bold", textTransform: "uppercase" }}>Percentage</td>
                  <td colSpan={showGrade ? 4 : 3} style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center", fontWeight: "bold" }}>
                    {data.summary?.percentage?.toFixed(1)}%
                  </td>
                </tr>
                {/* DIVISION */}
                <tr style={{ fontWeight: "bold" }}>
                  <td style={{ border: "1.5px solid #333", padding: "5px 8px", fontWeight: "bold", textTransform: "uppercase" }}>Division</td>
                  <td colSpan={showGrade ? 4 : 3} style={{ border: "1.5px solid #333", padding: "5px 8px", textAlign: "center", fontWeight: "bold" }}>
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
            <div style={{ marginTop: "50px", display: "flex", justifyContent: "space-between", padding: "0 20px", alignItems: "flex-end" }}>
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
        /* Mobile responsive scaling for report card */
        @media screen and (max-width: 767px) {
          #report-card-print {
            transform: scale(${Math.min(1, (window.innerWidth - 24) / 850)});
            transform-origin: top left;
            width: 850px !important;
          }
          #report-card-print h1 {
            font-size: 20px !important;
          }
          #report-card-print table {
            font-size: 10px !important;
          }
          #report-card-print td, #report-card-print th {
            padding: 3px 4px !important;
          }
        }
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
            transform: none !important;
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

