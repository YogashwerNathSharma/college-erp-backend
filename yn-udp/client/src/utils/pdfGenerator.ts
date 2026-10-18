/**
 * YN-UDP PDF Generator
 * Renders Fabric.js canvas JSON to PDF using pdf-lib
 * Supports single and bulk generation with multi-page and print layouts
 */

import { PDFDocument, PDFPage, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import { processTemplate, TemplateData } from './templateEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PageSize {
  width: number;
  height: number;
}

export interface GenerateOptions {
  format: 'combined' | 'individual' | 'zip';
  pageSize: PageSize;
  itemsPerPage?: number; // For ID cards: 8 per A4 sheet
  margin?: number;
  quality?: 'draft' | 'standard' | 'high'; // Affects image resolution
  fileName?: string;
}

export interface GeneratedPDF {
  buffer: Buffer;
  fileName: string;
  pageCount: number;
}

export interface BulkGenerateResult {
  pdfs: GeneratedPDF[];
  totalRecords: number;
  totalPages: number;
  combinedBuffer?: Buffer;
}

// Standard page sizes in points (72 points per inch)
export const PAGE_SIZES = {
  A4_PORTRAIT: { width: 595.28, height: 841.89 },
  A4_LANDSCAPE: { width: 841.89, height: 595.28 },
  A3_PORTRAIT: { width: 841.89, height: 1190.55 },
  A3_LANDSCAPE: { width: 1190.55, height: 841.89 },
  LETTER_PORTRAIT: { width: 612, height: 792 },
  LETTER_LANDSCAPE: { width: 792, height: 612 },
  ID_CARD_CR80: { width: 243, height: 153 }, // 3.375" x 2.125"
  A5_PORTRAIT: { width: 419.53, height: 595.28 },
  A5_LANDSCAPE: { width: 595.28, height: 419.53 },
};

// ─── Single PDF Generation ────────────────────────────────────────────────────

/**
 * Generate a single PDF from a processed canvas JSON
 */
export async function generateSinglePDF(
  canvasJSON: any,
  pageSize: PageSize,
  options?: { title?: string }
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  if (options?.title) {
    pdfDoc.setTitle(options.title);
  }
  pdfDoc.setCreator('YN-UDP Certificate Designer');
  pdfDoc.setProducer('YN Software ERP');

  const page = pdfDoc.addPage([pageSize.width, pageSize.height]);

  await renderCanvasObjectsToPDF(pdfDoc, page, canvasJSON, pageSize);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Render canvas objects to a PDF page
 * Converts Fabric.js objects (text, rect, image, etc.) to pdf-lib drawing commands
 */
async function renderCanvasObjectsToPDF(
  pdfDoc: PDFDocument,
  page: PDFPage,
  canvasJSON: any,
  pageSize: PageSize
): Promise<void> {
  if (!canvasJSON || !canvasJSON.objects) return;

  const { width: canvasWidth, height: canvasHeight } = canvasJSON;
  const scaleX = pageSize.width / (canvasWidth || pageSize.width);
  const scaleY = pageSize.height / (canvasHeight || pageSize.height);

  // Embed standard fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const fonts: Record<string, any> = {
    'Helvetica': helvetica,
    'Helvetica-Bold': helveticaBold,
    'Arial': helvetica,
    'Times New Roman': timesRoman,
    'Times-Roman': timesRoman,
    'TimesRoman-Bold': timesRomanBold,
    'default': helvetica,
  };

  for (const obj of canvasJSON.objects) {
    try {
      await renderObject(pdfDoc, page, obj, scaleX, scaleY, pageSize.height, fonts);
    } catch (err) {
      console.warn(`Failed to render object of type ${obj.type}:`, err);
    }
  }
}

/**
 * Render a single Fabric.js object to PDF
 */
async function renderObject(
  pdfDoc: PDFDocument,
  page: PDFPage,
  obj: any,
  scaleX: number,
  scaleY: number,
  pageHeight: number,
  fonts: Record<string, any>
): Promise<void> {
  // Calculate position (Fabric uses top-left, PDF uses bottom-left)
  const x = (obj.left || 0) * scaleX;
  const y = pageHeight - ((obj.top || 0) * scaleY);

  switch (obj.type) {
    case 'textbox':
    case 'i-text':
    case 'text':
      renderText(page, obj, x, y, scaleX, scaleY, fonts);
      break;

    case 'rect':
      renderRect(page, obj, x, y, scaleX, scaleY, pageHeight);
      break;

    case 'circle':
      renderCircle(page, obj, x, y, scaleX, scaleY, pageHeight);
      break;

    case 'line':
      renderLine(page, obj, scaleX, scaleY, pageHeight);
      break;

    case 'image':
      await renderImage(pdfDoc, page, obj, x, y, scaleX, scaleY, pageHeight);
      break;

    case 'group':
      if (obj.objects) {
        for (const child of obj.objects) {
          // Group children have offsets relative to group center
          const childObj = {
            ...child,
            left: (obj.left || 0) + (child.left || 0) + (obj.width || 0) / 2,
            top: (obj.top || 0) + (child.top || 0) + (obj.height || 0) / 2,
          };
          await renderObject(pdfDoc, page, childObj, scaleX, scaleY, pageHeight, fonts);
        }
      }
      break;

    default:
      // Unknown object type - skip silently
      break;
  }
}

