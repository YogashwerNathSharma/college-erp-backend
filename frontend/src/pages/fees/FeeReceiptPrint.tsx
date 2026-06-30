import { getPrintSignatureHTML } from "../../components/PrintSignature";

/**
 * ═══════════════════════════════════════════════════════════════════
 * FEE RECEIPT PRINT — Global Receipt (Used everywhere in ERP)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * FEATURES:
 * 1. Individual fee head rows (Tuition, Transport, Lab, Library etc.)
 * 2. Month coverage (MANDATORY on every receipt): "Paid: Apr to Jun"
 * 3. Total Paid Till Date + Balance Due + Pending From
 * 4. Dual copy (Student + School)
 * 5. Amount in words, signatures
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
  feePeriod?: string;        // "April 2026 to June 2026"
  totalPaidTillDate?: number; // total paid across all payments
  pendingFrom?: string;      // "July 2026"
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

const getFeePeriodText = (data: ReceiptData): string => {
  if (data.feePeriod) return data.feePeriod;
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const installment = data.installmentNo || 1;
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
    ? tenant.logoUrl.startsWith("http") ? tenant.logoUrl : tenant.logoUrl
    : "";

  const date = new Date(data.paymentDate).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const session = data.session || new Date().getFullYear() + "-" + (new Date().getFullYear() + 1).toString().slice(-2);
  const balance = data.balance || 0;
  const discount = data.discountAmount || 0;
  const paidWords = numberToWords(data.amount);
  const totalPaid = data.totalPaidTillDate || data.amount;
  const pendingFrom = data.pendingFrom || "";

  // Build fee rows from feeItems (individual heads)
  let feeRows: { name: string; amount: number }[] = [];
  if (data.feeItems && data.feeItems.length > 0) {
    feeRows = data.feeItems.map((item) => ({ name: item.name, amount: item.amount }));
  } else {
    // Fallback: single row
    feeRows = [{ name: data.feeHead || "Monthly Fee", amount: data.amount + discount }];
  }

  const subTotal = feeRows.reduce((sum, r) => sum + r.amount, 0);

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

      <!-- Receipt Info -->
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

      <!-- Fee Table with INDIVIDUAL fee heads -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 5px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="border: 1px solid #000; padding: 2px 4px; text-align: center; font-size: 8px; width: 25px;">S.No</th>
            <th style="border: 1px solid #000; padding: 2px 4px; text-align: left; font-size: 8px;">Particulars</th>
            <th style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 8px; width: 70px;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${feeRows.map((row, index) => `
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px; font-size: 9px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #000; padding: 2px 4px; font-size: 9px;">${row.name}</td>
            <td style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 9px;">${row.amount.toLocaleString("en-IN")}</td>
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
          ` : ""}
          <tr style="background: #e8f5e9;">
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
            <td style="border: 1px solid #000; padding: 3px 4px; font-weight: bold; font-size: 10px;">Amount Paid</td>
            <td style="border: 1px solid #000; padding: 3px 4px; text-align: right; font-weight: bold; font-size: 10px;">${data.amount.toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>

      <!-- Amount in words -->
      <div style="font-size: 8px; margin-bottom: 4px; padding: 2px 4px; border: 1px solid #ccc; background: #fafafa;">
        <strong>In words:</strong> ₹ ${paidWords}
      </div>

      <!-- ═══ MONTH COVERAGE (MANDATORY) ═══ -->
      <div style="font-size: 8px; border: 1px solid #2e7d32; background: #e8f5e9; padding: 4px 6px; border-radius: 3px; margin-bottom: 5px;">
        <div style="margin-bottom: 2px;"><strong>Fee Paid:</strong> ${getFeePeriodText(data)}</div>
        <div style="margin-bottom: 2px;"><strong>Total Paid Till Date:</strong> ₹${totalPaid.toLocaleString("en-IN")}</div>
        <div style="margin-bottom: 2px;"><strong>Balance Due:</strong> ₹${balance.toLocaleString("en-IN")}</div>
        ${pendingFrom ? `<div><strong>Pending From:</strong> ${pendingFrom}</div>` : ""}
      </div>

      ${data.reference ? `<div style="font-size: 8px; margin-bottom: 4px;"><strong>Ref:</strong> ${data.reference}</div>` : ""}

      <!-- Signature -->
      <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 8px;">
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
