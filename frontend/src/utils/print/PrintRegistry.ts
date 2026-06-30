/**
 * ═══════════════════════════════════════════════════════════════
 * UNIFIED PRINT SYSTEM — Single Source of Truth for ALL prints
 * ═══════════════════════════════════════════════════════════════
 * 
 * This file is the ONLY place where print formats are defined.
 * Change format HERE → changes EVERYWHERE (receipts, reports, TC, certificates).
 * 
 * How it works:
 * 1. Templates defined here with HTML layout
 * 2. All print components call `printDocument(type, data)`
 * 3. YN-UDP designer can override templates via DB
 * 4. Built-in templates used as fallback
 * 
 * USAGE:
 *   import { printDocument } from "@/utils/print/PrintRegistry";
 *   printDocument("fee_receipt", { studentName: "...", amount: 57600, ... });
 */

// ═══ TYPES ═══
export type PrintDocumentType = 
  | "fee_receipt" 
  | "report_card" 
  | "transfer_certificate" 
  | "character_certificate"
  | "bonafide_certificate"
  | "admit_card"
  | "id_card";

export interface PrintConfig {
  pageSize: "A4" | "A5" | "HALF_A4" | "LETTER";
  orientation: "portrait" | "landscape";
  copies: number; // e.g., 2 for student + school copy
  margins: { top: number; right: number; bottom: number; left: number }; // in mm
}

// ═══ GLOBAL PRINT SETTINGS ═══
// These can be overridden from Settings page and saved in localStorage/DB
export const getSchoolInfo = () => {
  const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");
  const rawLogo = tenant.logoUrl || tenant.logo || '';
  const API_BASE = (import.meta as any).env?.VITE_API_URL || (window.location.hostname !== 'localhost' ? 'https://college-erp-backend-91zi.onrender.com' : '');
  const resolvedLogo = rawLogo
    ? rawLogo.startsWith('http') ? rawLogo
      : rawLogo.startsWith('/') ? `${API_BASE}${rawLogo}`
      : `${API_BASE}/uploads/${rawLogo}`
    : '';
  return {
    name: tenant.schoolName || tenant.name || "R.M.S. ACADEMY",
    address: tenant.address || "",
    phone: tenant.phone || "",
    email: tenant.email || "",
    logoUrl: resolvedLogo,
  };
};

// ═══ PAGE SIZE CONFIGS ═══
const PAGE_SIZES: Record<string, { width: string; height: string }> = {
  A4: { width: "210mm", height: "297mm" },
  A5: { width: "148mm", height: "210mm" },
  HALF_A4: { width: "210mm", height: "148mm" },
  LETTER: { width: "216mm", height: "279mm" },
};

// ═══ DEFAULT CONFIGS PER DOCUMENT TYPE ═══
const DEFAULT_CONFIGS: Record<PrintDocumentType, PrintConfig> = {
  fee_receipt: { pageSize: "A4", orientation: "portrait", copies: 2, margins: { top: 10, right: 10, bottom: 10, left: 10 } },
  report_card: { pageSize: "A4", orientation: "portrait", copies: 1, margins: { top: 15, right: 15, bottom: 15, left: 15 } },
  transfer_certificate: { pageSize: "A4", orientation: "portrait", copies: 1, margins: { top: 20, right: 20, bottom: 20, left: 20 } },
  character_certificate: { pageSize: "A4", orientation: "portrait", copies: 1, margins: { top: 20, right: 20, bottom: 20, left: 20 } },
  bonafide_certificate: { pageSize: "A4", orientation: "portrait", copies: 1, margins: { top: 20, right: 20, bottom: 20, left: 20 } },
  admit_card: { pageSize: "A4", orientation: "landscape", copies: 1, margins: { top: 10, right: 10, bottom: 10, left: 10 } },
  id_card: { pageSize: "A5", orientation: "portrait", copies: 1, margins: { top: 5, right: 5, bottom: 5, left: 5 } },
};

// ═══ GET SAVED CONFIG (from localStorage or default) ═══
export const getPrintConfig = (type: PrintDocumentType): PrintConfig => {
  try {
    const saved = localStorage.getItem(`printConfig_${type}`);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_CONFIGS[type];
};

// ═══ SAVE CONFIG ═══
export const savePrintConfig = (type: PrintDocumentType, config: PrintConfig) => {
  localStorage.setItem(`printConfig_${type}`, JSON.stringify(config));
};

// ═══ NUMBER TO WORDS ═══
const numberToWords = (num: number): string => {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  };
  return "Rs. " + convert(Math.round(num)) + " only.";
};