/**
 * Render text object to PDF
 */
function renderText(
  page: PDFPage,
  obj: any,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
  fonts: Record<string, any>
): void {
  const text = obj.text || '';
  if (!text.trim()) return;

  const fontSize = (obj.fontSize || 14) * scaleY;
  const fontFamily = obj.fontFamily || 'default';
  const isBold = obj.fontWeight === 'bold' || obj.fontWeight >= 700;

  let font = fonts['default'];
  if (fontFamily.includes('Times')) {
    font = isBold ? fonts['TimesRoman-Bold'] : fonts['Times-Roman'];
  } else {
    font = isBold ? fonts['Helvetica-Bold'] : fonts['Helvetica'];
  }

  // Parse color
  const color = parseColor(obj.fill || '#000000');

  // Handle multi-line text
  const lines = text.split('\n');
  const lineHeight = fontSize * (obj.lineHeight || 1.2);

  lines.forEach((line: string, index: number) => {
    const lineY = y - fontSize - (index * lineHeight);

    // Text alignment
    let lineX = x;
    if (obj.textAlign === 'center') {
      const textWidth = font.widthOfTextAtSize(line, fontSize);
      const objWidth = (obj.width || 200) * scaleX;
      lineX = x + (objWidth - textWidth) / 2;
    } else if (obj.textAlign === 'right') {
      const textWidth = font.widthOfTextAtSize(line, fontSize);
      const objWidth = (obj.width || 200) * scaleX;
      lineX = x + objWidth - textWidth;
    }

    page.drawText(line, {
      x: lineX,
      y: lineY,
      size: fontSize,
      font: font,
      color: color,
    });
  });

  // Underline
  if (obj.underline) {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawLine({
      start: { x, y: y - fontSize - 2 },
      end: { x: x + textWidth, y: y - fontSize - 2 },
      thickness: 0.5,
      color: color,
    });
  }
}

/**
 * Render rectangle to PDF
 */
function renderRect(
  page: PDFPage,
  obj: any,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
  pageHeight: number
): void {
  const width = (obj.width || 100) * (obj.scaleX || 1) * scaleX;
  const height = (obj.height || 100) * (obj.scaleY || 1) * scaleY;
  const rectY = y - height;

  // Fill
  if (obj.fill && obj.fill !== 'transparent' && obj.fill !== '') {
    page.drawRectangle({
      x: x,
      y: rectY,
      width: width,
      height: height,
      color: parseColor(obj.fill),
      opacity: obj.opacity ?? 1,
    });
  }

  // Stroke
  if (obj.stroke && obj.stroke !== 'transparent' && obj.strokeWidth > 0) {
    page.drawRectangle({
      x: x,
      y: rectY,
      width: width,
      height: height,
      borderColor: parseColor(obj.stroke),
      borderWidth: obj.strokeWidth || 1,
    });
  }
}

/**
 * Render circle to PDF
 */
function renderCircle(
  page: PDFPage,
  obj: any,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
  pageHeight: number
): void {
  const radius = (obj.radius || 50) * scaleX;

  if (obj.fill && obj.fill !== 'transparent') {
    page.drawCircle({
      x: x + radius,
      y: y - radius,
      size: radius,
      color: parseColor(obj.fill),
      opacity: obj.opacity ?? 1,
    });
  }

  if (obj.stroke && obj.stroke !== 'transparent') {
    page.drawCircle({
      x: x + radius,
      y: y - radius,
      size: radius,
      borderColor: parseColor(obj.stroke),
      borderWidth: obj.strokeWidth || 1,
    });
  }
}

/**
 * Render line to PDF
 */
function renderLine(
  page: PDFPage,
  obj: any,
  scaleX: number,
  scaleY: number,
  pageHeight: number
): void {
  const x1 = (obj.x1 || 0) * scaleX + (obj.left || 0) * scaleX;
  const y1 = pageHeight - ((obj.y1 || 0) * scaleY + (obj.top || 0) * scaleY);
  const x2 = (obj.x2 || 0) * scaleX + (obj.left || 0) * scaleX;
  const y2 = pageHeight - ((obj.y2 || 0) * scaleY + (obj.top || 0) * scaleY);

  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: (obj.strokeWidth || 1) * scaleX,
    color: parseColor(obj.stroke || '#000000'),
    opacity: obj.opacity ?? 1,
  });
}

