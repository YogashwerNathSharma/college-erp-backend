//////////////////////////////////////////////////////
// 🎨 YN-UDP SERVICE
// API client for the YN-UDP template designer server.
// Handles template CRUD and rendering operations.
//////////////////////////////////////////////////////

import { getYnUdpBaseUrl } from '../utils/printHelper';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface YnUdpTemplate {
  id: string;
  tenantId: string;
  name: string;
  type: 'certificate' | 'id-card' | 'report-card' | 'custom';
  category?: string;
  canvasJSON: any;
  pageWidth: number;
  pageHeight: number;
  orientation: 'portrait' | 'landscape';
  thumbnail?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface YnUdpRenderResult {
  canvasJSON: any;
  pageWidth: number;
  pageHeight: number;
  orientation: string;
  html?: string;
}

export type TemplateSlotType =
  | 'admit-card'
  | 'report-card'
  | 'fee-receipt'
  | 'transfer-certificate'
  | 'character-certificate'
  | 'id-card'
  | 'attendance-sheet'
  | 'seating-arrangement'
  | 'bonafide-certificate';

// ─── Helper ───────────────────────────────────────────────────────────────────

function getTenantId(): string {
  try {
    const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
    return tenant.id || tenant._id || '';
  } catch {
    return '';
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

class YnUdpService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getYnUdpBaseUrl();
  }

  /**
   * Update base URL (useful if config changes at runtime).
   */
  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  /**
   * Check if YN-UDP server is available.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get all templates for the current tenant.
   */
  async getTemplates(tenantId?: string): Promise<YnUdpTemplate[]> {
    const tid = tenantId || getTenantId();
    const res = await fetch(
      `${this.baseUrl}/api/templates?tenantId=${tid}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`Failed to fetch templates: ${res.status}`);
    const data = await res.json();
    return data.templates || data || [];
  }

  /**
   * Get a single template by ID.
   */
  async getTemplate(templateId: string): Promise<YnUdpTemplate> {
    const res = await fetch(
      `${this.baseUrl}/api/templates/${templateId}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`Failed to fetch template: ${res.status}`);
    const data = await res.json();
    return data.template || data;
  }

  /**
   * Filter templates by document type (slot).
   * Maps slot names to YN-UDP type + category.
   */
  async getTemplatesByType(slotType: TemplateSlotType, tenantId?: string): Promise<YnUdpTemplate[]> {
    const tid = tenantId || getTenantId();
    
    // Map slot types to YN-UDP filter params
    const typeMap: Record<TemplateSlotType, { type: string; category?: string }> = {
      'admit-card': { type: 'certificate', category: 'admit-card' },
      'report-card': { type: 'report-card' },
      'fee-receipt': { type: 'custom', category: 'fee-receipt' },
      'transfer-certificate': { type: 'certificate', category: 'transfer-certificate' },
      'character-certificate': { type: 'certificate', category: 'character-certificate' },
      'id-card': { type: 'id-card' },
      'attendance-sheet': { type: 'custom', category: 'attendance-sheet' },
      'seating-arrangement': { type: 'custom', category: 'seating-arrangement' },
      'bonafide-certificate': { type: 'certificate', category: 'bonafide-certificate' },
    };

    const mapping = typeMap[slotType];
    let url = `${this.baseUrl}/api/templates?tenantId=${tid}&type=${mapping.type}`;
    if (mapping.category) {
      url += `&category=${mapping.category}`;
    }

    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch templates by type: ${res.status}`);
    const data = await res.json();
    return data.templates || data || [];
  }

  /**
   * Get the default template for a specific slot type.
   * Returns null if no default exists.
   */
  async getDefaultTemplate(slotType: TemplateSlotType, tenantId?: string): Promise<YnUdpTemplate | null> {
    try {
      const templates = await this.getTemplatesByType(slotType, tenantId);
      // Find the default one, or fall back to the first active one
      return templates.find(t => t.isDefault && t.isActive) || 
             templates.find(t => t.isActive) || 
             null;
    } catch {
      return null;
    }
  }

  /**
   * Render a template with data (replace placeholders).
   */
  async renderTemplate(templateId: string, data: Record<string, any>): Promise<YnUdpRenderResult> {
    const res = await fetch(
      `${this.baseUrl}/api/templates/${templateId}/render`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ data }),
      }
    );
    if (!res.ok) throw new Error(`Failed to render template: ${res.status}`);
    return await res.json();
  }

  /**
   * Render template and convert to printable HTML string.
   */
  async renderToHTML(templateId: string, data: Record<string, any>): Promise<string> {
    const result = await this.renderTemplate(templateId, data);
    
    if (result.html) return result.html;

    // Convert canvas JSON to HTML
    return this.canvasToHTML(result.canvasJSON, result.pageWidth, result.pageHeight);
  }

  /**
   * Convert Fabric.js canvas JSON to a printable HTML string.
   */
  private canvasToHTML(canvasJSON: any, pageWidth: number, pageHeight: number): string {
    if (!canvasJSON?.objects) return '';

    const scaleX = 186 / (pageWidth || 794);
    const scaleY = 267 / (pageHeight || 1123);
    let html = `<div style="position:relative;width:186mm;min-height:267mm;">`;

    for (const obj of canvasJSON.objects) {
      const left = (obj.left || 0) * scaleX;
      const top = (obj.top || 0) * scaleY;
      const width = (obj.width || 0) * (obj.scaleX || 1) * scaleX;
      const height = (obj.height || 0) * (obj.scaleY || 1) * scaleY;
      const angle = obj.angle || 0;
      const opacity = obj.opacity ?? 1;

      const baseStyle = `position:absolute;left:${left}mm;top:${top}mm;width:${width}mm;transform:rotate(${angle}deg);opacity:${opacity};`;

      switch (obj.type) {
        case 'textbox':
        case 'text':
        case 'i-text': {
          const fontSize = (obj.fontSize || 14) * scaleX * 2.83;
          html += `<div style="${baseStyle}font-size:${fontSize}pt;font-weight:${obj.fontWeight || 'normal'};font-style:${obj.fontStyle || 'normal'};text-align:${obj.textAlign || 'left'};color:${obj.fill || '#000'};font-family:${obj.fontFamily || 'Arial'};line-height:1.3;">${obj.text || ''}</div>`;
          break;
        }
        case 'image':
          html += `<img src="${obj.src}" style="${baseStyle}height:${height}mm;object-fit:contain;" />`;
          break;
        case 'rect':
          html += `<div style="${baseStyle}height:${height}mm;background:${obj.fill || 'transparent'};border:${obj.strokeWidth || 0}pt solid ${obj.stroke || 'transparent'};border-radius:${(obj.rx || 0) * scaleX}mm;"></div>`;
          break;
        case 'circle':
          html += `<div style="${baseStyle}width:${(obj.radius || 0) * scaleX * 2}mm;height:${(obj.radius || 0) * scaleY * 2}mm;border-radius:50%;background:${obj.fill || 'transparent'};border:1pt solid ${obj.stroke || '#000'};"></div>`;
          break;
        case 'line':
          html += `<div style="${baseStyle}height:0;border-top:${obj.strokeWidth || 1}pt solid ${obj.stroke || '#000'};"></div>`;
          break;
      }
    }

    html += '</div>';
    return html;
  }

  /**
   * Open the template editor for a given template ID.
   */
  getEditorUrl(templateId?: string): string {
    if (templateId) {
      return `${this.baseUrl}/editor/${templateId}`;
    }
    return this.baseUrl;
  }
}

// Export singleton instance
export const ynudpService = new YnUdpService();
export default ynudpService;
