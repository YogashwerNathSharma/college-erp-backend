/**
 * 🧾 Fee Receipt PDF Service
 *
 * Generates a professional fee receipt PDF for a payment.
 * Uses PDFKit for server-side PDF generation.
 */

import prisma from "../../utils/prisma";
import PDFDocument from "pdfkit";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

interface FeeItemInfo {
  name: string;
  amount: number;
  period?: string;
}

interface ReceiptInfo {
  receiptNo: string;
  date: string;
  studentName: string;
  admissionNo: string;
  className: string;
  sectionName: string;
  fatherName: string;
  phone: string;
  items: FeeItemInfo[];
  totalAmount: number;
  discount: number;
  fineAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: string;
  transactionId: string;
  amountInWords: string;
  academicYear: string;
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolLogo?: string;
  receivedBy: string;
}

// ─────────────────────────────────────────────────────
// Fetch and build
// ─────────────────────────────────────────────────────

export async function generateFeeReceiptPDF(
  paymentId: string,
  tenantId: string
): Promise<Buffer> {
  // Fetch payment
  const payment = await prisma.feePayment.findFirst({
    where: { id: paymentId, tenantId },
    include: {
      studentFee: {
        include: {
          enrollment: {
            include: {
              student: true,
              class: true,
              section: true,
              academicYear: true,
            },
          },
          feeStructure: {
            include: { items: { include: { feeHead: true } } },
          },
        },
      },
    },
  });

  if (!payment) throw new Error("Payment not found");

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const studentFee = payment.studentFee as any;
  const enrollment = studentFee?.enrollment;
  const student = enrollment?.student;

  if (!student) throw new Error("Student data not found for this payment");

  // Build fee items from structure
  const items: FeeItemInfo[] = (studentFee?.feeStructure?.items || []).map(
    (item: any) => ({
      name: item.feeHead?.name || item.name || "Fee",
      amount: item.amount || 0,
      period: item.frequency || "",
    })
  );

  // If no structured items, create one from the total
  if (items.length === 0) {
    items.push({ name: "Tuition Fee", amount: payment.amount || 0 });
  }

  const info: ReceiptInfo = {
    receiptNo: payment.receiptNumber || payment.id?.slice(-8).toUpperCase() || "N/A",
    date: new Date(payment.paymentDate || payment.createdAt).toLocaleDateString("en-IN"),
    studentName: `${student.firstName} ${student.lastName}`,
    admissionNo: student.admissionNo || "",
    className: enrollment?.class?.name || "N/A",
    sectionName: enrollment?.section?.name || "",
    fatherName: student.fatherName || "",
    phone: student.phone || student.fatherPhone || "",
    items,
    totalAmount: studentFee?.totalAmount || payment.amount || 0,
    discount: studentFee?.discountAmount || 0,
    fineAmount: studentFee?.fineAmount || payment.fineAmount || 0,
    netAmount: payment.amount || 0,
    paidAmount: payment.amount || 0,
    balanceAmount: studentFee?.balanceAmount || 0,
    paymentMode: payment.paymentMode || payment.method || "Cash",
    transactionId: payment.transactionId || payment.referenceNumber || "",
    amountInWords: numberToWords(payment.amount || 0),
    academicYear: enrollment?.academicYear?.name || "",
    schoolName: (tenant as any)?.name || "",
    schoolAddress: (tenant as any)?.address || "",
    schoolPhone: (tenant as any)?.phone || "",
    schoolEmail: (tenant as any)?.email || "",
    schoolLogo: (tenant as any)?.logoUrl || undefined,
    receivedBy: payment.collectedBy || "Office",
  };

  return buildReceiptPDF(info);
}

// ─────────────────────────────────────────────────────
// PDF Builder
// ─────────────────────────────────────────────────────

