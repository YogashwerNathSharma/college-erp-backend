import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Printer,
  Eye,
  X,
  CreditCard,
  RefreshCw,
  Palette,
  Users,
  User,
  School,
  Filter,
} from "lucide-react";

const YN_UDP_API = "http://localhost:5001/api";

const getTenantId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.tenantId || "";
  } catch {
    return "";
  }
};

const getFullUrl = (path: string | undefined | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${path}`;
  return `/uploads/${path}`;
};

interface Exam {
  id: string;
  name: string;
  className?: string;
}

interface ClassItem {
  id: string;
  name: string;
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
    className?: string;
    sectionName?: string;
  };
  rollNo: string;
  isGenerated: boolean;
}

interface AdmitCardDetail {
  admitCard: any;
  student: {
    name: string;
    fatherName: string;
    motherName: string;
    rollNo: string;
    admissionNo: string;
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

interface YnTemplate {
  id: string;
  name: string;
  type: string;
}

type PrintMode = "single" | "class" | "school";

const AdmitCardPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // Core state
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [admitCards, setAdmitCards] = useState<AdmitCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Filter state
  const [printMode, setPrintMode] = useState<PrintMode>("school");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  // View single admit card
  const [viewingCard, setViewingCard] = useState<AdmitCardDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Bulk print
  const [bulkPrintData, setBulkPrintData] = useState<AdmitCardDetail[]>([]);
  const [bulkPrinting, setBulkPrinting] = useState(false);

  // YN-UDP state
  const [ynTemplates, setYnTemplates] = useState<YnTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [ynLoading, setYnLoading] = useState(false);
  const [showYnModal, setShowYnModal] = useState(false);

  // Tenant info
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    fetchExams();
    fetchClasses();
    fetchTenant();
  }, []);

  useEffect(() => {
    if (selectedExam) fetchAdmitCards();
  }, [selectedExam]);

  const fetchTenant = async () => {
    try {
      const res = await axios.get("/api/settings", { headers });
      setTenant(res.data?.data?.tenant || JSON.parse(localStorage.getItem("tenant") || "{}"));
    } catch {
      setTenant(JSON.parse(localStorage.getItem("tenant") || "{}"));
    }
  };

  const fetchExams = async () => {
    try {
      const res = await axios.get("/api/exam", { headers });
      const raw = res.data?.data || res.data || [];
      setExams(Array.isArray(raw) ? raw : raw.exams || []);
    } catch {
      toast.error("Failed to load exams");
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get("/api/class", { headers });
      setClasses(res.data?.data || res.data || []);
    } catch {
      // silently fail
    }
  };

  const fetchAdmitCards = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/exam/${selectedExam}/admit-cards`, { headers });
      setAdmitCards(res.data?.data || res.data || []);
    } catch {
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
      await axios.post("/api/exam/admit-cards/generate", { examId: selectedExam }, { headers });
      toast.success("Admit cards generated successfully");
      fetchAdmitCards();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to generate admit cards";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  // Filter admit cards based on mode
  const filteredAdmitCards = (() => {
    if (printMode === "single" && selectedStudent) {
      return admitCards.filter(
        (c) => c.studentId === selectedStudent || c.student?.id === selectedStudent
      );
    }
    if (printMode === "class" && selectedClass) {
      return admitCards.filter(
        (c) => c.student?.className === selectedClass
      );
    }
    return admitCards; // "school" mode = all
  })();

  // ═══════════════════════════════════════
  // VIEW SINGLE ADMIT CARD
  // ═══════════════════════════════════════
  const handleView = async (studentId: string) => {
    setViewLoading(true);
    try {
      const res = await axios.get(`/api/exam/${selectedExam}/admit-card/${studentId}`, { headers });
      setViewingCard(res.data?.data || res.data);
    } catch {
      toast.error("Failed to load admit card details");
    } finally {
      setViewLoading(false);
    }
  };

  // ═══════════════════════════════════════
  // NORMAL PRINT - Single Admit Card
  // ═══════════════════════════════════════
  const printSingleAdmitCard = (data: AdmitCardDetail) => {
    const logoUrl = getFullUrl(data.tenant?.logoUrl);
    const photoUrl = getFullUrl(data.student?.photoUrl);

    const scheduleRows = (data.schedule || [])
      .map(
        (sch) => `
        <tr>
          <td style="border:1px solid #999;padding:3px 6px;">${sch.subject?.name || ""}</td>
          <td style="border:1px solid #999;padding:3px 6px;">${new Date(sch.examDate).toLocaleDateString()}</td>
          <td style="border:1px solid #999;padding:3px 6px;">${sch.startTime || ""} - ${sch.endTime || ""}</td>
        </tr>`
      )
      .join("");

    return `
      <div style="padding:16px 20px;border:2px solid #333;max-width:700px;font-family:'Times New Roman',serif;page-break-inside:avoid;overflow:hidden;">
        <!-- Header: Logo Left, School Center -->
        <div style="display:flex;align-items:center;border-bottom:2px solid #333;padding-bottom:6px;margin-bottom:6px;">
          <div style="width:50px;flex-shrink:0;">
            ${logoUrl ? `<img src="${logoUrl}" style="width:48px;height:48px;object-fit:contain;" />` : ""}
          </div>
          <div style="flex:1;text-align:center;line-height:1.2;">
            <h1 style="font-size:16px;font-weight:bold;text-transform:uppercase;margin:0;letter-spacing:1px;">
              ${data.tenant?.name || "School Name"}
            </h1>
            ${data.tenant?.address ? `<p style="font-size:9px;color:#555;margin:1px 0 0;">${data.tenant.address}</p>` : ""}
            ${data.tenant?.phone ? `<p style="font-size:9px;color:#555;margin:0;">Phone: ${data.tenant.phone}</p>` : ""}
          </div>
          <div style="width:50px;flex-shrink:0;"></div>
        </div>

        <!-- Title -->
        <div style="text-align:center;margin-bottom:6px;">
          <h2 style="font-size:12px;font-weight:bold;background:#f3f4f6;display:inline-block;padding:3px 18px;border:1px solid #999;margin:0;">
            ADMIT CARD
          </h2>
          <p style="margin-top:2px;font-size:10px;font-weight:600;">${data.exam?.name || ""}</p>
        </div>

        <!-- Student Info (2 columns) + Photo -->
        <div style="display:flex;margin-bottom:6px;">
          <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:1px 12px;font-size:10px;align-content:start;">
            <div><span style="font-weight:600;">Name:</span> ${data.student?.name || ""}</div>
            <div><span style="font-weight:600;">Class:</span> ${data.student?.class?.name || data.exam?.class?.name || ""}${data.student?.section?.name || data.exam?.section?.name ? " - " + (data.student?.section?.name || data.exam?.section?.name) : ""}</div>
            <div><span style="font-weight:600;">Father:</span> ${data.student?.fatherName || ""}</div>
            <div><span style="font-weight:600;">Roll No:</span> ${data.student?.rollNo || ""}</div>
            <div><span style="font-weight:600;">Mother:</span> ${data.student?.motherName || ""}</div>
            <div><span style="font-weight:600;">Adm No:</span> ${data.student?.admissionNo || ""}</div>
            <div><span style="font-weight:600;">DOB:</span> ${data.student?.dob ? new Date(data.student.dob).toLocaleDateString() : "N/A"}</div>
            <div></div>
          </div>
          <div style="margin-left:12px;flex-shrink:0;">
            ${
              photoUrl
                ? `<img src="${photoUrl}" style="width:60px;height:72px;object-fit:cover;border:1.5px solid #999;border-radius:3px;" />`
                : `<div style="width:60px;height:72px;background:#f3f4f6;border:1.5px solid #999;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#999;">Photo</div>`
            }
          </div>
        </div>

        <!-- Schedule Table -->
        ${
          data.schedule && data.schedule.length > 0
            ? `
          <div style="margin-bottom:6px;">
            <h3 style="font-size:10px;font-weight:bold;text-transform:uppercase;margin-bottom:3px;">Exam Schedule</h3>
            <table style="width:100%;border-collapse:collapse;font-size:9px;">
              <thead>
                <tr style="background:#f3f4f6;">
                  <th style="border:1px solid #999;padding:3px 6px;text-align:left;">Subject</th>
                  <th style="border:1px solid #999;padding:3px 6px;text-align:left;">Date</th>
                  <th style="border:1px solid #999;padding:3px 6px;text-align:left;">Time</th>
                </tr>
              </thead>
              <tbody>${scheduleRows}</tbody>
            </table>
          </div>`
            : ""
        }

        <!-- Instructions -->
        <div style="margin-bottom:6px;padding:4px 6px;background:#fffbeb;border:1px solid #fbbf24;border-radius:4px;">
          <p style="font-size:8px;font-weight:bold;margin:0 0 2px;">Instructions:</p>
          <ol style="font-size:7.5px;margin:0;padding-left:12px;color:#555;line-height:1.4;">
            <li>Students must bring this admit card to the examination hall.</li>
            <li>Reach the exam center 30 minutes before the scheduled time.</li>
            <li>No electronic devices allowed inside the exam hall.</li>
            <li>Use only blue/black pen for writing.</li>
          </ol>
        </div>

        <!-- Footer: Class Teacher (left) + Principal (right) -->
        <div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:6px;border-top:1px solid #ddd;">
          <div style="text-align:center;">
            <div style="width:110px;border-top:1.5px solid #222;margin:20px auto 2px;padding-top:3px;">
              <p style="font-size:9px;font-weight:bold;margin:0;">Class Teacher</p>
            </div>
          </div>
          <div style="text-align:center;">
            <div style="width:110px;border-top:1.5px solid #222;margin:20px auto 2px;padding-top:3px;">
              <p style="font-size:9px;font-weight:bold;margin:0;">Principal</p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // ═══════════════════════════════════════
  // BULK NORMAL PRINT
  // ═══════════════════════════════════════
  const handleBulkNormalPrint = async () => {
    if (filteredAdmitCards.length === 0) {
      toast.error("No admit cards to print");
      return;
    }
    setBulkPrinting(true);
    try {
      const allCards: AdmitCardDetail[] = [];
      for (const card of filteredAdmitCards) {
        const sid = card.student?.id || card.studentId;
        const res = await axios.get(`/api/exam/${selectedExam}/admit-card/${sid}`, { headers });
        allCards.push(res.data?.data || res.data);
      }

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Please allow popups for printing");
        return;
      }

      // Group 2 admit cards per page
      let cardsHTML = "";
      for (let i = 0; i < allCards.length; i += 2) {
        const card1 = printSingleAdmitCard(allCards[i]);
        const card2 = i + 1 < allCards.length ? printSingleAdmitCard(allCards[i + 1]) : "";
        cardsHTML += `<div class="page-pair">
          ${card1}
          ${card2}
        </div>`;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Admit Cards - ${exams.find((e) => e.id === selectedExam)?.name || "Exam"}</title>
          <style>
            @page { size: A4; margin: 8mm; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; font-family: 'Times New Roman', serif; }
            .page-pair {
              page-break-inside: avoid;
              margin-bottom: 10mm;
              padding: 0;
            }
            .page-pair > div { page-break-inside: avoid; }
            .page-pair > div + div { margin-top: 10mm; }
          </style>
        </head>
        <body>${cardsHTML}</body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    } catch {
      toast.error("Failed to load admit cards for printing");
    } finally {
      setBulkPrinting(false);
    }
  };

  // ═══════════════════════════════════════
  // SINGLE CARD NORMAL PRINT (from preview)
  // ═══════════════════════════════════════
  const handleSinglePrint = () => {
    if (!viewingCard) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups for printing");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admit Card - ${viewingCard.student?.name}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>${printSingleAdmitCard(viewingCard)}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  };

  // ═══════════════════════════════════════
  // YN-UDP PRINT
  // ═══════════════════════════════════════
  const fetchYnTemplates = async () => {
    try {
      const tenantId = getTenantId();
      let res = await axios.get(`${YN_UDP_API}/templates`, {
        params: { tenantId, type: "admit-card" },
      });
      let data = res.data?.data || [];
      // Fallback: try default tenantId if no results
      if (data.length === 0 && tenantId !== "000000000000000000000000") {
        res = await axios.get(`${YN_UDP_API}/templates`, {
          params: { tenantId: "000000000000000000000000", type: "admit-card" },
        });
        data = res.data?.data || [];
      }
      // If still no admit-card templates, fetch all types as fallback
      if (data.length === 0) {
        res = await axios.get(`${YN_UDP_API}/templates`, {
          params: { tenantId: tenantId !== "000000000000000000000000" ? "000000000000000000000000" : tenantId, type: "all" },
        });
        data = res.data?.data || [];
      }
      setYnTemplates(data);
    } catch {
      toast.error("YN-UDP server not reachable. Is it running on port 5001?");
    }
  };

  const handleYnUdpPrint = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    if (filteredAdmitCards.length === 0) {
      toast.error("No admit cards to print");
      return;
    }

    setYnLoading(true);
    // Open print window immediately (before async) to avoid popup blocker
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups for printing");
      setYnLoading(false);
      return;
    }
    printWindow.document.write(`<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h2>⏳ Rendering ${filteredAdmitCards.length} admit cards...</h2></body></html>`);

    try {
      // Fetch template once
      const tmplRes = await axios.get(`${YN_UDP_API}/templates/${selectedTemplate}`);
      const template = tmplRes.data?.data || tmplRes.data;
      if (!template || !template.canvasJSON) {
        toast.error("Template has no design data");
        printWindow.close();
        return;
      }

      const printCards: any[] = [];
      for (const card of filteredAdmitCards) {
        try {
        const sid = card.student?.id || card.studentId;
        const res = await axios.get(`/api/exam/${selectedExam}/admit-card/${sid}`, { headers });
        const data: AdmitCardDetail = res.data?.data || res.data;

        // Client-side placeholder replacement
        const placeholders: Record<string, string> = {
          student_name: data.student?.name || "",
          father_name: data.student?.fatherName || "",
          mother_name: data.student?.motherName || "",
          class_name: data.student?.class?.name || data.exam?.class?.name || "",
          section_name: data.student?.section?.name || data.exam?.section?.name || "",
          roll_number: data.student?.rollNo || "",
          admission_no: data.student?.admissionNo || "",
          dob: data.student?.dob ? new Date(data.student.dob).toLocaleDateString() : "",
          photo: getFullUrl(data.student?.photoUrl) || "",
          exam_name: data.exam?.name || "",
          school_name: data.tenant?.name || "",
          school_logo: getFullUrl(data.tenant?.logoUrl) || "",
          school_address: data.tenant?.address || "",
          school_phone: data.tenant?.phone || "",
          principal_name: "Principal",
          class_teacher_name: "Class Teacher",
        };

        // Replace placeholders in canvas JSON
        let canvasStr = JSON.stringify(template.canvasJSON);
        Object.keys(placeholders).forEach((key) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          canvasStr = canvasStr.replace(regex, placeholders[key]);
        });

        const renderedTemplate = {
          ...template,
          canvasJSON: JSON.parse(canvasStr),
        };
        printCards.push(renderedTemplate);
        } catch (cardErr) {
          console.warn("Failed to render card for student:", card.student?.name || card.studentId, cardErr);
        }
      }

      if (printCards.length === 0) {
        toast.error("No cards could be rendered. Check console for details.");
        printWindow.close();
        return;
      }

      // Generate print HTML from rendered canvas elements
      let cardsHTML = "";
      for (let i = 0; i < printCards.length; i += 2) {
        const card1HTML = renderCanvasToHTML(printCards[i]);
        const card2HTML = i + 1 < printCards.length ? renderCanvasToHTML(printCards[i + 1]) : "";
        cardsHTML += `<div class="page-pair">${card1HTML}${card2HTML}</div>`;
      }

      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Admit Cards - YN-UDP</title>
          <style>
            @page { size: A4; margin: 8mm; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; }
            .page-pair { page-break-inside: avoid; padding: 0; margin-bottom: 10mm; }
            .page-pair:nth-child(even) { page-break-after: auto; }
            .card-container { position: relative; margin: 0 auto; overflow: hidden; border: 1px solid #ddd; }
            .card-container + .card-container { margin-top: 10mm; }
          </style>
        </head>
        <body>${cardsHTML}</body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 600);

      toast.success(`${printCards.length} admit card(s) sent to print!`);
      setShowYnModal(false);
    } catch (error: any) {
      console.error("YN-UDP print error:", error);
      if (printWindow) printWindow.close();
      toast.error(error.response?.data?.message || "Failed to render via YN-UDP");
    } finally {
      setYnLoading(false);
    }
  };

  // Convert rendered canvas JSON to HTML for printing
  const renderCanvasToHTML = (templateData: any): string => {
    if (!templateData) return `<div class="card-container" style="width:794px;height:560px;background:#fff;position:relative;display:flex;align-items:center;justify-content:center;"><p>No data</p></div>`;
    const canvas = templateData?.canvasJSON || templateData?.canvas || {};
    // Handle both formats: canvasJSON could be {elements:[...]} or just an array
    const elements = canvas.elements || (Array.isArray(canvas) ? canvas : []);
    const pageW = templateData?.pageWidth || 794;
    const pageH = templateData?.pageHeight || 560;
    const pageBg = canvas.pageBg || "#ffffff";

    let elsHTML = "";
    for (const el of elements) {
      const style = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;opacity:${el.opacity ?? 1};${el.rotation ? `transform:rotate(${el.rotation}deg);` : ""}`;

      if (el.type === "rect") {
        const fill = el.fill || "transparent";
        const border = el.stroke && el.stroke !== "transparent" ? `border:${el.strokeWidth || 1}px solid ${el.stroke};` : "";
        const radius = el.borderRadius ? `border-radius:${el.borderRadius}px;` : "";
        elsHTML += `<div style="${style}background:${fill};${border}${radius}"></div>`;
      } else if (el.type === "line") {
        const color = el.stroke || "#000";
        const sw = el.strokeWidth || 1;
        elsHTML += `<div style="${style}border-top:${sw}px solid ${color};"></div>`;
      } else if (el.type === "text" || el.type === "field") {
        const textContent = el.text || "";
        // Check if content is an image URL (logo, photo, etc.)
        const isImageUrl = textContent && (
          textContent.startsWith("/uploads/") ||
          textContent.startsWith("http") ||
          (textContent.startsWith("/") && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(textContent))
        );
        if (isImageUrl) {
          elsHTML += `<img src="${textContent}" style="${style}object-fit:contain;" />`;
        } else {
        const color = el.color || "#000";
        const fontSize = el.fontSize || 14;
        const fontWeight = el.fontWeight || "normal";
        const fontFamily = el.fontFamily || "Arial";
        const textAlign = el.textAlign || "left";
        const fontStyle = el.fontStyle || "normal";
        const textDecoration = el.textDecoration || "none";
        elsHTML += `<div style="${style}color:${color};font-size:${fontSize}px;font-weight:${fontWeight};font-family:${fontFamily};text-align:${textAlign};font-style:${fontStyle};text-decoration:${textDecoration};line-height:1.3;overflow:hidden;">${textContent}</div>`;
        }
      } else if (el.type === "image" && el.src) {
        elsHTML += `<img src="${el.src}" style="${style}object-fit:contain;" />`;
      } else if (el.type === "circle") {
        const fill = el.fill || "transparent";
        const border = el.stroke && el.stroke !== "transparent" ? `border:${el.strokeWidth || 1}px solid ${el.stroke};` : "";
        elsHTML += `<div style="${style}background:${fill};${border}border-radius:50%;"></div>`;
      }
    }

    return `<div class="card-container" style="width:${pageW}px;height:${pageH}px;background:${pageBg};position:relative;">${elsHTML}</div>`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/exams")}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admit Cards</h1>
              <p className="mt-1 text-sm text-gray-500">
                Generate, view, and print admit cards — single, class-wise, or full school
              </p>
            </div>
          </div>

          {/* Print Buttons */}
          {admitCards.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkNormalPrint}
                disabled={bulkPrinting}
                className="inline-flex items-center px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors shadow-sm disabled:opacity-50"
              >
                {bulkPrinting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4 mr-2" />
                )}
                Normal Print ({filteredAdmitCards.length})
              </button>
              <button
                onClick={() => {
                  fetchYnTemplates();
                  setShowYnModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Palette className="w-4 h-4 mr-2" />
                YN-UDP Print
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Exam Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
              <select
                value={selectedExam}
                onChange={(e) => {
                  setSelectedExam(e.target.value);
                  setAdmitCards([]);
                }}
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

            {/* Print Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Print Mode</label>
              <select
                value={printMode}
                onChange={(e) => {
                  setPrintMode(e.target.value as PrintMode);
                  setSelectedStudent("");
                  setSelectedClass("");
                }}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="school">Full School (All)</option>
                <option value="class">Class-wise</option>
                <option value="single">Single Student</option>
              </select>
            </div>

            {/* Class Filter (if class mode) */}
            {printMode === "class" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.name}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Student Filter (if single mode) */}
            {printMode === "single" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                  <option value="">-- Select Student --</option>
                  {admitCards.map((card) => (
                    <option key={card.id} value={card.student?.id || card.studentId}>
                      {card.student?.name || "Unknown"} ({card.student?.rollNo || card.rollNo})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={handleGenerateAll}
                disabled={generating || !selectedExam}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Generate All
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {admitCards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Admit Cards</p>
                  <p className="text-xl font-bold text-gray-900">{admitCards.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Filter className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Filtered ({printMode})</p>
                  <p className="text-xl font-bold text-gray-900">{filteredAdmitCards.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Print Mode</p>
                  <p className="text-xl font-bold text-gray-900 capitalize">{printMode}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admit Card List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Admit Cards ({filteredAdmitCards.length})
              </h2>
            </div>
            {printMode !== "school" && (
              <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                {printMode === "class" ? `Class: ${selectedClass || "All"}` : `Student: ${selectedStudent ? "Selected" : "None"}`}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-500">Loading admit cards...</span>
            </div>
          ) : !selectedExam ? (
            <div className="flex flex-col items-center justify-center py-20">
              <CreditCard className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Select an Exam</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose an exam to view and print admit cards
              </p>
            </div>
          ) : filteredAdmitCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <CreditCard className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Admit Cards</h3>
              <p className="mt-1 text-sm text-gray-500">
                Click "Generate All" to create admit cards for this exam
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAdmitCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {card.student?.name || "Unknown Student"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Roll: {card.student?.rollNo || card.rollNo}
                        {card.student?.className && ` • Class: ${card.student.className}`}
                        {card.student?.sectionName && ` - ${card.student.sectionName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(card.student?.id || card.studentId)}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* VIEW ADMIT CARD MODAL */}
      {/* ═══════════════════════════════════════ */}
      {viewingCard && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Admit Card Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSinglePrint}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-900"
                >
                  <Printer className="w-3 h-3 mr-1" />
                  Print
                </button>
                <button
                  onClick={() => setViewingCard(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Card Content Preview */}
            <div className="p-6">
              <div className="border-2 border-gray-800 p-6 rounded-lg" style={{ fontFamily: "'Times New Roman', serif" }}>
                {/* Header */}
                <div className="flex items-center mb-4 border-b-2 border-gray-800 pb-3">
                  <div className="w-14 flex-shrink-0">
                    {getFullUrl(viewingCard.tenant?.logoUrl) && (
                      <img src={getFullUrl(viewingCard.tenant?.logoUrl)!} alt="Logo" className="w-12 h-12 object-contain" />
                    )}
                  </div>
                  <div className="flex-1 text-center leading-tight">
                    <h1 className="text-lg font-bold uppercase tracking-wide">{viewingCard.tenant?.name}</h1>
                    {viewingCard.tenant?.address && <p className="text-[10px] text-gray-600">{viewingCard.tenant.address}</p>}
                  </div>
                  <div className="w-14 flex-shrink-0"></div>
                </div>

                {/* Title */}
                <div className="text-center mb-4">
                  <h2 className="text-sm font-bold bg-gray-100 inline-block px-4 py-1 border border-gray-400">ADMIT CARD</h2>
                  <p className="mt-1 text-xs font-semibold">{viewingCard.exam?.name}</p>
                </div>

                {/* Student Info */}
                <div className="flex justify-between mb-4">
                  <div className="flex-1">
                    <table className="text-xs">
                      <tbody>
                        <tr><td className="py-0.5 pr-3 font-semibold w-28">Name:</td><td>{viewingCard.student?.name}</td></tr>
                        <tr><td className="py-0.5 pr-3 font-semibold">Father:</td><td>{viewingCard.student?.fatherName}</td></tr>
                        <tr><td className="py-0.5 pr-3 font-semibold">Class:</td><td>{viewingCard.student?.class?.name || viewingCard.exam?.class?.name}</td></tr>
                        <tr><td className="py-0.5 pr-3 font-semibold">Roll No:</td><td>{viewingCard.student?.rollNo}</td></tr>
                        <tr><td className="py-0.5 pr-3 font-semibold">DOB:</td><td>{viewingCard.student?.dob ? new Date(viewingCard.student.dob).toLocaleDateString() : "N/A"}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="ml-3">
                    {getFullUrl(viewingCard.student?.photoUrl) ? (
                      <img src={getFullUrl(viewingCard.student?.photoUrl)!} alt="Student" className="w-16 h-20 object-cover border border-gray-400 rounded" />
                    ) : (
                      <div className="w-16 h-20 bg-gray-100 border border-gray-400 rounded flex items-center justify-center">
                        <span className="text-[9px] text-gray-400">Photo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule */}
                {viewingCard.schedule && viewingCard.schedule.length > 0 && (
                  <div className="mb-4">
                    <table className="w-full text-[10px] border border-gray-400">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-400 px-2 py-1 text-left">Subject</th>
                          <th className="border border-gray-400 px-2 py-1 text-left">Date</th>
                          <th className="border border-gray-400 px-2 py-1 text-left">Time</th>
                          <th className="border border-gray-400 px-2 py-1 text-left">Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingCard.schedule.map((sch, idx) => (
                          <tr key={idx}>
                            <td className="border border-gray-400 px-2 py-1">{sch.subject?.name}</td>
                            <td className="border border-gray-400 px-2 py-1">{new Date(sch.examDate).toLocaleDateString()}</td>
                            <td className="border border-gray-400 px-2 py-1">{sch.startTime} - {sch.endTime}</td>
                            <td className="border border-gray-400 px-2 py-1">{sch.room?.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer Signatures */}
                <div className="flex justify-between mt-8 pt-3 border-t border-gray-300">
                  <div className="text-center">
                    <div className="w-28 border-t-[1.5px] border-black mx-auto mt-8 pt-1">
                      <p className="text-[10px] font-bold">Class Teacher</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-28 border-t-[1.5px] border-black mx-auto mt-8 pt-1">
                      <p className="text-[10px] font-bold">Principal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* YN-UDP Template Selection Modal */}
      {/* ═══════════════════════════════════════ */}
      {showYnModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Print via YN-UDP</h3>
              <button
                onClick={() => setShowYnModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Select a saved template from YN-UDP designer for admit card printing.
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Mode: <strong className="capitalize">{printMode}</strong> • 
              Cards: <strong>{filteredAdmitCards.length}</strong>
            </p>

            {ynTemplates.length === 0 ? (
              <div className="text-center py-8">
                <Palette className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No templates found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Create an admit card template in YN-UDP Designer first
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {ynTemplates.map((tpl) => (
                  <label
                    key={tpl.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate === tpl.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="ynTemplate"
                      value={tpl.id}
                      checked={selectedTemplate === tpl.id}
                      onChange={() => setSelectedTemplate(tpl.id)}
                      className="text-purple-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tpl.name}</p>
                      <p className="text-xs text-gray-500">{tpl.type}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowYnModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleYnUdpPrint}
                disabled={!selectedTemplate || ynLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                {ynLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                ) : (
                  <Palette className="w-4 h-4 inline mr-2" />
                )}
                Print ({filteredAdmitCards.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for view */}
      {viewLoading && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-xl flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="text-sm text-gray-700">Loading admit card...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmitCardPage;
