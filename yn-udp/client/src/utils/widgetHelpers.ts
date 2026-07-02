/**
 * YN-UDP Widget Helpers
 * Shared utility functions for Table, QR Code, Barcode, and Image Placeholder widgets
 */

import * as fabricModule from "fabric";
const fabric = (fabricModule as any).fabric || fabricModule;
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

// ===========================
// TYPES
// ===========================

export interface TableConfig {
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
  headers: string[];
  data?: string[][];
  headerBg: string;
  headerTextColor: string;
  borderColor: string;
  borderWidth: number;
  fontSize: number;
  fontFamily: string;
  cellPadding: number;
  alternateRowBg?: string;
  loopField?: string; // e.g., "marks" for {{#marks}}...{{/marks}}
}

export interface QRConfig {
  data: string; // text or {{placeholder}}
  size: number;
  darkColor: string;
  lightColor: string;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  margin: number;
  type: "qr" | "barcode";
  barcodeFormat?: string; // CODE128, CODE39, EAN13, etc.
}

export interface ImagePlaceholderConfig {
  width: number;
  height: number;
  dataSource: string; // student_photo, school_logo, signature_principal, etc.
  placeholderText: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  borderStyle: "solid" | "dashed" | "dotted";
  backgroundColor: string;
}

// ===========================
// TABLE WIDGET HELPERS
// ===========================

/**
 * Creates a Fabric.js Group representing a data table
 */
export function createTableObject(canvas: any, config: TableConfig): any {
  const {
    rows,
    cols,
    cellWidth,
    cellHeight,
    headers,
    data,
    headerBg,
    headerTextColor,
    borderColor,
    borderWidth,
    fontSize,
    fontFamily,
    cellPadding,
    alternateRowBg,
    loopField,
  } = config;

  const objects: any[] = [];
  const totalWidth = cols * cellWidth;
  const totalHeight = (rows + 1) * cellHeight; // +1 for header row

  // Outer border
  const outerRect = new fabric.Rect({
    left: 0,
    top: 0,
    width: totalWidth,
    height: totalHeight,
    fill: "transparent",
    stroke: borderColor,
    strokeWidth: borderWidth,
    selectable: false,
  });
  objects.push(outerRect);

  // Header row background
  const headerRect = new fabric.Rect({
    left: 0,
    top: 0,
    width: totalWidth,
    height: cellHeight,
    fill: headerBg,
    stroke: borderColor,
    strokeWidth: borderWidth,
    selectable: false,
  });
  objects.push(headerRect);

  // Header texts
  for (let col = 0; col < cols; col++) {
    const headerText = headers[col] || `Col ${col + 1}`;
    const text = new fabric.Text(headerText, {
      left: col * cellWidth + cellPadding,
      top: cellPadding,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fontWeight: "bold",
      fill: headerTextColor,
      selectable: false,
    });
    objects.push(text);

    // Vertical lines for header
    if (col > 0) {
      const vLine = new fabric.Line(
        [col * cellWidth, 0, col * cellWidth, totalHeight],
        {
          stroke: borderColor,
          strokeWidth: borderWidth,
          selectable: false,
        }
      );
      objects.push(vLine);
    }
  }

  // Data rows
  for (let row = 0; row < rows; row++) {
    const rowY = (row + 1) * cellHeight;

    // Alternate row background
    if (alternateRowBg && row % 2 === 1) {
      const altBg = new fabric.Rect({
        left: 0,
        top: rowY,
        width: totalWidth,
        height: cellHeight,
        fill: alternateRowBg,
        stroke: "transparent",
        strokeWidth: 0,
        selectable: false,
      });
      objects.push(altBg);
    }

    // Horizontal line
    const hLine = new fabric.Line(
      [0, rowY, totalWidth, rowY],
      {
        stroke: borderColor,
        strokeWidth: borderWidth,
        selectable: false,
      }
    );
    objects.push(hLine);

    // Cell texts
    for (let col = 0; col < cols; col++) {
      let cellText = "";
      if (data && data[row] && data[row][col]) {
        cellText = data[row][col];
      } else if (loopField) {
        // Auto-generate loop placeholders
        cellText = `{{${headers[col]?.toLowerCase().replace(/\s+/g, "_") || `col_${col}`}}}`;
      }

      if (cellText) {
        const text = new fabric.Text(cellText, {
          left: col * cellWidth + cellPadding,
          top: rowY + cellPadding,
          fontSize: fontSize - 1,
          fontFamily: fontFamily,
          fill: "#333333",
          selectable: false,
        });
        objects.push(text);
      }
    }
  }

  // Create the group
  const group = new fabric.Group(objects, {
    left: canvas.getWidth() / 2 - totalWidth / 2,
    top: canvas.getHeight() / 2 - totalHeight / 2,
    subTargetCheck: true,
    data: {
      type: "table",
      tableConfig: config,
      loopField: loopField || null,
    },
  });

  return group;
}

