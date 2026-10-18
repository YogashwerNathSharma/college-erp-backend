import React, { useState, useCallback } from 'react';
import {
  Download,
  FileText,
  Image,
  FileImage,
  Code2,
  FileType,
  Printer,
  LayoutGrid,
  X,
  Loader2,
  ChevronDown,
  Check,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ExportFormat = 'pdf' | 'png' | 'jpg' | 'svg' | 'docx' | 'print-sheet';

interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  extension: string;
  estimateSize?: string;
}

interface ExportPanelProps {
  canvas: fabric.Canvas | null;
  templateId?: string;
  pages?: Array<{ id: string; name: string; canvasJSON: object; width: number; height: number }>;
  onClose: () => void;
  isOpen: boolean;
  apiBaseUrl?: string;
}

interface ExportSettings {
  format: ExportFormat;
  resolution: number; // DPI
  quality: number; // 0-1 for JPG
  includeAllPages: boolean;
  itemsPerPage: number; // for print-sheet
  pageSize: 'a4' | 'letter' | 'a3';
  orientation: 'portrait' | 'landscape';
  margin: number; // mm
}

// ─────────────────────────────────────────────────────────────
// Export Options Configuration
// ─────────────────────────────────────────────────────────────

const EXPORT_OPTIONS: ExportOption[] = [
  {
    format: 'pdf',
    label: 'PDF Document',
    description: 'High-quality vector PDF for printing',
    icon: <FileText className="w-5 h-5 text-red-500" />,
    extension: '.pdf',
  },
  {
    format: 'png',
    label: 'PNG Image',
    description: '300 DPI high-res for print shops',
    icon: <Image className="w-5 h-5 text-blue-500" />,
    extension: '.png',
  },
  {
    format: 'jpg',
    label: 'JPG Image',
    description: 'Compressed for web & email',
    icon: <FileImage className="w-5 h-5 text-green-500" />,
    extension: '.jpg',
  },
  {
    format: 'svg',
    label: 'SVG Vector',
    description: 'Scalable vector graphics',
    icon: <Code2 className="w-5 h-5 text-purple-500" />,
    extension: '.svg',
  },
  {
    format: 'docx',
    label: 'Word Document',
    description: 'Editable DOCX format',
    icon: <FileType className="w-5 h-5 text-blue-700" />,
    extension: '.docx',
  },
  {
    format: 'print-sheet',
    label: 'Print Sheet (Multi)',
    description: 'Multiple cards per A4 page',
    icon: <LayoutGrid className="w-5 h-5 text-orange-500" />,
    extension: '.pdf',
  },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const ExportPanel: React.FC<ExportPanelProps> = ({
  canvas,
  templateId,
  pages,
  onClose,
  isOpen,
  apiBaseUrl = '/api',
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'pdf',
    resolution: 300,
    quality: 0.92,
    includeAllPages: true,
    itemsPerPage: 8,
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 5,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportResult, setExportResult] = useState<string | null>(null);

  // ─── Estimate File Size ─────────────────────────────────────
  const estimateFileSize = useCallback(
    (format: ExportFormat): string => {
      if (!canvas) return '—';
      const w = canvas.getWidth();
      const h = canvas.getHeight();
      const objectCount = canvas.getObjects().length;
      const pageCount = pages?.length || 1;

      switch (format) {
        case 'pdf':
          return `~${Math.round(((w * h) / 1000000) * 0.3 * pageCount * 100) / 100} MB`;
        case 'png': {
          const mult = settings.resolution / 72;
          const bytes = w * mult * h * mult * 4;
          return `~${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
        case 'jpg': {
          const mult2 = settings.resolution / 72;
          const bytes2 = w * mult2 * h * mult2 * 3 * settings.quality * 0.3;
          return `~${(bytes2 / (1024 * 1024)).toFixed(1)} MB`;
        }
        case 'svg':
          return `~${Math.round(objectCount * 0.8 + 5)} KB`;
        case 'docx':
          return `~${Math.round(objectCount * 2 + 50)} KB`;
        case 'print-sheet':
          return `~${Math.round(((w * h) / 1000000) * 0.4 * Math.ceil(pageCount / settings.itemsPerPage) * 100) / 100} MB`;
        default:
          return '—';
      }
    },
    [canvas, pages, settings]
  );

  // ─── Client-Side Export (PNG, JPG, SVG) ─────────────────────
  const exportClientSide = useCallback(async () => {
    if (!canvas) return;

    const { format, resolution, quality } = settings;
    const multiplier = resolution / 72; // 72 is screen DPI

    let dataUrl: string;
    let filename: string;
    const timestamp = new Date().toISOString().slice(0, 10);

    switch (format) {
      case 'png': {
        dataUrl = canvas.toDataURL({
          format: 'png',
          multiplier,
          quality: 1,
        });
        filename = `template_${timestamp}.png`;
        break;
      }
      case 'jpg': {
        dataUrl = canvas.toDataURL({
          format: 'jpeg',
          multiplier,
          quality,
        });
        filename = `template_${timestamp}.jpg`;
        break;
      }
      case 'svg': {
        const svgString = canvas.toSVG();
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `template_${timestamp}.svg`);
        URL.revokeObjectURL(url);
        return;
      }
      default:
        return;
    }

    triggerDownload(dataUrl, filename);
  }, [canvas, settings]);

  // ─── Server-Side Export (PDF, DOCX, Print-Sheet) ────────────
  const exportServerSide = useCallback(async () => {
    if (!canvas && !templateId) return;

    const canvasJSON = canvas ? canvas.toJSON() : null;
    const allPages = pages || (canvasJSON ? [{ id: '1', name: 'Page 1', canvasJSON, width: canvas!.getWidth(), height: canvas!.getHeight() }] : []);

    const body = {
      format: settings.format,
      resolution: settings.resolution,
      quality: settings.quality,
      pages: settings.includeAllPages ? allPages : [allPages[0]],
      pageSize: settings.pageSize,
      orientation: settings.orientation,
      margin: settings.margin,
      itemsPerPage: settings.itemsPerPage,
    };

    try {
      const response = await fetch(
        `${apiBaseUrl}/templates/${templateId || 'preview'}/export`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) throw new Error(`Export failed: ${response.statusText}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const ext = settings.format === 'print-sheet' ? 'pdf' : settings.format;
      triggerDownload(url, `template_export.${ext}`);
      URL.revokeObjectURL(url);
      return url;
    } catch (err) {
      console.error('Server export failed:', err);
      throw err;
    }
  }, [canvas, templateId, pages, settings, apiBaseUrl]);

  // ─── Main Export Handler ────────────────────────────────────
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setProgress(0);
    setExportResult(null);

    try {
      const clientFormats: ExportFormat[] = ['png', 'jpg', 'svg'];

      if (clientFormats.includes(settings.format)) {
        setProgress(50);
        await exportClientSide();
        setProgress(100);
      } else {
        setProgress(20);
        await exportServerSide();
        setProgress(100);
      }

      setExportResult('success');
    } catch (err) {
      setExportResult('error');
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [settings, exportClientSide, exportServerSide]);

  // ─── Print Handler ──────────────────────────────────────────
  const handlePrint = useCallback(() => {
    if (!canvas) return;

    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const { pageSize, orientation, margin } = settings;
    const pageSizes: Record<string, string> = {
      a4: '210mm 297mm',
      letter: '8.5in 11in',
      a3: '297mm 420mm',
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Template</title>
          <style>
            @page {
              size: ${pageSizes[pageSize]} ${orientation};
              margin: ${margin}mm;
            }
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
            }
            @media print {
              body { margin: 0; padding: 0; }
              img { max-width: 100%; max-height: 100%; }
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }, [canvas, settings]);

  // ─── Print Sheet Handler (Multiple per page) ────────────────
  const handlePrintSheet = useCallback(() => {
    if (!canvas) return;

    const { itemsPerPage, margin } = settings;
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 3 });

    const cols = itemsPerPage <= 4 ? 2 : itemsPerPage <= 6 ? 3 : 4;
    const rows = Math.ceil(itemsPerPage / cols);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let imagesHtml = '';
    for (let i = 0; i < itemsPerPage; i++) {
      imagesHtml += `<div class="card"><img src="${dataUrl}" /></div>`;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Sheet</title>
          <style>
            @page { size: A4 portrait; margin: ${margin}mm; }
            body { margin: 0; padding: 0; }
            .grid {
              display: grid;
              grid-template-columns: repeat(${cols}, 1fr);
              grid-template-rows: repeat(${rows}, 1fr);
              gap: 2mm;
              width: 100%;
              height: 100vh;
              padding: ${margin}mm;
              box-sizing: border-box;
            }
            .card {
              border: 0.5px dashed #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .card img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            @media print {
              .card { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="grid">${imagesHtml}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  }, [canvas, settings]);

  // ─── Trigger Download Helper ────────────────────────────────
  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Export Template</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_OPTIONS.map((opt) => (
                <button
                  key={opt.format}
                  onClick={() => setSettings((s) => ({ ...s, format: opt.format }))}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                    settings.format === opt.format
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{opt.description}</p>
                  </div>
                  {settings.format === opt.format && (
                    <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Settings */}
          {(settings.format === 'png' || settings.format === 'jpg') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution (DPI)
              </label>
              <div className="flex gap-2">
                {[72, 150, 300, 600].map((dpi) => (
                  <button
                    key={dpi}
                    onClick={() => setSettings((s) => ({ ...s, resolution: dpi }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.resolution === dpi
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {dpi} DPI
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                300 DPI recommended for print. 72 DPI for screen/web.
              </p>
            </div>
          )}

          {/* JPG Quality */}
          {settings.format === 'jpg' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality: {Math.round(settings.quality * 100)}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={settings.quality * 100}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, quality: Number(e.target.value) / 100 }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Small file</span>
                <span>High quality</span>
              </div>
            </div>
          )}

          {/* Print Sheet Options */}
          {settings.format === 'print-sheet' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items per Page
                </label>
                <div className="flex gap-2">
                  {[2, 4, 6, 8, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSettings((s) => ({ ...s, itemsPerPage: n }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.itemsPerPage === n
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margin (mm)
                </label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={settings.margin}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, margin: Number(e.target.value) }))
                  }
                  className="w-20 px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>
            </div>
          )}

          {/* Page Size (for PDF, DOCX, Print-Sheet) */}
          {['pdf', 'docx', 'print-sheet'].includes(settings.format) && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Size
                </label>
                <select
                  value={settings.pageSize}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, pageSize: e.target.value as any }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                >
                  <option value="a4">A4 (210×297mm)</option>
                  <option value="letter">Letter (8.5×11in)</option>
                  <option value="a3">A3 (297×420mm)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orientation
                </label>
                <select
                  value={settings.orientation}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, orientation: e.target.value as any }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
          )}

          {/* Multi-page option */}
          {pages && pages.length > 1 && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeAllPages"
                checked={settings.includeAllPages}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, includeAllPages: e.target.checked }))
                }
                className="w-4 h-4 text-indigo-600 rounded border-gray-300"
              />
              <label htmlFor="includeAllPages" className="text-sm text-gray-700">
                Include all pages ({pages.length} pages)
              </label>
            </div>
          )}

          {/* Estimated Size */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">Estimated file size:</span>
            <span className="text-sm font-semibold text-gray-900">
              {estimateFileSize(settings.format)}
            </span>
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <span className="text-sm text-gray-600">Exporting...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success / Error */}
          {exportResult === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">Export completed successfully!</span>
            </div>
          )}
          {exportResult === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="text-sm text-red-700">Export failed. Please try again.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {settings.format === 'print-sheet' && (
              <button
                onClick={handlePrintSheet}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                Print Sheet
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
