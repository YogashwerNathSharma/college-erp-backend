//////////////////////////////////////////////////////
// 🖨️ PRINT HELPER UTILITIES
// Mobile-safe printing via iframe, PDF generation,
// YN-UDP integration, and formatting utilities.
//////////////////////////////////////////////////////

/**
 * Base print CSS that ensures proper A4 rendering,
 * page breaks, and professional output.
 */
export function getBasePrintCSS(orientation: 'portrait' | 'landscape' = 'portrait'): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page {
      size: ${orientation === 'portrait' ? '210mm 297mm' : '297mm 210mm'};
      margin: 15mm 12mm 15mm 12mm;
    }
    
    html, body {
      width: ${orientation === 'portrait' ? '210mm' : '297mm'};
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #1a1a1a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .print-page {
      width: ${orientation === 'portrait' ? '186mm' : '273mm'};
      min-height: ${orientation === 'portrait' ? '267mm' : '183mm'};
      padding: 0;
      margin: 0 auto;
      position: relative;
    }
    
    /* Page break utilities */
    .page-break-before { page-break-before: always; }
    .page-break-after { page-break-after: always; }
    .no-break { page-break-inside: avoid; }
    
    /* Table styles */
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    th, td {
      border: 1px solid #333;
      padding: 4pt 6pt;
      text-align: left;
      font-size: 10pt;
    }
    th { 
      background-color: #f0f0f0 !important; 
      font-weight: 600;
    }
    
    /* Header styles */
    .print-header {
      text-align: center;
      border-bottom: 2pt solid #333;
      padding-bottom: 8pt;
      margin-bottom: 12pt;
    }
    .print-header .school-name {
      font-size: 18pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    .print-header .school-address {
      font-size: 9pt;
      color: #444;
      margin-top: 2pt;
    }
    .print-header .school-affiliation {
      font-size: 8pt;
      color: #666;
      margin-top: 1pt;
    }
    .print-header .doc-title {
      font-size: 14pt;
      font-weight: 700;
      margin-top: 8pt;
      text-transform: uppercase;
      text-decoration: underline;
      letter-spacing: 1pt;
    }
    .print-header .school-logo {
      width: 18mm;
      height: 18mm;
      object-fit: contain;
    }
    .header-flex {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12pt;
    }
    
    /* Footer */
    .print-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 8pt;
      color: #888;
      padding: 4pt 0;
      border-top: 0.5pt solid #ccc;
    }
    
    /* Signature area */
    .signature-area {
      display: flex;
      justify-content: space-between;
      margin-top: 20mm;
      padding-top: 4mm;
    }
    .signature-block {
      text-align: center;
      min-width: 35mm;
    }
    .signature-line {
      border-top: 1pt solid #333;
      width: 35mm;
      margin: 0 auto 3pt;
    }
    .signature-label {
      font-size: 9pt;
      font-weight: 500;
    }
    
    /* Watermark */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 60pt;
      color: rgba(200, 200, 200, 0.15);
      font-weight: 900;
      text-transform: uppercase;
      pointer-events: none;
      z-index: -1;
      white-space: nowrap;
    }
    
    /* QR Code */
    .qr-code {
      width: 20mm;
      height: 20mm;
    }
    
    /* Utility classes */
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }
    .font-medium { font-weight: 500; }
    .mt-2 { margin-top: 2mm; }
    .mt-4 { margin-top: 4mm; }
    .mt-6 { margin-top: 6mm; }
    .mt-8 { margin-top: 8mm; }
    .mb-2 { margin-bottom: 2mm; }
    .mb-4 { margin-bottom: 4mm; }
    .mb-6 { margin-bottom: 6mm; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-center { align-items: center; }
    .gap-2 { gap: 2mm; }
    .gap-4 { gap: 4mm; }
    .border { border: 1pt solid #333; }
    .border-2 { border: 2pt solid #333; }
    .p-4 { padding: 4mm; }
    .p-6 { padding: 6mm; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2mm; }
    .text-xs { font-size: 8pt; }
    .text-sm { font-size: 9pt; }
    .text-base { font-size: 11pt; }
    .text-lg { font-size: 13pt; }
    .text-xl { font-size: 16pt; }

    /* ID Card specific */
    .id-card {
      width: 85.6mm;
      height: 54mm;
      border: 0.5pt solid #333;
      border-radius: 3mm;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .id-card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4mm;
      padding: 4mm;
    }

    @media screen {
      html, body { width: 100%; }
      .print-page {
        max-width: 210mm;
        margin: 20px auto;
        padding: 15mm 12mm;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border: 1px solid #e0e0e0;
        background: white;
      }
    }
  `;
}

/**
 * Print HTML content using a hidden iframe (mobile-safe, avoids popup blockers)
 */
export function printViaIframe(htmlContent: string, options?: {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  additionalCSS?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const {
        title = 'Print Document',
        orientation = 'portrait',
        additionalCSS = '',
        onBeforePrint,
        onAfterPrint,
      } = options || {};

      // Remove any existing print iframe
      const existingFrame = document.getElementById('__print-iframe');
      if (existingFrame) existingFrame.remove();

      // Create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.id = '__print-iframe';
      iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:none;';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        reject(new Error('Cannot access iframe document'));
        return;
      }

      const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${title}</title>
          <style>${getBasePrintCSS(orientation)}</style>
          ${additionalCSS ? `<style>${additionalCSS}</style>` : ''}
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;

      iframeDoc.open();
      iframeDoc.write(fullHTML);
      iframeDoc.close();

      // Wait for content & images to load, then print
      iframe.onload = () => {
        setTimeout(() => {
          try {
            onBeforePrint?.();
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            onAfterPrint?.();

            // Clean up after print dialog closes
            setTimeout(() => {
              iframe.remove();
              resolve();
            }, 1000);
          } catch (err) {
            iframe.remove();
            reject(err);
          }
        }, 500); // Allow time for fonts/images to render
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Fetch a YN-UDP template, merge with data, and print via iframe.
 */
export async function printWithYnUDP(
  templateId: string,
  data: Record<string, any>,
  ynUdpBaseUrl: string = getYnUdpBaseUrl()
): Promise<void> {
  try {
    // Call YN-UDP render API
    const response = await fetch(`${ynUdpBaseUrl}/api/templates/${templateId}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error(`YN-UDP render failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const { canvasJSON, pageWidth, pageHeight, orientation } = result;

    // Convert Fabric.js canvas JSON to printable HTML
    const htmlContent = fabricCanvasToHTML(canvasJSON, pageWidth, pageHeight);
    
    await printViaIframe(htmlContent, {
      title: 'YN-UDP Document',
      orientation: orientation || 'portrait',
    });
  } catch (error) {
    console.error('YN-UDP print failed:', error);
    throw error;
  }
}

/**
 * Convert Fabric.js canvas JSON to HTML for printing.
 * Handles text, images, shapes, and lines.
 */
function fabricCanvasToHTML(canvasJSON: any, pageWidth: number, pageHeight: number): string {
  if (!canvasJSON || !canvasJSON.objects) return '<p>No content</p>';

  const scaleX = 186 / (pageWidth || 794); // mm per px
  const scaleY = 267 / (pageHeight || 1123);

  let html = `<div class="print-page" style="position:relative; width:186mm; height:267mm; overflow:hidden;">`;

  for (const obj of canvasJSON.objects) {
    const left = (obj.left || 0) * scaleX;
    const top = (obj.top || 0) * scaleY;
    const width = (obj.width || 0) * (obj.scaleX || 1) * scaleX;
    const height = (obj.height || 0) * (obj.scaleY || 1) * scaleY;
    const angle = obj.angle || 0;
    const opacity = obj.opacity ?? 1;

    const baseStyle = `position:absolute; left:${left}mm; top:${top}mm; width:${width}mm; transform:rotate(${angle}deg); opacity:${opacity};`;

    switch (obj.type) {
      case 'textbox':
      case 'text':
      case 'i-text': {
        const fontSize = (obj.fontSize || 14) * scaleX * 2.83; // px to pt approx
        const fontWeight = obj.fontWeight || 'normal';
        const fontStyle = obj.fontStyle || 'normal';
        const textAlign = obj.textAlign || 'left';
        const fill = obj.fill || '#000';
        const fontFamily = obj.fontFamily || 'Arial';
        html += `<div style="${baseStyle} font-size:${fontSize}pt; font-weight:${fontWeight}; font-style:${fontStyle}; text-align:${textAlign}; color:${fill}; font-family:${fontFamily}; line-height:1.3;">${obj.text || ''}</div>`;
        break;
      }
      case 'image': {
        html += `<img src="${obj.src}" style="${baseStyle} height:${height}mm; object-fit:contain;" />`;
        break;
      }
      case 'rect': {
        const fill = obj.fill || 'transparent';
        const stroke = obj.stroke || 'transparent';
        const strokeWidth = obj.strokeWidth || 0;
        const rx = (obj.rx || 0) * scaleX;
        html += `<div style="${baseStyle} height:${height}mm; background:${fill}; border:${strokeWidth}pt solid ${stroke}; border-radius:${rx}mm;"></div>`;
        break;
      }
      case 'circle': {
        const fill = obj.fill || 'transparent';
        const stroke = obj.stroke || '#000';
        const radius = (obj.radius || 0) * scaleX;
        html += `<div style="${baseStyle} width:${radius * 2}mm; height:${radius * 2}mm; border-radius:50%; background:${fill}; border:1pt solid ${stroke};"></div>`;
        break;
      }
      case 'line': {
        const stroke = obj.stroke || '#000';
        const strokeWidth = obj.strokeWidth || 1;
        html += `<div style="${baseStyle} height:0; border-top:${strokeWidth}pt solid ${stroke};"></div>`;
        break;
      }
      default:
        break;
    }
  }

  html += `</div>`;
  return html;
}

/**
 * Generate PDF from HTML content using html2canvas + jsPDF.
 * Falls back to browser print-to-PDF if libraries not available.
 */
export async function generatePDF(
  htmlContent: string,
  options?: {
    filename?: string;
    orientation?: 'portrait' | 'landscape';
    additionalCSS?: string;
  }
): Promise<void> {
  const { filename = 'document.pdf', orientation = 'portrait', additionalCSS = '' } = options || {};

  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:210mm;';
  container.innerHTML = `<style>${getBasePrintCSS(orientation)}${additionalCSS}</style>${htmlContent}`;
  document.body.appendChild(container);

  try {
    // Try html2canvas + jsPDF if available
    const html2canvas = (window as any).html2canvas;
    const jsPDF = (window as any).jspdf?.jsPDF;

    if (html2canvas && jsPDF) {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: orientation === 'portrait' ? 794 : 1123,
        height: orientation === 'portrait' ? 1123 : 794,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = orientation === 'portrait' ? 210 : 297;
      const pdfHeight = orientation === 'portrait' ? 297 : 210;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
    } else {
      // Fallback: open print dialog (user can "Save as PDF")
      await printViaIframe(htmlContent, { title: filename.replace('.pdf', ''), orientation });
    }
  } finally {
    container.remove();
  }
}

/**
 * Convert number to Indian English words (supports up to 99,99,99,999)
 */
export function numberToWords(amount: number): string {
  if (amount === 0) return 'Zero Rupees Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigit(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  }

  function convertThreeDigit(n: number): string {
    if (n >= 100) {
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertTwoDigit(n % 100) : '');
    }
    return convertTwoDigit(n);
  }

  const intPart = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - intPart) * 100);

  let result = '';

  if (intPart === 0) {
    result = 'Zero';
  } else {
    // Indian numbering: Crore, Lakh, Thousand, Hundred
    const crore = Math.floor(intPart / 10000000);
    const lakh = Math.floor((intPart % 10000000) / 100000);
    const thousand = Math.floor((intPart % 100000) / 1000);
    const remainder = intPart % 1000;

    if (crore > 0) result += convertTwoDigit(crore) + ' Crore ';
    if (lakh > 0) result += convertTwoDigit(lakh) + ' Lakh ';
    if (thousand > 0) result += convertTwoDigit(thousand) + ' Thousand ';
    if (remainder > 0) result += convertThreeDigit(remainder);
  }

  result = result.trim() + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convertTwoDigit(paise) + ' Paise';
  }
  result += ' Only';

  return result;
}

/**
 * Get formatted school header HTML from tenant data.
 */
export function getSchoolHeader(tenant: any, options?: {
  title?: string;
  subtitle?: string;
  showAffiliation?: boolean;
}): string {
  const { title, subtitle, showAffiliation = true } = options || {};
  const name = tenant?.name || 'School Name';
  const address = tenant?.address || '';
  const logo = tenant?.logo || '';
  const phone = tenant?.phone || '';
  const affiliation = tenant?.affiliationNo || '';
  const primaryColor = tenant?.primaryColor || '#1a365d';

  return `
    <div class="print-header">
      <div class="header-flex">
        ${logo ? `<img src="${logo}" alt="Logo" class="school-logo" />` : ''}
        <div>
          <div class="school-name" style="color:${primaryColor};">${name}</div>
          ${address ? `<div class="school-address">${address}${phone ? ' | Ph: ' + phone : ''}</div>` : ''}
          ${showAffiliation && affiliation ? `<div class="school-affiliation">Affiliation No: ${affiliation}</div>` : ''}
        </div>
        ${logo ? `<img src="${logo}" alt="Logo" class="school-logo" style="visibility:hidden;" />` : ''}
      </div>
      ${title ? `<div class="doc-title" style="margin-top:6pt;">${title}</div>` : ''}
      ${subtitle ? `<div style="font-size:10pt; margin-top:3pt; color:#555;">${subtitle}</div>` : ''}
    </div>
  `;
}

/**
 * Format date in Indian format DD/MM/YYYY
 */
export function formatIndianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date to long Indian format (15th January 2025)
 */
export function formatIndianDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
    day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  return `${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Convert a date of birth to words format (for TC)
 */
export function dateToWords(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const ones = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth',
    'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth',
    'Twentieth', 'Twenty-First', 'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth',
    'Twenty-Sixth', 'Twenty-Seventh', 'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth', 'Thirty-First'];
  
  const day = d.getDate();
  const year = d.getFullYear();
  const yearWords = numberToWords(year).replace(' Rupees Only', '').replace(' and ', ' ');
  
  return `${ones[day]} ${months[d.getMonth()]}, ${yearWords}`;
}

/**
 * Get the YN-UDP server base URL from environment or defaults.
 */
export function getYnUdpBaseUrl(): string {
  return (
    (import.meta as any).env?.VITE_YNUDP_URL ||
    (window.location.hostname === 'localhost' ? 'http://localhost:5001' : '/yn-udp')
  );
}

/**
 * Generate a simple QR code placeholder (data URL SVG).
 * In production, integrate with a QR library like qrcode.
 */
export function generateQRPlaceholder(data: string): string {
  // Simple SVG placeholder — replace with actual QR generation
  const encoded = btoa(data.slice(0, 50));
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="white" stroke="#333" stroke-width="2"/>
      <text x="50" y="45" text-anchor="middle" font-size="8" fill="#333">QR Code</text>
      <text x="50" y="60" text-anchor="middle" font-size="6" fill="#666">${encoded.slice(0, 10)}...</text>
      <rect x="10" y="10" width="20" height="20" fill="#333"/>
      <rect x="70" y="10" width="20" height="20" fill="#333"/>
      <rect x="10" y="70" width="20" height="20" fill="#333"/>
      <rect x="13" y="13" width="14" height="14" fill="white"/>
      <rect x="73" y="13" width="14" height="14" fill="white"/>
      <rect x="13" y="73" width="14" height="14" fill="white"/>
      <rect x="16" y="16" width="8" height="8" fill="#333"/>
      <rect x="76" y="16" width="8" height="8" fill="#333"/>
      <rect x="16" y="76" width="8" height="8" fill="#333"/>
    </svg>
  `)}`;
}
