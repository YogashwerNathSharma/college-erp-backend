export interface DesignTemplate {
  id: string;
  tenantId: string;
  name: string;
  type: TemplateType;
  category?: string;
  canvasJSON: any;
  pageWidth: number;
  pageHeight: number;
  orientation: "portrait" | "landscape";
  thumbnail?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TemplateType = "certificate" | "id-card" | "report-card" | "admit-card" | "notification" | "custom";

export interface PageSize {
  name: string;
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
}

export const PAGE_SIZES: PageSize[] = [
  { name: "A4 Portrait", width: 794, height: 1123, orientation: "portrait" },
  { name: "A4 Landscape", width: 1123, height: 794, orientation: "landscape" },
  { name: "ID Card Portrait", width: 243, height: 382, orientation: "portrait" },
  { name: "ID Card Landscape", width: 382, height: 243, orientation: "landscape" },
  { name: "Letter Portrait", width: 816, height: 1056, orientation: "portrait" },
  { name: "Letter Landscape", width: 1056, height: 816, orientation: "landscape" },
];

export const TEMPLATE_TYPES: { value: TemplateType; label: string; color: string }[] = [
  { value: "certificate", label: "Certificate", color: "#f59e0b" },
  { value: "id-card", label: "ID Card", color: "#3b82f6" },
  { value: "report-card", label: "Report Card", color: "#10b981" },
  { value: "admit-card", label: "Admit Card", color: "#ec4899" },
  { value: "notification", label: "Notification", color: "#f97316" },
  { value: "custom", label: "Custom", color: "#8b5cf6" },
];

export const FONT_FAMILIES = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS",
  "Palatino Linotype",
  "Lucida Console",
];

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96];
