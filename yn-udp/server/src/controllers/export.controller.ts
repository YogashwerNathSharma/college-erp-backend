import { Request, Response } from 'express';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { createCanvas, loadImage } from 'canvas';
import { fabric } from 'fabric';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ExportRequest {
  format: 'pdf' | 'png' | 'jpg' | 'svg' | 'docx' | 'print-sheet';
  resolution?: number;
  quality?: number;
  pages: Array<{
    id: string;
    name: string;
    canvasJSON: any;
    width: number;
    height: number;
  }>;
  pageSize?: 'a4' | 'letter' | 'a3';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  itemsPerPage?: number;
}

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  a3: { width: 841.89, height: 1190.55 },
};

// ─────────────────────────────────────────────────────────────
// Export Controller
// ─────────────────────────────────────────────────────────────

export const exportTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const body: ExportRequest = req.body;
    const {
      format,
      resolution = 300,
      quality = 0.92,
      pages,
      pageSize = 'a4',
      orientation = 'portrait',
      margin = 10,
      itemsPerPage = 8,
    } = body;

    if (!pages || pages.length === 0) {
      return res.status(400).json({ error: 'No pages provided for export' });
    }

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'pdf':
        buffer = await exportToPDF(pages, pageSize, orientation, margin);
        contentType = 'application/pdf';
        filename = `template_${templateId || 'export'}.pdf`;
        break;

      case 'png':
        buffer = await exportToImage(pages[0], 'png', resolution);
        contentType = 'image/png';
        filename = `template_${templateId || 'export'}.png`;
        break;

      case 'jpg':
        buffer = await exportToImage(pages[0], 'jpeg', resolution, quality);
        contentType = 'image/jpeg';
        filename = `template_${templateId || 'export'}.jpg`;
        break;

      case 'svg':
        const svgString = await exportToSVG(pages[0]);
        buffer = Buffer.from(svgString, 'utf-8');
        contentType = 'image/svg+xml';
        filename = `template_${templateId || 'export'}.svg`;
        break;

      case 'docx':
        buffer = await exportToDOCX(pages, pageSize, orientation);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `template_${templateId || 'export'}.docx`;
        break;

      case 'print-sheet':
        buffer = await exportPrintSheet(pages[0], pageSize, orientation, margin, itemsPerPage, resolution);
        contentType = 'application/pdf';
        filename = `template_${templateId || 'export'}_sheet.pdf`;
        break;

      default:
        return res.status(400).json({ error: `Unsupported format: ${format}` });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.send(buffer);
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed', message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PDF Export (multi-page)
// ─────────────────────────────────────────────────────────────