function buildReceiptPDF(info: ReceiptInfo): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const pageWidth = 515;
    const primaryColor = "#1a365d";

    // ─── Watermark ───
    doc
      .save()
      .fontSize(60)
      .fillColor("#E8F5E9")
      .opacity(0.15)
      .rotate(-45, { origin: [300, 400] })
      .text("PAID", 150, 350)
      .restore();
    doc.opacity(1);

    // ─── School Header ───
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text(info.schoolName.toUpperCase(), { align: "center" });
    if (info.schoolAddress) {
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#555")
        .text(info.schoolAddress, { align: "center" });
    }
    if (info.schoolPhone || info.schoolEmail) {
      doc
        .fontSize(8)
        .text(
          [info.schoolPhone && `Ph: ${info.schoolPhone}`, info.schoolEmail && `Email: ${info.schoolEmail}`]
            .filter(Boolean)
            .join("  |  "),
          { align: "center" }
        );
    }
    doc.moveDown(0.3);

    // Line
    doc
      .moveTo(40, doc.y)
      .lineTo(40 + pageWidth, doc.y)
      .lineWidth(2)
      .strokeColor(primaryColor)
      .stroke();
    doc.moveDown(0.3);

    // ─── Receipt Title ───
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text("FEE RECEIPT", { align: "center" });
    doc.moveDown(0.5);

    // ─── Receipt Info Row ───
    const infoY = doc.y;
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#000");
    doc.text(`Receipt No: ${info.receiptNo}`, 40, infoY);
    doc.text(`Date: ${info.date}`, 350, infoY);
    doc.text(`Academic Year: ${info.academicYear}`, 40, infoY + 15);
    doc.y = infoY + 35;

    // ─── Student Details Box ───
    const boxY = doc.y;
    doc.rect(40, boxY, pageWidth, 60).fillAndStroke("#F8F9FA", "#ddd");

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#000");
    doc.text(`Student: ${info.studentName}`, 50, boxY + 8);
    doc.text(`Adm No: ${info.admissionNo}`, 350, boxY + 8);
    doc.font("Helvetica");
    doc.text(`Father: ${info.fatherName}`, 50, boxY + 23);
    doc.text(`Class: ${info.className}${info.sectionName ? " - " + info.sectionName : ""}`, 350, boxY + 23);
    doc.text(`Phone: ${info.phone}`, 50, boxY + 38);
    doc.y = boxY + 70;

    // ─── Fee Table ───
    const tableTop = doc.y;
    const colW = [30, 285, 100, 100];
    const tableHeaders = ["S.No", "Fee Head", "Period", "Amount (₹)"];

    drawRow(doc, tableTop, colW, tableHeaders, {
      bold: true,
      bg: primaryColor,
      fg: "#FFFFFF",
    });

    let y = tableTop + 22;
    info.items.forEach((item, i) => {
      drawRow(doc, y, colW, [
        String(i + 1),
        item.name,
        item.period || "—",
        `₹ ${item.amount.toLocaleString("en-IN")}`,
      ], { bg: i % 2 === 0 ? "#F9F9F9" : "#FFF" });
      y += 20;
    });

    // Summary rows
    y += 5;
    doc
      .moveTo(40, y)
      .lineTo(40 + pageWidth, y)
      .lineWidth(0.5)
      .strokeColor("#ccc")
      .stroke();
    y += 8;

    const summaryItems = [
      ["Total Amount", `₹ ${info.totalAmount.toLocaleString("en-IN")}`],
      ...(info.discount > 0 ? [["Discount", `- ₹ ${info.discount.toLocaleString("en-IN")}`]] : []),
      ...(info.fineAmount > 0 ? [["Fine", `+ ₹ ${info.fineAmount.toLocaleString("en-IN")}`]] : []),
      ["Amount Paid", `₹ ${info.paidAmount.toLocaleString("en-IN")}`],
      ...(info.balanceAmount > 0 ? [["Balance Due", `₹ ${info.balanceAmount.toLocaleString("en-IN")}`]] : []),
    ];

    summaryItems.forEach(([label, value]) => {
      const isBold = label === "Amount Paid";
      doc.fontSize(9).font(isBold ? "Helvetica-Bold" : "Helvetica").fillColor("#000");
      doc.text(label as string, 330, y);
      doc.text(value as string, 430, y, { width: 100, align: "right" });
      y += 15;
    });

    y += 5;

    // ─── Amount in Words ───
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("Amount in Words: ", 40, y, { continued: true })
      .font("Helvetica")
      .text(`${info.amountInWords} Only`);
    y += 18;

    // ─── Payment Mode ───
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("Payment Mode: ", 40, y, { continued: true })
      .font("Helvetica")
      .text(info.paymentMode);
    if (info.transactionId) {
      y += 15;
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Transaction ID: ", 40, y, { continued: true })
        .font("Helvetica")
        .text(info.transactionId);
    }

    // ─── Signatures ───
    const sigY = Math.max(y + 60, 680);
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#000")
      .text("_______________________", 40, sigY)
      .text("Received By", 40, sigY + 12);
    doc
      .text("_______________________", 350, sigY)
      .text("Authorized Signatory", 350, sigY + 12);

    // ─── Footer ───
    doc
      .fontSize(7)
      .fillColor("#999")
      .text(
        "This is a computer-generated receipt and does not require a physical signature.",
        40,
        760,
        { align: "center" }
      );

    doc.end();
  });
}

// ─────────────────────────────────────────────────────
// Row drawer
// ─────────────────────────────────────────────────────

function drawRow(
  doc: PDFKit.PDFDocument,
  y: number,
  colW: number[],
  vals: string[],
  opts: { bold?: boolean; bg?: string; fg?: string } = {}
) {
  const startX = 40;
  let x = startX;
  const h = 20;

  if (opts.bg) {
    doc.rect(startX, y, colW.reduce((a, b) => a + b, 0), h).fill(opts.bg);
  }

  doc
    .fontSize(8)
    .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
    .fillColor(opts.fg || "#000");

  vals.forEach((v, i) => {
    doc.text(v, x + 4, y + 5, {
      width: colW[i] - 8,
      align: i === 0 ? "center" : i >= 2 ? "right" : "left",
    });
    x += colW[i];
  });

  x = startX;
  doc.strokeColor("#ccc").lineWidth(0.5);
  colW.forEach((w) => {
    doc.rect(x, y, w, h).stroke();
    x += w;
  });
}

// ─────────────────────────────────────────────────────
// Number to words (Indian format)
// ─────────────────────────────────────────────────────

function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = "Rupees " + convert(rupees);
  if (paise > 0) result += " and " + convert(paise) + " Paise";

  return result;
}