// ═══ GET FEE PERIOD TEXT ═══
const getFeePeriod = (installmentNo: number, dueDate?: string): string => {
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  if (dueDate) {
    const d = new Date(dueDate);
    const monthName = d.toLocaleString("en-IN", { month: "long", year: "numeric" });
    return `${monthName} (Installment #${installmentNo} of 12)`;
  }
  const monthIdx = ((installmentNo - 1) % 12);
  const year = installmentNo <= 9 ? 2025 : 2026;
  return `${months[monthIdx]} ${year} (Installment #${installmentNo} of 12)`;
};

// ═══════════════════════════════════════════════════════════════
// TEMPLATE: FEE RECEIPT (Dual Copy — Student + School)
// ═══════════════════════════════════════════════════════════════
const feeReceiptTemplate = (data: any): string => {
  const school = getSchoolInfo();
  const period = getFeePeriod(data.installmentNo || 1, data.dueDate);
  const payDate = data.paymentDate ? new Date(data.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const singleCopy = (copyType: string) => `
    <div style="width:49%;border:1px solid #000;padding:8px;font-size:11px;font-family:'Courier New',monospace;box-sizing:border-box;">
      <div style="text-align:center;border-bottom:1px solid #000;padding-bottom:5px;margin-bottom:5px;">
        ${school.logoUrl ? `<img src="${school.logoUrl}" style="width:40px;height:40px;float:left;" />` : ""}
        <h2 style="margin:0;font-size:14px;letter-spacing:1px;">${school.name}</h2>
        <p style="margin:0;font-size:9px;">${school.address}</p>
        <p style="margin:0;font-size:9px;">${school.phone}${school.email ? " | " + school.email : ""}</p>
      </div>
      <div style="text-align:center;background:#000;color:#fff;padding:2px;font-size:10px;margin-bottom:5px;">
        FEE RECEIPT (${copyType})
      </div>
      <div style="text-align:center;font-size:10px;margin-bottom:5px;">Session : ${data.session || "2025-26"}</div>
      <table style="width:100%;font-size:10px;margin-bottom:5px;">
        <tr><td><strong>Receipt No.</strong> ${data.receiptNo || "—"}</td><td style="text-align:right;"><strong>Date.</strong> ${payDate}</td></tr>
        <tr><td><strong>Student Name.</strong></td><td>${data.studentName || "—"}</td></tr>
        <tr><td><strong>Father's Name.</strong></td><td>${data.fatherName || "—"}</td></tr>
        <tr><td><strong>Class.</strong></td><td>${data.className || "—"} ${data.section || ""}</td><td><strong>Adm.No.</strong></td><td>${data.admissionNo || "—"}</td></tr>
        <tr><td><strong>Roll No.</strong></td><td>${data.rollNumber || "—"}</td><td><strong>Mode.</strong></td><td>${data.method || "CASH"}</td></tr>
        <tr><td><strong>Month.</strong></td><td colspan="3">${period}</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;border:1px solid #000;margin-bottom:5px;">
        <thead><tr style="background:#f0f0f0;"><th style="border:1px solid #000;padding:2px;text-align:left;font-size:10px;">S.No</th><th style="border:1px solid #000;padding:2px;text-align:left;font-size:10px;">Particulars</th><th style="border:1px solid #000;padding:2px;text-align:right;font-size:10px;">Amount (Rs)</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #000;padding:2px;">1</td><td style="border:1px solid #000;padding:2px;">${data.feeHead || "Fee"}</td><td style="border:1px solid #000;padding:2px;text-align:right;">${(data.totalFee || data.netAmount || data.amount || 0).toLocaleString("en-IN")}</td></tr>
          <tr><td style="border:1px solid #000;padding:2px;"></td><td style="border:1px solid #000;padding:2px;"><strong>Net Amount</strong></td><td style="border:1px solid #000;padding:2px;text-align:right;font-weight:bold;">${(data.totalFee || data.netAmount || data.amount || 0).toLocaleString("en-IN")}</td></tr>
          <tr style="background:#d4edda;"><td style="border:1px solid #000;padding:2px;"></td><td style="border:1px solid #000;padding:2px;font-weight:bold;color:green;">Paid</td><td style="border:1px solid #000;padding:2px;text-align:right;font-weight:bold;color:green;">${(data.amount || 0).toLocaleString("en-IN")}</td></tr>
          <tr style="background:#fff3cd;"><td style="border:1px solid #000;padding:2px;"></td><td style="border:1px solid #000;padding:2px;font-weight:bold;color:red;">Balance</td><td style="border:1px solid #000;padding:2px;text-align:right;font-weight:bold;color:red;">${(data.balance || 0).toLocaleString("en-IN")}</td></tr>
        </tbody>
      </table>
      <p style="font-size:9px;"><strong>In Words:</strong> ${numberToWords(data.amount || 0)}</p>
      <div style="margin-top:4px;font-size:9px;">
        <strong>Total Paid Till Date:</strong> ₹${(data.totalPaidTillDate || data.amount || 0).toLocaleString("en-IN")}
      </div>
      <div style="margin-top:2px;font-size:9px;">
        ${(data.balance || 0) === 0 ? '<strong style="color:green;">✓ FULLY PAID</strong>' : `<strong style="color:red;">Balance Due: ₹${(data.balance || 0).toLocaleString("en-IN")}</strong>`}
      </div>
      <div style="margin-top:10px;display:flex;justify-content:space-between;font-size:9px;">
        <span style="border-top:1px solid #000;padding-top:3px;">Student/Guardian</span>
        <span style="border-top:1px solid #000;padding-top:3px;">Authorised Sign.</span>
      </div>
    </div>
  `;

  return `
    <div style="display:flex;gap:2%;width:100%;">
      ${singleCopy("Student Copy")}
      ${singleCopy("School Copy")}
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// MAIN PRINT FUNCTION — SINGLE ENTRY POINT
// ═══════════════════════════════════════════════════════════════
export const printDocument = (type: PrintDocumentType, data: any) => {
  const config = getPrintConfig(type);
  const pageSize = PAGE_SIZES[config.pageSize] || PAGE_SIZES.A4;

  let bodyHTML = "";

  switch (type) {
    case "fee_receipt":
      bodyHTML = feeReceiptTemplate(data);
      break;
    // Future templates will be added here:
    // case "report_card": bodyHTML = reportCardTemplate(data); break;
    // case "transfer_certificate": bodyHTML = tcTemplate(data); break;
    default:
      bodyHTML = `<p>Template not found for: ${type}</p>`;
  }

  // Open print window
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) { alert("Please allow popups to print"); return; }

  printWindow.document.write(`<!DOCTYPE html><html><head>
    <title>Print - ${type}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; padding: ${config.margins.top}mm ${config.margins.right}mm ${config.margins.bottom}mm ${config.margins.left}mm; }
      @media print {
        body { padding: 0; }
        .no-print { display: none !important; }
        @page { size: ${pageSize.width} ${pageSize.height}; margin: ${config.margins.top}mm ${config.margins.right}mm ${config.margins.bottom}mm ${config.margins.left}mm; }
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    </style>
  </head><body>
    <div class="no-print" style="text-align:center;padding:15px;background:#f8f9fa;margin-bottom:20px;">
      <button onclick="window.print()" style="padding:10px 30px;font-size:16px;background:#4f46e5;color:#fff;border:none;border-radius:8px;cursor:pointer;">🖨️ Print Receipt</button>
    </div>
    ${bodyHTML}
  </body></html>`);
  printWindow.document.close();
};

// ═══════════════════════════════════════════════════════════════
// PRINT MULTIPLE RECEIPTS — All in one window with page breaks
// ═══════════════════════════════════════════════════════════════
export const printMultipleReceipts = (items: any[]) => {
  const config = getPrintConfig("fee_receipt");
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) { alert("Please allow popups to print"); return; }

  // 2 receipts per A4 page — each receipt is a dual-copy (student+school) row
  // Group items in pairs: [0,1], [2,3], [4,5]...
  let pages = "";
  for (let i = 0; i < items.length; i++) {
    pages += `<div style="margin-bottom: 10px;">${feeReceiptTemplate(items[i])}</div>`;
    // After every 2nd receipt, add page break
    if ((i + 1) % 2 === 0 && i < items.length - 1) {
      pages += '<div style="page-break-after: always;"></div>';
    }
  }

  printWindow.document.write(`<!DOCTYPE html><html><head>
    <title>Print - ${items.length} Receipts</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; padding: 5mm; }
      @media print {
        body { padding: 0; }
        .no-print { display: none !important; }
        @page { size: A4; margin: 5mm; }
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    </style>
  </head><body>
    <div class="no-print" style="text-align:center;padding:15px;background:#f8f9fa;margin-bottom:20px;">
      <button onclick="window.print()" style="padding:10px 30px;font-size:16px;background:#4f46e5;color:#fff;border:none;border-radius:8px;cursor:pointer;">🖨️ Print All ${items.length} Receipts</button>
    </div>
    ${pages}
  </body></html>`);
  printWindow.document.close();
};
