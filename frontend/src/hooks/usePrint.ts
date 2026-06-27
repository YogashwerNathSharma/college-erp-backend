import { useState, useCallback, useRef } from 'react';
import { printViaIframe, generatePDF, getBasePrintCSS, getSchoolHeader } from '../utils/printHelper';
import { ynudpService, TemplateSlotType } from '../services/ynudp.service';

//////////////////////////////////////////////////////
// 🖨️ PRINT HOOK — Production-Ready
// Mobile-safe iframe printing with YN-UDP integration.
// Supports preview, print, PDF download, and custom templates.
//////////////////////////////////////////////////////

export interface UsePrintOptions {
  /** YN-UDP template slot type (e.g., 'report-card', 'fee-receipt') */
  templateSlot?: TemplateSlotType;
  /** Specific YN-UDP template ID (overrides slot-based lookup) */
  templateId?: string;
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
  /** Document title (for print dialog & filename) */
  title?: string;
  /** Additional CSS to inject into print frame */
  additionalCSS?: string;
  /** Whether to show school header (default: true) */
  showHeader?: boolean;
  /** Watermark text */
  watermark?: string;
}

export interface UsePrintReturn {
  /** Print the document (via iframe, mobile-safe) */
  print: (elementOrHtml?: HTMLElement | string | null) => Promise<void>;
  /** Show print preview in a new tab */
  preview: (elementOrHtml?: HTMLElement | string | null) => void;
  /** Download as PDF */
  downloadPDF: (elementOrHtml?: HTMLElement | string | null, filename?: string) => Promise<void>;
  /** Print using YN-UDP template with dynamic data */
  printWithTemplate: (data: Record<string, any>) => Promise<void>;
  /** Whether a print/PDF operation is in progress */
  loading: boolean;
  /** Error message from last operation */
  error: string | null;
  /** Ref to attach to the printable element */
  printRef: React.RefObject<HTMLDivElement>;
  /** Check if YN-UDP template is available for the current slot */
  hasCustomTemplate: () => Promise<boolean>;
}