async function exportToPDF(
  pages: ExportRequest['pages'],
  pageSize: string,
  orientation: string,
  margin: number
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const pageData of pages) {
    const size = PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES] || PAGE_SIZES.a4;
    const w = orientation === 'landscape' ? size.height : size.width;
    const h = orientation === 'landscape' ? size.width : size.height;

    const pdfPage = pdfDoc.addPage([w, h]);
    const { canvasJSON, width: canvasW, height: canvasH } = pageData;

    // Scale canvas to fit PDF page with margins
    const marginPt = (margin / 25.4) * 72; // mm to points
    const availW = w - marginPt * 2;
    const availH = h - marginPt * 2;
    const scale = Math.min(availW / canvasW, availH / canvasH);

    const objects = canvasJSON.objects || [];

    for (const obj of objects) {
      const x = marginPt + obj.left * scale;
      const y = h - marginPt - (obj.top + (obj.height || 0) * (obj.scaleY || 1)) * scale;

      switch (obj.type) {
        case 'textbox':
        case 'i-text':
        case 'text': {
          const fontSize = (obj.fontSize || 16) * scale * (obj.scaleY || 1);
          const selectedFont = obj.fontWeight === 'bold' ? boldFont : font;
          const text = obj.text || '';
          const color = parseColor(obj.fill || '#000000');

          pdfPage.drawText(text, {
            x,
            y,
            size: Math.max(fontSize, 4),
            font: selectedFont,
            color: rgb(color.r, color.g, color.b),
          });
          break;
        }
        case 'rect': {
          const rw = (obj.width || 0) * (obj.scaleX || 1) * scale;
          const rh = (obj.height || 0) * (obj.scaleY || 1) * scale;
          const fillColor = obj.fill ? parseColor(obj.fill) : null;
          const strokeColor = obj.stroke ? parseColor(obj.stroke) : null;

          if (fillColor && obj.fill !== 'transparent' && obj.fill !== '') {
            pdfPage.drawRectangle({
              x,
              y,
              width: rw,
              height: rh,
              color: rgb(fillColor.r, fillColor.g, fillColor.b),
            });
          }
          if (strokeColor && obj.stroke !== 'transparent') {
            pdfPage.drawRectangle({
              x,
              y,
              width: rw,
              height: rh,
              borderColor: rgb(strokeColor.r, strokeColor.g, strokeColor.b),
              borderWidth: (obj.strokeWidth || 1) * scale,
            });
          }
          break;
        }
        case 'circle': {
          const radius = (obj.radius || 0) * (obj.scaleX || 1) * scale;
          const cx = x + radius;
          const cy = y + radius;
          const fillColor = obj.fill ? parseColor(obj.fill) : null;

          if (fillColor && obj.fill !== 'transparent') {
            pdfPage.drawCircle({
              x: cx,
              y: cy,
              size: radius,
              color: rgb(fillColor.r, fillColor.g, fillColor.b),
            });
          }
          break;
        }
        case 'line': {
          const strokeColor = obj.stroke ? parseColor(obj.stroke) : { r: 0, g: 0, b: 0 };
          const x1 = marginPt + (obj.x1 || 0) * scale + obj.left * scale;
          const y1 = h - marginPt - (obj.y1 || 0) * scale - obj.top * scale;
          const x2 = marginPt + (obj.x2 || 0) * scale + obj.left * scale;
          const y2 = h - marginPt - (obj.y2 || 0) * scale - obj.top * scale;

          pdfPage.drawLine({
            start: { x: x1, y: y1 },
            end: { x: x2, y: y2 },
            thickness: (obj.strokeWidth || 1) * scale,
            color: rgb(strokeColor.r, strokeColor.g, strokeColor.b),
          });
          break;
        }
        case 'image': {
          try {
            if (obj.src) {
              const imgBytes = await fetchImageBuffer(obj.src);
              const isPng = obj.src.includes('.png') || obj.src.includes('data:image/png');
              const embeddedImg = isPng
                ? await pdfDoc.embedPng(imgBytes)
                : await pdfDoc.embedJpg(imgBytes);

              const imgW = (obj.width || 100) * (obj.scaleX || 1) * scale;
              const imgH = (obj.height || 100) * (obj.scaleY || 1) * scale;

              pdfPage.drawImage(embeddedImg, {
                x,
                y,
                width: imgW,
                height: imgH,
              });
            }
          } catch (e) {
            console.warn('Failed to embed image in PDF:', e);
          }
          break;
        }
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ─────────────────────────────────────────────────────────────
// Image Export (PNG/JPG using node-canvas + fabric)
// ─────────────────────────────────────────────────────────────

async function exportToImage(
  page: ExportRequest['pages'][0],
  format: 'png' | 'jpeg',
  resolution: number,
  quality?: number
): Promise<Buffer> {
  const multiplier = resolution / 72;
  const { canvasJSON, width, height } = page;

  const nodeCanvas = createCanvas(width * multiplier, height * multiplier);
  const fabricCanvas = new fabric.StaticCanvas(null as any, {
    width: width * multiplier,
    height: height * multiplier,
  });

  // Scale all objects
  const scaledJSON = {
    ...canvasJSON,
    objects: (canvasJSON.objects || []).map((obj: any) => ({
      ...obj,
      left: obj.left * multiplier,
      top: obj.top * multiplier,
      scaleX: (obj.scaleX || 1) * multiplier,
      scaleY: (obj.scaleY || 1) * multiplier,
    })),
  };

  return new Promise((resolve, reject) => {
    fabricCanvas.loadFromJSON(scaledJSON, () => {
      fabricCanvas.renderAll();
      const stream =
        format === 'png'
          ? (fabricCanvas as any).createPNGStream()
          : (fabricCanvas as any).createJPEGStream({ quality: quality || 0.92 });

      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  });
}

// ─────────────────────────────────────────────────────────────
// SVG Export
// ─────────────────────────────────────────────────────────────

async function exportToSVG(page: ExportRequest['pages'][0]): Promise<string> {
  const { canvasJSON, width, height } = page;

  const fabricCanvas = new fabric.StaticCanvas(null as any, { width, height });

  return new Promise((resolve) => {
    fabricCanvas.loadFromJSON(canvasJSON, () => {
      fabricCanvas.renderAll();
      const svg = fabricCanvas.toSVG();
      resolve(svg);
    });
  });
}

// ─────────────────────────────────────────────────────────────
// DOCX Export
// ─────────────────────────────────────────────────────────────

async function exportToDOCX(
  pages: ExportRequest['pages'],
  pageSize: string,
  orientation: string
): Promise<Buffer> {
  const sections: any[] = [];

  for (const page of pages) {
    const { canvasJSON } = page;
    const objects = canvasJSON.objects || [];
    const children: any[] = [];

    // Sort objects by position (top to bottom)
    const sortedObjects = [...objects].sort((a: any, b: any) => (a.top || 0) - (b.top || 0));

    for (const obj of sortedObjects) {
      switch (obj.type) {
        case 'textbox':
        case 'i-text':
        case 'text': {
          const textRun = new TextRun({
            text: obj.text || '',
            bold: obj.fontWeight === 'bold',
            italics: obj.fontStyle === 'italic',
            size: (obj.fontSize || 16) * 2, // half-points
            font: obj.fontFamily || 'Arial',
            color: (obj.fill || '000000').replace('#', ''),
          });

          let alignment = AlignmentType.LEFT;
          if (obj.textAlign === 'center') alignment = AlignmentType.CENTER;
          if (obj.textAlign === 'right') alignment = AlignmentType.RIGHT;

          children.push(
            new Paragraph({
              children: [textRun],
              alignment,
              spacing: { after: 100 },
            })
          );
          break;
        }
        case 'image': {
          if (obj.src) {
            try {
              const imgBuffer = await fetchImageBuffer(obj.src);
              const imgW = Math.round((obj.width || 100) * (obj.scaleX || 1));
              const imgH = Math.round((obj.height || 100) * (obj.scaleY || 1));

              children.push(
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: imgBuffer,
                      transformation: { width: imgW, height: imgH },
                    }),
                  ],
                })
              );
            } catch (e) {
              console.warn('Failed to embed image in DOCX:', e);
            }
          }
          break;
        }
        case 'rect': {
          // Skip background rectangles
          break;
        }
      }
    }

    // Build table objects
    const tableObjects = objects.filter((o: any) => o.type === 'group' && o.isTable);
    for (const tableObj of tableObjects) {
      const table = buildDocxTable(tableObj);
      if (table) children.push(table);
    }

    const size = PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES] || PAGE_SIZES.a4;

    sections.push({
      properties: {
        page: {
          size: {
            width: orientation === 'landscape' ? size.height * 20 : size.width * 20,
            height: orientation === 'landscape' ? size.width * 20 : size.height * 20,
          },
        },
      },
      children: children.length > 0 ? children : [new Paragraph({ text: '' })],
    });
  }

  const doc = new Document({ sections });
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

