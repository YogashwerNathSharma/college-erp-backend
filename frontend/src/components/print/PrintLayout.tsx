import { ReactNode, useRef, useState, useEffect } from 'react';
import { usePrint, UsePrintOptions } from '../../hooks/usePrint';
import { ynudpService, TemplateSlotType } from '../../services/ynudp.service';
import { formatIndianDate, generateQRPlaceholder } from '../../utils/printHelper';

//////////////////////////////////////////////////////
// 🖨️ PRINT LAYOUT — Base Print Wrapper Component
// Production-quality A4 print with YN-UDP integration,
// iframe-based mobile-safe printing, and professional design.
//////////////////////////////////////////////////////

export interface PrintLayoutProps {
  children: ReactNode;
  /** Document title (shown in header) */
  title?: string;
  /** Subtitle (below title) */
  subtitle?: string;
  /** YN-UDP template ID (if provided, uses custom template) */
  templateId?: string;
  /** YN-UDP template slot type for automatic lookup */
  templateSlot?: TemplateSlotType;
  /** Data to merge with YN-UDP template */
  templateData?: Record<string, any>;
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
  /** Show school header */
  showHeader?: boolean;
  /** Show footer with page numbers and date */
  showFooter?: boolean;
  /** Watermark text (shown diagonally behind content) */
  watermark?: string;
  /** Enable QR code verification */
  qrData?: string;
  /** Mode: 'preview' shows on-screen, 'print' triggers print */
  mode?: 'preview' | 'print';
  /** Show print controls (print/preview/PDF buttons) */
  showControls?: boolean;
  /** Additional CSS for print */
  additionalCSS?: string;
  /** School override (defaults to tenant from localStorage) */
  schoolName?: string;
  schoolLogo?: string;
  schoolAddress?: string;
  affiliationNo?: string;
  /** Callback when print is triggered */
  onPrint?: () => void;
  /** Callback when PDF is downloaded */
  onDownload?: () => void;
}

