/**
 * Export Helpers for YN-UDP Template Designer
 * 
 * Shared utilities for canvas export, print layout calculations,
 * and format conversions.
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PageDimensions {
  width: number;   // in points (1pt = 1/72 inch)
  height: number;
  unit: 'pt' | 'mm' | 'in' | 'px';
}

export interface PrintSheetConfig {
  pageSize: PageDimensions;
  itemSize: { width: number; height: number };
  margin: number; // in mm
  gap: number; // gap between items in mm
  itemsPerPage: number;
}

export interface GridLayout {
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  offsetX: number;
  offsetY: number;
  positions: Array<{ x: number; y: number; width: number; height: number }>;
}

export type ExportFormat = 'pdf' | 'png' | 'jpg' | 'svg' | 'docx' | 'print-sheet';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

export const PAGE_SIZES: Record<string, PageDimensions> = {
  'a4-portrait': { width: 595.28, height: 841.89, unit: 'pt' },
  'a4-landscape': { width: 841.89, height: 595.28, unit: 'pt' },
  'a3-portrait': { width: 841.89, height: 1190.55, unit: 'pt' },
  'a3-landscape': { width: 1190.55, height: 841.89, unit: 'pt' },
  'a5-portrait': { width: 419.53, height: 595.28, unit: 'pt' },
  'a5-landscape': { width: 595.28, height: 419.53, unit: 'pt' },
  'letter-portrait': { width: 612, height: 792, unit: 'pt' },
  'letter-landscape': { width: 792, height: 612, unit: 'pt' },
  'cr80': { width: 242.65, height: 153.07, unit: 'pt' }, // 85.6mm x 53.98mm
  'cr80-portrait': { width: 153.07, height: 242.65, unit: 'pt' },
};

export const MM_TO_PT = 72 / 25.4;
export const PT_TO_MM = 25.4 / 72;
export const INCH_TO_PT = 72;
export const PT_TO_INCH = 1 / 72;
export const PX_TO_PT = 0.75; // at 96 DPI
export const PT_TO_PX = 1.333;

// ─────────────────────────────────────────────────────────────
// Unit Conversions
// ─────────────────────────────────────────────────────────────

export function mmToPoints(mm: number): number {
  return mm * MM_TO_PT;
}

export function pointsToMm(pts: number): number {
  return pts * PT_TO_MM;
}

export function inchesToPoints(inches: number): number {
  return inches * INCH_TO_PT;
}

export function pointsToInches(pts: number): number {
  return pts * PT_TO_INCH;
}

export function pixelsToPoints(px: number, dpi: number = 96): number {
  return (px / dpi) * 72;
}

export function pointsToPixels(pts: number, dpi: number = 96): number {
  return (pts / 72) * dpi;
}

// ─────────────────────────────────────────────────────────────
// Print Layout Calculations
// ─────────────────────────────────────────────────────────────

/**
 * Calculate optimal grid layout for printing multiple items per page.
 * Used for ID cards, business cards, etc.
 */