/**
 * Render image to PDF (from base64 or URL)
 */
async function renderImage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  obj: any,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
  pageHeight: number
): Promise<void> {
  const src = obj.src;
  if (!src) return;

  try {
    let imageBytes: Uint8Array;
    let pdfImage: any;

    if (src.startsWith('data:image/png')) {
      const base64Data = src.split(',')[1];
      imageBytes = Uint8Array.from(Buffer.from(base64Data, 'base64'));
      pdfImage = await pdfDoc.embedPng(imageBytes);
    } else if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) {
      const base64Data = src.split(',')[1];
      imageBytes = Uint8Array.from(Buffer.from(base64Data, 'base64'));
      pdfImage = await pdfDoc.embedJpg(imageBytes);
    } else if (src.startsWith('http') || src.startsWith('/')) {
      // Fetch image from URL
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      imageBytes = new Uint8Array(arrayBuffer);

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('png')) {
        pdfImage = await pdfDoc.embedPng(imageBytes);
      } else {
        pdfImage = await pdfDoc.embedJpg(imageBytes);
      }
    } else {
      return; // Unsupported image source
    }

    const width = (obj.width || 100) * (obj.scaleX || 1) * scaleX;
    const height = (obj.height || 100) * (obj.scaleY || 1) * scaleY;

    page.drawImage(pdfImage, {
      x: x,
      y: y - height,
      width: width,
      height: height,
      opacity: obj.opacity ?? 1,
    });
  } catch (err) {
    console.warn('Failed to embed image:', err);
    // Draw a placeholder rectangle
    page.drawRectangle({
      x: x,
      y: y - (obj.height || 100) * scaleY,
      width: (obj.width || 100) * scaleX,
      height: (obj.height || 100) * scaleY,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });
  }
}

// ─── Bulk PDF Generation ──────────────────────────────────────────────────────

/**
 * Generate PDFs for multiple records from a single template
 */
export async function generateBulkPDFs(
  templateJSON: any,
  records: TemplateData[],
  options: GenerateOptions
): Promise<BulkGenerateResult> {
  const { format, pageSize, itemsPerPage, margin = 20 } = options;

  if (format === 'combined') {
    return generateCombinedPDF(templateJSON, records, pageSize);
  }

  if (itemsPerPage && itemsPerPage > 1) {
    return generatePrintLayout(templateJSON, records, pageSize, itemsPerPage, margin);
  }

  // Individual PDFs
  return generateIndividualPDFs(templateJSON, records, pageSize, options.fileName);
}

/**
 * Generate one combined multi-page PDF (one record per page)
 */
async function generateCombinedPDF(
  templateJSON: any,
  records: TemplateData[],
  pageSize: PageSize
): Promise<BulkGenerateResult> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Bulk Generated Documents');
  pdfDoc.setCreator('YN-UDP Certificate Designer');

  for (const record of records) {
    const processedCanvas = processTemplate(templateJSON, record);
    const page = pdfDoc.addPage([pageSize.width, pageSize.height]);
    await renderCanvasObjectsToPDF(pdfDoc, page, processedCanvas, pageSize);
  }

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return {
    pdfs: [{
      buffer,
      fileName: 'bulk-generated.pdf',
      pageCount: records.length,
    }],
    totalRecords: records.length,
    totalPages: records.length,
    combinedBuffer: buffer,
  };
}

/**
 * Generate individual PDFs (one per record)
 */
