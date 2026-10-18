import ExcelJS from "exceljs";

interface ColumnDef {
  header: string;
  key: string;
  width?: number;
}

/**
 * Generate an Excel file from data
 */
export const generateExcel = async (
  title: string,
  data: any[],
  columns: ColumnDef[]
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "School ERP";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(title);

  // Title row
  worksheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = worksheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: "center" };

  // Date row
  worksheet.mergeCells(2, 1, 2, columns.length);
  const dateCell = worksheet.getCell("A2");
  dateCell.value = `Generated on: ${new Date().toLocaleDateString("en-IN")}`;
  dateCell.font = { size: 10, italic: true };
  dateCell.alignment = { horizontal: "center" };

  // Empty row
  worksheet.addRow([]);

  // Column headers
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
  }));

  // Style header row (row 4)
  const headerRow = worksheet.getRow(4);
  headerRow.values = columns.map((c) => c.header);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { horizontal: "center" };

  // Data rows
  data.forEach((row, index) => {
    const excelRow = worksheet.addRow(columns.map((c) => row[c.key] || ""));
    // Alternate row coloring
    if (index % 2 === 0) {
      excelRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F2F2" },
      };
    }
  });

  // Auto-fit columns
  worksheet.columns.forEach((col) => {
    if (col.header) {
      col.width = Math.max(col.header.length + 5, 12);
    }
  });

  // Add borders
  const lastRow = worksheet.rowCount;
  for (let row = 4; row <= lastRow; row++) {
    for (let col = 1; col <= columns.length; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

/**
 * Generate a summary Excel with multiple sheets
 */
export const generateMultiSheetExcel = async (
  sheets: Array<{ name: string; data: any[]; columns: ColumnDef[] }>
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "School ERP";
  workbook.created = new Date();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);

    worksheet.columns = sheet.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    // Header styling
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Data
    sheet.data.forEach((row) => {
      worksheet.addRow(sheet.columns.map((c) => row[c.key] || ""));
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