export function calculatePrintSheetLayout(config: PrintSheetConfig): GridLayout {
  const { pageSize, itemSize, margin, gap, itemsPerPage } = config;

  const marginPt = mmToPoints(margin);
  const gapPt = mmToPoints(gap);

  const availWidth = pageSize.width - marginPt * 2;
  const availHeight = pageSize.height - marginPt * 2;

  // Calculate how many fit naturally
  const maxCols = Math.floor((availWidth + gapPt) / (itemSize.width + gapPt));
  const maxRows = Math.floor((availHeight + gapPt) / (itemSize.height + gapPt));
  const maxItems = maxCols * maxRows;

  // Use requested items per page or max possible
  const actualItems = Math.min(itemsPerPage, maxItems);

  // Determine best grid arrangement
  let cols = Math.ceil(Math.sqrt(actualItems));
  let rows = Math.ceil(actualItems / cols);

  // Optimize: prefer wider layouts for landscape items
  if (itemSize.width > itemSize.height) {
    rows = Math.ceil(Math.sqrt(actualItems));
    cols = Math.ceil(actualItems / rows);
  }

  // Ensure we don't exceed page
  while (cols > maxCols) cols--;
  while (rows > maxRows) rows--;

  // Calculate actual cell sizes (scale items to fit if needed)
  const cellWidth = (availWidth - gapPt * (cols - 1)) / cols;
  const cellHeight = (availHeight - gapPt * (rows - 1)) / rows;

  // Scale item to fit cell while maintaining aspect ratio
  const itemAspect = itemSize.width / itemSize.height;
  let drawWidth = cellWidth;
  let drawHeight = drawWidth / itemAspect;
  if (drawHeight > cellHeight) {
    drawHeight = cellHeight;
    drawWidth = drawHeight * itemAspect;
  }

  // Calculate positions
  const positions: GridLayout['positions'] = [];
  const offsetX = marginPt + (cellWidth - drawWidth) / 2;
  const offsetY = marginPt + (cellHeight - drawHeight) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (positions.length >= actualItems) break;
      positions.push({
        x: marginPt + c * (cellWidth + gapPt) + (cellWidth - drawWidth) / 2,
        y: marginPt + r * (cellHeight + gapPt) + (cellHeight - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight,
      });
    }
  }

  return {
    cols,
    rows,
    cellWidth,
    cellHeight,
    offsetX,
    offsetY,
    positions,
  };
}

// ─────────────────────────────────────────────────────────────
// Canvas to Export Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Get canvas as high-resolution data URL.
 */
export function canvasToDataURL(
  canvas: fabric.Canvas,
  format: 'png' | 'jpeg' = 'png',
  dpi: number = 300,
  quality: number = 0.92
): string {
  const multiplier = dpi / 72; // Base is 72 DPI

  return canvas.toDataURL({
    format,
    multiplier,
    quality: format === 'jpeg' ? quality : 1,
  });
}

/**
 * Convert data URL to Blob for download.
 */
export function dataURLToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const binaryString = atob(data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Trigger file download in browser.
 */
export function triggerDownload(content: Blob | string, filename: string): void {
  let url: string;

  if (typeof content === 'string') {
    // It's a data URL or regular URL
    url = content;
  } else {
    url = URL.createObjectURL(content);
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    if (typeof content !== 'string') {
      URL.revokeObjectURL(url);
    }
  }, 100);
}

// ─────────────────────────────────────────────────────────────
// Placeholder Processing for Bulk Export
// ─────────────────────────────────────────────────────────────

/**
 * Replace {{placeholders}} in canvas JSON with actual data values.
 * Returns a new canvas JSON with all placeholders resolved.
 */
export function resolveCanvasPlaceholders(
  canvasJSON: any,
  data: Record<string, any>
): any {
  const jsonString = JSON.stringify(canvasJSON);

  // Replace simple {{field}} placeholders
  const resolved = jsonString.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();

    // Handle nested keys: {{student.name}} → data.student.name
    const value = getNestedValue(data, trimmedKey);

    if (value === undefined || value === null) {
      return match; // Keep original if not found
    }

    // Escape for JSON string
    return String(value).replace(/"/g, '\\"').replace(/\n/g, '\\n');
  });

  try {
    return JSON.parse(resolved);
  } catch (e) {
    console.error('Failed to parse resolved canvas JSON:', e);
    return canvasJSON;
  }
}

/**
 * Get nested value from object using dot notation.
 * e.g., getNestedValue(data, 'student.name') → data.student.name
 */
export function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Extract all placeholder field names from canvas JSON.
 */
export function extractPlaceholders(canvasJSON: any): string[] {
  const jsonString = JSON.stringify(canvasJSON);
  const matches = jsonString.match(/\{\{([^}]+)\}\}/g) || [];
  const fields = matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim());
  return [...new Set(fields)]; // Unique
}

// ─────────────────────────────────────────────────────────────
// Color Helpers
// ─────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Parse any CSS color to normalized RGB (0-1 range for pdf-lib).
 */