export function usePrint(options: UsePrintOptions = {}): UsePrintReturn {
  const {
    templateSlot,
    templateId,
    orientation = 'portrait',
    title = 'Print Document',
    additionalCSS = '',
    showHeader = true,
    watermark,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null!);

  /**
   * Get HTML content from various input types.
   */
  const resolveContent = useCallback((elementOrHtml?: HTMLElement | string | null): string => {
    if (typeof elementOrHtml === 'string') return elementOrHtml;
    if (elementOrHtml instanceof HTMLElement) return elementOrHtml.innerHTML;
    if (printRef.current) return printRef.current.innerHTML;
    return '';
  }, []);

  /**
   * Wrap content with school header, watermark, and footer.
   */
  const wrapContent = useCallback((htmlContent: string): string => {
    const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
    let wrapped = '';

    if (watermark) {
      wrapped += `<div class="watermark">${watermark}</div>`;
    }

    wrapped += '<div class="print-page">';
    
    if (showHeader) {
      wrapped += getSchoolHeader(tenant, { title });
    }

    wrapped += `<div class="print-body">${htmlContent}</div>`;
    
    wrapped += `
      <div style="position:fixed;bottom:5mm;left:0;right:0;text-align:center;font-size:7pt;color:#999;">
        Generated on ${new Date().toLocaleDateString('en-IN')} | Computer generated document
      </div>
    `;

    wrapped += '</div>';
    return wrapped;
  }, [title, showHeader, watermark]);

  /**
   * Print via hidden iframe (mobile-safe, works without popup blockers).
   */
  const print = useCallback(async (elementOrHtml?: HTMLElement | string | null) => {
    setLoading(true);
    setError(null);
    try {
      const content = resolveContent(elementOrHtml);
      if (!content) throw new Error('No content to print');

      const wrappedContent = wrapContent(content);
      await printViaIframe(wrappedContent, {
        title,
        orientation,
        additionalCSS,
      });
    } catch (err: any) {
      setError(err.message || 'Print failed');
      console.error('Print error:', err);
    } finally {
      setLoading(false);
    }
  }, [resolveContent, wrapContent, title, orientation, additionalCSS]);

  /**
   * Open a preview in a new window/tab.
   */
  const preview = useCallback((elementOrHtml?: HTMLElement | string | null) => {
    const content = resolveContent(elementOrHtml);
    if (!content) return;

    const wrappedContent = wrapContent(content);
    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title} — Preview</title>
        <style>
          ${getBasePrintCSS(orientation)}
          ${additionalCSS}
          body { background: #f5f5f5; padding: 20px; }
          .print-page { 
            background: white; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            margin: 0 auto 20px;
          }
          .preview-toolbar {
            position: fixed; top: 0; left: 0; right: 0;
            background: #1a365d; color: white; padding: 10px 20px;
            display: flex; justify-content: space-between; align-items: center;
            z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          }
          .preview-toolbar button {
            background: white; color: #1a365d; border: none;
            padding: 8px 16px; border-radius: 6px; cursor: pointer;
            font-weight: 600; font-size: 14px;
          }
          .preview-toolbar button:hover { background: #e2e8f0; }
          .preview-content { margin-top: 60px; }
          @media print { 
            .preview-toolbar { display: none !important; }
            body { background: white; padding: 0; }
            .preview-content { margin-top: 0; }
          }
        </style>
      </head>
      <body>
        <div class="preview-toolbar">
          <span style="font-size:14px;font-weight:600;">${title} — Preview</span>
          <div>
            <button onclick="window.print()">🖨️ Print</button>
            <button onclick="window.close()" style="margin-left:8px;background:#fed7d7;color:#c53030;">✕ Close</button>
          </div>
        </div>
        <div class="preview-content">
          ${wrappedContent}
        </div>
      </body>
      </html>
    `;

    // For mobile: use a blob URL instead of window.open with HTML
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    
    // Fallback if popup is blocked
    if (!win) {
      // Use iframe approach for mobile
      const previewFrame = document.createElement('iframe');
      previewFrame.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;border:none;background:white;';
      previewFrame.src = url;
      document.body.appendChild(previewFrame);
      
      // Add close button overlay
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕ Close Preview';
      closeBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:100000;background:#c53030;color:white;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;';
      closeBtn.onclick = () => {
        previewFrame.remove();
        closeBtn.remove();
        URL.revokeObjectURL(url);
      };
      document.body.appendChild(closeBtn);
    } else {
      // Clean up blob URL after window loads
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  }, [resolveContent, wrapContent, title, orientation, additionalCSS]);

  /**
   * Download the document as PDF.
   */
  const downloadPDF = useCallback(async (elementOrHtml?: HTMLElement | string | null, filename?: string) => {
    setLoading(true);
    setError(null);
    try {
      const content = resolveContent(elementOrHtml);
      if (!content) throw new Error('No content for PDF');

      const wrappedContent = wrapContent(content);
      await generatePDF(wrappedContent, {
        filename: filename || `${title.replace(/\s+/g, '_')}.pdf`,
        orientation,
        additionalCSS,
      });
    } catch (err: any) {
      setError(err.message || 'PDF generation failed');
      console.error('PDF error:', err);
    } finally {
      setLoading(false);
    }
  }, [resolveContent, wrapContent, title, orientation, additionalCSS]);

  /**
   * Print using a YN-UDP custom template with dynamic data.
   */
  const printWithTemplate = useCallback(async (data: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      let tplId = templateId;

      // If no explicit template ID, look up by slot type
      if (!tplId && templateSlot) {
        const template = await ynudpService.getDefaultTemplate(templateSlot);
        if (template) {
          tplId = template.id;
        }
      }

      if (!tplId) {
        throw new Error('No YN-UDP template available for this document type');
      }

      // Render and print
      const html = await ynudpService.renderToHTML(tplId, data);
      await printViaIframe(html, { title, orientation });
    } catch (err: any) {
      setError(err.message || 'Template print failed');
      console.error('Template print error:', err);
      throw err; // Re-throw so caller can fall back to built-in
    } finally {
      setLoading(false);
    }
  }, [templateId, templateSlot, title, orientation]);

  /**
   * Check if a custom YN-UDP template exists for the current slot.
   */
  const hasCustomTemplate = useCallback(async (): Promise<boolean> => {
    if (templateId) return true;
    if (!templateSlot) return false;
    try {
      const template = await ynudpService.getDefaultTemplate(templateSlot);
      return template !== null;
    } catch {
      return false;
    }
  }, [templateId, templateSlot]);

  return {
    print,
    preview,
    downloadPDF,
    printWithTemplate,
    loading,
    error,
    printRef,
    hasCustomTemplate,
  };
}
