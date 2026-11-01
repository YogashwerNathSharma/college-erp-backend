/**
 * 🖨️ Print / Export Toolbar
 *
 * Reusable bar with Print, PDF Download, and Excel Download buttons.
 * Place at the top of any report/print page.
 */

import { Printer, FileDown, FileSpreadsheet, ArrowLeft } from "lucide-react";

interface PrintExportBarProps {
  title?: string;
  /** Trigger browser print dialog */
  onPrint?: () => void;
  /** Download PDF — pass a URL or callback */
  onDownloadPdf?: () => void;
  pdfUrl?: string;
  /** Download Excel — pass a URL or callback */
  onDownloadExcel?: () => void;
  excelUrl?: string;
  /** Show back button */
  showBack?: boolean;
  onBack?: () => void;
  /** Loading state */
  loading?: boolean;
}

export default function PrintExportBar({
  title,
  onPrint,
  onDownloadPdf,
  pdfUrl,
  onDownloadExcel,
  excelUrl,
  showBack = true,
  onBack,
  loading = false,
}: PrintExportBarProps) {
  const handlePrint = () => {
    if (onPrint) return onPrint();
    window.print();
  };

  const handlePdf = () => {
    if (onDownloadPdf) return onDownloadPdf();
    if (pdfUrl) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.target = "_blank";
      a.click();
    }
  };

  const handleExcel = () => {
    if (onDownloadExcel) return onDownloadExcel();
    if (excelUrl) {
      const a = document.createElement("a");
      a.href = excelUrl;
      a.download = "";
      a.click();
    }
  };

  return (
    <div
      className="no-print sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between flex-wrap gap-2 shadow-sm"
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack || (() => window.history.back())}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          >
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
        )}
        {title && (
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            📄 {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Excel */}
        {(onDownloadExcel || excelUrl) && (
          <button
            onClick={handleExcel}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-300 dark:hover:border-green-700 transition disabled:opacity-50"
          >
            <FileSpreadsheet size={14} className="text-green-600" />
            Excel
          </button>
        )}

        {/* PDF */}
        {(onDownloadPdf || pdfUrl) && (
          <button
            onClick={handlePdf}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 transition disabled:opacity-50"
          >
            <FileDown size={14} className="text-red-500" />
            PDF
          </button>
        )}

        {/* Print */}
        <button
          onClick={handlePrint}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <Printer size={14} />
          {loading ? "Processing..." : "Print"}
        </button>
      </div>
    </div>
  );
}
