import { getFullUrl } from "../../utils/url";
import React, { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Printer,
  Download,
  Eye,
  X,
  CreditCard,
  RefreshCw,
  FileText,
} from "lucide-react";
import PrintSignature from "../../components/PrintSignature";

interface Exam {
  id: string;
  name: string;
  className?: string;
}

interface AdmitCardItem {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    rollNo: string;
    photoUrl?: string;
    fatherName?: string;
  };
  rollNo: string;
  isGenerated: boolean;
}

interface AdmitCardDetail {
  admitCard: any;
  student: {
    name: string;
    fatherName: string;
    rollNo: string;
    admissionNo: string;
    motherName: string;
    dob: string;
    photoUrl?: string;
    class?: { name: string };
    section?: { name: string } | null;
  };
  exam: {
    name: string;
    type: string;
    class?: { name: string };
    section?: { name: string } | null;
  };
  tenant: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logoUrl?: string;
  };
  schedule: {
    examDate: string;
    startTime: string;
    endTime: string;
    subject: { name: string };
    room: { name: string };
  }[];
}


const AdmitCard: React.FC = () => {
  const navigate = useNavigate();
  const { id: paramExamId } = useParams<{ id: string }>();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState(paramExamId || "");
  const [admitCards, setAdmitCards] = useState<AdmitCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [viewingCard, setViewingCard] = useState<AdmitCardDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [bulkPrintData, setBulkPrintData] = useState<AdmitCardDetail[]>([]);
  const [bulkPrinting, setBulkPrinting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isMobile] = useState(() =>
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768
  );

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (paramExamId) setSelectedExam(paramExamId);
  }, [paramExamId]);

  useEffect(() => {
    if (selectedExam) {
      fetchAdmitCards();
    }
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await axios.get("/api/exam", { headers });
      const raw = res.data?.data || res.data || [];
      setExams(Array.isArray(raw) ? raw : raw.exams || []);
    } catch (error) {
      toast.error("Failed to load exams");
    }
  };

  const fetchAdmitCards = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/exam/${selectedExam}/admit-cards`,
        { headers }
      );
      setAdmitCards(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Failed to load admit cards");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!selectedExam) {
      toast.error("Please select an exam");
      return;
    }
    setGenerating(true);
    try {
      await axios.post(
        "/api/exam/admit-cards/generate",
        { examId: selectedExam },
        { headers }
      );
      toast.success("Admit cards generated successfully");
      fetchAdmitCards();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to generate admit cards";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleView = async (studentId: string) => {
    setViewLoading(true);
    try {
      const res = await axios.get(
        `/api/exam/${selectedExam}/admit-card/${studentId}`,
        { headers }
      );
      setViewingCard(res.data?.data || res.data);
    } catch (error) {
      toast.error("Failed to load admit card details");
    } finally {
      setViewLoading(false);
    }
  };

  // ✅ Bulk Print — fetch all admit card details and print
  const handleBulkPrint = async () => {
    if (admitCards.length === 0) {
      toast.error("No admit cards to print");
      return;
    }
    setBulkPrinting(true);
    try {
      const allCards: AdmitCardDetail[] = [];
      for (const card of admitCards) {
        const sid = card.student?.id || card.studentId;
        const res = await axios.get(
          `/api/exam/${selectedExam}/admit-card/${sid}`,
          { headers }
        );
        allCards.push(res.data?.data || res.data);
      }
      setBulkPrintData(allCards);
      // Wait for render then print
      setTimeout(() => {
        window.print();
        setBulkPrintData([]);
      }, 500);
    } catch (error) {
      toast.error("Failed to load admit cards for printing");
    } finally {
      setBulkPrinting(false);
    }
  };

  const handlePrint = () => {
    if (isMobile) {
      const printContent = document.querySelector(".print\\:block") as HTMLElement;
      if (!printContent) { window.print(); return; }
      const printWindow = window.open("", "_blank");
      if (!printWindow) { toast.error("Allow popups for printing."); return; }
      printWindow.document.write(`
        <html><head><title>Admit Card</title>
        <style>body{margin:0;padding:20px;font-family:Arial,sans-serif;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}</style>
        </head><body>${printContent.innerHTML}</body></html>
      `);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    const printContent = document.querySelector(".print\\:block") as HTMLElement;
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
      pdf.save(`Admit-Card.pdf`);
      toast.success("PDF downloaded!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ✅ Render single admit card (reusable for both modal and bulk print)
  const renderAdmitCardContent = (data: AdmitCardDetail) => {
    const logoUrl = getFullUrl(data.tenant?.logoUrl);
    const photoUrl = getFullUrl(data.student?.photoUrl);

    return (
      <div className="p-8 border-2 border-gray-800 my-4 print:break-after-page" style={{ fontFamily: "'Times New Roman', serif" }}>
        {/* School Header */}
      {/* School Header — Logo Left, Name Center */}
<div className="flex items-center mb-4 border-b-2 border-gray-800 pb-3">
  {/* Logo Left */}
  <div className="w-16 flex-shrink-0">
    {logoUrl && (
      <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
    )}
  </div>
  {/* Center — School Name */}
  <div className="flex-1 text-center leading-tight">
    <h1 className="text-xl font-bold uppercase tracking-wide">
      {data.tenant?.name || "School Name"}
    </h1>
    {data.tenant?.address && (
      <p className="text-xs text-gray-600">{data.tenant.address}</p>
    )}
    {data.tenant?.phone && (
      <p className="text-xs text-gray-600">Phone: {data.tenant.phone}</p>
    )}
  </div>
  {/* Right spacer for symmetry */}
  <div className="w-16 flex-shrink-0"></div>
</div>

        {/* Admit Card Title */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold bg-gray-100 inline-block px-6 py-1.5 border border-gray-400">
            ADMIT CARD
          </h2>
          <p className="mt-2 text-sm font-semibold">{data.exam?.name}</p>
        </div>

        {/* Student Info + Photo */}
        <div className="flex justify-between mb-4">
          <div className="flex-1">
            <table className="text-sm">
              <tbody>
                <tr>
                  <td className="py-1 pr-4 font-semibold w-36">Name:</td>
                  <td className="py-1">{data.student?.name || ""}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-semibold">Father's Name:</td>
                  <td className="py-1">{data.student?.fatherName || ""}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-semibold">Class:</td>
                  <td className="py-1">{data.student?.class?.name || data.exam?.class?.name || ""}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-semibold">Section:</td>
                  <td className="py-1">{data.student?.section?.name || data.exam?.section?.name || ""}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-semibold">Roll No:</td>
                  <td className="py-1">{data.student?.rollNo || ""}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-semibold">Date of Birth:</td>
                  <td className="py-1">{data.student?.dob || "N/A"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="ml-4">
            {photoUrl ? (
              <img src={photoUrl} alt="Student" className="w-20 h-24 object-cover border-2 border-gray-400 rounded" />
            ) : (
              <div className="w-20 h-24 bg-gray-100 border-2 border-gray-400 rounded flex items-center justify-center">
                <span className="text-xs text-gray-400">Photo</span>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Table */}
        {data.schedule && data.schedule.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-bold mb-1 uppercase">Exam Schedule</h3>
            <table className="w-full text-xs border border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-2 py-1.5 text-left">Subject</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left">Date</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.schedule.map((sch, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-400 px-2 py-1.5">{sch.subject?.name || ""}</td>
                    <td className="border border-gray-400 px-2 py-1.5">
                      {sch.examDate ? new Date(sch.examDate).toLocaleDateString("en-IN") : ""}
                    </td>
                    <td className="border border-gray-400 px-2 py-1.5">{sch.startTime} - {sch.endTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures */}
        <div className="flex justify-between mt-8 pt-4 border-t border-gray-300">
          <div className="text-center">
            <div className="w-28 border-b border-gray-500 mb-1"></div>
            <p className="text-xs font-medium">Class Teacher</p>
          </div>
          <div className="text-center">
            <div className="w-28 border-b border-gray-500 mb-1"></div>
            <p className="text-xs font-medium">Exam Controller</p>
          </div>
          <div className="text-center">
            <PrintSignature inline={false} printOnly={false} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ✅ Bulk Print Area — hidden on screen, visible on print */}
      {bulkPrintData.length > 0 && (
        <div className="hidden print:block">
          {bulkPrintData.map((card, idx) => (
            <div key={idx}>{renderAdmitCardContent(card)}</div>
          ))}
        </div>
      )}

      {/* Main Page — hidden on print when bulk printing */}
      <div className={`min-h-screen bg-gray-50 p-6 ${bulkPrintData.length > 0 ? "print:hidden" : ""}`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6 print:hidden">
            <button
              onClick={() => navigate("/exams")}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Admit Cards</h1>
              <p className="mt-1 text-sm text-gray-500">
                Generate and view student admit cards
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 print:hidden">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Exam
                </label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                  <option value="">-- Select Exam --</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name} {exam.className ? `(${exam.className})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGenerateAll}
                disabled={generating || !selectedExam}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Generate All
              </button>
              {admitCards.length > 0 && (
                <button
                  onClick={handleBulkPrint}
                  disabled={bulkPrinting}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {bulkPrinting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                  Print All ({admitCards.length})
                </button>
              )}
            </div>
          </div>

          {/* Admit Cards List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Student Admit Cards</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                <span className="ml-3 text-gray-500">Loading...</span>
              </div>
            ) : !selectedExam ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Select an exam</h3>
                <p className="mt-1 text-sm text-gray-500">Choose an exam to view or generate admit cards</p>
              </div>
            ) : admitCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <CreditCard className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No admit cards found</h3>
                <p className="mt-1 text-sm text-gray-500">Click "Generate All" to create them</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {admitCards.map((card, index) => (
                      <tr key={card.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {card.student?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {card.student?.rollNo || card.rollNo}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            card.isGenerated ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {card.isGenerated ? "Generated" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleView(card.student?.id || card.studentId)}
                            className="inline-flex items-center px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-100"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Single Admit Card Modal */}
          {(viewingCard || viewLoading) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:relative print:bg-white print:p-0">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto print:max-w-none print:shadow-none print:rounded-none print:max-h-none">
                {viewLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    <span className="ml-3 text-gray-500">Loading...</span>
                  </div>
                ) : viewingCard ? (
                  <>
                    {/* Modal Header — hidden on print */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden">
                      <h3 className="text-lg font-semibold text-gray-900">Admit Card Preview</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrint}
                          className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Print
                        </button>
                        <button
                          onClick={() => setViewingCard(null)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Admit Card Content */}
                    {renderAdmitCardContent(viewingCard)}
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdmitCard;