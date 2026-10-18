// ══════════════════════════════════════════════════════
// YN-UDP Template Designer — Type Definitions
// ══════════════════════════════════════════════════════

export type TemplateType = "certificate" | "id-card" | "report-card" | "admit-card" | "notification" | "custom";

export type TemplateCategory =
  | "character-certificate"
  | "transfer-certificate"
  | "bonafide"
  | "study-certificate"
  | "migration-certificate"
  | "student-id"
  | "teacher-id"
  | "staff-id"
  | "report-card"
  | "marksheet"
  | "admit-card"
  | "notification"
  | "fee-receipt"
  | "custom";

export type PageOrientation = "portrait" | "landscape";

export interface PageSize {
  name: string;
  width: number;
  height: number;
}

export const PAGE_SIZES: Record<string, PageSize> = {
  A4: { name: "A4", width: 794, height: 1123 },
  A5: { name: "A5", width: 559, height: 794 },
  LETTER: { name: "Letter", width: 816, height: 1056 },
  ID_CARD_PORTRAIT: { name: "ID Card (Portrait)", width: 243, height: 386 },
  ID_CARD_LANDSCAPE: { name: "ID Card (Landscape)", width: 386, height: 243 },
  CERTIFICATE: { name: "Certificate (Landscape)", width: 1123, height: 794 },
  CUSTOM: { name: "Custom", width: 800, height: 600 },
};

export interface DesignTemplate {
  id?: string;
  tenantId?: string;
  name: string;
  type: TemplateType;
  category?: TemplateCategory;
  canvasJSON: any;
  pageWidth: number;
  pageHeight: number;
  orientation: PageOrientation;
  thumbnail?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CanvasElement {
  id: string;
  type: "text" | "shape" | "image" | "field" | "line" | "qrcode";
  fabricType: string;
  label?: string;
  fieldKey?: string; // e.g., {{student_name}}
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  // Text properties
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  underline?: boolean;
  textAlign?: string;
  fill?: string;
  // Shape properties
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  // Image properties
  src?: string;
}

export interface FieldMapping {
  key: string;
  label: string;
  category: "student" | "school" | "exam" | "fee" | "general";
  type: "text" | "image" | "date" | "number";
}

export interface HistoryState {
  canvasJSON: string;
  timestamp: number;
}

export type ToolType =
  | "select"
  | "text"
  | "rect"
  | "circle"
  | "triangle"
  | "line"
  | "image"
  | "field"
  | "watermark";