export default function PrintLayout({
  children,
  title,
  subtitle,
  templateId,
  templateSlot,
  templateData,
  orientation = 'portrait',
  showHeader = true,
  showFooter = true,
  watermark,
  qrData,
  mode = 'preview',
  showControls = true,
  additionalCSS = '',
  schoolName,
  schoolLogo,
  schoolAddress,
  affiliationNo,
  onPrint,
  onDownload,
}: PrintLayoutProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [ynUdpAvailable, setYnUdpAvailable] = useState<boolean | null>(null);
  const [useCustomTemplate, setUseCustomTemplate] = useState(false);

  // Get tenant info
  const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
  const primaryColor = tenant.primaryColor || '#1a365d';
  const name = schoolName || tenant.name || 'School Name';
  const rawLogo = schoolLogo || tenant.logoUrl || tenant.logo || '';
  const address = schoolAddress || tenant.address || '';
  const affiliation = affiliationNo || tenant.affiliationNo || '';
  
  // Resolve logo URL for both localhost and production
  const API_BASE = (import.meta as any).env?.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://college-erp-backend-91zi.onrender.com' : '');
  const logo = rawLogo
    ? rawLogo.startsWith('http') ? rawLogo
      : rawLogo.startsWith('/') ? `${API_BASE}${rawLogo}`
      : `${API_BASE}/uploads/${rawLogo}`
    : '';

  // Initialize print hook
  const printOptions: UsePrintOptions = {
    templateSlot,
    templateId,
    orientation,
    title: title || 'Document',
    additionalCSS,
    showHeader,
    watermark,
  };

  const { print, preview, downloadPDF, printWithTemplate, loading, error } = usePrint(printOptions);

  // Check YN-UDP availability on mount
  useEffect(() => {
    if (templateSlot || templateId) {
      ynudpService.isAvailable().then(available => {
        setYnUdpAvailable(available);
        if (available && (templateSlot || templateId)) {
          ynudpService
            .getDefaultTemplate(templateSlot || 'admit-card')
            .then(tpl => setUseCustomTemplate(!!tpl))
            .catch(() => setUseCustomTemplate(false));
        }
      });
    }
  }, [templateSlot, templateId]);

  // Handle print action
  const handlePrint = async () => {
    onPrint?.();
    if (useCustomTemplate && templateData) {
      try {
        await printWithTemplate(templateData);
        return;
      } catch {
        // Fall through to built-in print
      }
    }
    await print(contentRef.current);
  };

  // Handle preview action
  const handlePreview = () => {
    if (contentRef.current) {
      preview(contentRef.current);
    }
  };

  // Handle PDF download
  const handleDownload = async () => {
    onDownload?.();
    await downloadPDF(contentRef.current, `${title || 'document'}.pdf`);
  };

  return (
    <div className="print-layout-container">
      {/* ─── Control Bar (hidden during print) ─── */}
      {showControls && (
        <div className="no-print" style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a202c' }}>
              📄 {title || 'Document'}
            </span>
            {ynUdpAvailable && useCustomTemplate && (
              <span style={{
                fontSize: '11px',
                background: '#c6f6d5',
                color: '#22543d',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 500,
              }}>
                🎨 Custom Template
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Toggle custom template */}
            {ynUdpAvailable && templateSlot && (
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#4a5568',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={useCustomTemplate}
                  onChange={e => setUseCustomTemplate(e.target.checked)}
                  style={{ accentColor: primaryColor }}
                />
                Use YN-UDP Template
              </label>
            )}

            <button
              onClick={handlePreview}
              disabled={loading}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 500,
                border: '1px solid #cbd5e0',
                borderRadius: '6px',
                background: 'white',
                color: '#2d3748',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              👁️ Preview
            </button>

            <button
              onClick={handleDownload}
              disabled={loading}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 500,
                border: '1px solid #cbd5e0',
                borderRadius: '6px',
                background: 'white',
                color: '#2d3748',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              📥 PDF
            </button>

            <button
              onClick={handlePrint}
              disabled={loading}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '6px',
                background: primaryColor,
                color: 'white',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '⏳ Processing...' : '🖨️ Print'}
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="no-print" style={{
          background: '#fed7d7',
          color: '#c53030',
          padding: '8px 16px',
          fontSize: '13px',
          borderBottom: '1px solid #feb2b2',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ─── Printable Content Area ─── */}
      <div
        ref={contentRef}
        className={`print-page-wrapper ${orientation}`}
        style={{
          fontFamily: "'Segoe UI', Arial, sans-serif",
          maxWidth: orientation === 'portrait' ? '210mm' : '297mm',
          minHeight: orientation === 'portrait' ? '297mm' : '210mm',
          margin: '0 auto',
          padding: '15mm 12mm',
          background: 'white',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Watermark */}
        {watermark && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            fontSize: '48pt',
            color: 'rgba(200, 200, 200, 0.12)',
            fontWeight: 900,
            textTransform: 'uppercase',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 0,
          }}>
            {watermark}
          </div>
        )}

        {/* School Header */}
        {showHeader && (
          <div style={{
            textAlign: 'center',
            borderBottom: `2pt solid ${primaryColor}`,
            paddingBottom: '8pt',
            marginBottom: '12pt',
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12pt' }}>
              {logo && (
                <img
                  src={logo}
                  alt="Logo"
                  style={{ width: '20mm', height: '20mm', objectFit: 'contain' }}
                />
              )}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  fontSize: '18pt',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: primaryColor,
                  letterSpacing: '0.5pt',
                }}>
                  {name}
                </div>
                {address && (
                  <div style={{ fontSize: '9pt', color: '#444', marginTop: '2pt' }}>
                    {address}
                  </div>
                )}
                {affiliation && (
                  <div style={{ fontSize: '8pt', color: '#666', marginTop: '1pt' }}>
                    Affiliation No: {affiliation}
                  </div>
                )}
              </div>
            </div>
            {title && (
              <div style={{
                fontSize: '14pt',
                fontWeight: 700,
                marginTop: '8pt',
                textTransform: 'uppercase',
                textDecoration: 'underline',
                letterSpacing: '1pt',
                color: '#1a1a1a',
              }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ fontSize: '10pt', marginTop: '3pt', color: '#555' }}>
                {subtitle}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>

        {/* QR Code */}
        {qrData && (
          <div style={{
            position: 'absolute',
            bottom: '10mm',
            right: '10mm',
            textAlign: 'center',
          }}>
            <img
              src={generateQRPlaceholder(qrData)}
              alt="Verification QR"
              style={{ width: '18mm', height: '18mm' }}
            />
            <div style={{ fontSize: '6pt', color: '#888', marginTop: '1pt' }}>
              Scan to verify
            </div>
          </div>
        )}

        {/* Footer */}
        {showFooter && (
          <div style={{
            marginTop: '12mm',
            paddingTop: '4pt',
            borderTop: '0.5pt solid #ccc',
            textAlign: 'center',
            fontSize: '7pt',
            color: '#888',
          }}>
            Generated on {formatIndianDate(new Date())} | Computer generated document
            {tenant.name && ` | ${tenant.name}`}
          </div>
        )}
      </div>

      {/* ─── Mobile Print Button (fixed at bottom for mobile) ─── */}
      {showControls && (
        <div className="no-print" style={{
          display: 'none', // Shown via media query below
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          background: 'white',
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          gap: '8px',
        }} id="mobile-print-bar">
          <button
            onClick={handlePreview}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            👁️ Preview
          </button>
          <button
            onClick={handlePrint}
            disabled={loading}
            style={{
              flex: 2,
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              background: primaryColor,
              color: 'white',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? '⏳ Processing...' : '🖨️ Print Document'}
          </button>
        </div>
      )}

      {/* ─── Print & Responsive Styles ─── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-layout-container { padding: 0; margin: 0; }
          .print-page-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            box-shadow: none !important;
          }
          @page {
            size: ${orientation === 'portrait' ? '210mm 297mm' : '297mm 210mm'};
            margin: 15mm 12mm;
          }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }

        @media screen and (max-width: 768px) {
          #mobile-print-bar { display: flex !important; }
          .print-page-wrapper {
            padding: 10px !important;
            min-height: auto !important;
            font-size: 10px;
          }
        }

        @media screen {
          .print-page-wrapper {
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            margin: 16px auto;
          }
        }
      `}</style>
    </div>
  );
}
