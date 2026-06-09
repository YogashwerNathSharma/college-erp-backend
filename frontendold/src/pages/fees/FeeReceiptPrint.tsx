
// Fee Receipt Print — Dual Copy (Student + School)
// Portrait A4 — 2 copies side by side, scaled to fit 4 per page

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
  installmentNo: number;
  amount: number;
  method: string;
  reference?: string | null;
  totalDue?: number;
  balance?: number;
  collectedBy?: string;
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

export const FeeReceiptPrint = (data: ReceiptData) => {
  const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");
  const schoolName = tenant.name || tenant.schoolName || "School Name";
  const address = tenant.address || "";
  const phone = tenant.phone || "";
  const email = tenant.email || "";
  const logoUrl = tenant.logoUrl
    ? tenant.logoUrl.startsWith("http")
      ? tenant.logoUrl
      : `http://localhost:5000${tenant.logoUrl}`
    : "";

  const date = new Date(data.paymentDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const session = data.session || new Date().getFullYear() + "-" + (new Date().getFullYear() + 1).toString().slice(-2);
  const balance = data.balance || 0;
  const paidWords = numberToWords(data.amount);

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
          <td colspan="3">Installment #${data.installmentNo}</td>
        </tr>
      </table>

      <!-- Fee Table -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 5px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="border: 1px solid #000; padding: 2px 4px; text-align: left; font-size: 8px;">Particulars</th>
            <th style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 8px; width: 70px;">Amount (Rs)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px; font-size: 9px;">${data.feeHead}</td>
            <td style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 9px;">${data.amount.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px; font-weight: bold; font-size: 9px;">Total Amount</td>
            <td style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-weight: bold; font-size: 9px;">${data.amount.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px; font-weight: bold; font-size: 9px;">Total Payable</td>
            <td style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-weight: bold; font-size: 9px;">${data.amount.toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>

      <!-- Paid in words -->
      <div style="margin-bottom: 3px; font-size: 8px;">
        <strong>Paid: ${paidWords}</strong>
      </div>

      <!-- Balance -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 9px;">
        <div><strong>Balance:</strong> ₹${balance.toLocaleString("en-IN")}</div>
      </div>

      ${data.totalDue ? `<div style="border-top: 1px solid #000; padding-top: 2px; margin-top: 2px; font-weight: bold; font-size: 9px;">Total Due - ₹${data.totalDue.toLocaleString("en-IN")}</div>` : ""}

      <!-- Signature -->
      <div style="display: flex; justify-content: space-between; margin-top: 14px; font-size: 8px;">
        <div>
          <div style="border-top: 1px solid #000; padding-top: 1px; width: 90px; text-align: center;">
            Student/Guardian
          </div>
        </div>
        <div>
          <div style="border-top: 1px solid #000; padding-top: 1px; width: 90px; text-align: center;">
            ${data.collectedBy || "Authorized Sign."}
          </div>
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
        
        .cut-line {
          border-top: 1px dashed #999;
          margin: 6px 0;
          position: relative;
        }
        .cut-line::before {
          content: "✂";
          position: absolute;
          top: -8px;
          left: 5px;
          font-size: 10px;
          color: #999;
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

      <!-- Row 1: Student Copy + School Copy -->
      <div class="receipt-row">
        ${generateCopy("Student Copy")}
        ${generateCopy("School Copy")}
      </div>


    </body>
    </html>
  `);

  printWindow.document.close();
};