function buildDocxTable(tableObj: any): Table | null {
  if (!tableObj.objects || !tableObj.tableConfig) return null;
  const { rows, cols } = tableObj.tableConfig;

  const tableRows: TableRow[] = [];
  for (let r = 0; r < rows; r++) {
    const cells: TableCell[] = [];
    for (let c = 0; c < cols; c++) {
      const cellText = tableObj.cellData?.[r]?.[c] || '';
      cells.push(
        new TableCell({
          children: [new Paragraph({ text: cellText })],
          width: { size: 100 / cols, type: WidthType.PERCENTAGE },
        })
      );
    }
    tableRows.push(new TableRow({ children: cells }));
  }

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ─────────────────────────────────────────────────────────────
// Print Sheet Export (multiple items per page)
// ─────────────────────────────────────────────────────────────

async function exportPrintSheet(
  page: ExportRequest['pages'][0],
  pageSize: string,
  orientation: string,
  margin: number,
  itemsPerPage: number,
  resolution: number
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const size = PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES] || PAGE_SIZES.a4;
  const w = orientation === 'landscape' ? size.height : size.width;
  const h = orientation === 'landscape' ? size.width : size.height;
  const marginPt = (margin / 25.4) * 72;

  // Render the template as PNG first
  const templateImg = await exportToImage(page, 'png', resolution);
  const embeddedImg = await pdfDoc.embedPng(templateImg);

  // Calculate grid
  const cols = itemsPerPage <= 4 ? 2 : itemsPerPage <= 6 ? 3 : 4;
  const rows = Math.ceil(itemsPerPage / cols);

  const cellW = (w - marginPt * 2) / cols;
  const cellH = (h - marginPt * 2) / rows;

  const pdfPage = pdfDoc.addPage([w, h]);

  for (let i = 0; i < itemsPerPage; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = marginPt + col * cellW;
    const y = h - marginPt - (row + 1) * cellH;

    // Scale to fit in cell with some padding
    const padding = 2;
    const imgAspect = page.width / page.height;
    let drawW = cellW - padding * 2;
    let drawH = drawW / imgAspect;
    if (drawH > cellH - padding * 2) {
      drawH = cellH - padding * 2;
      drawW = drawH * imgAspect;
    }

    const offsetX = (cellW - drawW) / 2;
    const offsetY = (cellH - drawH) / 2;

    pdfPage.drawImage(embeddedImg, {
      x: x + offsetX,
      y: y + offsetY,
      width: drawW,
      height: drawH,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function parseColor(color: string): { r: number; g: number; b: number } {
  if (!color || color === 'transparent') return { r: 0, g: 0, b: 0 };

  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return { r, g, b };
  }

  if (color.startsWith('rgb')) {
    const match = color.match(/(\d+)/g);
    if (match && match.length >= 3) {
      return {
        r: parseInt(match[0]) / 255,
        g: parseInt(match[1]) / 255,
        b: parseInt(match[2]) / 255,
      };
    }
  }

  return { r: 0, g: 0, b: 0 };
}

async function fetchImageBuffer(src: string): Promise<Buffer> {
  if (src.startsWith('data:')) {
    const base64 = src.split(',')[1];
    return Buffer.from(base64, 'base64');
  }

  const response = await fetch(src);
  if (!response.ok) throw new Error(`Failed to fetch image: ${src}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─────────────────────────────────────────────────────────────
// Route Handler for Template Export by ID (from DB)
// ─────────────────────────────────────────────────────────────

export const exportTemplateById = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { prisma } = req.app.locals;

    if (templateId === 'preview') {
      // Direct export from provided canvas data
      return exportTemplate(req, res);
    }

    // Fetch template from DB
    const template = await prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // If no pages in body, use the template's canvasJSON
    if (!req.body.pages || req.body.pages.length === 0) {
      req.body.pages = [
        {
          id: template.id,
          name: template.name,
          canvasJSON: template.canvasJSON,
          width: (template.canvasJSON as any)?.width || 595,
          height: (template.canvasJSON as any)?.height || 842,
        },
      ];
    }

    return exportTemplate(req, res);
  } catch (error: any) {
    console.error('Export by ID error:', error);
    res.status(500).json({ error: 'Export failed', message: error.message });
  }
};
