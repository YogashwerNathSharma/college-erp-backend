import { getPrintSignatureHTML } from "../../components/PrintSignature";

/**
 * ═══════════════════════════════════════════════════════════════════
 * FEE RECEIPT PRINT — Unified Receipt (No Individual Fee Heads)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * RULES:
 * 1. NO individual fee head breakdown (no Tuition, Transport, Lab rows)
 * 2. Just ONE row showing total amount collected
 * 3. Transport & Hostel are already included in the total if student has them
 * 4. Dual copy (Student + School) side by side
 * 5. Same receipt format used everywhere in the ERP
 */

interface FeeHeadEntry {
  name: string;
  amount: number;
  code?: string;
}

interface ReceiptData {
  receiptNo: string;
  paymentDate: string;
  studentName: string;
  admissionNo: string;
  fatherName: string;
  className: string;
  section: string;
  rollNumber?: string;
  session?: string;
  feeHead: string;
  feeItems?: FeeHeadEntry[];
  installmentNo: number;
  amount: number;
  method: string;
  reference?: string | null;
  totalDue?: number;
  balance?: number;
  collectedBy?: string;
  discountAmount?: number;
  feePeriod?: string;
  dueDate?: string;
}

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
  return convert(Math.round(num)) + " only.";
};

// Get fee period text from installment number or dates
const getFeePeriodText = (data: ReceiptData): string => {
  if (data.feePeriod) return data.feePeriod;

  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const installment = data.installmentNo || 1;

  if (data.dueDate) {
    const d = new Date(data.dueDate);
    const monthName = d.toLocaleString("en-IN", { month: "short", year: "numeric" });
    return `${monthName} (Installment #${installment})`;
  }

  const monthIdx = ((installment - 1) % 12);
  const monthName = months[monthIdx];
  const year = new Date().getFullYear();
  const displayYear = monthIdx >= 9 ? year + 1 : year;
  return `${monthName} ${displayYear} (Installment #${installment})`;
};