export function parseColorNormalized(color: string): { r: number; g: number; b: number } {
  if (!color || color === 'transparent' || color === '') {
    return { r: 0, g: 0, b: 0 };
  }

  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (rgb) {
      return { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 };
    }
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

  // Named colors (basic)
  const namedColors: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    orange: '#ffa500',
    purple: '#800080',
    gray: '#808080',
    grey: '#808080',
  };

  if (namedColors[color.toLowerCase()]) {
    return parseColorNormalized(namedColors[color.toLowerCase()]);
  }

  return { r: 0, g: 0, b: 0 };
}

// ─────────────────────────────────────────────────────────────
// File Size Estimation
// ─────────────────────────────────────────────────────────────

/**
 * Estimate output file size before export.
 */
export function estimateFileSize(
  canvasWidth: number,
  canvasHeight: number,
  format: ExportFormat,
  options: {
    dpi?: number;
    quality?: number;
    objectCount?: number;
    pageCount?: number;
  } = {}
): { bytes: number; display: string } {
  const { dpi = 300, quality = 0.92, objectCount = 10, pageCount = 1 } = options;
  let bytes: number;

  switch (format) {
    case 'png': {
      const multiplier = dpi / 72;
      // PNG ~ 4 bytes/pixel * compression ratio (~0.5)
      bytes = canvasWidth * multiplier * canvasHeight * multiplier * 4 * 0.5;
      break;
    }
    case 'jpg': {
      const multiplier = dpi / 72;
      // JPG ~ 3 bytes/pixel * quality * compression
      bytes = canvasWidth * multiplier * canvasHeight * multiplier * 3 * quality * 0.3;
      break;
    }
    case 'svg': {
      // SVG ~ 800 bytes per object + base overhead
      bytes = objectCount * 800 + 5000;
      break;
    }
    case 'pdf': {
      // PDF ~ image + metadata per page
      bytes = canvasWidth * canvasHeight * 0.3 * pageCount + 10000;
      break;
    }
    case 'docx': {
      // DOCX ~ objects as images + text overhead
      bytes = objectCount * 2000 + 50000;
      break;
    }
    case 'print-sheet': {
      bytes = canvasWidth * canvasHeight * 0.4 + 20000;
      break;
    }
    default:
      bytes = 0;
  }

  return {
    bytes,
    display: formatFileSize(bytes),
  };
}

/**
 * Format bytes to human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ─────────────────────────────────────────────────────────────
// Image Processing Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Load image from URL and return as HTMLImageElement.
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Convert image to specific format and quality.
 */
export function convertImageFormat(
  img: HTMLImageElement,
  format: 'png' | 'jpeg' | 'webp',
  quality: number = 0.92,
  maxWidth?: number,
  maxHeight?: number
): string {
  const canvas = document.createElement('canvas');
  let { width, height } = img;

  // Scale if max dimensions specified
  if (maxWidth && width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  if (maxHeight && height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL(`image/${format}`, quality);
}

// ─────────────────────────────────────────────────────────────
// Batch Export Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Generate multiple exports from a single template with different data.
 * Used for bulk certificate/ID card generation.
 */
export async function batchResolveTemplates(
  canvasJSON: any,
  records: Record<string, any>[]
): Promise<any[]> {
  return records.map((record) => resolveCanvasPlaceholders(canvasJSON, record));
}

/**
 * Calculate total pages needed for print-sheet bulk export.
 */
export function calculatePrintSheetPages(
  totalItems: number,
  itemsPerPage: number
): number {
  return Math.ceil(totalItems / itemsPerPage);
}

// ─────────────────────────────────────────────────────────────
// Export Route Builder Helper (for backend)
// ─────────────────────────────────────────────────────────────

/**
 * Express routes configuration for export endpoints.
 * Use in your routes file:
 * 
 * import { exportRoutes } from './utils/exportHelpers';
 * router.use('/templates', exportRoutes);
 */
export const EXPORT_ROUTES = {
  export: 'POST /api/templates/:templateId/export',
  preview: 'POST /api/templates/preview/export',
  bulkExport: 'POST /api/templates/:templateId/bulk-export',
  printSheet: 'POST /api/templates/:templateId/print-sheet',
} as const;