/**
 * Update table properties (rebuild the table group)
 */
export function updateTableObject(canvas: any, tableGroup: any, newConfig: Partial<TableConfig>): any {
  const currentConfig = tableGroup.data?.tableConfig || {};
  const mergedConfig = { ...currentConfig, ...newConfig };

  const left = tableGroup.left;
  const top = tableGroup.top;

  canvas.remove(tableGroup);

  const newTable = createTableObject(canvas, mergedConfig);
  newTable.set({ left, top });
  canvas.add(newTable);
  canvas.setActiveObject(newTable);
  canvas.renderAll();

  return newTable;
}

/**
 * Get default table configuration
 */
export function getDefaultTableConfig(): TableConfig {
  return {
    rows: 5,
    cols: 4,
    cellWidth: 120,
    cellHeight: 30,
    headers: ["Subject", "Max Marks", "Obtained", "Grade"],
    headerBg: "#1e3a5f",
    headerTextColor: "#ffffff",
    borderColor: "#333333",
    borderWidth: 1,
    fontSize: 12,
    fontFamily: "Arial",
    cellPadding: 6,
    alternateRowBg: "#f8fafc",
    loopField: "marks",
  };
}

// ===========================
// QR CODE HELPERS
// ===========================

/**
 * Generate QR Code as data URL
 */
export async function generateQRDataUrl(
  text: string,
  options: Partial<QRConfig> = {}
): Promise<string> {
  const {
    size = 150,
    darkColor = "#000000",
    lightColor = "#ffffff",
    errorCorrectionLevel = "M",
    margin = 2,
  } = options;

  try {
    const dataUrl = await QRCode.toDataURL(text || "https://example.com", {
      width: size,
      margin: margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: errorCorrectionLevel,
    });
    return dataUrl;
  } catch (error) {
    console.error("QR Code generation error:", error);
    // Return a placeholder
    return createPlaceholderDataUrl(size, size, "QR Error");
  }
}

/**
 * Generate Barcode as data URL
 */
export function generateBarcodeDataUrl(
  text: string,
  options: {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
  } = {}
): string {
  const {
    format = "CODE128",
    width = 2,
    height = 60,
    displayValue = true,
    fontSize = 12,
  } = options;

  try {
    // Create offscreen canvas for barcode
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text || "0000000000", {
      format: format,
      width: width,
      height: height,
      displayValue: displayValue,
      fontSize: fontSize,
      margin: 10,
    });
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Barcode generation error:", error);
    return createPlaceholderDataUrl(200, 80, "Barcode Error");
  }
}

/**
 * Create a QR code Fabric.js image object and add to canvas
 */
