
import { getFullUrl } from "../../utils/url";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams, useSearchParams } from "react-router-dom";
import { Printer, Loader2 } from "lucide-react";

interface SubjectResult {
  subjectName: string;
  maxMarks: number;
  obtainedMarks: number | null;
  grade: string;
  status: string;
  isAbsent: boolean;
}

interface StudentReportData {
  school: { name: string; address: string; phone?: string; logo?: string; };
  student: { name: string; admissionNo: string; class: string; section?: string; fatherName: string; motherName?: string; rollNo?: string; dob?: string; photo?: string; };
  exam: { name: string; type: string; academicYear: string; };
  subjects: SubjectResult[];
  summary: { totalMarks: number; totalMaxMarks: number; percentage: number; grade: string; rank: number; division: string; result: string; };
}

const BulkReportCard: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [searchParams] = useSearchParams();
  const studentIds = searchParams.get("students")?.split(",") || [];
  const customTemplateId = searchParams.get("customTemplate");
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [studentsData, setStudentsData] = useState<StudentReportData[]>([]);
  const [customTemplate, setCustomTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Fetch custom template if specified
      if (customTemplateId) {
        const tmplRes = await axios.get(`/api/designer/templates/${customTemplateId}`, { headers });
        setCustomTemplate(tmplRes.data?.data || tmplRes.data);
      }

      // Fetch report card for each student
      const allData: StudentReportData[] = [];
      for (let i = 0; i < studentIds.length; i++) {
        try {
          const res = await axios.get(`/api/exam/${examId}/report-card/${studentIds[i]}`, { headers });
          const raw = res.data?.data || res.data;
          allData.push({
            school: { name: raw.tenant?.name || "", address: raw.tenant?.address || "", phone: raw.tenant?.phone || "", logo: raw.tenant?.logoUrl || raw.tenant?.logo || "" },
            student: { name: raw.student?.name || "", admissionNo: raw.student?.admissionNo || "", class: raw.student?.className || "", section: raw.student?.section || "", fatherName: raw.student?.fatherName || "", motherName: raw.student?.motherName || "", rollNo: raw.student?.rollNo || "", dob: raw.student?.dob || "", photo: raw.student?.photoUrl || raw.student?.photo || "" },
            exam: { name: raw.exam?.name || "", type: raw.exam?.type || "", academicYear: raw.exam?.academicYear || "" },
            subjects: (raw.subjectMarks || []).map((s: any) => ({ subjectName: s.subjectName || "", maxMarks: s.maxMarks || 0, obtainedMarks: s.marksObtained, grade: s.grade || "-", status: s.status || "-", isAbsent: s.isAbsent || false })),
            summary: raw.summary ? { totalMarks: raw.summary.totalMarks, totalMaxMarks: raw.summary.totalMaxMarks, percentage: raw.summary.percentage, grade: raw.summary.grade || "-", rank: raw.summary.rank, division: raw.summary.division || "-", result: raw.summary.status || "-" } : { totalMarks: 0, totalMaxMarks: 0, percentage: 0, grade: "-", rank: 0, division: "-", result: "-" },
          });
        } catch (e) {
          console.error(`Failed to fetch report for student ${studentIds[i]}`);
        }
        setProgress(Math.round(((i + 1) / studentIds.length) * 100));
      }
      setStudentsData(allData);
    } catch (error) {
      toast.error("Failed to load report cards");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Fill placeholders for a student
  const fillPlaceholder = (text: string, data: StudentReportData, subjectIndex?: number): string => {
    if (!text) return text;
    const map: Record<string, string> = {
      school_name: data.school.name, school_address: data.school.address, school_phone: data.school.phone || "",
      student_name: data.student.name, name: data.student.name,
      admission_no: data.student.admissionNo, adm_no: data.student.admissionNo,
      class_name: data.student.class, class: data.student.class,
      section_name: data.student.section || "", section: data.student.section || "",
      father_name: data.student.fatherName, mother_name: data.student.motherName || "",
      roll_no: data.student.rollNo || "", roll_number: data.student.rollNo || "",
      dob: data.student.dob || "", date_of_birth: data.student.dob || "",
      exam_name: data.exam.name, exam_type: data.exam.type,
      academic_year: data.exam.academicYear, session: data.exam.academicYear,
      total_marks: `${data.summary.totalMarks}/${data.summary.totalMaxMarks}`,
      total_obtained: String(data.summary.totalMarks), total_max: String(data.summary.totalMaxMarks),
      percentage: data.summary.percentage?.toFixed(1) || "0",
      grade: data.summary.grade, division: data.summary.division,
      rank: String(data.summary.rank || ""), status: data.summary.result, result: data.summary.result, result_status: data.summary.result,
      remarks: data.summary.result === "PASS" ? "Promoted to next class" : "Needs improvement",
      marks_table: data.subjects.map(s => `${s.subjectName}: ${s.obtainedMarks ?? "AB"}/${s.maxMarks}`).join("\n"),
    };

    let result = text;
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
    result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => map[key] !== undefined ? map[key] : match);
    return result;
  };


  // Render a single student using custom template
  const renderCustomTemplate = (data: StudentReportData, idx: number) => {
    const elements = customTemplate.canvasJSON?.elements || [];
    const pageW = customTemplate.pageWidth || 794;
    const pageH = customTemplate.pageHeight || 1123;
    const pageBg = customTemplate.canvasJSON?.pageBg || "#ffffff";

    const hasSubjectPlaceholder = (el: any) => {
      const t = el.text || "";
      return t.includes("{{subject_name}}") || t.includes("{{max_marks}}") || t.includes("{{marks_obtained}}") || t.includes("{{obtained_marks}}");
    };

    // Separate subject row elements from others
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

    const finalElements: any[] = [];
    expandedElements.forEach((el: any) => {
      if (subjectRowElements.length > 0 && el.y > subjectRowBaseY) {
        const extraRows = Math.max(0, data.subjects.length - 1);
        finalElements.push({ ...el, y: el.y + (extraRows * subjectRowHeight) });
      } else {
        finalElements.push(el);
      }
    });

    if (subjectRowElements.length > 0) {
      data.subjects.forEach((_, sIdx) => {
        subjectRowElements.forEach((el: any) => {
          finalElements.push({ ...el, id: `${el.id}_s${sIdx}`, y: subjectRowBaseY + (sIdx * subjectRowHeight), _subjectIndex: sIdx });
        });
      });
    }

    return (
      <div key={idx} className="page-break" style={{ width: pageW, minHeight: pageH, position: "relative", background: pageBg, margin: "0 auto", marginBottom: 20 }}>
        {finalElements.map((el: any, eIdx: number) => {
          const style: React.CSSProperties = { position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height, opacity: el.opacity ?? 1, transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined };

          if (el.type === "rect") {
            return <div key={eIdx} style={{ ...style, backgroundColor: el.fill || "transparent", border: el.stroke && el.stroke !== "transparent" ? `${el.strokeWidth || 1}px solid ${el.stroke}` : undefined, borderRadius: el.borderRadius || 0 }} />;
          }
          if (el.type === "text" || el.type === "field") {
            const rawText = (el.text || "").trim();
            if (rawText.includes("school_logo") || rawText.includes("{{logo}}") || (rawText.includes("/uploads") && rawText.includes("logo"))) {
              const logoSrc = getFullUrl(data.school?.logo);
              if (logoSrc) return <img key={eIdx} src={logoSrc} alt="Logo" style={{ ...style, objectFit: "contain" }} />;
              return null;
            }
            if (rawText.includes("student_photo") || rawText.includes("{{photo}}")) {
              const photoSrc = getFullUrl(data.student?.photo);
              if (photoSrc) return <img key={eIdx} src={photoSrc} alt="Photo" style={{ ...style, objectFit: "cover", borderRadius: 4 }} />;
              return <div key={eIdx} style={{ ...style, border: "1px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#999" }}>Photo</div>;
            }
            return (
              <div key={eIdx} style={{ ...style, fontSize: el.fontSize || 12, fontWeight: el.fontWeight || "normal", fontFamily: el.fontFamily || "Arial, sans-serif", color: el.color || "#000", textAlign: (el.textAlign as any) || "left", whiteSpace: "pre-wrap", lineHeight: 1.4, overflow: "hidden" }}>
                {fillPlaceholder(el.text || "", data, el._subjectIndex)}
              </div>
            );
          }
          if (el.type === "circle") {
            return <div key={eIdx} style={{ ...style, borderRadius: "50%", backgroundColor: el.fill || "transparent", border: el.stroke && el.stroke !== "transparent" ? `${el.strokeWidth || 1}px solid ${el.stroke}` : undefined }} />;
          }
          if (el.type === "line") {
            return <div key={eIdx} style={{ ...style, height: el.strokeWidth || 2, backgroundColor: el.stroke || el.fill || "#000" }} />;
          }
          if (el.type === "image" && el.src) {
            return <img key={eIdx} src={el.src} style={{ ...style, objectFit: "contain" }} alt="" />;
          }
          return null;
        })}
      </div>
    );
  };

  // Render a single student with built-in template
  const renderBuiltInTemplate = (data: StudentReportData, idx: number) => (
    <div key={idx} className="page-break bg-white shadow print:shadow-none" style={{ width: 794, minHeight: 1123, margin: "0 auto", marginBottom: 40, pageBreakAfter: "always", breakAfter: "page", padding: "40px 50px", fontFamily: "'Times New Roman', Times, serif", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8, position: "relative" }}>
        <div style={{ width: 85, flexShrink: 0 }}>
          {data.school.logo && <img src={getFullUrl(data.school.logo)} alt="Logo" style={{ width: 75, height: 75, objectFit: "contain" }} />}
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <h1 style={{ fontSize: 26, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>{data.school.name}</h1>
          <p style={{ fontSize: 13, margin: "2px 0", color: "#333" }}>{data.school.address}</p>
          {data.school.phone && <p style={{ fontSize: 13, margin: 0, color: "#333" }}>Phone No: {data.school.phone}</p>}
        </div>
        <div style={{ width: 85, flexShrink: 0 }}>
          {data.student.photo && getFullUrl(data.student.photo) ? (
            <img
              src={getFullUrl(data.student.photo)}
              alt="Student"
              style={{ width: 80, height: 95, objectFit: "cover", border: "1.5px solid #444" }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 95,
                border: "1.5px solid #444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                color: "#999",
                backgroundColor: "#f9f9f9",
              }}
            >
              Photo
            </div>
          )}
        </div>
      </div>
      <hr style={{ border: "none", borderTop: "3px solid #000", margin: "8px 0 16px" }} />

      {/* Title */}
      <h2 style={{ textAlign: "center", fontSize: 18, fontWeight: "bold", margin: "0 0 6px", textDecoration: "underline" }}>Progress Report Card (Annual)</h2>
      <p style={{ textAlign: "center", fontSize: 13, margin: "0 0 16px", color: "#555" }}>Session: {data.exam.academicYear}</p>

      {/* Student Info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 40px", fontSize: 13, marginBottom: 16, borderBottom: "1px solid #ccc", paddingBottom: 12 }}>
        <p style={{ margin: 0 }}><strong>Student's Name</strong> : {data.student.name}</p>
        <p style={{ margin: 0 }}><strong>Admission No.</strong> : {data.student.admissionNo}</p>
        <p style={{ margin: 0 }}><strong>Father's Name</strong> : {data.student.fatherName}</p>
        <p style={{ margin: 0 }}><strong>Class / Section</strong> : {data.student.class} - {data.student.section}</p>
        {data.student.motherName && <p style={{ margin: 0 }}><strong>Mother's Name</strong> : {data.student.motherName}</p>}
        <p style={{ margin: 0 }}><strong>Roll No</strong> : {data.student.rollNo}</p>
        {data.student.dob && <p style={{ margin: 0 }}><strong>Date of Birth</strong> : {data.student.dob}</p>}
      </div>

      {/* Exam Title */}
      <h3 style={{ fontSize: 14, fontWeight: "bold", margin: "0 0 8px", textDecoration: "underline" }}>Scholastic Achievement — {data.exam.name}</h3>

      {/* Marks Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 }}>
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            <th style={{ border: "1px solid #666", padding: "6px 8px", textAlign: "left" }}>Subject</th>
            <th style={{ border: "1px solid #666", padding: "6px 8px", textAlign: "center", width: 80 }}>Max Marks</th>
            <th style={{ border: "1px solid #666", padding: "6px 8px", textAlign: "center", width: 100 }}>Marks Obtained</th>
            <th style={{ border: "1px solid #666", padding: "6px 8px", textAlign: "center", width: 70 }}>Grade</th>
            <th style={{ border: "1px solid #666", padding: "6px 8px", textAlign: "center", width: 70 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.subjects.map((s, sIdx) => (
            <tr key={sIdx}>
              <td style={{ border: "1px solid #666", padding: "5px 8px", textTransform: "uppercase" }}>{s.subjectName}</td>
              <td style={{ border: "1px solid #666", padding: "5px 8px", textAlign: "center" }}>{s.maxMarks}</td>
              <td style={{ border: "1px solid #666", padding: "5px 8px", textAlign: "center", fontWeight: "bold" }}>{s.obtainedMarks !== null ? s.obtainedMarks : "AB"}</td>
              <td style={{ border: "1px solid #666", padding: "5px 8px", textAlign: "center" }}>{s.grade}</td>
              <td style={{ border: "1px solid #666", padding: "5px 8px", textAlign: "center", color: s.status?.toLowerCase() === "pass" ? "#16a34a" : "#dc2626" }}>{s.status}</td>
            </tr>
          ))}
          {/* Total Row */}
          <tr style={{ backgroundColor: "#f9fafb", fontWeight: "bold" }}>
            <td style={{ border: "1px solid #666", padding: "6px 8px" }}>TOTAL</td>
            <td style={{ border: "1px solid #666", padding: "6px 8px", textAlign: "center" }}>{data.summary.totalMaxMarks}</td>
            <td style={{ border: "1px solid #666", padding: "6px 8px", textAlign: "center" }}>{data.summary.totalMarks}</td>
            <td style={{ border: "1px solid #666", padding: "6px 8px", textAlign: "center" }}>{data.summary.grade}</td>
            <td style={{ border: "1px solid #666", padding: "6px 8px", textAlign: "center", color: data.summary.result?.toLowerCase() === "pass" ? "#16a34a" : "#dc2626" }}>{data.summary.result}</td>
          </tr>
        </tbody>
      </table>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, fontSize: 12, marginBottom: 20, padding: "10px 0", borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc" }}>
        <div><strong>Percentage:</strong> {data.summary.percentage?.toFixed(1)}%</div>
        <div><strong>Grade:</strong> {data.summary.grade}</div>
        <div><strong>Division:</strong> {data.summary.division}</div>
        <div><strong>Rank:</strong> {data.summary.rank || "-"}</div>
      </div>

      {/* Result & Remarks */}
      <div style={{ fontSize: 13, marginBottom: 30 }}>
        <p style={{ margin: "0 0 6px" }}><strong>Result:</strong> <span style={{ color: data.summary.result?.toLowerCase() === "pass" ? "#16a34a" : "#dc2626", fontWeight: "bold", fontSize: 14 }}>{data.summary.result}</span></p>
        <p style={{ margin: 0 }}><strong>Remarks:</strong> {data.summary.result === "PASS" ? "Promoted to next class. Keep up the good work!" : "Needs improvement. Parents are requested to meet the class teacher."}</p>
      </div>

      {/* Signatures */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 60, fontSize: 12, paddingTop: 8, position: "absolute", bottom: 60, left: 50, right: 50 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", width: 140, paddingTop: 4 }}>Class Teacher</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", width: 140, paddingTop: 4 }}>Principal</div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-4" />
        <p className="text-gray-600 font-medium">Loading report cards...</p>
        <div className="mt-3 w-64 bg-gray-200 rounded-full h-2">
          <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-gray-500">{progress}% ({Math.round(progress * studentIds.length / 100)}/{studentIds.length} students)</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Action Bar */}
      <div className="print:hidden bg-white shadow-sm border-b sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          Bulk Print — {studentsData.length} Report Cards
        </h1>
        <span className="text-xs text-gray-500 mr-3">⚠️ Enable "Background graphics" in Print settings</span>
        <button onClick={handlePrint} className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 shadow-sm">
          <Printer className="w-4 h-4 mr-2" />
          Print All
        </button>
      </div>

      {/* Report Cards */}
      <div className="py-6 print:py-0">
        {studentsData.map((data, idx) =>
          customTemplate ? renderCustomTemplate(data, idx) : renderBuiltInTemplate(data, idx)
        )}
      </div>

      {/* Print CSS */}
      <style>{`
        * {
          -webkit-print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        @media print {
          .page-break { 
            page-break-after: always !important; 
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .page-break:last-child { page-break-after: auto; break-after: auto; }
          body, * { -webkit-print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
};

export default BulkReportCard;
