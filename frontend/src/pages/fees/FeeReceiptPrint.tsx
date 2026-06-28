import { getPrintSignatureHTML } from "../../components/PrintSignature";

// Fee Receipt Print — Dual Copy (Student + School)
// Portrait A4 — 2 copies side by side
// Shows all fee head entries in SEPARATE ROWS with amounts, discount, after discount

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
  feeItems?: FeeHeadEntry[]; // Individual fee head entries with amounts
  installmentNo: number;
  amount: number;
  method: string;
  reference?: string | null;
  totalDue?: number;
  balance?: number;
  collectedBy?: string;
  discountAmount?: number;
  feePeriod?: string; // "Apr 2025 - Jun 2025"
  dueDate?: string; // ISO date to derive month
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
  // If explicit feePeriod provided, use it
  if (data.feePeriod) return data.feePeriod;

  // Derive from installment number (Indian academic year: Apr=1, May=2, ..., Mar=12)
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const installment = data.installmentNo || 1;

  if (data.dueDate) {
    const d = new Date(data.dueDate);
    const monthName = d.toLocaleString("en-IN", { month: "short", year: "numeric" });
    return `${monthName} (Installment #${installment})`;
  }

  // Fallback: map installment to month
  const monthIdx = ((installment - 1) % 12);
  const monthName = months[monthIdx];
  const year = new Date().getFullYear();
  const displayYear = monthIdx >= 9 ? year + 1 : year; // Jan-Mar = next year
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

  // Build fee rows from feeItems (preferred) or fallback to comma-separated feeHead
  let feeRows: { name: string; amount: number | null }[] = [];

  if (data.feeItems && data.feeItems.length > 0) {
    // Use backend-provided feeItems with individual amounts
    feeRows = data.feeItems.map((item) => ({ name: item.name, amount: item.amount }));
  } else {
    // Fallback: split comma-separated feeHead string
    const feeHeadNames = (data.feeHead || "Fee")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    feeRows = feeHeadNames.map((name) => ({ name, amount: null }));
  }

  // Calculate sub-total
  const subTotal = feeRows.some((r) => r.amount !== null)
    ? feeRows.reduce((sum, r) => sum + (r.amount || 0), 0)
    : data.amount + discount;

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

      <!-- Fee Table - Each fee head in SEPARATE ROW -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 5px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="border: 1px solid #000; padding: 2px 4px; text-align: center; font-size: 8px; width: 25px;">S.No</th>
            <th style="border: 1px solid #000; padding: 2px 4px; text-align: left; font-size: 8px;">Particulars</th>
            <th style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 8px; width: 70px;">Amount (Rs)</th>
          </tr>
        </thead>
        <tbody>
          ${feeRows.map((row, index) => `
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px; font-size: 9px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #000; padding: 2px 4px; font-size: 9px;">${row.name}</td>
            <td style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 9px;">${row.amount !== null ? row.amount.toLocaleString("en-IN") : ""}</td>
          </tr>
          `).join("")}
          <tr style="background: #f9f9f9;">
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
            <td style="border: 1px solid #000; padding: 3px 4px; font-weight: bold; font-size: 9px;">Sub Total</td>
            <td style="border: 1px solid #000; padding: 3px 4px; text-align: right; font-weight: bold; font-size: 9px;">${subTotal.toLocaleString("en-IN")}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
            <td style="border: 1px solid #000; padding: 2px 4px; font-size: 9px; color: #6b21a8;"><strong>Discount</strong></td>
            <td style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 9px; color: #6b21a8;">- ${discount.toLocaleString("en-IN")}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
            <td style="border: 1px solid #000; padding: 3px 4px; font-weight: bold; font-size: 9px;">After Discount</td>
            <td style="border: 1px solid #000; padding: 3px 4px; text-align: right; font-weight: bold; font-size: 9px;">${(subTotal - discount).toLocaleString("en-IN")}</td>
          </tr>
          ` : ""}
          <tr style="background: #e8f5e9;">
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
            <td style="border: 1px solid #000; padding: 3px 4px; font-weight: bold; font-size: 10px;">Total Paid</td>
            <td style="border: 1px solid #000; padding: 3px 4px; text-align: right; font-weight: bold; font-size: 10px;">${data.amount.toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>

      <!-- Paid in words -->
      <div style="margin-bottom: 3px; font-size: 8px;">
        <strong>In Words: Rs. ${paidWords}</strong>
      </div>

      <!-- Balance -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 3px; padding: 3px 5px; background: #fff3cd; border: 1px solid #ffc107; font-size: 10px;">
        <div><strong>Balance Due:</strong> ₹${balance.toLocaleString("en-IN")}</div>
        ${data.reference ? `<div><strong>Ref:</strong> ${data.reference}</div>` : ""}
      </div>

      ${data.totalDue ? `<div style="border-top: 1px solid #000; padding-top: 2px; margin-top: 2px; font-weight: bold; font-size: 9px;">Total Due - ₹${data.totalDue.toLocaleString("en-IN")}</div>` : ""}

      <!-- Signature -->
      <div style="display: flex; justify-content: space-between; margin-top: 14px; font-size: 8px;">
        <div>
          <div style="border-top: 1px solid #000; padding-top: 1px; width: 90px; text-align: center;">
            Student/Guardian
          </div>
        </div>
        <div style="text-align: center;">
          ${principalSignatureHTML || `<div style="border-top: 1px solid #000; padding-top: 1px; width: 90px; text-align: center;">${data.collectedBy || "Authorized Sign."}</div>`}
        </div>
      </div>
    </div>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fee Receipt - ${data.receiptNo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; }
        
        .receipt-row {
          display: flex;
          gap: 8px;
          justify-content: center;
          padding: 4px 10px;
        }
        
        .receipt-copy {
          width: 48%;
          border: 1.5px solid #000;
          padding: 8px 10px;
          font-size: 9px;
        }

        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          @page { 
            size: A4 portrait; 
            margin: 5mm; 
          }
        }
      </style>
    </head>
    <body>
      <!-- Print Button -->
      <div class="no-print" style="text-align: center; padding: 12px;">
        <button onclick="window.print()" style="padding: 10px 30px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
          🖨️ Print Receipt
        </button>
      </div>

      <!-- Student Copy + School Copy -->
      <div class="receipt-row">
        ${generateCopy("Student Copy")}
        ${generateCopy("School Copy")}
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
};