export async function createQRObject(
  canvas: any,
  config: Partial<QRConfig> = {}
): Promise<any> {
  const defaultConfig: QRConfig = {
    data: "{{admission_no}}",
    size: 150,
    darkColor: "#000000",
    lightColor: "#ffffff",
    errorCorrectionLevel: "M",
    margin: 2,
    type: "qr",
  };

  const mergedConfig = { ...defaultConfig, ...config };

  let dataUrl: string;
  if (mergedConfig.type === "barcode") {
    dataUrl = generateBarcodeDataUrl(mergedConfig.data, {
      format: mergedConfig.barcodeFormat || "CODE128",
      height: 60,
    });
  } else {
    dataUrl = await generateQRDataUrl(mergedConfig.data, mergedConfig);
  }

  return new Promise((resolve) => {
    fabric.Image.fromURL(
      dataUrl,
      (img: any) => {
        img.set({
          left: canvas.getWidth() / 2 - mergedConfig.size / 2,
          top: canvas.getHeight() / 2 - mergedConfig.size / 2,
          scaleX: mergedConfig.size / (img.width || mergedConfig.size),
          scaleY: mergedConfig.size / (img.height || mergedConfig.size),
          data: {
            type: mergedConfig.type === "barcode" ? "barcode" : "qrcode",
            qrConfig: mergedConfig,
          },
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        resolve(img);
      },
      { crossOrigin: "anonymous" }
    );
  });
}

/**
 * Update QR/Barcode object with new data
 */
export async function updateQRObject(
  canvas: any,
  obj: any,
  newConfig: Partial<QRConfig>
): Promise<any> {
  const currentConfig = obj.data?.qrConfig || {};
  const mergedConfig = { ...currentConfig, ...newConfig };

  const left = obj.left;
  const top = obj.top;

  let dataUrl: string;
  if (mergedConfig.type === "barcode") {
    dataUrl = generateBarcodeDataUrl(mergedConfig.data, {
      format: mergedConfig.barcodeFormat || "CODE128",
    });
  } else {
    dataUrl = await generateQRDataUrl(mergedConfig.data, mergedConfig);
  }

  return new Promise((resolve) => {
    fabric.Image.fromURL(
      dataUrl,
      (img: any) => {
        img.set({
          left,
          top,
          scaleX: mergedConfig.size / (img.width || mergedConfig.size),
          scaleY: mergedConfig.size / (img.height || mergedConfig.size),
          data: {
            type: mergedConfig.type === "barcode" ? "barcode" : "qrcode",
            qrConfig: mergedConfig,
          },
        });

        canvas.remove(obj);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        resolve(img);
      },
      { crossOrigin: "anonymous" }
    );
  });
}

// ===========================
// IMAGE PLACEHOLDER HELPERS
// ===========================

/**
 * Image placeholder data sources with labels and default sizes
 */
export const IMAGE_PLACEHOLDER_SOURCES = [
  { key: "student_photo", label: "Student Photo", defaultWidth: 90, defaultHeight: 120, icon: "👤" },
  { key: "school_logo", label: "School Logo", defaultWidth: 100, defaultHeight: 100, icon: "🏫" },
  { key: "signature_principal", label: "Principal Signature", defaultWidth: 120, defaultHeight: 50, icon: "✍️" },
  { key: "signature_class_teacher", label: "Class Teacher Signature", defaultWidth: 120, defaultHeight: 50, icon: "✍️" },
  { key: "signature_exam_controller", label: "Exam Controller Signature", defaultWidth: 120, defaultHeight: 50, icon: "✍️" },
  { key: "stamp", label: "Official Stamp", defaultWidth: 80, defaultHeight: 80, icon: "🔴" },
  { key: "school_watermark", label: "School Watermark", defaultWidth: 200, defaultHeight: 200, icon: "💧" },
  { key: "custom_image", label: "Custom Image Field", defaultWidth: 100, defaultHeight: 100, icon: "🖼️" },
];

/**
 * Create a placeholder data URL (simple canvas with text)
 */
export function createPlaceholderDataUrl(
  width: number,
  height: number,
  text: string,
  options: { bgColor?: string; textColor?: string; borderColor?: string; dashed?: boolean } = {}
): string {
  const { bgColor = "#f3f4f6", textColor = "#6b7280", borderColor = "#9ca3af", dashed = true } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  if (dashed) {
    ctx.setLineDash([6, 4]);
  }
  ctx.strokeRect(2, 2, width - 4, height - 4);

  // Icon (camera/image icon using simple shapes)
  ctx.setLineDash([]);
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 1.5;
  const iconSize = Math.min(width, height) * 0.25;
  const iconX = width / 2 - iconSize / 2;
  const iconY = height / 2 - iconSize / 2 - 8;
  ctx.strokeRect(iconX, iconY, iconSize, iconSize * 0.8);
  // Small circle inside (camera lens)
  ctx.beginPath();
  ctx.arc(width / 2, iconY + iconSize * 0.4, iconSize * 0.2, 0, Math.PI * 2);
  ctx.stroke();

  // Text
  const maxFontSize = Math.min(width / text.length * 1.5, 12);
  ctx.font = `${maxFontSize}px Arial`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2 + iconSize * 0.4 + 4);

  return canvas.toDataURL("image/png");
}

/**
 * Create an Image Placeholder Fabric.js object
 */
export function createImagePlaceholderObject(
  canvas: any,
  config: Partial<ImagePlaceholderConfig> = {}
): any {
  const defaultConfig: ImagePlaceholderConfig = {
    width: 90,
    height: 120,
    dataSource: "student_photo",
    placeholderText: "Student Photo",
    borderColor: "#6b7280",
    borderWidth: 2,
    borderRadius: 4,
    borderStyle: "dashed",
    backgroundColor: "#f3f4f6",
  };

  const mergedConfig = { ...defaultConfig, ...config };

  // Find source info
  const sourceInfo = IMAGE_PLACEHOLDER_SOURCES.find(
    (s) => s.key === mergedConfig.dataSource
  );
  if (sourceInfo && !config.width && !config.height) {
    mergedConfig.width = sourceInfo.defaultWidth;
    mergedConfig.height = sourceInfo.defaultHeight;
  }

  const displayText = mergedConfig.placeholderText || sourceInfo?.label || "Image";

  // Generate placeholder image
  const placeholderUrl = createPlaceholderDataUrl(
    mergedConfig.width,
    mergedConfig.height,
    displayText,
    {
      bgColor: mergedConfig.backgroundColor,
      borderColor: mergedConfig.borderColor,
      dashed: mergedConfig.borderStyle === "dashed",
    }
  );

  return new Promise<any>((resolve) => {
    fabric.Image.fromURL(
      placeholderUrl,
      (img: any) => {
        img.set({
          left: canvas.getWidth() / 2 - mergedConfig.width / 2,
          top: canvas.getHeight() / 2 - mergedConfig.height / 2,
          width: mergedConfig.width,
          height: mergedConfig.height,
          data: {
            type: "image_placeholder",
            placeholderConfig: mergedConfig,
            fieldKey: mergedConfig.dataSource,
          },
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        resolve(img);
      },
      { crossOrigin: "anonymous" }
    );
  });
}

/**
 * Update an image placeholder with new configuration
 */
export async function updateImagePlaceholder(
  canvas: any,
  obj: any,
  newConfig: Partial<ImagePlaceholderConfig>
): Promise<any> {
  const currentConfig = obj.data?.placeholderConfig || {};
  const mergedConfig = { ...currentConfig, ...newConfig };

  const left = obj.left;
  const top = obj.top;

  canvas.remove(obj);

  const newObj = await createImagePlaceholderObject(canvas, mergedConfig);
  if (newObj) {
    newObj.set({ left, top });
    canvas.renderAll();
  }
  return newObj;
}

/**
 * Replace placeholder with actual image URL during generation
 */
export function replaceImagePlaceholder(
  canvas: any,
  obj: any,
  imageUrl: string
): Promise<any> {
  return new Promise((resolve) => {
    const config = obj.data?.placeholderConfig || {};
    const left = obj.left;
    const top = obj.top;

    fabric.Image.fromURL(
      imageUrl,
      (img: any) => {
        // Scale image to FILL placeholder dimensions (cover entire box)
        const scaleX = config.width / (img.width || config.width);
        const scaleY = config.height / (img.height || config.height);
        const scale = Math.max(scaleX, scaleY);

        img.set({
          left,
          top,
          scaleX: scale,
          scaleY: scale,
          // Clip to box dimensions so image doesn't overflow
          clipPath: new fabric.Rect({
            width: config.width / scale,
            height: config.height / scale,
            originX: "center",
            originY: "center",
          }),
          data: obj.data,
        });

        canvas.remove(obj);
        canvas.add(img);
        canvas.renderAll();
        resolve(img);
      },
      { crossOrigin: "anonymous" }
    );
  });
}

// ===========================
// GENERAL UTILITIES
// ===========================

/**
 * Check if an object is a widget type
 */
export function isWidgetObject(obj: any): boolean {
  const type = obj?.data?.type;
  return ["table", "qrcode", "barcode", "image_placeholder"].includes(type);
}

/**
 * Get widget type label for display
 */
export function getWidgetTypeLabel(obj: any): string {
  const type = obj?.data?.type;
  switch (type) {
    case "table":
      return "📊 Table";
    case "qrcode":
      return "📱 QR Code";
    case "barcode":
      return "📊 Barcode";
    case "image_placeholder":
      return "🖼️ Image Placeholder";
    default:
      return "";
  }
}

/**
 * Resolve {{placeholders}} in a text with actual data
 */
export function resolvePlaceholder(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

/**
 * Process loop fields in table data
 * Input: "{{#marks}}...{{/marks}}" with array data
 */
export function resolveLoopData(
  loopField: string,
  data: Record<string, any>
): Record<string, any>[] {
  const arrayData = data[loopField];
  if (Array.isArray(arrayData)) {
    return arrayData;
  }
  return [];
}