export const FeeReceiptPrint = async (data: ReceiptData) => {
  const principalSignatureHTML = await getPrintSignatureHTML();
  const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");
  const schoolName = tenant.name || tenant.schoolName || "School Name";
  const address = tenant.address || "";
  const phone = tenant.phone || "";
  const email = tenant.email || "";
  const logoUrl = tenant.logoUrl
    ? tenant.logoUrl.startsWith("http")
      ? tenant.logoUrl
      : `${tenant.logoUrl}`
    : "";

  const date = new Date(data.paymentDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const session = data.session || new Date().getFullYear() + "-" + (new Date().getFullYear() + 1).toString().slice(-2);
  const balance = data.balance || 0;
  const discount = data.discountAmount || 0;
  const paidWords = numberToWords(data.amount);

  // UNIFIED: No individual fee head rows — just total
  const totalAmount = data.amount + discount; // gross before discount

  const generateCopy = (copyType: string) => `
    <div class="receipt-copy">
      <!-- Header -->
      <div style="display: flex; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 5px; margin-bottom: 5px;">
        ${logoUrl ? `<img src="${logoUrl}" style="width: 36px; height: 36px; object-fit: contain; margin-right: 8px;" />` : ""}
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 13px; font-weight: bold; letter-spacing: 0.5px;">${schoolName}</div>
          <div style="font-size: 8px;">${address}</div>
          <div style="font-size: 8px;">${phone}${email ? " | " + email : ""}</div>
        </div>
      </div>

      <!-- Title -->
      <div style="text-align: center; font-weight: bold; font-size: 10px; margin-bottom: 4px; background: #e8e8e8; padding: 2px; border: 1px solid #000;">
        FEE RECEIPT (${copyType})
      </div>

      <!-- Session -->
      <div style="text-align: center; font-size: 9px; margin-bottom: 4px;">
        <strong>Session : ${session}</strong>
      </div>

      <!-- Receipt Info Row -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 9px;">
        <div><strong>Receipt No.</strong> ${data.receiptNo}</div>
        <div><strong>Date.</strong> ${date}</div>
      </div>

      <!-- Student Info -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px; font-size: 9px;">
        <tr>
          <td style="padding: 1px 0; width: 32%;"><strong>Student Name.</strong></td>
          <td colspan="3">${data.studentName}</td>
        </tr>
        <tr>
          <td style="padding: 1px 0;"><strong>Father's Name.</strong></td>
          <td colspan="3">${data.fatherName}</td>
        </tr>
        <tr>
          <td style="padding: 1px 0;"><strong>Class.</strong></td>
          <td style="width: 18%;">${data.className} ${data.section}</td>
          <td style="width: 22%;"><strong>Adm.No.</strong></td>
          <td style="width: 28%;">${data.admissionNo}</td>
        </tr>
        <tr>
          <td style="padding: 1px 0;"><strong>Roll.No.</strong></td>
          <td>${data.rollNumber || "-"}</td>
          <td><strong>Mode.</strong></td>
          <td>${data.method}</td>
        </tr>
        <tr>
          <td style="padding: 1px 0;"><strong>Month.</strong></td>
          <td colspan="3">${getFeePeriodText(data)}</td>
        </tr>
      </table>

      <!-- Fee Table — UNIFIED: Single row, no individual fee heads -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 5px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="border: 1px solid #000; padding: 2px 4px; text-align: left; font-size: 8px;">Particulars</th>
            <th style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 8px; width: 80px;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 3px 4px; font-size: 9px;">Monthly Fee (Installment #${data.installmentNo})</td>
            <td style="border: 1px solid #000; padding: 3px 4px; text-align: right; font-size: 9px; font-weight: bold;">${totalAmount.toLocaleString("en-IN")}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px; font-size: 9px; color: #6b21a8;"><strong>Discount</strong></td>
            <td style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 9px; color: #6b21a8;">- ${discount.toLocaleString("en-IN")}</td>
          </tr>
          ` : ""}
          <tr style="background: #f9f9f9;">
            <td style="border: 1px solid #000; padding: 3px 4px; font-weight: bold; font-size: 9px;">Amount Paid</td>
            <td style="border: 1px solid #000; padding: 3px 4px; text-align: right; font-weight: bold; font-size: 10px;">${data.amount.toLocaleString("en-IN")}</td>
          </tr>
          ${balance > 0 ? `
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px; font-size: 9px; color: #dc2626;"><strong>Balance Due</strong></td>
            <td style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 9px; color: #dc2626; font-weight: bold;">${balance.toLocaleString("en-IN")}</td>
          </tr>
          ` : ""}
        </tbody>
      </table>

      <!-- Amount in words -->
      <div style="font-size: 8px; margin-bottom: 5px; padding: 2px 4px; border: 1px solid #ccc; background: #fafafa;">
        <strong>Amount in words:</strong> ₹ ${paidWords}
      </div>

      ${data.reference ? `<div style="font-size: 8px; margin-bottom: 4px;"><strong>Ref:</strong> ${data.reference}</div>` : ""}

      <!-- Signature -->
      <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 8px;">
        <div style="text-align: center;">
          <div style="border-top: 1px solid #000; padding-top: 2px; min-width: 80px;">Parent/Guardian</div>
        </div>
        <div style="text-align: center;">
          ${principalSignatureHTML}
          <div style="border-top: 1px solid #000; padding-top: 2px; min-width: 80px;">Authorized Signatory</div>
        </div>
      </div>
    </div>
  `;

  const html = `
    <html>
    <head>
      <title>Fee Receipt - ${data.receiptNo}</title>
      <style>
        @page { size: A4 portrait; margin: 8mm; }
        body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; }
        .receipt-container {
          display: flex;
          gap: 10px;
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
        }
        .receipt-copy {
          flex: 1;
          border: 1.5px solid #000;
          padding: 8px;
          box-sizing: border-box;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .receipt-container { gap: 8px; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        ${generateCopy("Student Copy")}
        ${generateCopy("School Copy")}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
};
