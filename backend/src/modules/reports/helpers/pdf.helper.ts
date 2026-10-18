import PDFDocument from "pdfkit";

/**
 * Generate a PDF report from data
 */
export const generatePDF = async (title: string, data: any[]): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text(title, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica")
      .text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, { align: "center" });
    doc.moveDown(1);

    // Draw line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    if (data.length === 0) {
      doc.fontSize(12).text("No data available", { align: "center" });
      doc.end();
      return;
    }

    // Table headers
    const keys = Object.keys(data[0]);
    const colWidth = Math.min(500 / keys.length, 100);
    const startX = 50;
    let currentY = doc.y;

    // Header row
    doc.fontSize(8).font("Helvetica-Bold");
    keys.forEach((key, i) => {
      doc.text(
        formatHeaderName(key),
        startX + i * colWidth,
        currentY,
        { width: colWidth, align: "left" }
      );
    });

    currentY += 20;
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 5;

    // Data rows
    doc.font("Helvetica").fontSize(7);
    for (const row of data) {
      if (currentY > 750) {
        doc.addPage();
        currentY = 50;
      }

      keys.forEach((key, i) => {
        const value = row[key] !== null && row[key] !== undefined ? String(row[key]) : "";
        doc.text(value.substring(0, 20), startX + i * colWidth, currentY, {
          width: colWidth,
          align: "left",
        });
      });

      currentY += 15;
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font("Helvetica")
      .text(`Total Records: ${data.length}`, { align: "left" });

    doc.end();
  });
};

/**
 * Generate PDF with custom template
 */
export const generateCustomPDF = async (options: {
  title: string;
  subtitle?: string;
  headerLogo?: string;
  data: any[];
  columns: Array<{ header: string; key: string; width?: number }>;
  orientation?: "portrait" | "landscape";
}): Promise<Buffer> => {
  const { title, subtitle, data, columns, orientation } = options;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: orientation || "portrait",
    });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Title
    doc.fontSize(18).font("Helvetica-Bold").text(title, { align: "center" });
    if (subtitle) {
      doc.fontSize(10).font("Helvetica").text(subtitle, { align: "center" });
    }
    doc.moveDown(1);

    // Table
    const pageWidth = orientation === "landscape" ? 770 : 510;
    const colWidth = pageWidth / columns.length;
    let y = doc.y;

    // Headers
    doc.fontSize(8).font("Helvetica-Bold");
    columns.forEach((col, i) => {
      doc.text(col.header, 40 + i * colWidth, y, { width: colWidth });
    });
    y += 15;

    // Data
    doc.font("Helvetica").fontSize(7);
    for (const row of data) {
      if (y > (orientation === "landscape" ? 550 : 780)) {
        doc.addPage();
        y = 40;
      }
      columns.forEach((col, i) => {
        const val = row[col.key] != null ? String(row[col.key]) : "";
        doc.text(val.substring(0, 25), 40 + i * colWidth, y, { width: colWidth });
      });
      y += 12;
    }

    doc.end();
  });
};

function formatHeaderName(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
