/**
 * 📊 Report Card PDF Page
 *
 * Wraps the existing ReportCardPrint component with PrintExportBar
 * and adds server-side PDF download capability.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import PrintExportBar from "../../components/print/PrintExportBar";
import { ReportCardPrint } from "../../components/print";
import type { ReportCardData } from "../../components/print";

export default function ReportCardPDFPage() {
  const { studentId, examId } = useParams<{ studentId: string; examId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!studentId || !examId) return;
    fetchData();
  }, [studentId, examId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch exam results for this student
      const res = await axios.get(
        getFullUrl(`/api/exam/${examId}/results`),
        { headers, params: { studentId } }
      );

      const exam = res.data?.data || res.data;
      if (!exam) throw new Error("No data");

      // The existing report card component expects ReportCardData format
      // Map from the API response
      const studentResult = Array.isArray(exam.results)
        ? exam.results.find((r: any) => r.studentId === studentId) || exam.results[0]
        : exam;

      if (studentResult) {
        setData({
          studentName: studentResult.studentName || "Student",
          admissionNo: studentResult.admissionNo || "",
          rollNo: studentResult.rollNo || studentResult.admissionNo || "",
          class: studentResult.className || "",
          section: studentResult.sectionName || "",
          examName: exam.examName || exam.name || "",
          academicYear: exam.academicYear || "",
          dob: studentResult.dob || "",
          fatherName: studentResult.fatherName || "",
          motherName: studentResult.motherName || "",
          subjects: (studentResult.subjects || studentResult.marks || []).map((s: any) => ({
            name: s.subjectName || s.name || "",
            maxMarks: s.maxMarks || 100,
            marksObtained: s.marksObtained || s.marks || 0,
            grade: s.grade || "",
          })),
          totalMarks: studentResult.totalMarks || 0,
          maxTotalMarks: studentResult.maxTotalMarks || 0,
          percentage: studentResult.percentage || 0,
          grade: studentResult.grade || studentResult.overallGrade || "",
          rank: studentResult.rank,
          attendance: studentResult.attendance || { present: 0, total: 0 },
          remarks: studentResult.remarks || "",
          result: studentResult.result || "PASS",
        });
      }
    } catch (err: any) {
      console.error("Failed to load report card data:", err);
      toast.error("Failed to load report card");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await axios.get(
        getFullUrl(`/api/report/report-card/${studentId}/${examId}`),
        { headers, responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-card-${studentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch (err: any) {
      toast.error("PDF download failed");
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        No report card data found for this student/exam.
      </div>
    );
  }

  return (
    <div>
      <PrintExportBar
        title="Report Card"
        onDownloadPdf={handleDownloadPdf}
        onBack={() => navigate(-1)}
        loading={downloading}
      />
      <div className="max-w-[210mm] mx-auto mt-4">
        <ReportCardPrint data={data} showControls={false} mode="preview" />
      </div>
    </div>
  );
}