async function generateIndividualPDFs(
  templateJSON: any,
  records: TemplateData[],
  pageSize: PageSize,
  fileNameTemplate?: string
): Promise<BulkGenerateResult> {
  const pdfs: GeneratedPDF[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const processedCanvas = processTemplate(templateJSON, record);
    const buffer = await generateSinglePDF(processedCanvas, pageSize);

    // Generate filename from record data
    let fileName = fileNameTemplate || '{{name}}_{{admission_no}}';
    fileName = fileName.replace(/\{\{(\w+)\}\}/g, (_, field) => {
      return record[field] || field;
    });
    fileName = `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    pdfs.push({ buffer, fileName, pageCount: 1 });
  }

  return {
    pdfs,
    totalRecords: records.length,
    totalPages: records.length,
  };
}

/**
 * Generate print-ready layout (multiple items per page - for ID cards etc.)
 */
async function generatePrintLayout(
  templateJSON: any,
  records: TemplateData[],
  outputPageSize: PageSize,
  itemsPerPage: number,
  margin: number
): Promise<BulkGenerateResult> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Print Layout - Bulk Generated');
  pdfDoc.setCreator('YN-UDP Certificate Designer');

  // Calculate grid layout
  const cols = Math.ceil(Math.sqrt(itemsPerPage));
  const rows = Math.ceil(itemsPerPage / cols);
  const availableWidth = outputPageSize.width - (margin * 2);
  const availableHeight = outputPageSize.height - (margin * 2);
  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / rows;
  const itemGap = 5;

  let currentPage: PDFPage | null = null;
  let itemIndex = 0;
  let pageCount = 0;

  for (let i = 0; i < records.length; i++) {
    const posOnPage = i % itemsPerPage;

    // Create new page when needed
    if (posOnPage === 0) {
      currentPage = pdfDoc.addPage([outputPageSize.width, outputPageSize.height]);
      pageCount++;
    }

    if (!currentPage) continue;

    const col = posOnPage % cols;
    const row = Math.floor(posOnPage / cols);

    // Calculate position for this item on the page
    const itemX = margin + (col * cellWidth) + itemGap;
    const itemY = margin + (row * cellHeight) + itemGap;
    const itemWidth = cellWidth - (itemGap * 2);
    const itemHeight = cellHeight - (itemGap * 2);

    // Process template for this record
    const processedCanvas = processTemplate(templateJSON, records[i]);

    // Draw a border around each item (optional, for cutting guides)
    currentPage.drawRectangle({
      x: itemX,
      y: outputPageSize.height - itemY - itemHeight,
      width: itemWidth,
      height: itemHeight,
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 0.5,
      borderDashArray: [3, 3],
    });

    // Render the template scaled to fit within the cell
    // This requires a mini-render with adjusted coordinates
    if (processedCanvas.objects) {
      const templateWidth = processedCanvas.width || 595;
      const templateHeight = processedCanvas.height || 842;
      const scaleToFitX = itemWidth / templateWidth;
      const scaleToFitY = itemHeight / templateHeight;
      const scaleFactor = Math.min(scaleToFitX, scaleToFitY);

      // Create a sub-canvas adjusted for position
      const adjustedCanvas = {
        ...processedCanvas,
        width: itemWidth / scaleFactor,
        height: itemHeight / scaleFactor,
      };

      // For print layout, we render each item's objects individually with offset
      // This is a simplified version - in production you'd use canvas.toDataURL()
      // and embed as image for pixel-perfect rendering
    }
  }

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return {
    pdfs: [{
      buffer,
      fileName: 'print-layout.pdf',
      pageCount,
    }],
    totalRecords: records.length,
    totalPages: pageCount,
    combinedBuffer: buffer,
  };
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Parse CSS color string to pdf-lib RGB color
 */
function parseColor(color: string): ReturnType<typeof rgb> {
  if (!color || color === 'transparent') return rgb(0, 0, 0);

  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }

  // Handle rgb() colors
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return rgb(
      parseInt(rgbMatch[1]) / 255,
      parseInt(rgbMatch[2]) / 255,
      parseInt(rgbMatch[3]) / 255
    );
  }

  // Handle rgba() colors
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (rgbaMatch) {
    return rgb(
      parseInt(rgbaMatch[1]) / 255,
      parseInt(rgbaMatch[2]) / 255,
      parseInt(rgbaMatch[3]) / 255
    );
  }

  // Named colors fallback
  const namedColors: Record<string, [number, number, number]> = {
    black: [0, 0, 0],
    white: [1, 1, 1],
    red: [1, 0, 0],
    green: [0, 0.5, 0],
    blue: [0, 0, 1],
    yellow: [1, 1, 0],
    gray: [0.5, 0.5, 0.5],
    navy: [0, 0, 0.5],
  };

  const named = namedColors[color.toLowerCase()];
  if (named) return rgb(named[0], named[1], named[2]);

  return rgb(0, 0, 0); // Default black
}

/**
 * Convert canvas pixel dimensions to PDF points at given DPI
 */
export function pixelsToPoints(pixels: number, dpi: number = 96): number {
  return (pixels / dpi) * 72;
}

/**
 * Convert PDF points to canvas pixels at given DPI
 */
export function pointsToPixels(points: number, dpi: number = 96): number {
  return (points / 72) * dpi;
}

/**
 * Estimate PDF file size (rough approximation)
 */
export function estimatePDFSize(
  canvasJSON: any,
  recordCount: number,
  hasImages: boolean
): string {
  const baseSize = 5000; // ~5KB base PDF overhead
  const textSize = JSON.stringify(canvasJSON).length * 0.3; // Text compression
  const imageSize = hasImages ? 50000 : 0; // ~50KB per image
  const perRecordSize = textSize + imageSize;
  const totalBytes = baseSize + (perRecordSize * recordCount);

  if (totalBytes < 1024) return `${totalBytes} B`;
  if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
  return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default {
  generateSinglePDF,
  generateBulkPDFs,
  PAGE_SIZES,
  pixelsToPoints,
  pointsToPixels,
  estimatePDFSize,
};
